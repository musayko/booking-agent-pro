import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Calendar, Globe, LogOut, Stethoscope, Bot } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { STUDENT_NAME, TEAM_SLUG } from "../../lib/constants";
import ServiceManager from "./ServiceManager";
import AppointmentCalendar from "./AppointmentCalendar";
import AgentSettings from "./AgentSettings";

type Tab = "services" | "calendar" | "agent" | "languages";

export default function Dashboard() {
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("services");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check auth
    const localAuth = localStorage.getItem("bp_auth");
    if (localAuth) {
      setUser(JSON.parse(localAuth));
      return;
    }
    if (isSupabaseConfigured()) {
      supabase.auth.getUser().then(({ data }: any) => {
        if (data.user) setUser({ email: data.user.email, role: "admin" });
        else navigate("/login");
      });
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("bp_auth");
    if (isSupabaseConfigured()) supabase.auth.signOut();
    navigate("/login");
  };

  if (!user) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "services", label: t("services"), icon: <LayoutDashboard size={18} /> },
    { id: "calendar", label: t("calendar"), icon: <Calendar size={18} /> },
    { id: "agent", label: t("agentSettings"), icon: <Bot size={18} /> },
    { id: "languages", label: t("languages"), icon: <Globe size={18} /> },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside style={{
        width: 260, padding: "24px 16px", borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column", gap: 8,
        background: "rgba(12,18,34,0.95)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, padding: "0 8px" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, var(--primary), var(--gradient-end))",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Stethoscope size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>BookingAgent Pro</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{t("dashboard")}</div>
          </div>
        </div>

        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`sidebar-link ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        <div style={{
          padding: "12px", borderRadius: 10,
          background: "rgba(255,255,255,0.03)",
          fontSize: "0.8rem", color: "var(--text-muted)",
        }}>
          <div style={{ fontWeight: 500, color: "white", marginBottom: 4 }}>{user.email}</div>
          <div>Role: Admin</div>
        </div>

        <button className="sidebar-link" onClick={handleLogout} style={{ color: "#f87171" }}>
          <LogOut size={18} /> {t("logout")}
        </button>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: 32, overflowY: "auto" }}>
        {activeTab === "services" && <ServiceManager />}
        {activeTab === "calendar" && <AppointmentCalendar />}
        {activeTab === "agent" && <AgentSettings />}
        {activeTab === "languages" && (
          <div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 24 }}>{t("languages")}</h2>
            <div className="glass-card" style={{ padding: 24 }}>
              <p style={{ color: "var(--text-muted)", marginBottom: 16, fontSize: "0.9rem" }}>
                Select the dashboard and AI language:
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                {(["en", "et"] as const).map(l => (
                  <button
                    key={l}
                    className={lang === l ? "btn-primary" : "btn-secondary"}
                    onClick={() => setLang(l)}
                  >
                    {l === "en" ? "🇬🇧 English" : "🇪🇪 Eesti"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: 48, padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.05)",
          color: "var(--text-muted)", fontSize: "0.75rem", textAlign: "center",
        }}>
          Built in AI Web Session 2026 | BookingAgent Pro | Student: {STUDENT_NAME} | Team: {TEAM_SLUG}
        </div>
      </main>
    </div>
  );
}
