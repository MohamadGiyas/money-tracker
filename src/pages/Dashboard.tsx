// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

type TxType = "income" | "expense";

type IncomeCategory =
  | "Gaji"
  | "Uang Saku"
  | "Bonus"
  | "Hadiah"
  | "Penjualan Barang"
  | "Transfer Masuk"
  | "Lainnya";

type ExpenseCategory =
  | "Makanan"
  | "Transportasi"
  | "Belanja"
  | "Hiburan"
  | "Tagihan"
  | "Pendidikan"
  | "Kesehatan"
  | "Lainnya";

type TxCategory = IncomeCategory | ExpenseCategory;

type ThemeName = "dark" | "light" | "cyber" | "pastel";

interface Transaction {
  id: string;
  user_id: string;
  type: TxType;
  category: TxCategory;
  amount: number;
  note: string | null;
  date: string; // yyyy-mm-dd
  created_at: string;
}

interface FormState {
  type: TxType;
  category: TxCategory;
  amount: string;
  note: string;
  date: string;
}

type HistoryFilter = "all" | "today" | "week" | "month";

interface DashboardProps {
  // Biar aman kalau App.tsx sudah pernah ngirim theme, sifatnya opsional
  theme?: ThemeName;
  setTheme?: (t: ThemeName) => void;
}

