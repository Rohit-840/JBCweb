import { useState } from "react";

// Direct call to Python MT5 bridge (Vite proxies /mt5 → localhost:8001)
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
    <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
      isBuy ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
    }`}>
      {isBuy ? "BUY" : "SELL"}
    </span>
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

          {/* Trade details */}
          <div className="bg-white/[0.03] rounded-xl border border-white/5 px-4 py-3 space-y-2.5 mb-4">
            {isAll ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Open positions</span>
                  <span className="text-white font-semibold">{confirm.trades.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total P&amp;L</span>
                  <span className={`font-bold ${pnlPos ? "text-green-400" : "text-red-400"}`}>
                    {pnlPos ? "+" : ""}${totalPnl.toFixed(2)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Symbol</span>
                  <span className="text-white font-semibold">{confirm.trade.symbol}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Direction</span>
                  <TypeBadge type={confirm.trade.type} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Volume</span>
                  <span className="text-gray-300">{confirm.trade.volume} lots</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Open price</span>
                  <span className="text-gray-300 font-mono text-xs">{confirm.trade.price_open}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-white/5 pt-2">
                  <span className="text-gray-500">Current P&amp;L</span>
                  <span className={`font-bold ${pnlPos ? "text-green-400" : "text-red-400"}`}>
                    {pnlPos ? "+" : ""}${totalPnl.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>

          <p className="text-sm text-gray-500 leading-relaxed">
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
                <p className="text-sm font-semibold text-yellow-400 mb-0.5">AlgoTrading is disabled</p>
                <p className="text-xs text-yellow-400/70 leading-relaxed">
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

        {/* Action buttons */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10
              text-sm text-gray-300 font-medium hover:bg-white/10 transition-all duration-150
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-red-500/15 border border-red-500/30
              text-red-400 font-semibold text-sm hover:bg-red-500/25
              transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
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

/* ── Main page ──────────────────────────────────────────────────────────────── */
export default function OpenTrades({ data, filteredSymbols, tradeAllowed = true }) {
  const trades = (data?.trades || []).filter(
    (t) => !filteredSymbols || filteredSymbols.includes(t.symbol)
  );

  const [confirm,      setConfirm]      = useState(null);
  const [closing,      setClosing]      = useState(new Set());
  const [closeErr,     setCloseErr]     = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const openConfirm = (payload) => { setCloseErr(null); setConfirm(payload); };
  const closeModal  = ()         => { setConfirm(null); setCloseErr(null); };

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
    } catch {
      setCloseErr("Cannot reach MT5 bridge — make sure the Python service is running.");
    } finally {
      setModalLoading(false);
      setClosing(new Set());
    }
  };

  const totalPnl = trades.reduce((s, t) => s + t.profit, 0);
  const pnlPos   = totalPnl >= 0;

  return (
    <div className="p-5 min-h-full">
      {/* AlgoTrading disabled banner */}
      {!tradeAllowed && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl
          bg-yellow-500/10 border border-yellow-500/25">
          <svg className="w-4 h-4 text-yellow-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-sm text-yellow-400/80">
            <span className="font-bold text-yellow-400">AlgoTrading is disabled</span> — open your MT5 terminal and click the{" "}
            <span className="font-semibold text-yellow-300">"AlgoTrading"</span> button in the toolbar to enable closing trades from this dashboard.
          </p>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <p className="text-[10px] tracking-[0.22em] text-yellow-400/60 uppercase mb-1">Live</p>
          <h1 className="text-3xl font-bold text-white tracking-wider">Open Trades</h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Summary badge */}
          {trades.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-white/5 bg-white/[0.03]">
              <div className="text-center">
                <p className="text-[9px] text-gray-600 uppercase tracking-widest">Positions</p>
                <p className="text-sm font-bold text-white">{trades.length}</p>
              </div>
              <div className="w-px h-8 bg-white/5" />
              <div className="text-center">
                <p className="text-[9px] text-gray-600 uppercase tracking-widest">Total P&L</p>
                <p className={`text-sm font-bold ${pnlPos ? "text-green-400" : "text-red-400"}`}>
                  {pnlPos ? "+" : ""}${totalPnl.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Close All button */}
          {trades.length > 0 && (
            <button
              onClick={() => openConfirm({ type: "all", trades })}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm
                bg-red-500/10 border border-red-500/25 text-red-400
                hover:bg-red-500/20 hover:border-red-500/40 transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close All ({trades.length})
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[620px]">
            <thead>
              <tr className="border-b border-white/5">
                {["Symbol", "Type", "Volume", "Open Price", "Current", "Profit", "Action"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-3.5 text-[10px] tracking-widest text-gray-600 uppercase font-medium ${
                      i >= 3 && i < 6 ? "text-right" : i === 6 ? "text-right" : "text-left"
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
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-700 text-sm">
                    No open trades
                  </td>
                </tr>
              ) : (
                trades.map((t) => {
                  const isBusy   = closing.has(t.ticket);
                  const profitPos = t.profit >= 0;
                  return (
                    <tr
                      key={t.ticket}
                      className={`border-b border-white/5 transition-colors duration-150 ${
                        isBusy ? "opacity-50 bg-white/[0.01]" : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <td className="px-5 py-3.5 text-white font-semibold">{t.symbol}</td>
                      <td className="px-5 py-3.5"><TypeBadge type={t.type} /></td>
                      <td className="px-5 py-3.5 text-gray-300">{t.volume}</td>
                      <td className="px-5 py-3.5 text-right text-gray-400 font-mono text-xs">{t.price_open}</td>
                      <td className="px-5 py-3.5 text-right text-gray-400 font-mono text-xs">{t.price_current}</td>
                      <td className={`px-5 py-3.5 text-right font-semibold ${profitPos ? "text-green-400" : "text-red-400"}`}>
                        {profitPos ? "+" : ""}${t.profit.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => openConfirm({ type: "one", trade: t })}
                          disabled={isBusy}
                          title={`Close ${t.symbol}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                            text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400
                            hover:bg-red-500/20 hover:border-red-500/30
                            disabled:opacity-30 disabled:cursor-not-allowed
                            transition-all duration-150"
                        >
                          {isBusy ? (
                            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                                strokeDasharray="40" strokeDashoffset="10" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          {isBusy ? "Closing…" : "Close"}
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
        onCancel={closeModal}
        onConfirm={handleConfirm}
        loading={modalLoading}
        error={closeErr}
        tradeAllowed={tradeAllowed}
      />
    </div>
  );
}
