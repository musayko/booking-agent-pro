import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, LogIn, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Fallback demo login
    if (!isSupabaseConfigured() || (email === "admin@bookingpro.cms" && password === "demo2026")) {
      localStorage.setItem("bp_auth", JSON.stringify({ email, role: "admin" }));
      navigate("/dashboard");
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at 50% 30%, rgba(13,148,136,0.1), var(--bg-dark))",
      padding: 24,
    }}>
      <div className="glass-card" style={{ padding: 40, width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, margin: "0 auto 16px",
            background: "linear-gradient(135deg, var(--primary), var(--gradient-end))",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Stethoscope size={24} color="white" />
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>BookingAgent Pro</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>Dashboard Login</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 6, display: "block" }}>Email</label>
            <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@bookingpro.cms" required />
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 6, display: "block" }}>Password</label>
            <input className="input-field" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <p style={{ color: "#f87171", fontSize: "0.85rem" }}>{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <><LogIn size={18} /> Sign In</>}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 20 }}>
          Demo: admin@bookingpro.cms / demo2026
        </p>
      </div>
    </div>
  );
}
