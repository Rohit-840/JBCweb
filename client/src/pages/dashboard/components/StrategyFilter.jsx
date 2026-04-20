import { useState, useMemo, useEffect } from "react";
import { STRATEGIES } from "../constants.js";
import SymbolChart from "./SymbolChart.jsx";

/* ── helpers ── */
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

/* ── Volume Filter panel (right side, above chart) ── */
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

      {/* Text input + clear */}
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

      {/* Quick-select chips */}
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

/* ── Main component ── */
export default function StrategyFilter({
  data, activeStrategy, onStrategyChange,
  availableVolumes = [], volumeFilter = [], onVolumeFilterChange,
}) {
  const [popup, setPopup]                   = useState(null);
  const [popupVolume, setPopupVolume]       = useState("");

  // Reset popup volume filter when symbol changes
  useEffect(() => { setPopupVolume(""); }, [popup]);

  const toggleStrategyVolume = (vol) => {
    onVolumeFilterChange((prev) => {
      const idx = prev.findIndex((v) => Math.abs(v - vol) < 0.0001);
      return idx !== -1 ? prev.filter((_, i) => i !== idx) : [...prev, vol];
    });
  };

  const handleStrategy = (name) => {
    onStrategyChange(activeStrategy === name ? null : name);
    setPopup(null);
  };

  const handleReset = () => {
    onStrategyChange(null);
    setPopup(null);
  };

  /* All history for the selected symbol */
  const symbolHistory = useMemo(
    () => popup ? (data?.full_history || []).filter((h) => h.symbol === popup) : [],
    [popup, data?.full_history]
  );

  const symbolTrades = useMemo(
    () => popup ? (data?.trades || []).filter((t) => t.symbol === popup) : [],
    [popup, data?.trades]
  );

  /* Volume-filtered history — drives table, chart AND stats */
  const displayHistory = useMemo(() => {
    const raw = popupVolume.trim();
    if (!raw) return symbolHistory;
    const vol = parseFloat(raw);
    if (isNaN(vol)) return symbolHistory;
    return symbolHistory.filter((h) => Math.abs(h.volume - vol) < 0.0001);
  }, [symbolHistory, popupVolume]);

  const isFiltered  = displayHistory.length !== symbolHistory.length;
  const stats       = useMemo(() => calcStats(displayHistory), [displayHistory]);

  return (
    <>
      {/* ── Strategy bar ── */}
      <div className="bg-[#111] rounded-xl px-4 py-3.5 border border-white/5 mb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] tracking-[0.2em] text-yellow-400/70 uppercase mb-0.5">
              Strategy Filter
            </p>
            <p className="text-white font-medium text-sm">
              {activeStrategy
                ? `${activeStrategy}: ${STRATEGIES[activeStrategy].join(", ")}`
                : "Choose your Strategy"}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {Object.keys(STRATEGIES).map((name) => (
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
          </div>
        </div>

        {activeStrategy && (
          <div className="mt-3 pt-3 border-t border-white/5 space-y-2.5">
            {/* Symbol chips */}
            <div className="flex gap-2 flex-wrap">
              {STRATEGIES[activeStrategy].map((sym) => (
                <button
                  key={sym}
                  onClick={() => setPopup(sym)}
                  className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs
                    text-gray-300 hover:border-yellow-500/30 hover:text-yellow-400 transition-all"
                >
                  {sym}
                </button>
              ))}
            </div>

            {/* Strategy-level volume multi-select */}
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

      {/* ── Symbol detail modal ── */}
      {popup && (
        <>
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40"
            onClick={() => setPopup(null)}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
            <div
              className="bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              style={{ width: "90vw", maxWidth: 1180, height: "85vh" }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-[10px] text-yellow-400/70 uppercase tracking-widest mb-0.5">
                      {activeStrategy} Strategy
                    </p>
                    <h2 className="text-2xl font-bold text-white">{popup}</h2>
                  </div>
                  {isFiltered && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-yellow-500/10
                      border border-yellow-500/30 text-yellow-400 font-semibold tracking-wide">
                      Vol {popupVolume} · {displayHistory.length}/{symbolHistory.length} trades
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setPopup(null)}
                  className="text-gray-500 hover:text-white text-3xl leading-none transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Stats row — updates with volume filter */}
              <div className="grid grid-cols-4 gap-3 px-6 py-4 border-b border-white/5 shrink-0">
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

              {/* Body: table (left) + filter+chart (right) */}
              <div className="flex flex-1 overflow-hidden">

                {/* ── Left: history table ── */}
                <div className="flex-1 overflow-y-auto border-r border-white/5">
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

                {/* ── Right: volume filter + chart + open positions ── */}
                <div className="w-[340px] shrink-0 flex flex-col overflow-y-auto">

                  {/* Volume filter */}
                  <VolumeFilter
                    symbolHistory={symbolHistory}
                    volumeFilter={popupVolume}
                    setVolumeFilter={setPopupVolume}
                  />

                  {/* Trade breakdown — updates with volume filter */}
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

                  {/* Chart */}
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

                    {/* key forces smooth remount when filter changes */}
                    <div
                      key={`${popup}-${popupVolume}`}
                      className="transition-opacity duration-300"
                    >
                      <SymbolChart history={displayHistory} height={190} />
                    </div>
                  </div>

                  {/* Open positions */}
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
    </>
  );
}
