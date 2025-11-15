import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: window.location.origin + "/reset-password",
      }
    );

    setLoading(false);

    if (error) {
      alert("Gagal mengirim link reset: " + error.message);
    } else {
      alert("Link reset password sudah dikirim ke email kamu.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-card" style={{ width: "100%" }}>
          <h2 className="auth-heading">Lupa Password</h2>
          <p className="auth-subheading">
            Masukkan email yang terdaftar. Kami akan mengirim link untuk reset
            password.
          </p>

          <form onSubmit={handleReset}>
            <div className="field">
              <label className="field-label">Email</label>
              <input
                className="field-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email yang terdaftar"
              />
            </div>

            <button
              type="submit"
              className="primary-btn"
              disabled={loading}
            >
              {loading ? "Mengirim..." : "Kirim Link Reset"}
            </button>
          </form>

          <div className="auth-footer">
            Kembali ke{" "}
            <a href="/login">
              Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
