import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  LogOut,
  Plus,
  RefreshCcw,
  Server,
  Trash2,
  WalletCards,
} from "lucide-react";
import api from "../../services/api";
import logo from "../../assets/new3.webp";
import {
  GlassPanel,
  LiveBadge,
  MetricValue,
  MotionButton,
} from "../../components/ui/visual.jsx";
import { itemVariants, listVariants } from "../../components/ui/motion.js";

const fmt = (n) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n ?? 0);

const pnlColor = (n) => (n >= 0 ? "text-emerald-400" : "text-red-400");
const pnlTone = (n) => (n >= 0 ? "positive" : "negative");
const pnlSign = (n) => (n >= 0 ? "+" : "");

function SkeletonCard({ index }) {
  return (
    <GlassPanel
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="p-6 space-y-5 min-h-[260px]"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-2 w-20 rounded-full bg-white/[0.07] animate-pulse" />
          <div className="h-5 w-28 rounded-full bg-white/[0.07] animate-pulse" />
          <div className="h-2 w-36 rounded-full bg-white/[0.05] animate-pulse" />
        </div>
        <div className="h-6 w-16 rounded-full bg-white/[0.07] animate-pulse" />
      </div>
      <div className="space-y-3">
        <div className="h-8 w-36 rounded-lg bg-white/[0.07] animate-pulse" />
        <div className="h-6 w-28 rounded-lg bg-white/[0.06] animate-pulse" />
      </div>
      <div className="h-10 w-full rounded-lg bg-white/[0.07] animate-pulse" />
    </GlassPanel>
  );
}

function AccountCard({ account, index, onSelect, onDelete, selecting }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isSelecting = selecting === account.id;
  const disabled = !!selecting;
  const offline = account.success === false;

  const confirmAndDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    await onDelete(account.id);
    setDeleting(false);
    setConfirmDelete(false);
  };

  return (
    <GlassPanel
      layout
      interactive={!offline && !disabled}
      variants={itemVariants}
      initial="initial"
      animate="animate"
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
      transition={{ delay: index * 0.04, duration: 0.36 }}
      onClick={() => !offline && !disabled && !confirmDelete && onSelect(account.id)}
      className={[
        "group p-5 sm:p-6 flex flex-col gap-5 min-h-[260px]",
        offline ? "opacity-55 cursor-not-allowed" : disabled ? "cursor-wait" : "cursor-pointer",
      ].join(" ")}
    >
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="absolute inset-0 z-20 bg-[#070807]/95 backdrop-blur-md flex flex-col items-center justify-center gap-5 px-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-lg bg-red-500/15 border border-red-500/35 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-sm mb-1">Remove this account?</p>
              <p className="text-gray-300 text-xs font-medium">#{account.login}</p>
              <p className="text-gray-500 text-[11px] mt-0.5 truncate max-w-[200px]">{account.server}</p>
            </div>
            <div className="flex gap-3 w-full">
              <MotionButton
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                disabled={deleting}
                className="flex-1 py-2.5 text-xs"
              >
                Cancel
              </MotionButton>
              <MotionButton
                variant="danger"
                onClick={confirmAndDelete}
                disabled={deleting}
                className="flex-1 py-2.5 text-xs"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {deleting ? "Removing..." : "Remove"}
              </MotionButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.18em] text-yellow-500/55 uppercase mb-1">
            Pepperstone MT5
          </p>
          <p className="text-white font-bold text-xl tracking-wide">#{account.login}</p>
          <p className="text-gray-500 text-xs mt-0.5 truncate max-w-[180px]">{account.server}</p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <LiveBadge active={!offline} label={offline ? "Offline" : "Live"} />
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
            title="Remove account"
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-gray-600 hover:text-red-400 text-[10px] font-medium border border-transparent hover:border-red-500/20 hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="w-3 h-3" />
            Remove
          </button>
        </div>
      </div>

      {!offline ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] tracking-widest text-gray-600 uppercase mb-1">Equity</p>
            <p className="text-2xl font-bold text-white leading-none">
              <MetricValue value={`$${fmt(account.equity)}`} />
            </p>
            <p className="text-[11px] text-gray-600 mt-1">Bal: ${fmt(account.balance)}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-widest text-gray-600 uppercase mb-1">Floating P&amp;L</p>
            <p className="text-2xl font-bold leading-none">
              <MetricValue
                tone={pnlTone(account.profit)}
                value={`${pnlSign(account.profit)}$${fmt(account.profit)}`}
              />
            </p>
            <p className="text-[11px] text-gray-600 mt-1">
              {account.leverage ? `1:${account.leverage} leverage` : "No leverage data"}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-600">{account.error || "Connection unavailable"}</p>
      )}

      {!offline && (
        <MotionButton disabled={disabled} className="w-full mt-auto py-2.5">
          {isSelecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Entering...
            </>
          ) : (
            <>
              Enter Dashboard
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </MotionButton>
      )}
    </GlassPanel>
  );
}

