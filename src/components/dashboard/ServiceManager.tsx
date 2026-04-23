import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { DEFAULT_SERVICES } from "../../lib/constants";
import type { Service } from "../../lib/types";

export default function ServiceManager() {
  const { t } = useI18n();
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [editing, setEditing] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    supabase.from("services").select("*").order("created_at").then(({ data }: any) => {
      if (data?.length) setServices(data);
    });
  }, []);

  const emptyService: Service = {
    id: "", name: "", name_et: "", description: "", description_et: "",
    price: 0, duration_minutes: 30, active: true,
  };

  const openNew = () => { setEditing({ ...emptyService }); setShowForm(true); };
  const openEdit = (s: Service) => { setEditing({ ...s }); setShowForm(true); };
  const closeForm = () => { setEditing(null); setShowForm(false); };

  const saveService = async () => {
    if (!editing) return;
    if (editing.id) {
      // Update
      if (isSupabaseConfigured()) {
        await supabase.from("services").update(editing).eq("id", editing.id);
      }
      setServices(prev => prev.map(s => s.id === editing.id ? editing : s));
    } else {
      // Insert
      const newSvc = { ...editing, id: `svc-${Date.now()}` };
      if (isSupabaseConfigured()) {
        const { data } = await supabase.from("services").insert(newSvc).select().single();
        if (data) { newSvc.id = data.id; }
      }
      setServices(prev => [...prev, newSvc]);
    }
    closeForm();
  };

  const deleteService = async (id: string) => {
    if (isSupabaseConfigured()) await supabase.from("services").delete().eq("id", id);
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const toggleActive = async (s: Service) => {
    const updated = { ...s, active: !s.active };
    if (isSupabaseConfigured()) await supabase.from("services").update({ active: updated.active }).eq("id", s.id);
    setServices(prev => prev.map(x => x.id === s.id ? updated : x));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700 }}>{t("services")}</h2>
        <button className="btn-primary" onClick={openNew}><Plus size={18} /> {t("addService")}</button>
      </div>

      {/* Service Table */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>{t("price")}</th>
              <th>{t("durationLabel")}</th>
              <th>{t("active")}</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{s.name}</div>
                  {s.name_et && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{s.name_et}</div>}
                </td>
                <td style={{ color: "var(--primary-light)", fontWeight: 600 }}>€{s.price}</td>
                <td>{s.duration_minutes} min</td>
                <td>
                  <button className={`toggle ${s.active ? "active" : ""}`} onClick={() => toggleActive(s)} />
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-ghost" onClick={() => openEdit(s)} style={{ padding: "6px" }}><Pencil size={16} /></button>
                    <button className="btn-ghost" onClick={() => deleteService(s.id)} style={{ padding: "6px", color: "#f87171" }}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit/Add Modal */}
      {showForm && editing && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }}>
          <div className="glass-card" style={{ padding: 32, width: "100%", maxWidth: 500 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>{editing.id ? t("editService") : t("addService")}</h3>
              <button className="btn-ghost" onClick={closeForm}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Name (EN)</label>
                  <input className="input-field" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Name (ET)</label>
                  <input className="input-field" value={editing.name_et || ""} onChange={e => setEditing({ ...editing, name_et: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{t("description")}</label>
                <textarea className="input-field" value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{t("price")} (€)</label>
                  <input className="input-field" type="number" value={editing.price} onChange={e => setEditing({ ...editing, price: Number(e.target.value) })} />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{t("durationLabel")}</label>
                  <input className="input-field" type="number" value={editing.duration_minutes} onChange={e => setEditing({ ...editing, duration_minutes: Number(e.target.value) })} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                <button className="btn-secondary" onClick={closeForm}>{t("cancel")}</button>
                <button className="btn-primary" onClick={saveService}><Check size={18} /> {t("save")}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
