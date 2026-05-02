import { useMemo } from "react";

export default function Analytics({ data }) {
  const analytics = data?.analytics;
  const trades = useMemo(() => data?.trades || [], [data?.trades]);

  // full_history covers 365 days and already has the position_id symbol-recovery
  // fix applied in Python, so SpotCrude and other CFD instruments appear correctly.
  // (data.history is only 7 days and used just for the analytics object server-side.)
  const closed = useMemo(() => data?.full_history || [], [data?.full_history]);

  const {
    totalOpenProfit,
    totalClosedProfit,
    winTrades,
    lossTrades,
    closedBySymbol,
    openBySymbol,
    allSymbols,
  } = useMemo(() => {
    const nextClosedBySymbol = {};
    const nextOpenBySymbol = {};
    let nextTotalOpenProfit = 0;
    let nextTotalClosedProfit = 0;
    const nextWinTrades = [];
    const nextLossTrades = [];

    for (const h of closed) {
      const profit = h.profit || 0;
      nextTotalClosedProfit += profit;
      if (profit > 0) nextWinTrades.push(h);
      if (profit < 0) nextLossTrades.push(h);
      if (h.symbol) nextClosedBySymbol[h.symbol] = (nextClosedBySymbol[h.symbol] || 0) + profit;
    }

    for (const t of trades) {
      const profit = t.profit || 0;
      nextTotalOpenProfit += profit;
      if (t.symbol) nextOpenBySymbol[t.symbol] = (nextOpenBySymbol[t.symbol] || 0) + profit;
    }

    const symbols = [...new Set([
      ...Object.keys(nextClosedBySymbol),
      ...Object.keys(nextOpenBySymbol),
    ])].sort((a, b) => {
      const totalA = (nextClosedBySymbol[a] || 0) + (nextOpenBySymbol[a] || 0);
      const totalB = (nextClosedBySymbol[b] || 0) + (nextOpenBySymbol[b] || 0);
      return totalB - totalA;
    });

    return {
      totalOpenProfit: nextTotalOpenProfit,
      totalClosedProfit: nextTotalClosedProfit,
      winTrades: nextWinTrades,
      lossTrades: nextLossTrades,
      closedBySymbol: nextClosedBySymbol,
      openBySymbol: nextOpenBySymbol,
      allSymbols: symbols,
    };
  }, [closed, trades]);

  const summary = [
    {
      label: "Total Closed P/L",
      val:   `${totalClosedProfit >= 0 ? "+" : ""}$${totalClosedProfit.toFixed(2)}`,
      color: totalClosedProfit >= 0 ? "text-green-400" : "text-red-400",
    },
    {
      label: "Open P/L",
      val:   `${totalOpenProfit >= 0 ? "+" : ""}$${totalOpenProfit.toFixed(2)}`,
      color: totalOpenProfit >= 0 ? "text-green-400" : "text-red-400",
    },
    {
      label: "Win Rate",
      val:   `${(analytics?.win_rate ?? 0).toFixed(1)}%`,
      color: "text-yellow-400",
    },
    {
      label: "Avg Profit",
      val:   `$${(analytics?.avg_profit ?? 0).toFixed(2)}`,
      color: "text-white",
    },
  ];

  return (
    <div className="p-5 min-h-full">
      <div className="mb-5">
        <p className="text-[10px] tracking-[0.22em] text-yellow-400/60 uppercase mb-1">
          Overview
        </p>
        <h1 className="text-3xl font-bold text-white tracking-wider">Analytics</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {summary.map((c) => (
          <div key={c.label} className="bg-[#111] rounded-xl p-4 border border-white/5">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">{c.label}</p>
            <p className={`text-xl font-bold ${c.color}`}>{c.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Win / Loss breakdown */}
        <div className="bg-[#111] rounded-xl p-5 border border-white/5">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-4">
            Win / Loss Breakdown
          </p>
          <div className="space-y-3">
            {[
              { label: "Winning Trades", val: winTrades.length,  color: "text-green-400" },
              { label: "Losing Trades",  val: lossTrades.length, color: "text-red-400"   },
              { label: "Total Closed",   val: closed.length,     color: "text-white", divider: true },
              { label: "Open Positions", val: trades.length,     color: "text-white" },
            ].map(({ label, val, color, divider }) => (
              <div
                key={label}
                className={`flex justify-between items-center ${divider ? "pt-3 border-t border-white/5" : ""}`}
              >
                <span className={`text-sm ${color}`}>{label}</span>
                <span className="text-white font-bold">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* P/L by symbol — closed + open side by side */}
        <div className="bg-[#111] rounded-xl p-5 border border-white/5">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-4">
            P / L by Symbol
          </p>
          {allSymbols.length === 0 ? (
            <p className="text-gray-700 text-sm">No trade data yet</p>
          ) : (
            <div className="space-y-0">
              {/* Column headers */}
              <div className="flex justify-between items-center pb-2 mb-1 border-b border-white/5">
                <span className="text-[9px] text-gray-600 uppercase tracking-widest">Symbol</span>
                <div className="flex gap-6">
                  <span className="text-[9px] text-gray-600 uppercase tracking-widest text-right w-20">Closed</span>
                  <span className="text-[9px] text-amber-600/70 uppercase tracking-widest text-right w-20">Open</span>
                </div>
              </div>

              <div className="space-y-2">
                {allSymbols.map((sym) => {
                  const cl = closedBySymbol[sym] ?? null;
                  const op = openBySymbol[sym]   ?? null;
                  return (
                    <div key={sym} className="flex justify-between items-center">
                      <span className="text-sm text-gray-300 font-medium">{sym}</span>
                      <div className="flex gap-6">
                        {/* Closed P&L */}
                        <span className={`text-sm font-semibold text-right w-20 ${
                          cl === null ? "text-gray-700"
                            : cl >= 0  ? "text-green-400"
                            : "text-red-400"
                        }`}>
                          {cl === null ? "—" : `${cl >= 0 ? "+" : ""}$${cl.toFixed(2)}`}
                        </span>
                        {/* Open floating P&L */}
                        <span className={`text-sm font-semibold text-right w-20 ${
                          op === null ? "text-gray-700"
                            : op >= 0  ? "text-amber-400"
                            : "text-red-400"
                        }`}>
                          {op === null ? "—" : `${op >= 0 ? "+" : ""}$${op.toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
