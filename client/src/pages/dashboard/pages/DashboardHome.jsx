import { useState } from "react";
import StatsCards from "../components/StatsCards.jsx";
import StrategyFilter from "../components/StrategyFilter.jsx";
import EquityChart from "../components/EquityChart.jsx";
import TradingAnalytics from "../components/TradingAnalytics.jsx";

export default function DashboardHome({ data, connected, onFilterChange }) {
  const account = data?.account;

  return (
    <div className="p-5 min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[10px] tracking-[0.22em] text-gray-600 uppercase mb-1">
            Crownstone Private Wealth
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
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-green-400 animate-pulse" : "bg-gray-600"
              }`}
            />
            {connected ? "CONNECTED" : "OFFLINE"}
          </div>
          {account?.server && (
            <span className="text-[10px] font-normal text-gray-500 mt-0.5">
              {account.server.split(" ")[0]}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <StatsCards account={account} />

      {/* Strategy Filter */}
      <StrategyFilter data={data} onFilterChange={onFilterChange} />

      {/* Chart + Analytics */}
      <div className="flex gap-4">
        <EquityChart equityHistory={data?.equityHistory} />
        <TradingAnalytics
          analytics={data?.analytics}
          openCount={data?.trades?.length ?? 0}
        />
      </div>
    </div>
  );
}
