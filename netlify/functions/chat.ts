import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || "";
const TEAM_SLUG = process.env.TEAM_SLUG || "bookingpro-musa";

const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// ─── Tool Definitions for Gemini ───
const tools = [{
  functionDeclarations: [
    {
      name: "check_availability",
      description: "Check available appointment time slots for a specific date. Returns a list of available time slots.",
      parameters: {
        type: "OBJECT" as const,
        properties: {
          date: { type: "STRING" as const, description: "The date to check availability for, in YYYY-MM-DD format" },
          service_id: { type: "STRING" as const, description: "Optional service ID to check duration-specific slots" },
        },
        required: ["date"],
      },
    },
    {
      name: "create_booking",
      description: "Create a new appointment booking after the customer has confirmed the details. Requires customer name, email, service, date and time.",
      parameters: {
        type: "OBJECT" as const,
        properties: {
          service_id: { type: "STRING" as const, description: "The ID of the service to book" },
          service_name: { type: "STRING" as const, description: "The name of the service" },
          customer_name: { type: "STRING" as const, description: "Full name of the customer" },
          customer_email: { type: "STRING" as const, description: "Email address of the customer" },
          customer_phone: { type: "STRING" as const, description: "Phone number of the customer (optional)" },
          date: { type: "STRING" as const, description: "Appointment date in YYYY-MM-DD format" },
          time: { type: "STRING" as const, description: "Appointment start time in HH:MM format (24-hour)" },
        },
        required: ["service_id", "service_name", "customer_name", "customer_email", "date", "time"],
      },
    },
    {
      name: "get_business_info",
      description: "Get business information such as services offered, prices, business hours, FAQ answers, or general information about the dental clinic.",
      parameters: {
        type: "OBJECT" as const,
        properties: {
          question_type: {
            type: "STRING" as const,
            description: "Type of information requested: 'services' for service list and prices, 'hours' for business hours, 'faq' for frequently asked questions, 'general' for general info",
          },
        },
        required: ["question_type"],
      },
    },
  ],
}];

// ─── Tool Execution Functions ───

async function checkAvailability(args: { date: string; service_id?: string }) {
  const { date, service_id } = args;
  const dayOfWeek = new Date(date + "T00:00:00").getDay();

  if (dayOfWeek === 0) return { available: false, message: "The clinic is closed on Sundays.", slots: [] };

  const startHour = dayOfWeek === 6 ? 10 : 9;
  const endHour = dayOfWeek === 6 ? 14 : 18;

  let duration = 30;
  if (service_id && supabase) {
    const { data: svc } = await supabase.from("services").select("duration_minutes").eq("id", service_id).maybeSingle();
    if (svc) duration = svc.duration_minutes;
  }

  let existingBookings: any[] = [];
  if (supabase) {
    const { data } = await supabase.from("bookings").select("start_time, end_time").eq("booking_date", date).neq("status", "cancelled");
    existingBookings = data || [];
  }

  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += 30) {
      const startMin = h * 60 + m;
      const endMin = startMin + duration;
      if (endMin > endHour * 60) continue;

      const startStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const hasOverlap = existingBookings.some(b => {
        const bStart = timeToMinutes(b.start_time);
        const bEnd = timeToMinutes(b.end_time);
        return startMin < bEnd && endMin > bStart;
      });

      if (!hasOverlap) slots.push(startStr);
    }
  }

  return {
    available: slots.length > 0,
    date,
    slots,
    message: slots.length > 0
      ? `Available slots on ${date}: ${slots.join(", ")}`
      : `No available slots on ${date}. Please try another day.`,
  };
}

