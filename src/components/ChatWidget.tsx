import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { useI18n } from "../lib/i18n";
import type { ChatMessage, Service } from "../lib/types";

const SESSION_KEY = "bp_session_id";
function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(SESSION_KEY, id); }
  return id;
}

export default function ChatWidget({ services: _services }: { services: Service[] }) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: t("chatWelcome"), timestamp: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Update welcome message when language changes
  useEffect(() => {
    setMessages(prev => prev.map(m => m.id === "welcome" ? { ...m, content: t("chatWelcome") } : m));
  }, [lang, t]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(), role: "user", content: text, timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = messages
        .filter(m => m.id !== "welcome")
        .concat(userMsg)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          sessionId: getSessionId(),
          language: lang,
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");
      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply || "Sorry, I couldn't process that. Please try again.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: "assistant", timestamp: Date.now(),
        content: lang === "et"
          ? "Vabandust, tekkis viga. Palun proovige uuesti."
          : "Sorry, something went wrong. Please try again.",
      }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Float button */}
      <button className="chat-float-btn" onClick={() => setOpen(!open)} aria-label="Open chat">
        {open ? <X size={26} /> : <MessageCircle size={26} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="chat-panel glass-card" style={{ border: "1px solid rgba(13,148,136,0.2)" }}>
          {/* Header */}
          <div style={{
            padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "linear-gradient(135deg, rgba(13,148,136,0.15), rgba(8,145,178,0.1))",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "linear-gradient(135deg, var(--primary), var(--gradient-end))",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <MessageCircle size={16} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{t("chatTitle")}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--primary-light)" }}>● Online</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer",
            }}>
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{
            flex: 1, overflowY: "auto", padding: "16px 16px 8px",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            {messages.map(m => (
              <div key={m.id} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div className={m.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-bubble-assistant" style={{ display: "inline-block" }}>
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding: "12px 16px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", gap: 8,
          }}>
            <input
              ref={inputRef}
              className="input-field"
              style={{ flex: 1, borderRadius: 12 }}
              placeholder={t("chatPlaceholder")}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              disabled={loading}
            />
            <button
              className="btn-primary"
              style={{ padding: "10px 14px", borderRadius: 12 }}
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
