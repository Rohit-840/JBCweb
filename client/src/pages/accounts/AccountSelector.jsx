import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import logo from "../../assets/new3.webp";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n ?? 0);

const pnlColor = (n) => (n >= 0 ? "text-emerald-400" : "text-red-400");
const pnlSign  = (n) => (n >= 0 ? "+" : "");

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard({ index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="rounded-2xl border border-white/5 bg-[#0d0d0d] p-6 space-y-5"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-2 w-20 rounded-full bg-white/[0.06] animate-pulse" />
          <div className="h-5 w-28 rounded-full bg-white/[0.06] animate-pulse" />
          <div className="h-2 w-36 rounded-full bg-white/[0.04] animate-pulse" />
        </div>
        <div className="h-6 w-16 rounded-full bg-white/[0.06] animate-pulse" />
      </div>
      <div className="space-y-3">
        <div>
          <div className="h-2 w-12 rounded-full bg-white/[0.04] mb-2 animate-pulse" />
          <div className="h-8 w-36 rounded-lg bg-white/[0.06] animate-pulse" />
          <div className="h-2 w-24 rounded-full bg-white/[0.04] mt-1.5 animate-pulse" />
        </div>
        <div>
          <div className="h-2 w-20 rounded-full bg-white/[0.04] mb-2 animate-pulse" />
          <div className="h-6 w-28 rounded-lg bg-white/[0.06] animate-pulse" />
        </div>
      </div>
      <div className="h-10 w-full rounded-xl bg-white/[0.06] animate-pulse" />
    </motion.div>
  );
}

// ─── Account card ─────────────────────────────────────────────────────────────
function AccountCard({ account, index, onSelect, onDelete, selecting }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  const isSelecting = selecting === account.id;
  const disabled    = !!selecting;
  const offline     = account.success === false;

  const openConfirm = (e) => { e.stopPropagation(); setConfirmDelete(true); };
  const closeConfirm = (e) => { e.stopPropagation(); setConfirmDelete(false); };

  const confirmAndDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    await onDelete(account.id);
    setDeleting(false);
    setConfirmDelete(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      onClick={() => !offline && !disabled && !confirmDelete && onSelect(account.id)}
      className={[
        "group relative rounded-2xl border p-6 flex flex-col gap-5 overflow-hidden transition-all duration-300",
        offline
          ? "border-white/5 bg-[#0d0d0d] opacity-50 cursor-not-allowed"
          : disabled
          ? "border-yellow-500/20 bg-[#0d0d0d] cursor-wait"
          : "border-yellow-500/15 bg-[#0d0d0d] cursor-pointer hover:border-yellow-500/40 hover:bg-[#111] hover:shadow-[0_0_40px_rgba(255,215,0,0.05)]",
      ].join(" ")}
    >
      {/* Hover glow */}
      {!offline && (
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-yellow-500/[0.03] to-transparent pointer-events-none" />
      )}

      {/* ── Delete confirmation overlay ── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-20 rounded-2xl bg-[#0d0d0d]
              flex flex-col items-center justify-center gap-5 px-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning icon */}
            <div className="w-14 h-14 rounded-full bg-red-500/20 border-2 border-red-500/60 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>

            <div className="text-center">
              <p className="text-white font-semibold text-sm mb-1">Remove this account?</p>
              <p className="text-gray-300 text-xs font-medium">#{account.login}</p>
              <p className="text-gray-500 text-[11px] mt-0.5 truncate max-w-[180px]">{account.server}</p>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={closeConfirm}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-semibold
                  hover:bg-white/15 hover:border-white/30 transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-600 border border-red-500 text-white text-xs font-semibold
                  hover:bg-red-500 transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10" />
                    </svg>
                    Removing…
                  </>
                ) : (
                  "Remove"
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.18em] text-yellow-500/50 uppercase mb-1">
            Pepperstone MT5
          </p>
          <p className="text-white font-bold text-xl tracking-wide">#{account.login}</p>
          <p className="text-gray-500 text-xs mt-0.5 truncate max-w-[160px]">{account.server}</p>
        </div>

        {/* Status badge + delete button stacked */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {offline ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span className="text-[10px] font-semibold text-red-400">Offline</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-400">Live</span>
            </span>
          )}

          {/* Trash button — always visible, subtle until hovered */}
          <button
            onClick={openConfirm}
            title="Remove account"
            className="flex items-center gap-1 px-2 py-1 rounded-lg
              text-gray-600 hover:text-red-400 text-[10px] font-medium
              border border-transparent hover:border-red-500/20 hover:bg-red-500/10
              transition-all duration-200"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Remove
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      {!offline && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] tracking-widest text-gray-600 uppercase mb-1">Equity</p>
            <p className="text-2xl font-bold text-white leading-none">${fmt(account.equity)}</p>
            <p className="text-[11px] text-gray-600 mt-1">Bal: ${fmt(account.balance)}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-widest text-gray-600 uppercase mb-1">Floating P&amp;L</p>
            <p className={`text-2xl font-bold leading-none ${pnlColor(account.profit)}`}>
              {pnlSign(account.profit)}${fmt(account.profit)}
            </p>
            <p className="text-[11px] text-gray-600 mt-1">
              {account.leverage ? `1:${account.leverage} leverage` : "—"}
            </p>
          </div>
        </div>
      )}

      {offline && (
        <p className="text-xs text-gray-600">{account.error || "Connection unavailable"}</p>
      )}

      {/* ── CTA ── */}
      {!offline && (
        <button
          disabled={disabled}
          className={[
            "w-full py-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200",
            isSelecting
              ? "bg-yellow-500/15 text-yellow-400/70 cursor-wait"
              : disabled
              ? "bg-yellow-500/10 text-yellow-400/40"
              : "bg-yellow-500 text-black hover:bg-yellow-400 active:scale-[0.98]",
          ].join(" ")}
        >
          {isSelecting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10" />
              </svg>
              Entering...
            </span>
          ) : (
            "Enter Dashboard →"
          )}
        </button>
      )}
    </motion.div>
  );
}

