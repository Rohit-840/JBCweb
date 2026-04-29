import { useState, useEffect } from "react";

// Direct call to the Python MT5 bridge (Vite proxies /mt5 → localhost:8001)
async function pyPost(path, body) {
  const res  = await fetch(path, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

function TypeBadge({ type }) {
  const isBuy = type === 0;
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
      isBuy ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
    }`}>
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
  const d   = new Date(ts * 1000);
  const dd  = d.getDate().toString().padStart(2, "0");
  const mm  = (d.getMonth() + 1).toString().padStart(2, "0");
  const hh  = d.getHours().toString().padStart(2, "0");
  const min = d.getMinutes().toString().padStart(2, "0");
  return `${dd}/${mm} ${hh}:${min}`;
}

function EmptyRow({ cols, msg }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-7 text-center text-gray-700 text-xs">{msg}</td>
    </tr>
  );
}

/* ── Confirmation modal ─────────────────────────────────────────────────────── */
function ConfirmModal({ confirm, onCancel, onConfirm, loading, error, tradeAllowed }) {
  if (!confirm) return null;

  const isAll    = confirm.type === "all";
  const totalPnl = isAll
    ? confirm.trades.reduce((s, t) => s + t.profit, 0)
    : confirm.trade.profit;
  const pnlPos   = totalPnl >= 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/25
              flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-red-400/60 uppercase tracking-widest mb-0.5">Confirm Close</p>
              <h3 className="text-base font-bold text-white">
                {isAll ? `Close ${confirm.trades.length} Trades` : `Close ${confirm.trade.symbol}`}
              </h3>
            </div>
          </div>

          {/* Trade info */}
          <div className="bg-white/[0.03] rounded-xl border border-white/5 px-4 py-3 space-y-2 mb-4">
            {isAll ? (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Positions</span>
                  <span className="text-white font-semibold">{confirm.trades.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Total P&amp;L</span>
                  <span className={`font-bold ${pnlPos ? "text-green-400" : "text-red-400"}`}>
                    {pnlPos ? "+" : ""}${totalPnl.toFixed(2)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Symbol</span>
                  <span className="text-white font-semibold">{confirm.trade.symbol}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Direction</span>
                  <TypeBadge type={confirm.trade.type} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Volume</span>
                  <span className="text-gray-300">{confirm.trade.volume} lots</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Current P&amp;L</span>
                  <span className={`font-bold ${pnlPos ? "text-green-400" : "text-red-400"}`}>
                    {pnlPos ? "+" : ""}${totalPnl.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            Are you sure you want to close {isAll ? "all these positions" : "this position"}?
            This action <span className="text-white font-medium">cannot be undone</span>.
          </p>

          {/* AlgoTrading disabled warning */}
          {!tradeAllowed && (
            <div className="mt-3 px-3 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/25 flex gap-2.5">
              <svg className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-yellow-400 mb-0.5">AlgoTrading is disabled</p>
                <p className="text-[11px] text-yellow-400/70 leading-relaxed">
                  Open your <span className="font-semibold text-yellow-300">MT5 terminal</span> →
                  click the <span className="font-semibold text-yellow-300">"AlgoTrading"</span> button
                  in the top toolbar until it lights up, then retry.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-3 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 flex gap-2">
              <svg className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <p className="text-xs text-red-400 leading-relaxed">{error}</p>
                {(error.includes("AlgoTrading") || error.includes("10027")) && (
                  <p className="text-[11px] text-red-400/60 mt-1">
                    MT5 terminal → toolbar → <strong>AlgoTrading</strong> button → enable it → retry.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-6 pb-5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10
              text-sm text-gray-300 hover:bg-white/10 transition-all duration-150
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30
              text-red-400 font-semibold text-sm hover:bg-red-500/25
              transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                  strokeDasharray="40" strokeDashoffset="10" />
              </svg>
            )}
            {loading ? "Closing…" : isAll ? "Close All" : "Close Trade"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Open trades mini table ─────────────────────────────────────────────────── */
function OpenTradesPanel({ trades, tradeAllowed = true }) {
  const [confirm,  setConfirm]  = useState(null);
  const [closing,  setClosing]  = useState(new Set());
  const [closeErr, setCloseErr] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const handleConfirm = async () => {
    setCloseErr(null);
    setModalLoading(true);
    const isAll   = confirm.type === "all";
    const tickets = isAll ? confirm.trades.map(t => t.ticket) : [confirm.trade.ticket];
    setClosing(new Set(tickets));

    try {
      if (!isAll) {
        const { ok, data } = await pyPost("/mt5/close", { ticket: confirm.trade.ticket });
        if (!ok || !data.success) {
          setCloseErr(data.error || data.message || "MT5 rejected the close order.");
          return;
        }
      } else {
        const { ok, data } = await pyPost("/mt5/close-all", { tickets });
        if (data.errors?.length) {
          setCloseErr(`${data.errors.length} position(s) failed: ${data.errors[0]?.error || ""}`);
          return;
        }
      }
      setConfirm(null);
    } catch (err) {
      setCloseErr("Cannot reach MT5 bridge — make sure the Python service is running.");
    } finally {
      setModalLoading(false);
      setClosing(new Set());
    }
  };

  return (
    <>
      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden flex-1">
        {/* AlgoTrading disabled banner */}
        {!tradeAllowed && (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20">
            <svg className="w-3.5 h-3.5 text-yellow-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-[10px] text-yellow-400/80 font-medium">
              <span className="font-bold text-yellow-400">AlgoTrading disabled</span> — open MT5 terminal and click the AlgoTrading button to enable closing trades.
            </p>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div>
            <p className="text-[10px] tracking-[0.18em] text-yellow-400/60 uppercase mb-0.5">Live</p>
            <p className="text-sm font-semibold text-white">Open Trades</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/5">
              {trades.length} position{trades.length !== 1 ? "s" : ""}
            </span>
            {trades.length > 0 && (
              <button
                onClick={() => { setCloseErr(null); setConfirm({ type: "all", trades }); }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold
                  bg-red-500/10 border border-red-500/20 text-red-400
                  hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-150"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close All
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#111]">
              <tr className="border-b border-white/5">
                {["Symbol", "Type", "Volume", "Open", "Current", "Profit", ""].map((h, i) => (
                  <th
                    key={i}
                    className={`px-3 py-2.5 text-[10px] tracking-widest text-gray-600 uppercase font-medium ${
                      i >= 3 && i < 6 ? "text-right" : i === 6 ? "w-16" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <EmptyRow cols={7} msg="No open positions" />
              ) : (
                trades.map((t) => {
                  const isBusy = closing.has(t.ticket);
                  return (
                    <tr
                      key={t.ticket}
                      className={`border-b border-white/[0.04] transition-colors ${
                        isBusy ? "opacity-50" : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <td className="px-3 py-2.5 text-white font-semibold">{t.symbol}</td>
                      <td className="px-3 py-2.5"><TypeBadge type={t.type} /></td>
                      <td className="px-3 py-2.5 text-gray-400">{t.volume}</td>
                      <td className="px-3 py-2.5 text-right text-gray-500 font-mono">{t.price_open}</td>
                      <td className="px-3 py-2.5 text-right text-gray-400 font-mono">{t.price_current}</td>
                      <td className="px-3 py-2.5 text-right"><ProfitCell profit={t.profit} /></td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => { setCloseErr(null); setConfirm({ type: "one", trade: t }); }}
                          disabled={isBusy}
                          title={`Close ${t.symbol}`}
                          className="px-2 py-1 rounded-lg text-[10px] font-semibold
                            bg-red-500/10 border border-red-500/20 text-red-400
                            hover:bg-red-500/20 hover:border-red-500/30
                            disabled:opacity-30 disabled:cursor-not-allowed
                            transition-all duration-150"
                        >
                          {isBusy ? (
                            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                                strokeDasharray="40" strokeDashoffset="10" />
                            </svg>
                          ) : "Close"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        confirm={confirm}
        onCancel={() => { setConfirm(null); setCloseErr(null); }}
        onConfirm={handleConfirm}
        loading={modalLoading}
        error={closeErr}
        tradeAllowed={tradeAllowed}
      />
    </>
  );
}

/* ── Recent history mini table with pagination ──────────────────────────────── */
const PAGE_SIZE = 10;

function HistoryPanel({ history, resetKey }) {
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [resetKey]);

  const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages - 1);
  const rows       = history.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden flex-1">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div>
          <p className="text-[10px] tracking-[0.18em] text-yellow-400/60 uppercase mb-0.5">Recent</p>
          <p className="text-sm font-semibold text-white">Trade History</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/5">
            {history.length === 0
              ? "0"
              : `${safePage * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE + PAGE_SIZE, history.length)}`
            } of {history.length}
          </span>
          <button onClick={() => setPage(0)} disabled={safePage === 0}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/10
              text-gray-500 hover:text-white hover:border-white/20 disabled:opacity-25
              disabled:cursor-not-allowed transition-all text-xs">«</button>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/10
              text-gray-500 hover:text-white hover:border-white/20 disabled:opacity-25
              disabled:cursor-not-allowed transition-all text-xs">‹</button>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/10
              text-gray-500 hover:text-white hover:border-white/20 disabled:opacity-25
              disabled:cursor-not-allowed transition-all text-xs">›</button>
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#111]">
            <tr className="border-b border-white/5">
              {["Symbol", "Type", "Volume", "Closed", "Profit"].map((h, i) => (
                <th key={h}
                  className={`px-3 py-2.5 text-[10px] tracking-widest text-gray-600 uppercase font-medium ${
                    i >= 3 ? "text-right" : "text-left"
                  }`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyRow cols={5} msg="No recent trades" />
            ) : (
              rows.map((h, i) => (
                <tr key={`${h.ticket}-${i}`}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 py-2.5 text-white font-semibold">{h.symbol}</td>
                  <td className="px-3 py-2.5"><TypeBadge type={h.type} /></td>
                  <td className="px-3 py-2.5 text-gray-400">{h.volume}</td>
                  <td className="px-3 py-2.5 text-right text-gray-500 font-mono whitespace-nowrap">{fmtClose(h.time)}</td>
                  <td className="px-3 py-2.5 text-right"><ProfitCell profit={h.profit} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Main export ────────────────────────────────────────────────────────────── */
export default function TradeSummary({ trades, fullHistory, strategySymbols, strategyVolumeFilter = [], tradeAllowed = true }) {
  const symbolTrades  = strategySymbols ? trades.filter((t) => strategySymbols.includes(t.symbol))      : trades;
  const symbolHistory = strategySymbols ? fullHistory.filter((h) => strategySymbols.includes(h.symbol)) : fullHistory;

  const filteredTrades = strategyVolumeFilter.length > 0
    ? symbolTrades.filter((t) => strategyVolumeFilter.some((v) => Math.abs(t.volume - v) < 0.0001))
    : symbolTrades;

  const filteredHistory = strategyVolumeFilter.length > 0
    ? strategyVolumeFilter.flatMap((vol) => symbolHistory.filter((h) => Math.abs(h.volume - vol) < 0.0001))
    : symbolHistory;

  const resetKey = JSON.stringify(strategySymbols) + JSON.stringify(strategyVolumeFilter);

  return (
    <div className="flex flex-col md:flex-row gap-4 mt-4">
      <OpenTradesPanel trades={filteredTrades} tradeAllowed={tradeAllowed} />
      <HistoryPanel history={filteredHistory} resetKey={resetKey} />
    </div>
  );
}
