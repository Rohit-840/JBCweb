export default function Analytics({ data }) {
  const analytics = data?.analytics;
  const trades    = data?.trades   || [];
  const history   = (data?.history || []).filter((h) => h.entry === 1);

  const totalOpenProfit   = trades.reduce((s, t) => s + (t.profit || 0), 0);
  const totalClosedProfit = history.reduce((s, h) => s + (h.profit || 0), 0);
  const winTrades  = history.filter((h) => h.profit > 0);
  const lossTrades = history.filter((h) => h.profit < 0);

  const bySymbol = history.reduce((acc, h) => {
    acc[h.symbol] = (acc[h.symbol] || 0) + h.profit;
    return acc;
  }, {});
  const symbolRows = Object.entries(bySymbol).sort((a, b) => b[1] - a[1]);

  const summary = [
    {
      label: "Total Closed P/L",
      val: `${totalClosedProfit >= 0 ? "+" : ""}$${totalClosedProfit.toFixed(2)}`,
      color: totalClosedProfit >= 0 ? "text-green-400" : "text-red-400",
    },
    {
      label: "Open P/L",
      val: `${totalOpenProfit >= 0 ? "+" : ""}$${totalOpenProfit.toFixed(2)}`,
      color: totalOpenProfit >= 0 ? "text-green-400" : "text-red-400",
    },
    {
      label: "Win Rate",
      val: `${(analytics?.win_rate ?? 0).toFixed(1)}%`,
      color: "text-yellow-400",
    },
    {
      label: "Avg Profit",
      val: `$${(analytics?.avg_profit ?? 0).toFixed(2)}`,
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
      <div className="grid grid-cols-4 gap-3 mb-5">
        {summary.map((c) => (
          <div key={c.label} className="bg-[#111] rounded-xl p-4 border border-white/5">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">
              {c.label}
            </p>
            <p className={`text-xl font-bold ${c.color}`}>{c.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Win / Loss */}
        <div className="bg-[#111] rounded-xl p-5 border border-white/5">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-4">
            Win / Loss Breakdown
          </p>
          <div className="space-y-3">
            {[
              { label: "Winning Trades", val: winTrades.length, color: "text-green-400" },
              { label: "Losing Trades",  val: lossTrades.length, color: "text-red-400" },
              { label: "Total Closed",   val: history.length,    color: "text-white", divider: true },
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

        {/* P/L by symbol */}
        <div className="bg-[#111] rounded-xl p-5 border border-white/5">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-4">
            P / L by Symbol
          </p>
          {symbolRows.length === 0 ? (
            <p className="text-gray-700 text-sm">No closed trade data yet</p>
          ) : (
            <div className="space-y-2.5">
              {symbolRows.map(([sym, pnl]) => (
                <div key={sym} className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">{sym}</span>
                  <span
                    className={`text-sm font-semibold ${
                      pnl >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
