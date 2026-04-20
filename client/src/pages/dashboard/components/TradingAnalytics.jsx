function Bar({ value, max = 100 }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className="h-1.5 bg-white/5 rounded-full mt-2">
      <div
        className="h-full bg-green-500 rounded-full transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function TradingAnalytics({ analytics, openCount, strategyName }) {
  const winRate      = analytics?.win_rate      ?? 0;
  const avgProfit    = analytics?.avg_profit    ?? 0;
  const tradesClosed = analytics?.total_trades  ?? 0;

  const isFiltered = !!strategyName;

  return (
    <div className="bg-[#111] rounded-xl p-4 border border-white/5 w-[272px] shrink-0">
      <p className="text-[10px] tracking-[0.2em] text-yellow-400/70 uppercase mb-0.5">
        {isFiltered ? strategyName : "Overview"}
      </p>
      <p className="text-white font-semibold text-sm mb-5">Trading Analytics</p>

      <div className="space-y-5">
        <div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 uppercase tracking-widest">Win Rate</span>
            <span className="text-white font-bold">{winRate.toFixed(0)}%</span>
          </div>
          <Bar value={winRate} max={100} />
        </div>

        <div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 uppercase tracking-widest">Avg Profit</span>
            <span className={`font-bold ${avgProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
              {avgProfit >= 0 ? "+" : ""}${Math.abs(avgProfit).toFixed(2)}
            </span>
          </div>
          <Bar value={Math.min(Math.abs(avgProfit), 500)} max={500} />
        </div>

        <div className="h-px bg-white/5" />

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
            <p className="text-[9px] tracking-widest text-gray-500 uppercase mb-1.5">
              Trades Closed
            </p>
            <p className="text-2xl font-bold text-white">{tradesClosed}</p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
            <p className="text-[9px] tracking-widest text-gray-500 uppercase mb-1.5">
              Open Positions
            </p>
            <p className="text-2xl font-bold text-white">{openCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
