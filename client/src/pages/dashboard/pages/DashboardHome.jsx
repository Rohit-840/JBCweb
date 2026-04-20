import { useState, useMemo } from "react";
import StatsCards from "../components/StatsCards.jsx";
import StrategyFilter from "../components/StrategyFilter.jsx";
import EquityChart from "../components/EquityChart.jsx";
import TradingAnalytics from "../components/TradingAnalytics.jsx";
import TradeSummary from "../components/TradeSummary.jsx";
import { STRATEGIES } from "../constants.js";

function computeStrategyAnalytics(history) {
  const total = history.length;
  if (total === 0) return { win_rate: 0, avg_profit: 0, total_trades: 0 };
  const wins = history.filter((h) => h.profit > 0);
  const sum  = history.reduce((s, h) => s + h.profit, 0);
  return {
    win_rate:     (wins.length / total) * 100,
    avg_profit:   sum / total,
    total_trades: total,
  };
}

export default function DashboardHome({ data, connected }) {
  const [activeStrategy, setActiveStrategy] = useState(null);
  const account = data?.account;

  const strategySymbols = activeStrategy ? STRATEGIES[activeStrategy] : null;

  // Filter full_history by strategy symbols
  const strategyHistory = useMemo(() => {
    if (!strategySymbols) return null;
    return (data?.full_history || []).filter((h) => strategySymbols.includes(h.symbol));
  }, [strategySymbols, data?.full_history]);

  // Filter open trades by strategy symbols
  const strategyTrades = useMemo(() => {
    if (!strategySymbols) return null;
    return (data?.trades || []).filter((t) => strategySymbols.includes(t.symbol));
  }, [strategySymbols, data?.trades]);

  // Build cumulative P/L series for the chart (oldest → newest)
  const strategyChartData = useMemo(() => {
    if (!strategyHistory || strategyHistory.length === 0) return null;
    const sorted = [...strategyHistory].sort((a, b) => a.time - b.time);
    let cum = 0;
    return sorted.map((d) => ({ time: d.time * 1000, equity: (cum += d.profit) }));
  }, [strategyHistory]);

  const displayAnalytics = useMemo(
    () => strategyHistory ? computeStrategyAnalytics(strategyHistory) : data?.analytics,
    [strategyHistory, data?.analytics]
  );

  const displayOpenCount = strategyTrades ? strategyTrades.length : (data?.trades?.length ?? 0);

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

      {/* Strategy filter — owns activeStrategy state */}
      <StrategyFilter
        data={data}
        activeStrategy={activeStrategy}
        onStrategyChange={setActiveStrategy}
      />

      {/* Equity chart + analytics — react to strategy selection */}
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

      {/* Live open trades + recent history (newest 10) — filter-aware */}
      <TradeSummary
        trades={data?.trades || []}
        fullHistory={data?.full_history || []}
        strategySymbols={strategySymbols}
      />
    </div>
  );
}
