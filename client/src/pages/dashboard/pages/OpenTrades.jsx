function TypeBadge({ type }) {
  const isBuy = type === 0;
  return (
    <span
      className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
        isBuy ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
      }`}
    >
      {isBuy ? "BUY" : "SELL"}
    </span>
  );
}

export default function OpenTrades({ data, filteredSymbols }) {
  const trades = (data?.trades || []).filter(
    (t) => !filteredSymbols || filteredSymbols.includes(t.symbol)
  );

  return (
    <div className="p-5 min-h-full">
      <div className="mb-5">
        <p className="text-[10px] tracking-[0.22em] text-yellow-400/60 uppercase mb-1">
          Live
        </p>
        <h1 className="text-3xl font-bold text-white tracking-wider">Open Trades</h1>
      </div>

      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {["Symbol", "Type", "Volume", "Open Price", "Current", "Profit"].map((h, i) => (
                <th
                  key={h}
                  className={`px-5 py-3.5 text-[10px] tracking-widest text-gray-600 uppercase font-medium ${
                    i >= 3 ? "text-right" : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-700 text-sm">
                  No open trades
                </td>
              </tr>
            ) : (
              trades.map((t) => (
                <tr
                  key={t.ticket}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3.5 text-white font-semibold">{t.symbol}</td>
                  <td className="px-5 py-3.5">
                    <TypeBadge type={t.type} />
                  </td>
                  <td className="px-5 py-3.5 text-gray-300">{t.volume}</td>
                  <td className="px-5 py-3.5 text-right text-gray-400 font-mono text-xs">
                    {t.price_open}
                  </td>
                  <td className="px-5 py-3.5 text-right text-gray-400 font-mono text-xs">
                    {t.price_current}
                  </td>
                  <td
                    className={`px-5 py-3.5 text-right font-semibold ${
                      t.profit >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {t.profit >= 0 ? "+" : ""}${t.profit.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
