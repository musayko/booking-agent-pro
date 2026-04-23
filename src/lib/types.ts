// ─── BookingAgent Pro Types ───

export type Language = "en" | "et";

export interface Service {
  id: string;
  name: string;
  name_et?: string;
  description: string;
  description_et?: string;
  price: number;
  duration_minutes: number;
  active: boolean;
  created_at?: string;
}

export interface Booking {
  id: string;
  service_id: string;
  service_name?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  booking_date: string;        // YYYY-MM-DD
  start_time: string;          // HH:MM
  end_time: string;            // HH:MM
  status: "confirmed" | "cancelled" | "completed";
  notes?: string;
  created_at?: string;
}

export interface AgentSettings {
  id: string;
  system_prompt: string;
  mode: "info_only" | "full_booking";
  business_name: string;
  business_hours: string;
  business_address?: string;
  business_phone?: string;
  business_email?: string;
  faq: FaqEntry[];
  updated_at?: string;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface ChatHistoryRecord {
  id?: string;
  session_id: string;
  role: string;
  content: string;
  tool_calls?: any;
  created_at?: string;
}

export interface LanguageConfig {
  code: Language;
  label: string;
  native_label: string;
  enabled: boolean;
}

export interface TimeSlot {
  time: string;      // HH:MM
  available: boolean;
}
