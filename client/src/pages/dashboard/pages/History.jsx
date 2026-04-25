import { useState, useMemo } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function fmtTime(ts) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString("en-GB", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
}

// ── Time period filter config ─────────────────────────────────────────────────
const TIME_FILTERS = [
  { label: "All", days: null },
  { label: "1Y",  days: 365  },
  { label: "1M",  days: 30   },
  { label: "1D",  days: 1    },
];

function TimeFilter({ active, onChange }) {
  return (
    <div className="flex items-center bg-[#0a0a0a] border border-white/[0.07] rounded-lg p-[3px] gap-[2px]">
      {TIME_FILTERS.map(({ label }) => {
        const isActive = active === label;
        return (
          <button
            key={label}
            onClick={() => onChange(label)}
            className={[
              "px-3 py-1.5 rounded-md text-[10px] font-bold tracking-[0.14em] transition-all duration-200",
              isActive ? "text-yellow-400 bg-yellow-500/[0.12]" : "text-gray-600 hover:text-gray-400",
            ].join(" ")}
            style={isActive ? {
              boxShadow: "0 0 10px rgba(234,179,8,0.18), inset 0 0 8px rgba(234,179,8,0.06)",
              border: "1px solid rgba(234,179,8,0.25)",
            } : { border: "1px solid transparent" }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Table columns ─────────────────────────────────────────────────────────────
const COLS = ["Ticket", "Symbol", "Type", "Volume", "Close Time", "Profit"];

// ── Main component ────────────────────────────────────────────────────────────
export default function History({ data, filteredSymbols }) {
  const [query,      setQuery]      = useState("");
  const [timePeriod, setTimePeriod] = useState("All");

  // 1 — symbol filter (from parent)
  const symbolFiltered = useMemo(
    () => (data?.full_history || []).filter(
      (h) => !filteredSymbols || filteredSymbols.includes(h.symbol)
    ),
    [data?.full_history, filteredSymbols]
  );

  // 2 — time period filter
  const periodFiltered = useMemo(() => {
    const cfg = TIME_FILTERS.find((f) => f.label === timePeriod);
    if (!cfg?.days) return symbolFiltered;
    const cutoff = Math.floor(Date.now() / 1000) - cfg.days * 86_400;
    return symbolFiltered.filter((h) => h.time >= cutoff);
  }, [symbolFiltered, timePeriod]);

  // 3 — search filter
  const history = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return periodFiltered;
    return periodFiltered.filter(
      (h) =>
        String(h.ticket).includes(q) ||
        h.symbol?.toLowerCase().includes(q) ||
        (h.type === 0 ? "buy" : "sell").includes(q)
    );
  }, [periodFiltered, query]);

  const total    = periodFiltered.length;
  const matched  = history.length;
  const hasQuery = query.trim().length > 0;

  return (
    <div className="p-5 min-h-full">

      {/* ── Header ── */}
      <div className="mb-5">
        <p className="text-[10px] tracking-[0.22em] text-yellow-400/60 uppercase mb-1">
          Full History
        </p>
        <h1 className="text-3xl font-bold text-white tracking-wider">Trade History</h1>
        <p className="text-gray-600 text-xs mt-1">
          {hasQuery
            ? `${matched} of ${total} trade${total !== 1 ? "s" : ""}`
            : `${total} trade${total !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* ── Controls row: period filter + search ── */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <TimeFilter active={timePeriod} onChange={setTimePeriod} />

        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ticket, symbol, buy / sell…"
            className="w-full bg-[#111] border border-white/10 rounded-xl
              pl-9 pr-9 py-2.5 text-sm text-white placeholder-gray-600
              outline-none focus:border-yellow-500/40 focus:bg-[#161616]
              transition-colors duration-200"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2
                text-gray-600 hover:text-gray-300 transition-colors text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[620px]">
            <thead>
              <tr className="border-b border-white/5">
                {COLS.map((col, i) => (
                  <th
                    key={col}
                    className={`px-5 py-3.5 text-[10px] tracking-widest text-gray-600 uppercase font-medium ${
                      i >= 4 ? "text-right" : "text-left"
                    }`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={COLS.length} className="px-5 py-12 text-center text-gray-700 text-sm">
                    {hasQuery
                      ? `No trades matching "${query}"`
                      : timePeriod !== "All"
                      ? `No closed trades in the last ${timePeriod}`
                      : "No trade history"}
                  </td>
                </tr>
              ) : (
                history.map((h, i) => (
                  <tr
                    key={`${h.ticket}-${i}`}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Ticket — highlighted when it matches search */}
                    <td className="px-5 py-3.5 font-mono text-xs">
                      {hasQuery && String(h.ticket).includes(query.trim()) ? (
                        <span className="text-yellow-400 font-semibold">{h.ticket}</span>
                      ) : (
                        <span className="text-gray-500">{h.ticket}</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-white font-semibold">{h.symbol}</td>

                    <td className="px-5 py-3.5">
                      <TypeBadge type={h.type} />
                    </td>

                    <td className="px-5 py-3.5 text-gray-400">{h.volume}</td>

                    <td className="px-5 py-3.5 text-right text-gray-500 font-mono text-xs whitespace-nowrap">
                      {fmtTime(h.time)}
                    </td>

                    <td className={`px-5 py-3.5 text-right font-semibold ${
                      h.profit >= 0 ? "text-green-400" : "text-red-400"
                    }`}>
                      {h.profit >= 0 ? "+" : ""}${h.profit.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
