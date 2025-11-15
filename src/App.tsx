import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Forgot from "./pages/Forgot";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";

type Theme = "dark" | "light" | "cyber" | "pastel";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem("mt-theme") as Theme | null;
  if (stored === "dark" || stored === "light" || stored === "cyber" || stored === "pastel") {
    return stored;
  }
  return "dark";
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("mt-theme", theme);
    }
  }, [theme]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* Theme switcher kanan bawah */}
      <div className="theme-switcher">
        <span className="theme-switcher-label">Tema:</span>
        <select
          className="theme-switcher-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value as Theme)}
        >
          <option value="dark">Gelap</option>
          <option value="light">Cerah</option>
          <option value="cyber">Cyber</option>
          <option value="pastel">Pastel</option>
        </select>
      </div>

      {/* Watermark kiri bawah */}
      <div className="app-watermark">
        Made with <span>MGiyas</span>
      </div>
    </>
  );
}