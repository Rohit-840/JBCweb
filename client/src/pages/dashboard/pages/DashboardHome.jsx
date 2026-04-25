import { useState, useMemo, useEffect, useCallback } from "react";
import StatsCards       from "../components/StatsCards.jsx";
import StrategyFilter   from "../components/StrategyFilter.jsx";
import EquityChart      from "../components/EquityChart.jsx";
import TradingAnalytics from "../components/TradingAnalytics.jsx";
import TradeSummary     from "../components/TradeSummary.jsx";
import { applyTPSLFilter } from "../constants.js";
import { buildEffectiveStrategies } from "../utils/symbolUtils.js";
import api from "../../../services/api.js";

function computeStrategyAnalytics(history) {
  const total = history.length;
  if (total === 0) return { win_rate: 0, total_pnl: 0, total_trades: 0 };
  const wins = history.filter((h) => h.profit > 0);
  const sum  = history.reduce((s, h) => s + h.profit, 0);
  return { win_rate: (wins.length / total) * 100, total_pnl: sum, total_trades: total };
}

export default function DashboardHome({ data, connected }) {
  const [activeStrategy,       setActiveStrategy]       = useState(null);
  const [strategyVolumeFilter, setStrategyVolumeFilter] = useState([]);
  const [customizations,       setCustomizations]       = useState({});
  const [symbolLoading,        setSymbolLoading]        = useState(false);
  const account = data?.account;

  // ── Load user's strategy customisations on mount ──────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    api
      .get("/strategies", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setCustomizations(r.data.customizations || {}))
      .catch(() => {}); // silent — static strategies still work
  }, []);

  // Reset volume filter when active strategy changes
  useEffect(() => { setStrategyVolumeFilter([]); }, [activeStrategy]);

  // ── Merge static + custom symbols ────────────────────────────────────────
  const strategies = useMemo(
    () => buildEffectiveStrategies(customizations),
    [customizations]
  );

  const strategySymbols      = activeStrategy ? strategies[activeStrategy] : null;
  const strategySymbolsUpper = useMemo(
    () => strategySymbols ? strategySymbols.map((s) => s.toUpperCase()) : null,
    [strategySymbols]
  );

  // ── Filtered data for the active strategy ────────────────────────────────
  const strategyHistory = useMemo(() => {
    if (!strategySymbolsUpper) return null;
    const bySymbol = (data?.full_history || []).filter(
      (h) => strategySymbolsUpper.includes(h.symbol?.trim().toUpperCase())
    );
    return applyTPSLFilter(bySymbol, activeStrategy);
  }, [strategySymbolsUpper, activeStrategy, data?.full_history]);

  const strategyTrades = useMemo(() => {
    if (!strategySymbolsUpper) return null;
    return (data?.trades || []).filter(
      (t) => strategySymbolsUpper.includes(t.symbol?.trim().toUpperCase())
    );
  }, [strategySymbolsUpper, data?.trades]);

  const availableStrategyVolumes = useMemo(() => {
    if (!strategyHistory) return [];
    return [...new Set(strategyHistory.map((h) => h.volume))].sort((a, b) => a - b);
  }, [strategyHistory]);

  const volumeFilteredHistory = useMemo(() => {
    if (!strategyHistory) return null;
    if (strategyVolumeFilter.length === 0) return strategyHistory;
    return strategyVolumeFilter.flatMap((vol) =>
      strategyHistory.filter((h) => Math.abs(h.volume - vol) < 0.0001)
    );
  }, [strategyHistory, strategyVolumeFilter]);

  const volumeFilteredTrades = useMemo(() => {
    if (!strategyTrades) return null;
    if (strategyVolumeFilter.length === 0) return strategyTrades;
    return strategyTrades.filter((t) =>
      strategyVolumeFilter.some((vol) => Math.abs(t.volume - vol) < 0.0001)
    );
  }, [strategyTrades, strategyVolumeFilter]);

  const strategyChartData = useMemo(() => {
    const hist = volumeFilteredHistory;
    if (!hist || hist.length === 0) return null;
    const sorted = [...hist].sort((a, b) => a.time - b.time);
    let cum = 0;
    return sorted.map((d) => ({ time: d.time * 1000, equity: (cum += d.profit) }));
  }, [volumeFilteredHistory]);

  const displayAnalytics = useMemo(() => {
    if (volumeFilteredHistory) return computeStrategyAnalytics(volumeFilteredHistory);
    const base     = data?.analytics ?? {};
    const totalPnl = (data?.full_history || []).reduce((s, h) => s + h.profit, 0);
    return { ...base, total_pnl: totalPnl };
  }, [volumeFilteredHistory, data?.analytics, data?.full_history]);

  const displayOpenCount = volumeFilteredTrades
    ? volumeFilteredTrades.length
    : (data?.trades?.length ?? 0);

  // ── Strategy symbol callbacks ─────────────────────────────────────────────
  const handleAddSymbol = useCallback(async (strategyName, normalisedSymbol) => {
    setSymbolLoading(true);
    try {
      const token = localStorage.getItem("token");
      await api.post(
        `/strategies/${strategyName}/add`,
        { symbol: normalisedSymbol },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCustomizations((prev) => {
        const delta = prev[strategyName] || { added: [], removed: [] };
        const removed = delta.removed.filter((s) => s !== normalisedSymbol);
        const added   = delta.added.includes(normalisedSymbol)
          ? delta.added
          : [...delta.added, normalisedSymbol];
        return { ...prev, [strategyName]: { added, removed } };
      });
      return true;
    } catch {
      return false;
    } finally {
      setSymbolLoading(false);
    }
  }, []);

  const handleRemoveSymbol = useCallback(async (strategyName, symbol) => {
    const normalisedSymbol = symbol.toLowerCase();
    try {
      const token = localStorage.getItem("token");
      await api.delete(
        `/strategies/${strategyName}/symbol/${encodeURIComponent(normalisedSymbol)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCustomizations((prev) => {
        const delta   = prev[strategyName] || { added: [], removed: [] };
        const inAdded = delta.added.includes(normalisedSymbol);
        if (inAdded) {
          return { ...prev, [strategyName]: { ...delta, added: delta.added.filter((s) => s !== normalisedSymbol) } };
        }
        const removed = delta.removed.includes(normalisedSymbol)
          ? delta.removed
          : [...delta.removed, normalisedSymbol];
        return { ...prev, [strategyName]: { ...delta, removed } };
      });
    } catch { /* silent */ }
  }, []);

  return (
    <div className="p-5 min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div>
          <p className="text-[10px] tracking-[0.22em] text-gray-600 uppercase mb-1">
            Crownstone Private Wealth And Investment Management
          </p>
          <h1 className="text-3xl font-bold text-white tracking-wider">DASHBOARD</h1>
        </div>

        <div className={`flex flex-col items-end px-4 py-2 rounded-xl border text-xs font-bold tracking-widest
          ${connected
            ? "border-green-500/40 bg-green-500/5 text-green-400"
            : "border-white/10 bg-white/[0.03] text-gray-600"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
            {connected ? "CONNECTED" : "OFFLINE"}
          </div>
          {account?.server && (
            <span className="text-[10px] font-normal text-gray-500 mt-0.5">
              {account.server.split(" ")[0]}
            </span>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <StatsCards account={account} />

      {/* Strategy filter */}
      <StrategyFilter
        data={data}
        strategies={strategies}
        activeStrategy={activeStrategy}
        onStrategyChange={setActiveStrategy}
        onAddSymbol={handleAddSymbol}
        onRemoveSymbol={handleRemoveSymbol}
        symbolLoading={symbolLoading}
        availableVolumes={availableStrategyVolumes}
        volumeFilter={strategyVolumeFilter}
        onVolumeFilterChange={setStrategyVolumeFilter}
      />

      {/* Equity chart + analytics */}
      <div className="flex flex-col lg:flex-row gap-4">
        <EquityChart
          equityHistory={data?.equityHistory}
          fullHistory={data?.full_history}
          account={data?.account}
          strategyData={strategyChartData}
          strategyName={activeStrategy}
        />
        <TradingAnalytics
          analytics={displayAnalytics}
          openCount={displayOpenCount}
          strategyName={activeStrategy}
        />
      </div>

      {/* Open trades + history */}
      <TradeSummary
        trades={strategyTrades ?? data?.trades ?? []}
        fullHistory={strategyHistory ?? data?.full_history ?? []}
        strategySymbols={strategySymbols}
        strategyVolumeFilter={strategyVolumeFilter}
      />
    </div>
  );
}