function AddAccountCard({ onAdd, index }) {
  return (
    <GlassPanel
      interactive
      variants={itemVariants}
      initial="initial"
      animate="animate"
      transition={{ delay: index * 0.04, duration: 0.36 }}
      onClick={onAdd}
      className="group p-6 flex flex-col items-center justify-center gap-4 min-h-[260px] border-dashed"
    >
      <div className="w-14 h-14 rounded-lg flex items-center justify-center border border-yellow-500/25 bg-yellow-500/[0.07] group-hover:border-yellow-500/50 group-hover:bg-yellow-500/15 transition-all">
        <Plus className="w-5 h-5 text-yellow-400" />
      </div>
      <div className="text-center">
        <p className="text-white/70 group-hover:text-white text-sm font-semibold tracking-wide transition-colors">
          Add Account
        </p>
        <p className="text-gray-600 text-xs mt-1.5">Connect another MT5 account</p>
      </div>
    </GlassPanel>
  );
}

function StatCard({ label, value, sub, colored, delay }) {
  return (
    <GlassPanel
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-5 sm:p-6"
    >
      <p className="text-[10px] font-bold tracking-[0.18em] text-yellow-500/55 uppercase mb-3">
        {label}
      </p>
      <p className={`text-3xl sm:text-4xl font-bold tracking-tight ${colored}`}>
        <MetricValue value={value} tone={colored.includes("emerald") ? "positive" : colored.includes("red") ? "negative" : "neutral"} />
      </p>
      <p className="text-gray-600 text-xs mt-2">{sub}</p>
    </GlassPanel>
  );
}

export default function AccountSelector({ token, onSelect, onAddAccount, onLogout }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(null);
  const [fetchError, setFetchError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const deleteErrorTimer = useRef(null);
  const snapshotController = useRef(null);

  const email = localStorage.getItem("userEmail") || "";

  const fetchSnapshot = useCallback(async () => {
    snapshotController.current?.abort();
    const controller = new AbortController();
    snapshotController.current = controller;
    setLoading(true);
    setFetchError("");
    try {
      const { data } = await api.post(
        "/mt5/snapshot",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }
      );
      setAccounts(data.accounts);
    } catch (err) {
      if (err.name !== "CanceledError") {
        setFetchError("Failed to load account data. Please retry.");
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
      if (snapshotController.current === controller) {
        snapshotController.current = null;
      }
    }
  }, [token]);

  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  useEffect(() => () => {
    snapshotController.current?.abort();
    clearTimeout(deleteErrorTimer.current);
  }, []);

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

  const handleDelete = async (accountId) => {
    if (!accountId) return;
    try {
      await api.delete(
        `/mt5/accounts/${accountId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    } catch {
      setDeleteError("Failed to remove account. Please try again.");
      clearTimeout(deleteErrorTimer.current);
      deleteErrorTimer.current = setTimeout(() => setDeleteError(""), 4000);
    }
  };

  const live = accounts.filter((a) => a.success !== false);
  const totalEquity = live.reduce((s, a) => s + (a.equity ?? 0), 0);
  const totalPnl = live.reduce((s, a) => s + (a.profit ?? 0), 0);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-transparent relative overflow-y-auto">
      <nav className="sticky top-0 z-50 border-b border-yellow-500/15 bg-[#050605]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={logo}
              alt="JB Crownstone"
              className="w-7 h-7 rounded-full object-cover border border-yellow-500/30"
            />
            <span className="text-yellow-400 font-bold tracking-[0.16em] text-xs uppercase truncate">
              JB Crownstone
            </span>
          </div>
          <div className="flex items-center gap-3 min-w-0">
            <span className="hidden sm:block text-gray-600 text-xs truncate max-w-[220px]">{email}</span>
            <MotionButton
              variant="ghost"
              onClick={onLogout}
              className="px-3 py-1.5 text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </MotionButton>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 pb-16">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-[10px] font-bold tracking-[0.22em] text-yellow-500/55 uppercase mb-2 flex items-center gap-2">
            <Server className="h-3.5 w-3.5" />
            Pepperstone
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Select Account
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Choose a trading account to enter the dashboard.
          </p>
        </motion.div>

        <AnimatePresence>
          {fetchError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <span>{fetchError}</span>
                <MotionButton variant="danger" onClick={fetchSnapshot} className="shrink-0 px-3 py-1 text-xs">
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Retry
                </MotionButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {deleteError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <span>{deleteError}</span>
                <MotionButton variant="danger" onClick={() => setDeleteError("")} className="shrink-0 px-3 py-1 text-xs">
                  Dismiss
                </MotionButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!loading && live.length > 0 && (
            <motion.div
              variants={listVariants}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
            >
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
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-5">
          <p className="text-[10px] font-bold tracking-[0.22em] text-gray-600 uppercase flex items-center gap-2">
            <WalletCards className="h-3.5 w-3.5" />
            Your Accounts
          </p>
          {!loading && accounts.length === 0 && (
            <p className="text-xs text-gray-600">No accounts connected yet</p>
          )}
        </div>

        <motion.div
          variants={listVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
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
        </motion.div>
      </div>
    </div>
  );
}
