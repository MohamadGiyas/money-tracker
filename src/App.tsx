import { useState } from "react";
import { supabase } from "./supabaseClient";

function App() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // ✅ BERSIHKAN INPUT DULU
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password; // kalau mau bisa juga password.trim()

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
      options: {
        data: { full_name: cleanName },
        emailRedirectTo: "http://localhost:5173/",
      },
    });

    setLoading(false);

    if (error) {
      alert("Gagal daftar: " + error.message);
      console.error("SUPABASE ERROR:", error);
    } else {
      alert("Akun berhasil dibuat!");
      console.log("DATA:", data);

      // optional: kosongkan form setelah sukses
      setFullName("");
      setEmail("");
      setPassword("");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        color: "white",
      }}
    >
      <form
        onSubmit={handleRegister}
        style={{
          width: 350,
          padding: 20,
          borderRadius: 12,
          background: "#1e293b",
          border: "1px solid #334155",
        }}
      >
        <h2 style={{ marginBottom: 12 }}>Register User</h2>

        <div style={{ marginBottom: 12 }}>
          <label>Nama Lengkap</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{
              width: "100%",
              padding: 6,
              marginTop: 4,
              borderRadius: 6,
              border: "1px solid #334155",
              background: "#0f172a",
              color: "white",
            }}
            required
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: 6,
              marginTop: 4,
              borderRadius: 6,
              border: "1px solid #334155",
              background: "#0f172a",
              color: "white",
            }}
            required
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: 6,
              marginTop: 4,
              borderRadius: 6,
              border: "1px solid #334155",
              background: "#0f172a",
              color: "white",
            }}
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 6,
            border: "none",
            background: loading ? "#166534" : "#22c55e",
            fontWeight: 700,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Mendaftar..." : "Daftar"}
        </button>
      </form>
    </div>
  );
}

export default App;
