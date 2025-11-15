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

interface Transaction {
  id: string;
  type: TxType;
  category: TxCategory;
  amount: number;
  note: string;
  date: string; // yyyy-mm-dd
}

interface FormState {
  type: TxType;
  category: TxCategory;
  amount: string;
  note: string;
  date: string;
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState<FormState>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      type: "expense",
      category: "Makanan",
      amount: "",
      note: "",
      date: today,
    };
  });

  // THEME STATE (dark / light)
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Filter histori: mode + tanggal
  const [historyMode, setHistoryMode] = useState<"all" | "range">("all");
  const [historyStart, setHistoryStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6); // default 7 hari terakhir
    return d.toISOString().slice(0, 10);
  });
  const [historyEnd, setHistoryEnd] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  // ------------ AUTH ------------
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate("/login");
      } else {
        setUser(data.user);
      }
      setLoadingUser(false);
    });
  }, [navigate]);

  const storageKey = useMemo(
    () => (user ? `money-tracker:${user.id}` : null),
    [user]
  );

  // ------------ LOAD / SAVE LOCALSTORAGE (TRANSAKSI) ------------
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setTransactions(JSON.parse(raw));
    } catch (e) {
      console.error("Gagal load transaksi:", e);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(transactions));
  }, [transactions, storageKey]);

  // ------------ THEME: LOAD & APPLY ------------
  useEffect(() => {
    // load theme dari localStorage
    const saved = localStorage.getItem("money-theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    // apply ke <body> sebagai class
    if (typeof document !== "undefined") {
      document.body.classList.toggle("theme-light", theme === "light");
      localStorage.setItem("money-theme", theme);
    }
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // ------------ HELPERS ------------

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleFormChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const nominal = Number(form.amount.replace(",", "."));
    if (!nominal || nominal <= 0) {
      alert("Nominal harus lebih dari 0");
      return;
    }

    const newTx: Transaction = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2),
      type: form.type,
      category: form.category,
      amount: nominal,
      note: form.note.trim(),
      date: form.date,
    };

    setTransactions((prev) => [newTx, ...prev]);
    setForm((prev) => ({ ...prev, amount: "", note: "" }));
  };

  const handleDelete = (id: string) => {
    if (!confirm("Hapus transaksi ini?")) return;
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  // ------ HITUNG STATISTIK & DATA CHART + INFO HARI INI ------
  const stats = useMemo(() => {
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);

    const weekStart = new Date();
    weekStart.setDate(today.getDate() - 6); // 7 hari terakhir

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    let totalIncome = 0,
      totalExpense = 0;
    let dayIncome = 0,
      dayExpense = 0;
    let weekIncome = 0,
      weekExpense = 0;
    let monthIncome = 0,
      monthExpense = 0;

    // untuk chart 7 hari terakhir
    const dailyMap: Record<string, number> = {};

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = 0;
    }

    const todayIncomeCats: string[] = [];
    const todayExpenseCats: string[] = [];

    for (const tx of transactions) {
      const amt = tx.amount;
      const isIncome = tx.type === "income";
      const d = new Date(tx.date);

      if (isIncome) totalIncome += amt;
      else totalExpense += amt;

      if (tx.date === todayKey) {
        if (isIncome) {
          dayIncome += amt;
          todayIncomeCats.push(tx.category);
        } else {
          dayExpense += amt;
          todayExpenseCats.push(tx.category);
        }
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
    const dailySeries = Object.entries(dailyMap).map(([dateKey, net]) => {
      const d = new Date(dateKey);
      const label = dayNames[d.getDay()];
      return { dateKey, label, net };
    });

    const maxAbs = dailySeries.reduce(
      (m, d) => Math.max(m, Math.abs(d.net)),
      0
    );

    const uniq = (arr: string[]) => Array.from(new Set(arr));
    const joinCats = (arr: string[]) =>
      arr.length === 0 ? "-" : uniq(arr).slice(0, 3).join(", ");

    const todayIncomeText = joinCats(todayIncomeCats);
    const todayExpenseText = joinCats(todayExpenseCats);

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
      todayIncomeText,
      todayExpenseText,
      todayKey,
    };
  }, [transactions]);

  // ------ FILTER HISTORI BERDASARKAN MODE & TANGGAL ------
  const filteredTransactions = useMemo(() => {
    if (historyMode === "all") return transactions;

    let list = [...transactions];

    let start: Date | null = historyStart ? new Date(historyStart) : null;
    let end: Date | null = historyEnd ? new Date(historyEnd) : null;

    if (end) {
      // supaya inclusive sampai akhir hari
      end.setHours(23, 59, 59, 999);
    }

    if (!start && !end) return list;

    list = list.filter((tx) => {
      const d = new Date(tx.date);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });

    return list;
  }, [transactions, historyMode, historyStart, historyEnd]);

  if (loadingUser) {
    return <div className="dashboard-loading">Memuat...</div>;
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  const todayDateLabel = new Date(stats.todayKey).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // ------------ RENDER ------------
  return (
    <div className="shell-root">
      {/* SIDEBAR */}
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
            <button
              className="outline-btn small"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}
      </aside>

      {/* MAIN */}
      <div className="shell-main">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Ringkasan Keuangan</h1>
            <p className="dashboard-subtitle">
              Pantau pemasukan & pengeluaran kamu per hari, minggu, dan bulan.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="outline-btn"
              type="button"
              onClick={handleThemeToggle}
            >
              {theme === "dark" ? "Tema Cerah" : "Tema Gelap"}
            </button>
            {!sidebarOpen && (
              <button className="outline-btn" onClick={handleLogout}>
                Logout
              </button>
            )}
          </div>
        </header>

        <main className="dashboard-main">
          {/* KARTU RINGKASAN */}
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
                Hari Ini
                <span className="summary-date"> • {todayDateLabel}</span>
              </div>
              <div
                className={
                  "summary-value " +
                  (stats.dayNet >= 0 ? "positive" : "negative")
                }
              >
                {formatCurrency(stats.dayNet)}
              </div>
              <div className="summary-caption subtle">
                Pemasukan: {stats.todayIncomeText} • Pengeluaran:{" "}
                {stats.todayExpenseText}
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

          {/* GRID BAWAH: FORM + CHART + LIST */}
          <section className="bottom-grid">
            {/* FORM */}
            <div className="card-panel glass">
              <h2 className="panel-title">Catat Transaksi</h2>
              <p className="panel-subtitle">
                Input pemasukan atau pengeluaran harian kamu.
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

                <button type="submit" className="primary-btn">
                  Simpan Transaksi
                </button>
              </form>
            </div>

            {/* CHART + LIST */}
            <div className="card-panel glass">
              <h2 className="panel-title">Grafik 7 Hari Terakhir</h2>
              <p className="panel-subtitle">
                Batang hijau = plus, merah = minus. Berdasarkan saldo harian.
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

              {/* HEADER + FILTER HISTORI */}
              <div className="history-header">
                <div>
                  <h3 className="panel-title" style={{ marginTop: 18 }}>
                    Histori Transaksi
                  </h3>
                  <p className="panel-subtitle">
                    Terbaru ada di paling atas. Data disimpan di browser kamu.
                  </p>
                </div>

                <div className="history-filter-row">
                  <select
                    className="field-input"
                    style={{ width: "auto", minWidth: 120 }}
                    value={historyMode}
                    onChange={(e) =>
                      setHistoryMode(e.target.value as "all" | "range")
                    }
                  >
                    <option value="all">Semua</option>
                    <option value="range">Rentang tanggal</option>
                  </select>

                  {historyMode === "range" && (
                    <>
                      <input
                        type="date"
                        className="field-input"
                        value={historyStart}
                        onChange={(e) => setHistoryStart(e.target.value)}
                      />
                      <span className="history-filter-sep">sampai</span>
                      <input
                        type="date"
                        className="field-input"
                        value={historyEnd}
                        onChange={(e) => setHistoryEnd(e.target.value)}
                      />
                    </>
                  )}
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <p className="empty-text">
                  Belum ada transaksi pada periode ini.
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
      </div>
    </div>
  );
}
