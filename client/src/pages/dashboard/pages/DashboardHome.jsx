import { useState, useMemo, useEffect } from "react";
import StatsCards from "../components/StatsCards.jsx";
import StrategyFilter from "../components/StrategyFilter.jsx";
import EquityChart from "../components/EquityChart.jsx";
import TradingAnalytics from "../components/TradingAnalytics.jsx";
import TradeSummary from "../components/TradeSummary.jsx";
import { STRATEGIES } from "../constants.js";

function computeStrategyAnalytics(history) {
  const total = history.length;
  if (total === 0) return { win_rate: 0, total_pnl: 0, total_trades: 0 };
  const wins = history.filter((h) => h.profit > 0);
  const sum  = history.reduce((s, h) => s + h.profit, 0);
  return {
    win_rate:     (wins.length / total) * 100,
    total_pnl:    sum,
    total_trades: total,
  };
}

export default function DashboardHome({ data, connected }) {
  const [activeStrategy, setActiveStrategy]           = useState(null);
  const [strategyVolumeFilter, setStrategyVolumeFilter] = useState([]);
  const account = data?.account;

  // Reset volume filter when strategy changes
  useEffect(() => { setStrategyVolumeFilter([]); }, [activeStrategy]);

  const strategySymbols = activeStrategy ? STRATEGIES[activeStrategy] : null;

  // History filtered by strategy symbols
  const strategyHistory = useMemo(() => {
    if (!strategySymbols) return null;
    return (data?.full_history || []).filter((h) => strategySymbols.includes(h.symbol));
  }, [strategySymbols, data?.full_history]);

  // Open trades filtered by strategy symbols
  const strategyTrades = useMemo(() => {
    if (!strategySymbols) return null;
    return (data?.trades || []).filter((t) => strategySymbols.includes(t.symbol));
  }, [strategySymbols, data?.trades]);

  // Unique volumes available for the current strategy (for chip list)
  const availableStrategyVolumes = useMemo(() => {
    if (!strategyHistory) return [];
    const set = new Set(strategyHistory.map((h) => h.volume));
    return [...set].sort((a, b) => a - b);
  }, [strategyHistory]);

  // History after applying volume filter — grouped in selection order
  const volumeFilteredHistory = useMemo(() => {
    if (!strategyHistory) return null;
    if (strategyVolumeFilter.length === 0) return strategyHistory;
    return strategyVolumeFilter.flatMap((vol) =>
      strategyHistory.filter((h) => Math.abs(h.volume - vol) < 0.0001)
    );
  }, [strategyHistory, strategyVolumeFilter]);

  // Open trades after volume filter
  const volumeFilteredTrades = useMemo(() => {
    if (!strategyTrades) return null;
    if (strategyVolumeFilter.length === 0) return strategyTrades;
    return strategyTrades.filter((t) =>
      strategyVolumeFilter.some((vol) => Math.abs(t.volume - vol) < 0.0001)
    );
  }, [strategyTrades, strategyVolumeFilter]);

  // Chart: always chronological for correct cumulative P/L
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

  return (
    <div className="p-5 min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[10px] tracking-[0.22em] text-gray-600 uppercase mb-1">
            Crownstone Private Wealth And Investement Management
          </p>
          <h1 className="text-3xl font-bold text-white tracking-wider">DASHBOARD</h1>
        </div>

        <div
          className={`flex flex-col items-end px-4 py-2 rounded-xl border text-xs font-bold tracking-widest
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
        activeStrategy={activeStrategy}
        onStrategyChange={setActiveStrategy}
        availableVolumes={availableStrategyVolumes}
        volumeFilter={strategyVolumeFilter}
        onVolumeFilterChange={setStrategyVolumeFilter}
      />

      {/* Equity chart + analytics */}
      <div className="flex gap-4">
        <EquityChart
          equityHistory={data?.equityHistory}
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
        trades={data?.trades || []}
        fullHistory={data?.full_history || []}
        strategySymbols={strategySymbols}
        strategyVolumeFilter={strategyVolumeFilter}
      />
    </div>
  );
}
