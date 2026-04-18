import { useState } from "react";

const STRATEGIES = {
  TITAN:   ["XAUUSD", "NAS100", "BTCUSD"],
  ORION:   ["EURUSD", "GBPUSD", "USDCAD"],
  ALPHA:   ["EURUSD"],
  SCRABER: ["GBPJPY"],
};

function TypeBadge({ type }) {
  const isBuy = type === 0;
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isBuy ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
      {isBuy ? "BUY" : "SELL"}
    </span>
  );
}

export default function StrategyFilter({ data, onFilterChange }) {
  const [active, setActive] = useState(null);
  const [popup, setPopup]   = useState(null);

  const handleStrategy = (name) => {
    const next = active === name ? null : name;
    setActive(next);
    setPopup(null);
    onFilterChange?.(next ? STRATEGIES[name] : null);
  };

  const handleReset = () => {
    setActive(null);
    setPopup(null);
    onFilterChange?.(null);
  };

  const popupTrades  = popup ? (data?.trades  || []).filter((t) => t.symbol === popup) : [];
  const popupHistory = popup ? (data?.history || []).filter((h) => h.symbol === popup && h.entry === 1) : [];

  return (
    <>
      <div className="bg-[#111] rounded-xl px-4 py-3.5 border border-white/5 mb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] tracking-[0.2em] text-yellow-400/70 uppercase mb-0.5">
              Strategy Filter
            </p>
            <p className="text-white font-medium text-sm">
              {active
                ? `${active}: ${STRATEGIES[active].join(", ")}`
                : "Choose your Strategy"}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {Object.keys(STRATEGIES).map((name) => (
              <button
                key={name}
                onClick={() => handleStrategy(name)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all
                  ${active === name
                    ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-400"
                    : "border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300"
                  }`}
              >
                {name}
              </button>
            ))}

            {active && (
              <button
                onClick={handleReset}
                className="px-4 py-1.5 rounded-full text-xs font-medium border border-white/10 text-gray-600 hover:text-gray-400 transition-all"
              >
                RESET
              </button>
            )}
          </div>
        </div>

        {/* Symbol chips */}
        {active && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
            {STRATEGIES[active].map((sym) => (
              <button
                key={sym}
                onClick={() => setPopup(popup === sym ? null : sym)}
                className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:border-yellow-500/30 hover:text-yellow-400 transition-all"
              >
                {sym}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Symbol popup modal */}
      {popup && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setPopup(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[480px] bg-[#0e0e0e] border border-white/10 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] text-yellow-400/70 uppercase tracking-widest mb-0.5">
                  {active}
                </p>
                <h3 className="text-white text-lg font-bold">{popup}</h3>
              </div>
              <button
                onClick={() => setPopup(null)}
                className="text-gray-500 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Open positions */}
            {popupTrades.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] text-yellow-400/70 uppercase tracking-widest mb-2">
                  Open Positions
                </p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-600 border-b border-white/5">
                      <th className="text-left pb-2">Type</th>
                      <th className="text-left pb-2">Volume</th>
                      <th className="text-left pb-2">Open Price</th>
                      <th className="text-right pb-2">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {popupTrades.map((t) => (
                      <tr key={t.ticket} className="border-b border-white/5">
                        <td className="py-2"><TypeBadge type={t.type} /></td>
                        <td className="py-2 text-gray-300">{t.volume}</td>
                        <td className="py-2 text-gray-300">{t.price_open}</td>
                        <td className={`py-2 text-right font-semibold ${t.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {t.profit >= 0 ? "+" : ""}${t.profit.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Recent closed */}
            {popupHistory.length > 0 && (
              <div>
                <p className="text-[10px] text-yellow-400/70 uppercase tracking-widest mb-2">
                  Recent Closed
                </p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-600 border-b border-white/5">
                      <th className="text-left pb-2">Type</th>
                      <th className="text-left pb-2">Volume</th>
                      <th className="text-right pb-2">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {popupHistory.slice(0, 8).map((h, i) => (
                      <tr key={`${h.ticket}-${i}`} className="border-b border-white/5">
                        <td className="py-2"><TypeBadge type={h.type} /></td>
                        <td className="py-2 text-gray-300">{h.volume}</td>
                        <td className={`py-2 text-right font-semibold ${h.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {h.profit >= 0 ? "+" : ""}${h.profit.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {popupTrades.length === 0 && popupHistory.length === 0 && (
              <p className="text-gray-600 text-sm text-center py-4">
                No trade data available for {popup}
              </p>
            )}
          </div>
        </>
      )}
    </>
  );
}
