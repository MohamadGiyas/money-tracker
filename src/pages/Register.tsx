import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: window.location.origin + "/reset-password",
      },
    });

    setLoading(false);

    if (error) {
      alert("Gagal daftar: " + error.message);
    } else {
      alert("Akun berhasil dibuat! Silakan login.");
      navigate("/login");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        {/* Panel kiri */}
        <div className="auth-hero">
          <div>
            <div className="auth-hero-logo">₿</div>
            <div className="auth-hero-title">Buat Akun Baru</div>
            <div className="auth-hero-subtitle">
              Simpan transaksi harian, dapatkan gambaran plus minus keuangan
              dalam seminggu.
            </div>
          </div>
          <div className="auth-hero-badge">
            <span>📊</span>
            <span>Ringkasan keuangan otomatis</span>
          </div>
        </div>

        {/* Panel kanan */}
        <div className="auth-card">
          <h2 className="auth-heading">Daftar</h2>
          <p className="auth-subheading">
            Buat akun supaya datamu tersimpan dan bisa diakses kapan saja.
          </p>

          <form onSubmit={handleRegister}>
            <div className="field">
              <label className="field-label">Nama Lengkap</label>
              <input
                className="field-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="contoh: Mohamad Giyas"
              />
            </div>

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
                  minLength={6}
                  placeholder="minimal 6 karakter"
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

            <button
              type="submit"
              className="primary-btn"
              disabled={loading}
            >
              {loading ? "Mendaftar..." : "Daftar"}
            </button>
          </form>

          <div className="auth-footer">
            Sudah punya akun?{" "}
            <a href="/login">
              Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