export default function Dashboard({ theme, setTheme }: DashboardProps) {
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [saving, setSaving] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const todayStr = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<FormState>({
    type: "expense",
    category: "Makanan",
    amount: "",
    note: "",
    date: todayStr,
  });

  const [historyFilter, setHistoryFilter] =
    useState<HistoryFilter>("all");

  // === THEME HANDLING (fallback di dalam Dashboard) ===
  const [internalTheme, setInternalTheme] =
    useState<ThemeName>("dark");
  const activeTheme = theme ?? internalTheme;

  const applyTheme = (t: ThemeName) => {
    const root = document.documentElement;
    root.setAttribute("data-theme", t);

    document.body.classList.remove(
      "theme-dark",
      "theme-light",
      "theme-cyber",
      "theme-pastel"
    );
    document.body.classList.add(`theme-${t}`);
  };

  useEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme]);

  const handleChangeTheme = (value: ThemeName) => {
    if (setTheme) {
      setTheme(value);
    } else {
      setInternalTheme(value);
    }
  };

  // ============ AUTH & LOAD TRANSAKSI ============

  useEffect(() => {
    const boot = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        navigate("/login");
        return;
      }

      setUser(data.user);
      setLoadingUser(false);

      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", data.user.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (txError) {
        console.error("Gagal load transaksi:", txError.message);
      } else if (txData) {
        setTransactions(txData as Transaction[]);
      }
      setLoadingTx(false);
    };

    boot();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // ============ FORM HANDLER ============

  const handleFormChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const nominal = Number(
      form.amount.replace(".", "").replace(",", ".")
    );
    if (!nominal || nominal <= 0) {
      alert("Nominal harus lebih dari 0");
      return;
    }

    setSaving(true);
    const payload = {
      user_id: user.id,
      type: form.type,
      category: form.category,
      amount: nominal,
      note: form.note.trim() || null,
      date: form.date,
    };

    const { data, error } = await supabase
      .from("transactions")
      .insert(payload)
      .select()
      .single();

    setSaving(false);

    if (error) {
      console.error("Gagal simpan transaksi:", error.message);
      alert("Gagal menyimpan transaksi. Coba lagi.");
      return;
    }

    setTransactions((prev) => [data as Transaction, ...prev]);
    setForm((prev) => ({ ...prev, amount: "", note: "" }));
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!confirm("Hapus transaksi ini?")) return;

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Gagal hapus transaksi:", error.message);
      alert("Gagal menghapus transaksi. Coba lagi.");
      return;
    }

    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  // ============ STATISTIK & CHART ============

  const stats = useMemo(() => {
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);

    const weekStart = new Date();
    weekStart.setDate(today.getDate() - 6);

    const monthStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    let totalIncome = 0,
      totalExpense = 0;
    let dayIncome = 0,
      dayExpense = 0;
    let weekIncome = 0,
      weekExpense = 0;
    let monthIncome = 0,
      monthExpense = 0;

    const dailyMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = 0;
    }

    for (const tx of transactions) {
      const amt = tx.amount;
      const isIncome = tx.type === "income";
      const d = new Date(tx.date);

      if (isIncome) totalIncome += amt;
      else totalExpense += amt;

      if (tx.date === todayKey) {
        if (isIncome) dayIncome += amt;
        else dayExpense += amt;
      }

      if (d >= weekStart && d <= today) {
        if (isIncome) weekIncome += amt;
        else weekExpense += amt;
      }

      if (d >= monthStart && d <= today) {
        if (isIncome) monthIncome += amt;
        else monthExpense += amt;
      }

      const key = tx.date;
      if (key in dailyMap) {
        dailyMap[key] += isIncome ? amt : -amt;
      }
    }

    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const dailySeries = Object.entries(dailyMap).map(
      ([dateKey, net]) => {
        const d = new Date(dateKey);
        const label = dayNames[d.getDay()];
        return { dateKey, label, net };
      }
    );

    const maxAbs = dailySeries.reduce(
      (m, d) => Math.max(m, Math.abs(d.net)),
      0
    );

    return {
      totalIncome,
      totalExpense,
      totalNet: totalIncome - totalExpense,
      dayIncome,
      dayExpense,
      dayNet: dayIncome - dayExpense,
      weekIncome,
      weekExpense,
      weekNet: weekIncome - weekExpense,
      monthIncome,
      monthExpense,
      monthNet: monthIncome - monthExpense,
      dailySeries,
      maxAbs,
    };
  }, [transactions]);

  // ============ FILTER HISTORI ============

  const filteredTransactions = useMemo(() => {
    if (historyFilter === "all") return transactions;

    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);

    if (historyFilter === "today") {
      return transactions.filter((tx) => tx.date === todayKey);
    }

    if (historyFilter === "week") {
      const weekStart = new Date();
      weekStart.setDate(today.getDate() - 6);
      return transactions.filter((tx) => {
        const d = new Date(tx.date);
        return d >= weekStart && d <= today;
      });
    }

    if (historyFilter === "month") {
      const monthStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
      return transactions.filter((tx) => {
        const d = new Date(tx.date);
        return d >= monthStart && d <= today;
      });
    }

    return transactions;
  }, [transactions, historyFilter]);

  if (loadingUser) {
    return <div className="dashboard-loading">Memuat...</div>;
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  // ============ RENDER ============

  return (
    <div className="shell-root">
      {/* SIDEBAR (desktop) */}
      <aside className={`shell-sidebar ${sidebarOpen ? "" : "collapsed"}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">₿</div>
          {sidebarOpen && (
            <div className="sidebar-title">
              <div className="sidebar-brand">Money Tracker</div>
              <div className="sidebar-user">Hi, {displayName}</div>
            </div>
          )}
        </div>

        {sidebarOpen && (
          <div className="sidebar-section">
            <div className="sidebar-label">Saldo Keseluruhan</div>
            <div className="sidebar-balance">
              {formatCurrency(stats.totalNet)}
            </div>
            <div className="sidebar-caption">
              Pemasukan {formatCurrency(stats.totalIncome)} • Pengeluaran{" "}
              {formatCurrency(stats.totalExpense)}
            </div>
          </div>
        )}

        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen((v) => !v)}
        >
          {sidebarOpen ? "«" : "»"}
        </button>

        {sidebarOpen && (
          <div className="sidebar-footer">
            <button className="outline-btn small" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </aside>

      {/* MAIN */}
      <div className="shell-main">
        {/* HEADER – Logout SELALU ADA (PC & HP) */}
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <h1 className="dashboard-title">Ringkasan Keuangan</h1>
            <p className="dashboard-subtitle">
              Pantau pemasukan & pengeluaran kamu per hari, minggu, dan bulan.
            </p>
          </div>

          <div className="dashboard-header-right">
            <button className="outline-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="dashboard-main">
          {/* SUMMARY CARDS */}
          <section className="summary-grid">
            <div className="summary-card summary-balance">
              <div className="summary-label">Total Keseluruhan</div>
              <div className="summary-value">
                {formatCurrency(stats.totalNet)}
              </div>
              <div className="summary-caption">
                +{formatCurrency(stats.totalIncome)} • -
                {formatCurrency(stats.totalExpense)}
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-label">
                Hari Ini (
                {new Date().toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
                )
              </div>
              <div
                className={
                  "summary-value " +
                  (stats.dayNet >= 0 ? "positive" : "negative")
                }
              >
                {formatCurrency(stats.dayNet)}
              </div>
              <div className="summary-caption">
                +{formatCurrency(stats.dayIncome)} / -
                {formatCurrency(stats.dayExpense)}
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-label">Minggu Ini</div>
              <div
                className={
                  "summary-value " +
                  (stats.weekNet >= 0 ? "positive" : "negative")
                }
              >
                {formatCurrency(stats.weekNet)}
              </div>
              <div className="summary-caption">
                +{formatCurrency(stats.weekIncome)} / -
                {formatCurrency(stats.weekExpense)}
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-label">Bulan Ini</div>
              <div
                className={
                  "summary-value " +
                  (stats.monthNet >= 0 ? "positive" : "negative")
                }
              >
                {formatCurrency(stats.monthNet)}
              </div>
              <div className="summary-caption">
                +{formatCurrency(stats.monthIncome)} / -
                {formatCurrency(stats.monthExpense)}
              </div>
            </div>
          </section>

          {/* GRID BAWAH */}
          <section className="bottom-grid">
            {/* FORM */}
            <div className="card-panel glass">
              <h2 className="panel-title">Catat Transaksi</h2>
              <p className="panel-subtitle">
                Input pemasukan atau pengeluaran harian kamu. Data disimpan di
                Supabase dan bisa diakses dari device lain.
              </p>

              <form className="tx-form" onSubmit={handleAddTransaction}>
                <div className="tx-form-row">
                  <div className="tx-field">
                    <label className="field-label">Tipe</label>
                    <select
                      className="field-input"
                      value={form.type}
                      onChange={(e) =>
                        handleFormChange("type", e.target.value as TxType)
                      }
                    >
                      <option value="income">Pemasukan</option>
                      <option value="expense">Pengeluaran</option>
                    </select>
                  </div>

                  <div className="tx-field">
                    <label className="field-label">Kategori</label>
                    <select
                      className="field-input"
                      value={form.category}
                      onChange={(e) =>
                        handleFormChange(
                          "category",
                          e.target.value as TxCategory
                        )
                      }
                    >
                      {form.type === "income" ? (
                        <>
                          <option>Gaji</option>
                          <option>Uang Saku</option>
                          <option>Bonus</option>
                          <option>Hadiah</option>
                          <option>Penjualan Barang</option>
                          <option>Transfer Masuk</option>
                          <option>Lainnya</option>
                        </>
                      ) : (
                        <>
                          <option>Makanan</option>
                          <option>Transportasi</option>
                          <option>Belanja</option>
                          <option>Hiburan</option>
                          <option>Tagihan</option>
                          <option>Pendidikan</option>
                          <option>Kesehatan</option>
                          <option>Lainnya</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="tx-form-row">
                  <div className="tx-field">
                    <label className="field-label">Tanggal</label>
                    <input
                      type="date"
                      className="field-input"
                      value={form.date}
                      onChange={(e) =>
                        handleFormChange("date", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="tx-field">
                    <label className="field-label">Nominal</label>
                    <input
                      className="field-input"
                      placeholder="contoh: 50000"
                      value={form.amount}
                      onChange={(e) =>
                        handleFormChange("amount", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                <div className="tx-field">
                  <label className="field-label">Catatan (opsional)</label>
                  <input
                    className="field-input"
                    placeholder="contoh: kopi sama roti"
                    value={form.note}
                    onChange={(e) =>
                      handleFormChange("note", e.target.value)
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  {saving ? "Menyimpan..." : "Simpan Transaksi"}
                </button>
              </form>
            </div>

            {/* CHART + HISTORI */}
            <div className="card-panel glass">
              <h2 className="panel-title">Grafik 7 Hari Terakhir</h2>
              <p className="panel-subtitle">
                Batang hijau = saldo harian positif, merah = minus.
              </p>

              <div className="chart-wrapper">
                <div className="chart-bars">
                  {stats.dailySeries.map((d) => {
                    const max = stats.maxAbs || 1;
                    const height = (Math.abs(d.net) / max) * 100;
                    const positive = d.net >= 0;
                    return (
                      <div key={d.dateKey} className="chart-bar-item">
                        <div className="chart-bar-track">
                          <div
                            className={
                              "chart-bar-fill " +
                              (positive ? "positive" : "negative")
                            }
                            style={{ height: `${height || 4}%` }}
                          />
                        </div>
                        <div className="chart-bar-label">{d.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <h3 className="panel-title" style={{ marginTop: 18 }}>
                Histori Transaksi
              </h3>
              <div className="history-filter-row">
                <span className="history-filter-label">Filter</span>
                <select
                  className="field-input history-filter-select"
                  value={historyFilter}
                  onChange={(e) =>
                    setHistoryFilter(e.target.value as HistoryFilter)
                  }
                >
                  <option value="all">Semua</option>
                  <option value="today">Hari ini</option>
                  <option value="week">7 hari terakhir</option>
                  <option value="month">Bulan ini</option>
                </select>
              </div>

              {loadingTx ? (
                <p className="empty-text">Memuat transaksi...</p>
              ) : filteredTransactions.length === 0 ? (
                <p className="empty-text">
                  Belum ada transaksi pada filter ini.
                </p>
              ) : (
                <div className="tx-list">
                  {filteredTransactions.map((tx) => (
                    <div key={tx.id} className="tx-item">
                      <div className="tx-main">
                        <div className="tx-top-row">
                          <span className="tx-category">{tx.category}</span>
                          <span
                            className={
                              "tx-amount " +
                              (tx.type === "income"
                                ? "tx-amount-income"
                                : "tx-amount-expense")
                            }
                          >
                            {tx.type === "income" ? "+" : "-"}
                            {formatCurrency(tx.amount)}
                          </span>
                        </div>
                        {tx.note && (
                          <div className="tx-note">{tx.note}</div>
                        )}
                        <div className="tx-meta">
                          {new Date(tx.date).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          •{" "}
                          {tx.type === "income"
                            ? "Pemasukan"
                            : "Pengeluaran"}
                        </div>
                      </div>
                      <button
                        className="tx-delete-btn"
                        onClick={() => handleDelete(tx.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>

        {/* FOOTER: WATERMARK + THEME PICKER */}
        <footer className="app-footer">
          <div className="watermark">
            Made with <span>MGiyas</span>
          </div>

          <div className="theme-switcher">
            <span className="theme-switcher-label">Tema:</span>
            <select
              className="theme-switcher-select"
              value={activeTheme}
              onChange={(e) =>
                handleChangeTheme(e.target.value as ThemeName)
              }
            >
              <option value="dark">Gelap</option>
              <option value="light">Cerah</option>
              <option value="cyber">Cyber</option>
              <option value="pastel">Pastel</option>
            </select>
          </div>
        </footer>
      </div>
    </div>
  );
}
