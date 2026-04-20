import { useState, useEffect } from "react";

function TypeBadge({ type }) {
  const isBuy = type === 0;
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
        isBuy ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
      }`}
    >
      {isBuy ? "BUY" : "SELL"}
    </span>
  );
}

function ProfitCell({ profit }) {
  const pos = profit >= 0;
  return (
    <span className={`font-semibold ${pos ? "text-green-400" : "text-red-400"}`}>
      {pos ? "+" : ""}${profit.toFixed(2)}
    </span>
  );
}

function fmtClose(ts) {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  const dd  = d.getDate().toString().padStart(2, "0");
  const mm  = (d.getMonth() + 1).toString().padStart(2, "0");
  const hh  = d.getHours().toString().padStart(2, "0");
  const min = d.getMinutes().toString().padStart(2, "0");
  return `${dd}/${mm} ${hh}:${min}`;
}

function SectionHeader({ title, count, label }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
      <div>
        <p className="text-[10px] tracking-[0.18em] text-yellow-400/60 uppercase mb-0.5">
          {label}
        </p>
        <p className="text-sm font-semibold text-white">{title}</p>
      </div>
      <span className="text-xs text-gray-600 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/5">
        {count}
      </span>
    </div>
  );
}

function EmptyRow({ cols, msg }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-7 text-center text-gray-700 text-xs">
        {msg}
      </td>
    </tr>
  );
}

/* ─── Open Trades mini table ─── */
function OpenTradesPanel({ trades }) {
  return (
    <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden flex-1">
      <SectionHeader
        label="Live"
        title="Open Trades"
        count={`${trades.length} position${trades.length !== 1 ? "s" : ""}`}
      />
      <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#111]">
            <tr className="border-b border-white/5">
              {["Symbol", "Type", "Volume", "Open", "Current", "Profit"].map((h, i) => (
                <th
                  key={h}
                  className={`px-3 py-2.5 text-[10px] tracking-widest text-gray-600 uppercase font-medium ${
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
              <EmptyRow cols={6} msg="No open positions" />
            ) : (
              trades.map((t) => (
                <tr
                  key={t.ticket}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-3 py-2.5 text-white font-semibold">{t.symbol}</td>
                  <td className="px-3 py-2.5">
                    <TypeBadge type={t.type} />
                  </td>
                  <td className="px-3 py-2.5 text-gray-400">{t.volume}</td>
                  <td className="px-3 py-2.5 text-right text-gray-500 font-mono">
                    {t.price_open}
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-400 font-mono">
                    {t.price_current}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <ProfitCell profit={t.profit} />
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

/* ─── Recent History mini table with pagination ─── */
const PAGE_SIZE = 10;

function HistoryPanel({ history, resetKey }) {
  const [page, setPage] = useState(0);

  // Only reset when strategy changes, not on every WebSocket tick
  useEffect(() => { setPage(0); }, [resetKey]);

  const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const rows = history.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden flex-1">
      {/* Header with pagination controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div>
          <p className="text-[10px] tracking-[0.18em] text-yellow-400/60 uppercase mb-0.5">Recent</p>
          <p className="text-sm font-semibold text-white">Trade History</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/5">
            {history.length === 0 ? "0" : `${safePage * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE + PAGE_SIZE, history.length)}`} of {history.length}
          </span>
          <button
            onClick={() => setPage(0)}
            disabled={safePage === 0}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/10
              text-gray-500 hover:text-white hover:border-white/20 disabled:opacity-25
              disabled:cursor-not-allowed transition-all text-xs"
          >
            «
          </button>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/10
              text-gray-500 hover:text-white hover:border-white/20 disabled:opacity-25
              disabled:cursor-not-allowed transition-all text-xs"
          >
            ‹
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/10
              text-gray-500 hover:text-white hover:border-white/20 disabled:opacity-25
              disabled:cursor-not-allowed transition-all text-xs"
          >
            ›
          </button>
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#111]">
            <tr className="border-b border-white/5">
              {["Symbol", "Type", "Volume", "Closed", "Profit"].map((h, i) => (
                <th
                  key={h}
                  className={`px-3 py-2.5 text-[10px] tracking-widest text-gray-600 uppercase font-medium ${
                    i >= 3 ? "text-right" : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyRow cols={5} msg="No recent trades" />
            ) : (
              rows.map((h, i) => (
                <tr
                  key={`${h.ticket}-${i}`}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-3 py-2.5 text-white font-semibold">{h.symbol}</td>
                  <td className="px-3 py-2.5">
                    <TypeBadge type={h.type} />
                  </td>
                  <td className="px-3 py-2.5 text-gray-400">{h.volume}</td>
                  <td className="px-3 py-2.5 text-right text-gray-500 font-mono whitespace-nowrap">
                    {fmtClose(h.time)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <ProfitCell profit={h.profit} />
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

/* ─── Main export ─── */
export default function TradeSummary({ trades, fullHistory, strategySymbols, strategyVolumeFilter = [] }) {
  // Step 1: filter by strategy symbols
  const symbolTrades = strategySymbols
    ? trades.filter((t) => strategySymbols.includes(t.symbol))
    : trades;

  const symbolHistory = strategySymbols
    ? fullHistory.filter((h) => strategySymbols.includes(h.symbol))
    : fullHistory;

  // Step 2: apply volume filter
  // Open trades — simple union filter
  const filteredTrades = strategyVolumeFilter.length > 0
    ? symbolTrades.filter((t) => strategyVolumeFilter.some((v) => Math.abs(t.volume - v) < 0.0001))
    : symbolTrades;

  // History — grouped in selection order (all vol[0] trades, then vol[1], etc.)
  const filteredHistory = strategyVolumeFilter.length > 0
    ? strategyVolumeFilter.flatMap((vol) =>
        symbolHistory.filter((h) => Math.abs(h.volume - vol) < 0.0001)
      )
    : symbolHistory;

  const resetKey = JSON.stringify(strategySymbols) + JSON.stringify(strategyVolumeFilter);

  return (
    <div className="flex gap-4 mt-4">
      <OpenTradesPanel trades={filteredTrades} />
      <HistoryPanel history={filteredHistory} resetKey={resetKey} />
    </div>
  );
}
