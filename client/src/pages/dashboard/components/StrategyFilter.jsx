import { useState, useMemo, useEffect, useRef } from "react";
import { STRATEGY_CONFIG, STRATEGIES, applyTPSLFilter } from "../constants.js";
import { normaliseSymbol, isValidSymbol } from "../utils/symbolUtils.js";
import SymbolChart      from "./SymbolChart.jsx";
import AddSymbolInput   from "./AddSymbolInput.jsx";
import InteractiveChart from "./InteractiveChart.jsx";

/* helpers */
function TypeBadge({ type }) {
  const isBuy = type === 0;
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
      isBuy ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
    }`}>
      {isBuy ? "BUY" : "SELL"}
    </span>
  );
}

function fmtTime(ts) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString("en-GB", {
    year: "2-digit", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function calcStats(history) {
  const total  = history.length;
  const wins   = history.filter((h) => h.profit > 0);
  const losses = history.filter((h) => h.profit < 0);
  const avgWin  = wins.length   > 0 ? wins.reduce((s, h)   => s + h.profit, 0) / wins.length   : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, h) => s + h.profit, 0) / losses.length) : 0;
  const avgRR   = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : "—";
  const totalPnl = history.reduce((s, h) => s + h.profit, 0);
  const winRate  = total > 0 ? ((wins.length / total) * 100).toFixed(1) : "—";

  const sorted = [...history].sort((a, b) => a.time - b.time);
  let peak = 0, maxDD = 0, cum = 0;
  for (const h of sorted) {
    cum += h.profit;
    if (cum > peak) peak = cum;
    const dd = peak - cum;
    if (dd > maxDD) maxDD = dd;
  }
  return { total, avgRR, totalPnl, maxDD, profitable: wins.length, losing: losses.length, winRate };
}

function StatCard({ label, value, color = "text-white" }) {
  return (
    <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5 text-center">
      <p className="text-[9px] tracking-widest text-gray-600 uppercase mb-1.5">{label}</p>
      <p className={`text-base font-bold transition-all duration-300 ${color}`}>{value}</p>
    </div>
  );
}

/* ── Suggestion combo-box input ────────────────────────────────────────────── */
function SuggestInput({
  value, onChange, onSelectSubmit, onKeyDown,
  suggestions, openSymbols, disabled, placeholder, className,
}) {
  const [dropOpen, setDropOpen] = useState(false);
  const [cursor,   setCursor]   = useState(-1);
  const [dropPos,  setDropPos]  = useState({});
  const inputRef = useRef(null);
  const wrapRef  = useRef(null);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return suggestions.slice(0, 8);
    const starts   = suggestions.filter(s => s.startsWith(q));
    const contains = suggestions.filter(s => !s.startsWith(q) && s.includes(q));
    return [...starts, ...contains].slice(0, 8);
  }, [value, suggestions]);

  const updatePos = () => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 200) });
    }
  };

  useEffect(() => {
    if (!dropOpen) return;
    const close    = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setDropOpen(false); };
    const onScroll = () => setDropOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("scroll",    onScroll, true);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("scroll",    onScroll, true);
    };
  }, [dropOpen]);

  const pick = (sym) => {
    onChange(sym);
    setDropOpen(false);
    setCursor(-1);
    onSelectSubmit?.(sym);
  };

  const handleKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault(); setDropOpen(true); updatePos();
      setCursor(c => Math.min(c + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor(c => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      if (dropOpen && cursor >= 0 && matches[cursor]) {
        e.preventDefault(); pick(matches[cursor]);
      } else {
        setDropOpen(false); onKeyDown?.(e);
      }
    } else if (e.key === "Escape") {
      setDropOpen(false); setCursor(-1);
    } else {
      onKeyDown?.(e);
    }
  };

  return (
    <div className="relative flex-1" ref={wrapRef}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setCursor(-1); setDropOpen(true); updatePos(); }}
        onFocus={() => { setDropOpen(true); updatePos(); }}
        onKeyDown={handleKey}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
      />

      {dropOpen && matches.length > 0 && (
        <div
          style={{ position: "fixed", top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
          className="bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="px-3 py-1.5 border-b border-white/5 flex items-center gap-1.5 bg-[#1a1a1a]">
            <svg className="w-2.5 h-2.5 text-yellow-400/50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-[9px] text-yellow-400/50 uppercase tracking-widest font-medium">
              From your trades
            </span>
          </div>
          <div className="max-h-44 overflow-y-auto">
            {matches.map((sym, i) => {
              const isLive = openSymbols?.has(sym);
              return (
                <button
                  key={sym}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(sym)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between
                    transition-colors duration-100 ${
                    i === cursor
                      ? "bg-yellow-500/15 text-yellow-300"
                      : "text-gray-300 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isLive ? "bg-green-400 animate-pulse" : "bg-gray-600"
                    }`} />
                    <span className="font-mono">{sym}</span>
                  </span>
                  {isLive && (
                    <span className="text-[8px] bg-green-500/10 border border-green-500/20 text-green-400
                      px-1.5 py-0.5 rounded font-bold tracking-widest uppercase">
                      Live
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* volume filter panel (right side, above chart) */
function VolumeFilter({ symbolHistory, volumeFilter, setVolumeFilter }) {
  const availableVolumes = useMemo(() => {
    const set = new Set(symbolHistory.map((h) => h.volume));
    return [...set].sort((a, b) => a - b);
  }, [symbolHistory]);

  const activeVol = volumeFilter.trim() !== "" ? parseFloat(volumeFilter) : null;

  return (
    <div className="px-4 pt-4 pb-3 border-b border-white/5 shrink-0">
      <p className="text-[10px] text-yellow-400/60 uppercase tracking-widest mb-2">
        Volume Filter
      </p>

      <div className="flex gap-2 mb-2.5">
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="e.g. 0.1"
          value={volumeFilter}
          onChange={(e) => setVolumeFilter(e.target.value)}
          className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-1.5
            text-white text-xs outline-none placeholder-gray-700
            focus:border-yellow-500/40 focus:bg-white/[0.06]
            transition-all duration-200"
        />
        {volumeFilter !== "" && (
          <button
            onClick={() => setVolumeFilter("")}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10
              text-gray-500 hover:text-white text-xs transition-all duration-150 hover:border-white/20"
          >
            ✕
          </button>
        )}
      </div>

      {availableVolumes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {availableVolumes.map((vol) => {
            const selected = activeVol !== null && Math.abs(vol - activeVol) < 0.0001;
            return (
              <button
                key={vol}
                onClick={() => setVolumeFilter(selected ? "" : String(vol))}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all duration-150
                  ${selected
                    ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-400"
                    : "bg-white/[0.03] border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20"
                  }`}
              >
                {vol}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Edit Strategies Modal ───────────────────────────────────────────────── */
function EditModal({
  strategies, onAddSymbol, onRemoveSymbol, onDeleteStrategy,
  symbolLoading, suggestions, openSymbols, onClose,
}) {
  const [addInputs, setAddInputs] = useState({});
  const [addErrors, setAddErrors] = useState({});
  const [newName,   setNewName]   = useState("");
  const [newSymbol, setNewSymbol] = useState("");
  const [newError,  setNewError]  = useState("");
  const [creating,  setCreating]  = useState(false);

  const isStatic = (name) => name in STRATEGIES;

  const handleAddSymbol = async (strategyName, symOverride) => {
    const raw = symOverride || (addInputs[strategyName] || "").trim();
    const sym = normaliseSymbol(raw);
    if (!sym) return setAddErrors((p) => ({ ...p, [strategyName]: "Enter a symbol." }));
    if (!isValidSymbol(sym)) return setAddErrors((p) => ({ ...p, [strategyName]: "Letters, digits, dots only." }));
    setAddErrors((p) => ({ ...p, [strategyName]: "" }));
    await onAddSymbol(strategyName, sym);
    setAddInputs((p) => ({ ...p, [strategyName]: "" }));
  };

  const handleCreate = async () => {
    const name = newName.trim().toUpperCase().replace(/\s+/g, "_");
    const sym  = normaliseSymbol(newSymbol);
    if (!name)              return setNewError("Enter a strategy name.");
    if (!sym)               return setNewError("Enter at least one symbol.");
    if (!isValidSymbol(sym)) return setNewError("Symbol: letters, digits, dots only.");
    if (name in strategies)  return setNewError("Strategy name already exists.");
    setNewError("");
    setCreating(true);
    await onAddSymbol(name, sym);
    setCreating(false);
    setNewName("");
    setNewSymbol("");
  };

  const handleDelete = async (name) => {
    if (!window.confirm(`Delete strategy "${name}"? This cannot be undone.`)) return;
    await onDeleteStrategy(name);
  };

  const inputCls = "w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-700 outline-none focus:border-yellow-500/40 focus:bg-white/[0.07] disabled:opacity-40 transition-colors";
  const inputClsLg = "w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-700 outline-none focus:border-yellow-500/40 focus:bg-white/[0.07] transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        className="bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl
          w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "88vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div>
            <p className="text-[10px] text-yellow-400/60 uppercase tracking-widest mb-0.5">Configuration</p>
            <h2 className="text-lg font-bold text-white">Manage Strategies</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full
              bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white
              transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Strategy list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {Object.entries(strategies).map(([name, symbols]) => (
            <div key={name} className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{name}</span>
                  <span className="text-[10px] text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
                    {symbols.length} symbol{symbols.length !== 1 ? "s" : ""}
                  </span>
                  {isStatic(name) && (
                    <span className="text-[9px] text-yellow-400/50 bg-yellow-400/5 border border-yellow-400/10
                      px-2 py-0.5 rounded-full tracking-widest uppercase">Static</span>
                  )}
                </div>
                {!isStatic(name) && (
                  <button
                    onClick={() => handleDelete(name)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-semibold
                      bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20
                      transition-all duration-150"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                )}
              </div>

              {/* Symbol chips */}
              <div className="flex flex-wrap gap-2 mb-3 min-h-[28px]">
                {symbols.length === 0 ? (
                  <span className="text-xs text-gray-700 italic">No symbols — add one below</span>
                ) : symbols.map((sym) => (
                  <span
                    key={sym}
                    className="group flex items-center gap-1 px-2.5 py-1 rounded-lg
                      bg-white/5 border border-white/10 text-xs text-gray-300
                      hover:border-red-500/30 transition-all"
                  >
                    {sym}
                    <button
                      onClick={() => onRemoveSymbol(name, sym)}
                      className="text-gray-600 hover:text-red-400 transition-colors leading-none text-sm ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Add symbol input with suggestions */}
              <div className="flex items-center gap-2">
                <SuggestInput
                  value={addInputs[name] || ""}
                  onChange={(v) => {
                    setAddInputs((p) => ({ ...p, [name]: v }));
                    setAddErrors((p) => ({ ...p, [name]: "" }));
                  }}
                  onSelectSubmit={(sym) => handleAddSymbol(name, sym)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSymbol(name)}
                  suggestions={suggestions}
                  openSymbols={openSymbols}
                  disabled={symbolLoading}
                  placeholder="Add symbol (e.g. gbpjpy)"
                  className={inputCls}
                />
                <button
                  onClick={() => handleAddSymbol(name)}
                  disabled={symbolLoading || !(addInputs[name] || "").trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0
                    bg-yellow-500/15 border border-yellow-500/30 text-yellow-400
                    hover:bg-yellow-500/25 disabled:opacity-30 disabled:cursor-not-allowed
                    transition-all"
                >
                  + Add
                </button>
              </div>
              {addErrors[name] && (
                <p className="mt-1 text-[10px] text-red-400">{addErrors[name]}</p>
              )}
            </div>
          ))}

          {/* New strategy creator */}
          <div className="rounded-xl border border-dashed border-white/10 p-4">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Create New Strategy</p>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setNewError(""); }}
                placeholder="Strategy name (e.g. NOVA)"
                className={inputClsLg + " flex-1"}
              />
              {/* Symbol input with suggestions (fill-only, no auto-submit) */}
              <SuggestInput
                value={newSymbol}
                onChange={(v) => { setNewSymbol(v); setNewError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                suggestions={suggestions}
                openSymbols={openSymbols}
                placeholder="First symbol (e.g. eurusd)"
                className={inputClsLg + " w-full"}
              />
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim() || !newSymbol.trim()}
                className="px-4 py-2 rounded-lg text-xs font-bold shrink-0
                  bg-yellow-500/15 border border-yellow-500/30 text-yellow-400
                  hover:bg-yellow-500/25 disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all whitespace-nowrap"
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
            {newError && <p className="text-[10px] text-red-400">{newError}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function StrategyFilter({
  data,
  strategies = {},
  activeStrategy,
  onStrategyChange,
  onAddSymbol,
  onRemoveSymbol,
  onDeleteStrategy,
  symbolLoading = false,
  availableVolumes = [],
  volumeFilter = [],
  onVolumeFilterChange,
}) {
  const [popup, setPopup]             = useState(null);
  const [popupVolume, setPopupVolume] = useState("");
  const [interactiveChartOpen, setInteractiveChartOpen] = useState(false);
  const [editOpen, setEditOpen]       = useState(false);

  // ── Suggestion data ───────────────────────────────────────────────────────
  // All symbols already assigned to any strategy
  const allUsedSymbolsSet = useMemo(() => {
    const set = new Set();
    for (const syms of Object.values(strategies))
      for (const s of syms) set.add(s.toLowerCase());
    return set;
  }, [strategies]);

  // Open-trade symbols (for the "Live" badge)
  const openTradeSymbolsSet = useMemo(() => {
    const set = new Set();
    for (const t of data?.trades || []) {
      const s = t.symbol?.trim().toLowerCase();
      if (s) set.add(s);
    }
    return set;
  }, [data?.trades]);

  // Candidate symbols: from open trades first (sorted), then history-only (sorted)
  // Excludes anything already in any strategy
  const candidateSymbols = useMemo(() => {
    const openSet = new Set();
    const histSet = new Set();
    for (const t of data?.trades || []) {
      const s = t.symbol?.trim().toLowerCase();
      if (s && !allUsedSymbolsSet.has(s)) openSet.add(s);
    }
    for (const h of data?.full_history || []) {
      const s = h.symbol?.trim().toLowerCase();
      if (s && !allUsedSymbolsSet.has(s) && !openSet.has(s)) histSet.add(s);
    }
    return [...[...openSet].sort(), ...[...histSet].sort()];
  }, [data?.trades, data?.full_history, allUsedSymbolsSet]);

  // ── Popup history + keyboard interaction ──────────────────────────────────
  useEffect(() => {
    if (popup) window.history.pushState({ crownstone: "popup", symbol: popup }, "");
  }, [popup]);

  useEffect(() => {
    const onPop = () => setPopup(null);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!popup) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (interactiveChartOpen) setInteractiveChartOpen(false);
        else closePopup();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [popup, interactiveChartOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const closePopup = () => {
    if (!popup) return;
    setPopup(null);
    window.history.back();
  };

  useEffect(() => { setPopupVolume(""); }, [popup]);

  const toggleStrategyVolume = (vol) => {
    onVolumeFilterChange((prev) => {
      const idx = prev.findIndex((v) => Math.abs(v - vol) < 0.0001);
      return idx !== -1 ? prev.filter((_, i) => i !== idx) : [...prev, vol];
    });
  };

  const handleStrategy = (name) => {
    onStrategyChange(activeStrategy === name ? null : name);
    closePopup();
  };

  const handleReset = () => {
    onStrategyChange(null);
    closePopup();
  };

  const symbolHistory = useMemo(() => {
    if (!popup) return [];
    const upper = popup.toUpperCase();
    const bySymbol = (data?.full_history || []).filter(
      (h) => h.symbol?.trim().toUpperCase() === upper
    );
    return applyTPSLFilter(bySymbol, activeStrategy);
  }, [popup, activeStrategy, data?.full_history]);

  const symbolTrades = useMemo(
    () => popup
      ? (data?.trades || []).filter(
          (t) => t.symbol?.trim().toUpperCase() === popup.toUpperCase()
        )
      : [],
    [popup, data?.trades]
  );

  const displayHistory = useMemo(() => {
    const raw = popupVolume.trim();
    if (!raw) return symbolHistory;
    const vol = parseFloat(raw);
    if (isNaN(vol)) return symbolHistory;
    return symbolHistory.filter((h) => Math.abs(h.volume - vol) < 0.0001);
  }, [symbolHistory, popupVolume]);

  const isFiltered = displayHistory.length !== symbolHistory.length;
  const stats      = useMemo(() => calcStats(displayHistory), [displayHistory]);

  return (
    <>
      <div className="bg-[#111] rounded-xl px-4 py-3.5 border border-white/5 mb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] tracking-[0.2em] text-yellow-400/70 uppercase mb-0.5">
              Strategy Filter
            </p>
            <p className="text-white font-medium text-sm">
              {activeStrategy
                ? `${activeStrategy}: ${(strategies[activeStrategy] || []).join(", ")}`
                : "Choose your Strategy"}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {Object.keys(strategies).map((name) => (
              <button
                key={name}
                onClick={() => handleStrategy(name)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all
                  ${activeStrategy === name
                    ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-400"
                    : "border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300"
                  }`}
              >
                {name}
              </button>
            ))}
            {activeStrategy && (
              <button
                onClick={handleReset}
                className="px-4 py-1.5 rounded-full text-xs font-medium border border-white/10
                  text-gray-600 hover:text-gray-400 transition-all"
              >
                RESET
              </button>
            )}

            <button
              onClick={() => setEditOpen(true)}
              title="Manage strategies"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10
                text-gray-500 hover:text-yellow-400 hover:border-yellow-500/30 hover:bg-yellow-500/5
                transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        </div>

        {activeStrategy && (
          <div className="mt-3 pt-3 border-t border-white/5 space-y-2.5">
            {/* Symbol chips */}
            <div className="flex gap-2 flex-wrap">
              {(strategies[activeStrategy] || []).map((sym) => {
                const cfg = STRATEGY_CONFIG[activeStrategy]?.[sym];
                return (
                  <span
                    key={sym}
                    className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                      bg-white/5 border border-white/10 text-xs text-gray-300
                      hover:border-yellow-500/30 hover:text-yellow-400 transition-all"
                  >
                    <button
                      onClick={() => setPopup(sym)}
                      className="flex items-center gap-1.5"
                    >
                      <span>{sym}</span>
                      {cfg && (
                        <span className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-green-500/15 border border-green-500/30 text-green-400 text-[9px] font-bold">
                            {typeof cfg.tp === "object" ? `TP $${cfg.tp.min}-$${cfg.tp.max}` : `TP $${cfg.tp}`}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/30 text-red-400 text-[9px] font-bold">
                            {typeof cfg.sl === "object" ? `SL $${cfg.sl.min}-$${cfg.sl.max}` : `SL $${cfg.sl}`}
                          </span>
                        </span>
                      )}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveSymbol?.(activeStrategy, sym); }}
                      title={`Remove ${sym} from ${activeStrategy}`}
                      className="opacity-0 group-hover:opacity-100 ml-0.5 text-gray-600
                        hover:text-red-400 transition-all leading-none text-sm"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>

            {/* Add symbol inline input with suggestions */}
            <AddSymbolInput
              strategyName={activeStrategy}
              loading={symbolLoading}
              onAdd={(sym) => onAddSymbol?.(activeStrategy, sym)}
              suggestions={candidateSymbols}
              openSymbols={openTradeSymbolsSet}
            />

            {availableVolumes.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] text-gray-600 uppercase tracking-widest shrink-0">
                  Vol Filter
                </span>
                {availableVolumes.map((vol) => {
                  const selIdx = volumeFilter.findIndex((v) => Math.abs(v - vol) < 0.0001);
                  const selected = selIdx !== -1;
                  return (
                    <button
                      key={vol}
                      onClick={() => toggleStrategyVolume(vol)}
                      className={`relative px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border
                        transition-all duration-150
                        ${selected
                          ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-400"
                          : "bg-white/[0.03] border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20"
                        }`}
                    >
                      {selected && (
                        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-yellow-500
                          text-black text-[7px] font-black rounded-full flex items-center justify-center leading-none">
                          {selIdx + 1}
                        </span>
                      )}
                      {vol}
                    </button>
                  );
                })}
                {volumeFilter.length > 0 && (
                  <button
                    onClick={() => onVolumeFilterChange([])}
                    className="px-2 py-0.5 rounded-lg text-[9px] border border-white/10
                      text-gray-600 hover:text-gray-400 hover:border-white/20 transition-all"
                  >
                    clear
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {popup && (
        <>
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40"
            onClick={closePopup}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
            <div
              className="bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden
                w-[95vw] md:w-[90vw] max-w-[1180px]"
              style={{ height: "90vh" }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <p className="text-[10px] text-yellow-400/70 uppercase tracking-widest mb-0.5">
                      {activeStrategy} Strategy
                    </p>
                    <h2 className="text-2xl font-bold text-white">{popup}</h2>
                  </div>
                  {STRATEGY_CONFIG[activeStrategy]?.[popup] && (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                        bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        {(() => { const t = STRATEGY_CONFIG[activeStrategy][popup].tp; return typeof t === "object" ? `T/P $${t.min}-$${t.max}` : `T/P $${t}`; })()}
                      </span>
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                        bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        {(() => { const s = STRATEGY_CONFIG[activeStrategy][popup].sl; return typeof s === "object" ? `S/L $${s.min}-$${s.max}` : `S/L $${s}`; })()}
                      </span>
                    </div>
                  )}
                  {isFiltered && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-yellow-500/10
                      border border-yellow-500/30 text-yellow-400 font-semibold tracking-wide">
                      Vol {popupVolume} · {displayHistory.length}/{symbolHistory.length} trades
                    </span>
                  )}
                </div>
                <button
                  onClick={closePopup}
                  className="text-gray-500 hover:text-white text-3xl leading-none transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 md:px-6 py-4 border-b border-white/5 shrink-0">
                <StatCard label="Total Trades" value={stats.total} />
                <StatCard
                  label="Average RR"
                  value={stats.avgRR === "—" ? "—" : `${stats.avgRR}:1`}
                  color="text-yellow-400"
                />
                <StatCard
                  label="Total PNL"
                  value={`${stats.totalPnl >= 0 ? "+" : ""}$${stats.totalPnl.toFixed(2)}`}
                  color={stats.totalPnl >= 0 ? "text-green-400" : "text-red-400"}
                />
                <StatCard
                  label="Max Drawdown"
                  value={stats.maxDD > 0 ? `-$${stats.maxDD.toFixed(2)}` : "$0"}
                  color="text-red-400"
                />
              </div>

              <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden">

                <div className="md:flex-1 md:overflow-y-auto border-b md:border-b-0 md:border-r border-white/5 md:min-h-0">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-[#0d0d0d] z-10">
                      <tr className="border-b border-white/5">
                        {["Ticket", "Time", "Type", "Volume", "Profit"].map((h, i) => (
                          <th
                            key={h}
                            className={`px-4 py-3 text-[10px] tracking-widest text-gray-600
                              uppercase font-medium ${i >= 4 ? "text-right" : "text-left"}`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayHistory.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-gray-700">
                            {isFiltered
                              ? `No trades with volume ${volumeFilter} for ${popup}`
                              : `No history for ${popup}`}
                          </td>
                        </tr>
                      ) : (
                        displayHistory.map((h, i) => (
                          <tr
                            key={`${h.ticket}-${i}`}
                            className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors duration-100"
                          >
                            <td className="px-4 py-2.5 text-gray-500 font-mono">{h.ticket}</td>
                            <td className="px-4 py-2.5 text-gray-400 font-mono whitespace-nowrap">
                              {fmtTime(h.time)}
                            </td>
                            <td className="px-4 py-2.5"><TypeBadge type={h.type} /></td>
                            <td className={`px-4 py-2.5 font-semibold ${
                              isFiltered ? "text-yellow-400" : "text-gray-300"
                            }`}>
                              {h.volume}
                            </td>
                            <td className={`px-4 py-2.5 text-right font-semibold ${
                              h.profit >= 0 ? "text-green-400" : "text-red-400"
                            }`}>
                              {h.profit >= 0 ? "+" : ""}${h.profit.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="w-full md:w-[380px] md:shrink-0 flex flex-col md:overflow-y-auto">

                  <VolumeFilter
                    symbolHistory={symbolHistory}
                    volumeFilter={popupVolume}
                    setVolumeFilter={setPopupVolume}
                  />

                  <div className="px-4 pt-3 pb-3 border-b border-white/5 shrink-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-600 uppercase tracking-widest">Profitable Trades</span>
                      <span className="text-sm font-bold text-green-400">{stats.profitable}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-600 uppercase tracking-widest">Losing Trades</span>
                      <span className="text-sm font-bold text-red-400">{stats.losing}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <span className="text-[10px] text-yellow-400/60 uppercase tracking-widest">Win Rate</span>
                      <span className="text-sm font-bold text-yellow-400">
                        {stats.winRate === "—" ? "—" : `${stats.winRate}%`}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 shrink-0">
                    <p className="text-[10px] text-yellow-400/60 uppercase tracking-widest mb-0.5">
                      Cumulative P/L
                    </p>
                    <p className="text-white text-xs font-semibold mb-3">
                      {popup} Performance
                      {isFiltered && (
                        <span className="text-yellow-400/70 font-normal ml-1">
                          · vol {popupVolume}
                        </span>
                      )}
                    </p>

                    <div
                      key={`${popup}-${popupVolume}`}
                      className="transition-opacity duration-300 relative group cursor-pointer"
                      onClick={() => setInteractiveChartOpen(true)}
                    >
                      <SymbolChart
                        history={displayHistory}
                        trades={symbolTrades}
                        height={220}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <span className="bg-black/80 px-3 py-1.5 rounded-lg text-xs font-semibold text-white backdrop-blur-sm border border-white/10 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                          Expand Graph
                        </span>
                      </div>
                    </div>
                  </div>

                  {symbolTrades.length > 0 && (
                    <div className="px-4 pb-4 border-t border-white/5 pt-3 shrink-0">
                      <p className="text-[10px] text-yellow-400/60 uppercase tracking-widest mb-2">
                        Open Positions ({symbolTrades.length})
                      </p>
                      <div className="space-y-1.5">
                        {symbolTrades.map((t) => (
                          <div
                            key={t.ticket}
                            className="flex items-center justify-between bg-white/[0.03]
                              rounded-lg px-3 py-2 text-xs border border-white/5"
                          >
                            <TypeBadge type={t.type} />
                            <span className="text-gray-400">{t.volume} lots</span>
                            <span className={`font-semibold ${
                              t.profit >= 0 ? "text-green-400" : "text-red-400"
                            }`}>
                              {t.profit >= 0 ? "+" : ""}${t.profit.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {editOpen && (
        <EditModal
          strategies={strategies}
          onAddSymbol={onAddSymbol}
          onRemoveSymbol={onRemoveSymbol}
          onDeleteStrategy={onDeleteStrategy}
          symbolLoading={symbolLoading}
          suggestions={candidateSymbols}
          openSymbols={openTradeSymbolsSet}
          onClose={() => setEditOpen(false)}
        />
      )}

      {interactiveChartOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/20">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-yellow-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
                  </span>
                  {popup} Interactive Graph
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Zoom, pan, and analyze historical performance
                </p>
              </div>
              <button
                onClick={() => setInteractiveChartOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 p-2 md:p-4 min-h-0">
              <InteractiveChart
                history={displayHistory}
                trades={symbolTrades}
                title={`${popup} Performance`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
