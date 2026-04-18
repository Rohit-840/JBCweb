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

function fmtTime(ts) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function History({ data, filteredSymbols }) {
  const history = (data?.history || [])
    .filter((h) => h.entry === 1)
    .filter((h) => !filteredSymbols || filteredSymbols.includes(h.symbol));

  return (
    <div className="p-5 min-h-full">
      <div className="mb-5">
        <p className="text-[10px] tracking-[0.22em] text-yellow-400/60 uppercase mb-1">
          Recent
        </p>
        <h1 className="text-3xl font-bold text-white tracking-wider">Trade History</h1>
      </div>

      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {["Symbol", "Type", "Volume", "Close Time", "Profit"].map((h, i) => (
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
            {history.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-gray-700 text-sm">
                  No trade history
                </td>
              </tr>
            ) : (
              history.map((h, i) => (
                <tr
                  key={`${h.ticket}-${i}`}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3.5 text-white font-semibold">{h.symbol}</td>
                  <td className="px-5 py-3.5">
                    <TypeBadge type={h.type} />
                  </td>
                  <td className="px-5 py-3.5 text-gray-400">{h.volume}</td>
                  <td className="px-5 py-3.5 text-right text-gray-500 font-mono text-xs">
                    {fmtTime(h.time)}
                  </td>
                  <td
                    className={`px-5 py-3.5 text-right font-semibold ${
                      h.profit >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {h.profit >= 0 ? "+" : ""}${h.profit.toFixed(2)}
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