async function createBooking(args: {
  service_id: string; service_name: string;
  customer_name: string; customer_email: string;
  customer_phone?: string; date: string; time: string;
}) {
  let duration = 30;
  if (supabase) {
    const { data: svc } = await supabase.from("services").select("duration_minutes").eq("id", args.service_id).maybeSingle();
    if (svc) duration = svc.duration_minutes;
  }

  const startMin = timeToMinutes(args.time);
  const endMin = startMin + duration;
  const endTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;

  if (supabase) {
    const { data: conflicts } = await supabase
      .from("bookings").select("id")
      .eq("booking_date", args.date).neq("status", "cancelled")
      .lt("start_time", endTime).gt("end_time", args.time);

    if (conflicts?.length) {
      return { success: false, message: "This time slot is no longer available. Please choose another time." };
    }
  }

  const booking = {
    service_id: args.service_id,
    service_name: args.service_name,
    customer_name: args.customer_name,
    customer_email: args.customer_email,
    customer_phone: args.customer_phone || "",
    booking_date: args.date,
    start_time: args.time,
    end_time: endTime,
    status: "confirmed",
    notes: `Booked via AI Assistant`,
  };

  let bookingId = `local-${Date.now()}`;
  if (supabase) {
    const { data, error } = await supabase.from("bookings").insert(booking).select("id").single();
    if (error) {
      console.error("[Booking] Insert error:", error);
      return { success: false, message: "Failed to create booking. Please try again." };
    }
    bookingId = data.id;
  }

  await sendBookingEmail({ ...booking, id: bookingId });

  return {
    success: true,
    booking_id: bookingId,
    message: `Appointment confirmed! ${args.service_name} on ${args.date} at ${args.time}. A confirmation email has been sent to ${args.customer_email}.`,
  };
}

async function getBusinessInfo(args: { question_type: string }) {
  let services: any[] = [];
  let settings: any = null;

  if (supabase) {
    const [svcRes, setRes] = await Promise.all([
      supabase.from("services").select("*").eq("active", true),
      supabase.from("agent_settings").select("*").maybeSingle(),
    ]);
    services = svcRes.data || [];
    settings = setRes.data;
  }

  switch (args.question_type) {
    case "services":
      const svcList = services.length
        ? services.map(s => `• ${s.name}: €${s.price} (${s.duration_minutes} min) - ${s.description}`).join("\n")
        : "• Dental Check-up: €75 (30 min)\n• Teeth Whitening: €250 (60 min)\n• Dental Cleaning: €120 (45 min)\n• Root Canal: €450 (90 min)\n• Implant Consultation: €100 (45 min)\n• Orthodontic Consultation: €90 (30 min)";
      return { info: `Our services:\n${svcList}` };

    case "hours":
      return { info: settings?.business_hours || "Monday-Friday 9:00-18:00, Saturday 10:00-14:00, Sunday closed." };

    case "faq":
      const faqs = settings?.faq || [];
      const faqText = faqs.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
      return { info: faqText || "Please ask your specific question and I'll do my best to answer!" };

    default:
      return {
        info: `SmilePro Dental — ${settings?.business_address || "Pärnu mnt 25, Tallinn, Estonia"}. Phone: ${settings?.business_phone || "+372 5555 1234"}. Email: ${settings?.business_email || "info@smileprodental.ee"}.`,
      };
  }
}

// ─── Email via Resend ───

