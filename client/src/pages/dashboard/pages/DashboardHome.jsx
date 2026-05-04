import { useState, useMemo, useEffect, useCallback } from "react";
import StatsCards       from "../components/StatsCards.jsx";
import StrategyFilter   from "../components/StrategyFilter.jsx";
import EquityChart      from "../components/EquityChart.jsx";
import TradingAnalytics from "../components/TradingAnalytics.jsx";
import TradeSummary     from "../components/TradeSummary.jsx";
import { applyTPSLFilter } from "../constants.js";
import { buildEffectiveStrategies, buildStrategyExpertRules, matchesStrategyRule } from "../utils/symbolUtils.js";
import api from "../../../services/api.js";
import { LiveBadge } from "../../../components/ui/visual.jsx";

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
  const expertRulesByStrategy = useMemo(
    () => buildStrategyExpertRules(customizations),
    [customizations]
  );

  const strategySymbols      = activeStrategy ? strategies[activeStrategy] : null;
  const strategySymbolsUpper = useMemo(
    () => strategySymbols ? strategySymbols.map((s) => s.toUpperCase()) : null,
    [strategySymbols]
  );
  const strategySymbolsSet = useMemo(
    () => strategySymbolsUpper ? new Set(strategySymbolsUpper) : null,
    [strategySymbolsUpper]
  );

  // ── Filtered data for the active strategy ────────────────────────────────
  const strategyHistory = useMemo(() => {
    if (!strategySymbolsUpper) return null;
    const bySymbol = (data?.full_history || []).filter(
      (h) => matchesStrategyRule(h, activeStrategy, strategySymbolsSet, expertRulesByStrategy)
    );
    return applyTPSLFilter(bySymbol, activeStrategy);
  }, [strategySymbolsUpper, strategySymbolsSet, expertRulesByStrategy, activeStrategy, data?.full_history]);

  const strategyTrades = useMemo(() => {
    if (!strategySymbolsUpper) return null;
    return (data?.trades || []).filter(
      (t) => matchesStrategyRule(t, activeStrategy, strategySymbolsSet, expertRulesByStrategy)
    );
  }, [strategySymbolsUpper, strategySymbolsSet, expertRulesByStrategy, activeStrategy, data?.trades]);

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
    const pts = sorted.map((d) => ({ time: d.time * 1000, equity: (cum += d.profit) }));
    // Anchor at $0 just before the first trade so the line always starts from zero
    return [{ time: sorted[0].time * 1000 - 1000, equity: 0 }, ...pts];
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
  const handleAddSymbol = useCallback(async (strategyName, normalisedSymbol, expert = {}) => {
    setSymbolLoading(true);
    try {
      const token = localStorage.getItem("token");
      await api.post(
        `/strategies/${strategyName}/add`,
        {
          symbol: normalisedSymbol,
          ...(expert.magic ? { magic: expert.magic, timeframe: expert.timeframe } : {}),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCustomizations((prev) => {
        const delta = prev[strategyName] || { added: [], removed: [], expertRules: [] };
        const removed = delta.removed.filter((s) => s !== normalisedSymbol);
        const added   = delta.added.includes(normalisedSymbol)
          ? delta.added
          : [...delta.added, normalisedSymbol];
        const expertRules = expert.magic
          ? [
              ...(delta.expertRules || []).filter(
                (rule) => !(rule.symbol === normalisedSymbol && Number(rule.magic) === Number(expert.magic))
              ),
              { symbol: normalisedSymbol, magic: Number(expert.magic), timeframe: expert.timeframe },
            ]
          : (delta.expertRules || []);
        return { ...prev, [strategyName]: { added, removed, expertRules } };
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
        const delta   = prev[strategyName] || { added: [], removed: [], expertRules: [] };
        const inAdded = delta.added.includes(normalisedSymbol);
        const expertRules = (delta.expertRules || []).filter((rule) => rule.symbol !== normalisedSymbol);
        if (inAdded) {
          return { ...prev, [strategyName]: { ...delta, added: delta.added.filter((s) => s !== normalisedSymbol), expertRules } };
        }
        const removed = delta.removed.includes(normalisedSymbol)
          ? delta.removed
          : [...delta.removed, normalisedSymbol];
        return { ...prev, [strategyName]: { ...delta, removed, expertRules } };
      });
    } catch { /* silent */ }
  }, []);

  const handleDeleteStrategy = useCallback(async (strategyName) => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(
        `/strategies/${strategyName}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCustomizations((prev) => {
        const next = { ...prev };
        delete next[strategyName];
        return next;
      });
      if (activeStrategy === strategyName) setActiveStrategy(null);
    } catch { /* silent */ }
  }, [activeStrategy]);

  return (
    <div className="dashboard-home p-4 sm:p-5 min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div>
          <p className="text-[10px] tracking-[0.28em] text-gray-500 uppercase mb-1">
            Crownstone Private Wealth And Investment Management
          </p>
          <h1 className="text-3xl font-bold text-white tracking-[0.08em]">DASHBOARD</h1>
        </div>

        <LiveBadge
          active={connected}
          label={connected ? "Connected" : "Offline"}
          sublabel={account?.server ? account.server.split(" ")[0] : ""}
        />
      </div>

      {/* Stats cards */}
      <StatsCards account={account} />

      {/* Strategy filter */}
      <StrategyFilter
        data={data}
        strategies={strategies}
        expertRules={expertRulesByStrategy}
        activeStrategy={activeStrategy}
        onStrategyChange={setActiveStrategy}
        onAddSymbol={handleAddSymbol}
        onRemoveSymbol={handleRemoveSymbol}
        onDeleteStrategy={handleDeleteStrategy}
        symbolLoading={symbolLoading}
        availableVolumes={availableStrategyVolumes}
        volumeFilter={strategyVolumeFilter}
        onVolumeFilterChange={setStrategyVolumeFilter}
      />

      {/* Equity chart + analytics */}
      <div className="dashboard-market-row flex flex-col lg:flex-row gap-4">
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
        tradeAllowed={data?.trade_allowed !== false}
      />
    </div>
  );
}
