import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import type { Booking } from "../../lib/types";

export default function AppointmentCalendar() {
  const { t } = useI18n();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<"all" | "confirmed" | "cancelled" | "completed">("all");

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    supabase.from("bookings").select("*").order("booking_date", { ascending: false }).then(({ data }: any) => {
      if (data) setBookings(data);
    });
  }, []);

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  const updateStatus = async (id: string, status: Booking["status"]) => {
    if (isSupabaseConfigured()) {
      await supabase.from("bookings").update({ status }).eq("id", id);
    }
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const statusBadge = (status: string) => {
    const cls = status === "confirmed" ? "badge-success" : status === "cancelled" ? "badge-danger" : "badge-warning";
    const label = status === "confirmed" ? t("confirmed") : status === "cancelled" ? t("cancelled") : t("completed");
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700 }}>
          <Calendar size={24} style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} />
          {t("calendar")}
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          {(["all", "confirmed", "completed", "cancelled"] as const).map(f => (
            <button
              key={f}
              className={filter === f ? "btn-primary" : "btn-ghost"}
              onClick={() => setFilter(f)}
              style={{ padding: "6px 14px", fontSize: "0.8rem" }}
            >
              {f === "all" ? "All" : t(f)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: 48, textAlign: "center" }}>
          <Calendar size={48} style={{ color: "var(--text-muted)", marginBottom: 16 }} />
          <p style={{ color: "var(--text-muted)" }}>{t("noBookings")}</p>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("customer")}</th>
                <th>{t("email")}</th>
                <th>{t("service")}</th>
                <th>{t("date")}</th>
                <th>{t("time")}</th>
                <th>{t("status")}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 500 }}>{b.customer_name}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{b.customer_email}</td>
                  <td>{b.service_name || b.service_id}</td>
                  <td>{b.booking_date}</td>
                  <td>{b.start_time} - {b.end_time}</td>
                  <td>{statusBadge(b.status)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      {b.status === "confirmed" && (
                        <>
                          <button className="btn-ghost" style={{ fontSize: "0.75rem", padding: "4px 8px" }} onClick={() => updateStatus(b.id, "completed")}>✓ Done</button>
                          <button className="btn-ghost" style={{ fontSize: "0.75rem", padding: "4px 8px", color: "#f87171" }} onClick={() => updateStatus(b.id, "cancelled")}>✗ Cancel</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
