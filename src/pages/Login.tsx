import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (error) {
      alert("Gagal login: " + error.message);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        {/* Panel kiri */}
        <div className="auth-hero">
          <div>
            <div className="auth-hero-logo">₿</div>
            <div className="auth-hero-title">Money Tracker Pro</div>
            <div className="auth-hero-subtitle">
              Pantau pemasukan & pengeluaran mingguan kamu dengan tampilan yang
              rapi dan mudah dipahami.
            </div>
          </div>
          <div className="auth-hero-badge">
            <span>🔒</span>
            <span>Data tersimpan aman di Supabase</span>
          </div>
        </div>

        {/* Panel kanan (form login) */}
        <div className="auth-card">
          <h2 className="auth-heading">Login</h2>
          <p className="auth-subheading">
            Masuk untuk melihat ringkasan keuangan kamu.
          </p>

          <form onSubmit={handleLogin}>
            <div className="field">
              <label className="field-label">Email</label>
              <input
                className="field-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="contoh: kamu@email.com"
              />
            </div>

            <div className="field">
              <label className="field-label">Password</label>
              <div className="password-wrapper">
                <input
                  className="field-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Sembunyi" : "Lihat"}
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <span />
              <a href="/forgot-password" className="link-inline">
                Lupa password?
              </a>
            </div>

            <button
              type="submit"
              className="primary-btn"
              disabled={loading}
            >
              {loading ? "Sedang masuk..." : "Login"}
            </button>
          </form>

          <div className="auth-footer">
            Belum punya akun?{" "}
            <a href="/register">
              Daftar
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
