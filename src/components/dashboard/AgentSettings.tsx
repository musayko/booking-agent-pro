import { useState, useEffect } from "react";
import { Bot, Save, Loader2 } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { DEFAULT_AGENT_SETTINGS } from "../../lib/constants";
import type { AgentSettings as AgentSettingsType } from "../../lib/types";

export default function AgentSettings() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<AgentSettingsType>(DEFAULT_AGENT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    supabase.from("agent_settings").select("*").maybeSingle().then(({ data }: any) => {
      if (data) setSettings(data);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    if (isSupabaseConfigured()) {
      await supabase.from("agent_settings").upsert({
        ...settings,
        updated_at: new Date().toISOString(),
      });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700 }}>
          <Bot size={24} style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} />
          {t("agentSettings")}
        </h2>
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saved ? "Saved!" : t("save")}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Mode Toggle */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 12 }}>{t("agentMode")}</h3>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              className={settings.mode === "full_booking" ? "btn-primary" : "btn-secondary"}
              onClick={() => setSettings({ ...settings, mode: "full_booking" })}
            >
              {t("fullBooking")}
            </button>
            <button
              className={settings.mode === "info_only" ? "btn-primary" : "btn-secondary"}
              onClick={() => setSettings({ ...settings, mode: "info_only" })}
            >
              {t("infoOnly")}
            </button>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 8 }}>
            {settings.mode === "full_booking"
              ? "The AI can check availability and create bookings."
              : "The AI will only provide information. Customers must call to book."}
          </p>
        </div>

        {/* System Prompt */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 12 }}>{t("systemPrompt")}</h3>
          <textarea
            className="input-field"
            style={{ minHeight: 200, fontFamily: "'Inter', monospace", fontSize: "0.85rem", lineHeight: 1.6 }}
            value={settings.system_prompt}
            onChange={e => setSettings({ ...settings, system_prompt: e.target.value })}
          />
          <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 8 }}>
            This prompt defines the AI agent's personality, behavior, and knowledge.
          </p>
        </div>

        {/* Business Info */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 12 }}>Business Information</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{t("businessName")}</label>
              <input className="input-field" value={settings.business_name} onChange={e => setSettings({ ...settings, business_name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{t("businessHours")}</label>
              <input className="input-field" value={settings.business_hours} onChange={e => setSettings({ ...settings, business_hours: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{t("email")}</label>
              <input className="input-field" value={settings.business_email || ""} onChange={e => setSettings({ ...settings, business_email: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{t("phone")}</label>
              <input className="input-field" value={settings.business_phone || ""} onChange={e => setSettings({ ...settings, business_phone: e.target.value })} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