// ─── Add account card (sits inline in the accounts grid) ─────────────────────
function AddAccountCard({ onAdd, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      onClick={onAdd}
      className="group rounded-2xl border-2 border-dashed border-yellow-500/20 bg-[#0d0d0d]
        p-6 flex flex-col items-center justify-center gap-4 min-h-[260px]
        cursor-pointer hover:border-yellow-500/40 hover:bg-[#111]
        transition-all duration-300"
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center
          border border-yellow-500/25 bg-yellow-500/[0.07]
          group-hover:border-yellow-500/50 group-hover:bg-yellow-500/15
          transition-all duration-300"
      >
        <svg
          className="w-5 h-5 text-yellow-500/50 group-hover:text-yellow-400 transition-colors duration-300"
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-white/55 group-hover:text-white/90 text-sm font-semibold tracking-wide transition-colors duration-300">
          Add Account
        </p>
        <p className="text-gray-600 text-xs mt-1.5">Connect another MT5 account</p>
      </div>
    </motion.div>
  );
}

// ─── Aggregate stat card ──────────────────────────────────────────────────────
function StatCard({ label, value, sub, colored, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative rounded-2xl border border-yellow-500/20 bg-[#0d0d0d] p-6 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/[0.025] to-transparent pointer-events-none" />
      <p className="text-[10px] font-bold tracking-[0.18em] text-yellow-500/50 uppercase mb-3 relative z-10">
        {label}
      </p>
      <p className={`text-3xl sm:text-4xl font-bold tracking-tight relative z-10 ${colored}`}>
        {value}
      </p>
      <p className="text-gray-600 text-xs mt-2 relative z-10">{sub}</p>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AccountSelector({ token, onSelect, onAddAccount, onLogout }) {
  const [accounts,     setAccounts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selecting,    setSelecting]    = useState(null);
  const [fetchError,   setFetchError]   = useState("");   // persistent — needs manual retry
  const [deleteError,  setDeleteError]  = useState("");   // transient — auto-clears
  const deleteErrorTimer = useRef(null);

  const email = localStorage.getItem("userEmail") || "";

  const fetchSnapshot = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const { data } = await api.post(
        "/mt5/snapshot",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAccounts(data.accounts);
    } catch {
      setFetchError("Failed to load account data. Please retry.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchSnapshot(); }, [fetchSnapshot]);

  const handleSelect = async (accountId) => {
    setSelecting(accountId);
    try {
      await api.post(
        `/mt5/select/${accountId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSelect();
    } catch {
      setSelecting(null);
      setFetchError("Failed to connect to selected account. Please retry.");
    }
  };

  // Delete only removes from this site + MongoDB — never touches the real MT5 account
  const handleDelete = async (accountId) => {
    if (!accountId) return;
    try {
      await api.delete(
        `/mt5/accounts/${accountId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    } catch {
      // Show transient error, auto-dismiss after 4 s
      setDeleteError("Failed to remove account. Please try again.");
      clearTimeout(deleteErrorTimer.current);
      deleteErrorTimer.current = setTimeout(() => setDeleteError(""), 4000);
    }
  };

  const live        = accounts.filter((a) => a.success !== false);
  const totalEquity = live.reduce((s, a) => s + (a.equity  ?? 0), 0);
  const totalPnl    = live.reduce((s, a) => s + (a.profit  ?? 0), 0);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#0a0a0a] relative overflow-y-auto">
      {/* Ambient glows */}
      <div className="fixed pointer-events-none w-[700px] h-[700px] rounded-full bg-yellow-500/[0.025] blur-[140px] -top-60 -left-60" />
      <div className="fixed pointer-events-none w-[700px] h-[700px] rounded-full bg-yellow-500/[0.025] blur-[140px] -bottom-60 -right-60" />

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={logo}
              alt="JB Crownstone"
              className="w-7 h-7 rounded-full object-cover border border-yellow-500/30"
            />
            <span className="text-yellow-400 font-bold tracking-[0.16em] text-xs uppercase">
              JB Crownstone
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-gray-600 text-xs truncate max-w-[200px]">{email}</span>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-500 text-xs
                hover:border-red-500/30 hover:text-red-400 transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 pb-16">

        {/* ── Page header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <p className="text-[10px] font-bold tracking-[0.22em] text-yellow-500/50 uppercase mb-2">
            Pepperstone 
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Select Account
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Choose a trading account to enter the dashboard
          </p>
        </motion.div>

        {/* ── Fetch / select error (persistent, retry refetches) ── */}
        <AnimatePresence>
          {fetchError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <span>{fetchError}</span>
                <button
                  onClick={fetchSnapshot}
                  className="shrink-0 px-3 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-xs font-semibold transition-colors"
                >
                  Retry
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Delete error (transient, auto-dismisses) ── */}
        <AnimatePresence>
          {deleteError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <span>{deleteError}</span>
                <button
                  onClick={() => setDeleteError("")}
                  className="shrink-0 px-3 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-xs font-semibold transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Aggregate totals ── */}
        <AnimatePresence>
          {!loading && live.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <StatCard
                label="Total Equity"
                value={`$${fmt(totalEquity)}`}
                sub={`Across ${live.length} account${live.length !== 1 ? "s" : ""}`}
                colored="text-white"
                delay={0.08}
              />
              <StatCard
                label="Total Floating P&L"
                value={`${pnlSign(totalPnl)}$${fmt(totalPnl)}`}
                sub="Combined open positions"
                colored={pnlColor(totalPnl)}
                delay={0.14}
              />
            </div>
          )}
        </AnimatePresence>

        {/* ── Section label ── */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-[10px] font-bold tracking-[0.22em] text-gray-600 uppercase">
            Your Accounts
          </p>
          {!loading && accounts.length === 0 && (
            <p className="text-xs text-gray-600">No accounts connected yet</p>
          )}
        </div>

        {/* ── Account grid (Add Account card always appears last) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [0, 1, 2].map((i) => <SkeletonCard key={i} index={i} />)
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                {accounts.map((acc, i) => (
                  <AccountCard
                    key={acc.id ?? i}
                    account={acc}
                    index={i}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                    selecting={selecting}
                  />
                ))}
              </AnimatePresence>
              <AddAccountCard onAdd={onAddAccount} index={accounts.length} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