async function sendBookingEmail(booking: any) {
  if (!RESEND_API_KEY) return;
  try {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#0d9488">✅ Appointment Confirmed</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;font-weight:bold">Service:</td><td style="padding:8px">${booking.service_name}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Date:</td><td style="padding:8px">${booking.booking_date}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Time:</td><td style="padding:8px">${booking.start_time} - ${booking.end_time}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Customer:</td><td style="padding:8px">${booking.customer_name}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Email:</td><td style="padding:8px">${booking.customer_email}</td></tr>
        </table>
        <p style="color:#666;font-size:12px;margin-top:20px">BookingAgent Pro | ${TEAM_SLUG}</p>
      </div>`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "onboarding@resend.dev", to: booking.customer_email,
        subject: `[BOOKING-2026] ${TEAM_SLUG} - Appointment Confirmed`, html,
      }),
    });

    if (NOTIFICATION_EMAIL) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "onboarding@resend.dev", to: NOTIFICATION_EMAIL,
          subject: `[BOOKING-2026] ${TEAM_SLUG} - New Booking: ${booking.customer_name}`, html,
        }),
      });
    }
  } catch (e) {
    console.error("Email send error:", e);
  }
}

// ─── Helper ───
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// ─── Rate Limiting ───

const ALLOWED_ORIGINS = [
  "https://bookingpro-musa.netlify.app",
  "http://localhost:5173",  // local dev
  "http://localhost:8888",  // netlify dev
];

const MAX_REQUESTS_PER_IP_PER_HOUR = 20;    // Max 20 chats per IP per hour
const MAX_REQUESTS_PER_SESSION = 30;         // Max 30 messages per session total
const MAX_DAILY_API_CALLS = 200;             // Global daily budget cap
const MAX_MESSAGE_LENGTH = 500;              // Max chars per user message
const MAX_MESSAGES_PER_REQUEST = 20;         // Max conversation history length

// In-memory rate limit store (resets on cold start, backed by Supabase)
const ipRateMap = new Map<string, { count: number; resetAt: number }>();

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + 3600_000 }); // 1 hour window
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_IP_PER_HOUR) return false;
  entry.count++;
  return true;
}

async function checkDailyBudget(): Promise<boolean> {
  if (!supabase) return true;
  try {
    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("chat_history")
      .select("*", { count: "exact", head: true })
      .eq("role", "assistant")
      .gte("created_at", `${today}T00:00:00Z`);
    return (count || 0) < MAX_DAILY_API_CALLS;
  } catch {
    return true; // fail open if DB check fails
  }
}

async function checkSessionLimit(sessionId: string): Promise<boolean> {
  if (!supabase || !sessionId) return true;
  try {
    const { count } = await supabase
      .from("chat_history")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId);
    return (count || 0) < MAX_REQUESTS_PER_SESSION;
  } catch {
    return true;
  }
}

function getCorsHeaders(origin?: string) {
  const allowed = ALLOWED_ORIGINS.includes(origin || "");
  return {
    "Access-Control-Allow-Origin": allowed ? origin! : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

// ─── Main Handler ───

const handler: Handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || "";
  const corsHeaders = getCorsHeaders(origin);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ reply: "Method not allowed" }) };
  }

  // ── Security Layer 1: Origin check ──
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    console.warn(`[Security] Blocked origin: ${origin}`);
    return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ reply: "Access denied." }) };
  }

  // ── Security Layer 2: IP rate limit ──
  const clientIp = event.headers?.["x-forwarded-for"]?.split(",")[0]?.trim()
    || event.headers?.["client-ip"]
    || "unknown";

  if (!checkIpRateLimit(clientIp)) {
    console.warn(`[Security] Rate limited IP: ${clientIp}`);
    return {
      statusCode: 429,
      headers: { ...corsHeaders, "Retry-After": "300" },
      body: JSON.stringify({ reply: "Too many requests. Please try again in a few minutes." }),
    };
  }

  // ── Security Layer 3: Daily budget cap ──
  if (!(await checkDailyBudget())) {
    console.warn("[Security] Daily API budget exhausted");
    return {
      statusCode: 429,
      headers: corsHeaders,
      body: JSON.stringify({ reply: "The assistant is temporarily unavailable. Please try again tomorrow or call us at +372 5555 1234." }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { messages, sessionId, language } = body;

    // ── Security Layer 4: Input validation ──
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ reply: "Invalid request." }) };
    }

    if (messages.length > MAX_MESSAGES_PER_REQUEST) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ reply: "Conversation too long. Please start a new chat." }) };
    }

    // Validate and sanitize each message
    for (const msg of messages) {
      if (!msg.content || typeof msg.content !== "string") {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ reply: "Invalid message format." }) };
      }
      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ reply: `Messages must be under ${MAX_MESSAGE_LENGTH} characters.` }) };
      }
    }

    // ── Security Layer 5: Session limit ──
    if (!(await checkSessionLimit(sessionId))) {
      return {
        statusCode: 429,
        headers: corsHeaders,
        body: JSON.stringify({ reply: "This chat session has reached its limit. Please start a new conversation or call us at +372 5555 1234." }),
      };
    }

    // Load agent settings
    let systemPrompt = "";
    let agentMode = "full_booking";
    if (supabase) {
      try {
        const { data } = await supabase.from("agent_settings").select("*").maybeSingle();
        if (data) { systemPrompt = data.system_prompt; agentMode = data.mode; }
      } catch (_e) { /* use defaults */ }
    }
    if (!systemPrompt) {
      systemPrompt = `You are a friendly dental receptionist for SmilePro Dental. Help customers book appointments, check availability, and answer questions. Business hours: Mon-Fri 9:00-18:00, Sat 10:00-14:00, Sun closed. Address: Pärnu mnt 25, Tallinn.`;
    }

    if (language === "et") systemPrompt += "\n\nThe customer is speaking Estonian. Respond in Estonian.";
    if (agentMode === "info_only") systemPrompt += "\n\nIMPORTANT: You are in Information Only mode. Do NOT book appointments. Only provide information and suggest the customer call to book.";

    const geminiMessages = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    let finalReply = "";
    let toolCallsLog: any[] = [];
    let attempts = 0;

    let currentContents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Understood. I am the SmilePro Dental assistant." }] },
      ...geminiMessages,
    ];

    while (attempts < 5) {
      attempts++;

      const geminiBody: any = {
        contents: currentContents,
        tools: agentMode === "info_only"
          ? [{ functionDeclarations: [tools[0].functionDeclarations[2]] }]
          : tools,
      };

      console.log(`[Chat] Attempt ${attempts}`);

      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error("[Chat] Gemini error:", geminiRes.status, errText.substring(0, 300));
        finalReply = "I'm having trouble connecting right now. Please try again in a moment.";
        break;
      }

      const geminiData = await geminiRes.json();
      const candidate = geminiData.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      console.log("[Chat] Parts count:", parts.length, "types:", parts.map((p: any) => Object.keys(p).join(",")).join(" | "));

      const functionCalls = parts.filter((p: any) => p.functionCall);
      const textParts = parts.filter((p: any) => p.text);

      if (functionCalls.length > 0) {
        console.log("[Chat] Function calls:", functionCalls.map((fc: any) => fc.functionCall.name));

        const functionResponses: any[] = [];
        for (const fc of functionCalls) {
          const { name, args } = fc.functionCall;
          let result: any;
          try {
            switch (name) {
              case "check_availability": result = await checkAvailability(args); break;
              case "create_booking": result = await createBooking(args); break;
              case "get_business_info": result = await getBusinessInfo(args); break;
              default: result = { error: "Unknown function" };
            }
          } catch (toolErr: any) {
            console.error(`[Chat] Tool error ${name}:`, toolErr.message);
            result = { error: toolErr.message };
          }

          toolCallsLog.push({ name, args, result });
          functionResponses.push({ functionResponse: { name, response: result } });
        }

        currentContents.push({ role: "model", parts: functionCalls.map((fc: any) => ({ functionCall: fc.functionCall })) });
        currentContents.push({ role: "user", parts: functionResponses });
        continue;
      }

      // Extract text (skip thinking parts)
      if (textParts.length > 0) {
        finalReply = textParts.map((p: any) => p.text).join("\n");
      } else {
        finalReply = "I'm ready to help! What would you like to know?";
      }
      break;
    }

    // Save chat history
    if (supabase && sessionId) {
      try {
        await supabase.from("chat_history").insert([
          ...messages.map((m: any) => ({ session_id: sessionId, role: m.role, content: m.content })),
          { session_id: sessionId, role: "assistant", content: finalReply, tool_calls: toolCallsLog.length > 0 ? toolCallsLog : null },
        ]);
      } catch (_e) { /* non-critical */ }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ reply: finalReply }),
    };
  } catch (err: any) {
    console.error("[Chat] Error:", err.message);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ reply: "Something went wrong. Please try again." }) };
  }
};

export { handler };
