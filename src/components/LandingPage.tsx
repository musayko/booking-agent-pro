import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Stethoscope, Clock, DollarSign, Globe, Sparkles, Shield, Star } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { DEFAULT_SERVICES } from "../lib/constants";
import type { Service } from "../lib/types";
import ChatWidget from "./ChatWidget";

export default function LandingPage() {
  const { lang, setLang, t } = useI18n();
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    supabase.from("services").select("*").eq("active", true).order("created_at").then(({ data }: any) => {
      if (data?.length) setServices(data);
    });
  }, []);

  const svcName = (s: Service) => lang === "et" && s.name_et ? s.name_et : s.name;
  const svcDesc = (s: Service) => lang === "et" && s.description_et ? s.description_et : s.description;

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* ─── Nav ─── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(12, 18, 34, 0.8)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, var(--primary), var(--gradient-end))",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Stethoscope size={20} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>SmilePro Dental</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="#services" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
            {t("servicesTitle")}
          </a>
          <button
            onClick={() => setLang(lang === "en" ? "et" : "en")}
            className="btn-ghost"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <Globe size={16} />
            {lang.toUpperCase()}
          </button>
          <Link to="/login" className="btn-ghost" style={{ fontSize: "0.85rem" }}>
            {t("login")}
          </Link>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "120px 24px 80px",
        background: "radial-gradient(ellipse at 30% 20%, rgba(13,148,136,0.15), transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(8,145,178,0.1), transparent 50%)",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative grid */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.03,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        <div style={{ maxWidth: 800, textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px",
            background: "rgba(13,148,136,0.12)", borderRadius: 9999, marginBottom: 24,
            color: "var(--primary-light)", fontSize: "0.85rem", fontWeight: 600,
          }}>
            <Sparkles size={14} /> AI-Powered Booking
          </div>

          <h1 style={{
            fontSize: "clamp(2.2rem, 5vw, 3.8rem)", fontWeight: 800,
            lineHeight: 1.1, marginBottom: 20,
            background: "linear-gradient(135deg, #fff 30%, var(--primary-light))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            {t("heroTitle")}
          </h1>

          <p style={{
            fontSize: "1.15rem", color: "var(--text-muted)", lineHeight: 1.7,
            maxWidth: 600, margin: "0 auto 40px",
          }}>
            {t("heroSubtitle")}
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => {
              const btn = document.querySelector('.chat-float-btn') as HTMLButtonElement;
              btn?.click();
            }}>
              <Sparkles size={18} /> {t("ctaBook")}
            </button>
            <a href="#services" className="btn-secondary">{t("ctaServices")}</a>
          </div>

          {/* Stats */}
          <div style={{
            display: "flex", gap: 32, justifyContent: "center", marginTop: 60,
            flexWrap: "wrap",
          }}>
            {[
              { icon: <Star size={20} />, value: "4.9★", label: "Rating" },
              { icon: <Shield size={20} />, value: "15+", label: lang === "et" ? "Aastat kogemust" : "Years Experience" },
              { icon: <Stethoscope size={20} />, value: "10K+", label: lang === "et" ? "Rahulolev patsient" : "Happy Patients" },
            ].map((s, i) => (
              <div key={i} className="glass-card" style={{ padding: "20px 28px", textAlign: "center" }}>
                <div style={{ color: "var(--primary-light)", marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Services ─── */}
      <section id="services" style={{
        padding: "80px 24px",
        background: "linear-gradient(180deg, transparent, rgba(13,148,136,0.03))",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 12 }}>{t("servicesTitle")}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>{t("servicesSubtitle")}</p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 20,
          }}>
            {services.filter(s => s.active).map(s => (
              <div key={s.id} className="service-card">
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8 }}>{svcName(s)}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: 16 }}>
                  {svcDesc(s)}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--primary-light)", fontWeight: 600 }}>
                      <DollarSign size={16} />€{s.price}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      <Clock size={14} />{s.duration_minutes} {t("duration")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{
        padding: "32px 24px", textAlign: "center",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        color: "var(--text-muted)", fontSize: "0.8rem",
      }}>
        <p>{t("footer")}</p>
        <p style={{ marginTop: 4 }}>© 2026 SmilePro Dental. All rights reserved.</p>
      </footer>

      {/* ─── Chat Widget ─── */}
      <ChatWidget services={services} />
    </div>
  );
}
