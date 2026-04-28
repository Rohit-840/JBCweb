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

const TODAY = new Date().toISOString().split("T")[0]; // YYYY-MM-DD for max attr

// ── Quick period filter ───────────────────────────────────────────────────────
const QUICK_FILTERS = ["All", "1Y", "1M", "1W", "1D"];

function getPeriodCutoff(label) {
  const now = new Date();
  switch (label) {
    case "1D":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime() / 1000;
    case "1W": {
      const day  = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, 0, 0, 0, 0).getTime() / 1000;
    }
    case "1M":
      return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime() / 1000;
    case "1Y":
      return new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0).getTime() / 1000;
    default:
      return null;
  }
}

// Convert a YYYY-MM-DD string to epoch seconds for start/end of that day
function dayStart(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime() / 1000;
}
function dayEnd(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d + 1, 0, 0, 0, 0).getTime() / 1000; // exclusive
}

// Shared input style for date pickers
const DATE_INPUT_CLS = `bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs text-white
  outline-none focus:border-yellow-500/40 focus:bg-[#161616]
  transition-colors duration-200 [color-scheme:dark] cursor-pointer`;

// ── Mode toggle button ────────────────────────────────────────────────────────
function ModeBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold tracking-[0.12em] transition-all duration-200",
        active ? "text-yellow-400 bg-yellow-500/[0.12]" : "text-gray-600 hover:text-gray-400",
      ].join(" ")}
      style={active ? {
        boxShadow: "0 0 10px rgba(234,179,8,0.18), inset 0 0 8px rgba(234,179,8,0.06)",
        border: "1px solid rgba(234,179,8,0.25)",
      } : { border: "1px solid transparent" }}
    >
      {children}
    </button>
  );
}

// Table column headers
const COLS = ["Ticket", "Symbol", "Type", "Volume", "Close Time", "Profit"];

// ── Main component ────────────────────────────────────────────────────────────
export default function History({ data, filteredSymbols }) {
  const [query,      setQuery]      = useState("");
  const [filterMode, setFilterMode] = useState("quick"); // "quick" | "date" | "range"
  const [timePeriod, setTimePeriod] = useState("All");
  const [customDate, setCustomDate] = useState("");      // YYYY-MM-DD
  const [dateFrom,   setDateFrom]   = useState("");      // YYYY-MM-DD
  const [dateTo,     setDateTo]     = useState("");      // YYYY-MM-DD

  // 1 — symbol filter (from parent strategy selection)
  const symbolFiltered = useMemo(
    () => (data?.full_history || []).filter(
      (h) => !filteredSymbols || filteredSymbols.includes(h.symbol)
    ),
    [data?.full_history, filteredSymbols]
  );

  // 2 — time / date filter
  const periodFiltered = useMemo(() => {
    if (filterMode === "quick") {
      const cutoff = getPeriodCutoff(timePeriod);
      if (cutoff === null) return symbolFiltered;
      return symbolFiltered.filter((h) => h.time >= cutoff);
    }

    if (filterMode === "date") {
      if (!customDate) return symbolFiltered;
      const start = dayStart(customDate);
      const end   = dayEnd(customDate);
      return symbolFiltered.filter((h) => h.time >= start && h.time < end);
    }

    if (filterMode === "range") {
      if (!dateFrom && !dateTo) return symbolFiltered;
      return symbolFiltered.filter((h) => {
        if (dateFrom && h.time < dayStart(dateFrom)) return false;
        if (dateTo   && h.time >= dayEnd(dateTo))    return false;
        return true;
      });
    }

    return symbolFiltered;
  }, [symbolFiltered, filterMode, timePeriod, customDate, dateFrom, dateTo]);

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
  const totalPnl = useMemo(() => history.reduce((s, h) => s + h.profit, 0), [history]);

  // Subtitle under the Trade History heading
  const subtitle = (() => {
    if (filterMode === "date" && customDate)
      return `${hasQuery ? `${matched} of ` : ""}${total} trade${total !== 1 ? "s" : ""} on ${customDate}`;
    if (filterMode === "range" && (dateFrom || dateTo)) {
      const fromStr = dateFrom || "earliest";
      const toStr   = dateTo   || "today";
      return `${hasQuery ? `${matched} of ` : ""}${total} trade${total !== 1 ? "s" : ""} · ${fromStr} → ${toStr}`;
    }
    return hasQuery
      ? `${matched} of ${total} trade${total !== 1 ? "s" : ""}`
      : `${total} trade${total !== 1 ? "s" : ""}`;
  })();

  // Empty state message
  const emptyMsg = (() => {
    if (hasQuery) return `No trades matching "${query}"`;
    if (filterMode === "date" && customDate)
      return `No closed trades on ${customDate}`;
    if (filterMode === "range" && (dateFrom || dateTo))
      return `No closed trades ${dateFrom ? `from ${dateFrom}` : ""} ${dateTo ? `to ${dateTo}` : ""}`.trim();
    if (filterMode === "quick" && timePeriod !== "All")
      return `No closed trades for ${
        timePeriod === "1D" ? "today" :
        timePeriod === "1W" ? "this week" :
        timePeriod === "1M" ? "this month" : "this year"
      }`;
    return "No trade history";
  })();

  const switchMode = (mode) => {
    setFilterMode(mode);
    // Reset quick period when entering custom modes so it doesn't confuse the label
    if (mode !== "quick") setTimePeriod("All");
  };

  return (
    <div className="p-5 min-h-full">

      {/* ── Header + Search ── */}
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <p className="text-[10px] tracking-[0.22em] text-yellow-400/60 uppercase mb-1">
            Full History
          </p>
          <h1 className="text-3xl font-bold text-white tracking-wider">Trade History</h1>
          <p className="text-gray-600 text-xs mt-1">{subtitle}</p>
        </div>

        {/* Search + PnL */}
        <div className="flex flex-col gap-2 w-full sm:w-72">
          <div className="relative">
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

          {/* Total PnL strip */}
          <div className="flex items-center justify-between px-3 py-2 bg-white/[0.03] border border-white/[0.07] rounded-xl">
            <span className="text-[10px] tracking-widest text-gray-600 uppercase">Total PnL</span>
            <span className={`text-sm font-bold ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
              {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Filter controls ── */}
      <div className="mb-5 space-y-3">

        {/* Row: quick pills + mode toggles */}
        <div className="flex items-center gap-3 flex-wrap">

          {/* Quick period pills */}
          <div className="flex items-center bg-[#0a0a0a] border border-white/[0.07] rounded-lg p-[3px] gap-[2px]">
            {QUICK_FILTERS.map((label) => {
              const isActive = filterMode === "quick" && timePeriod === label;
              return (
                <button
                  key={label}
                  onClick={() => { switchMode("quick"); setTimePeriod(label); }}
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

          {/* Divider */}
          <div className="w-px h-5 bg-white/[0.08] hidden sm:block" />

          {/* Custom date / range mode buttons */}
          <div className="flex items-center bg-[#0a0a0a] border border-white/[0.07] rounded-lg p-[3px] gap-[2px]">
            <ModeBtn active={filterMode === "date"} onClick={() => switchMode(filterMode === "date" ? "quick" : "date")}>
              {/* calendar icon */}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              Date
            </ModeBtn>
            <ModeBtn active={filterMode === "range"} onClick={() => switchMode(filterMode === "range" ? "quick" : "range")}>
              {/* range icon */}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Range
            </ModeBtn>
          </div>
        </div>

        {/* Custom date picker */}
        {filterMode === "date" && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] text-gray-600 uppercase tracking-widest shrink-0">Select Date</span>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              max={TODAY}
              className={DATE_INPUT_CLS}
            />
            {customDate && (
              <button
                onClick={() => setCustomDate("")}
                className="text-[10px] text-gray-600 hover:text-gray-300 transition-colors
                  px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-white/20"
              >
                Clear
              </button>
            )}
            {customDate && (
              <span className="text-[10px] text-yellow-400/60 bg-yellow-500/[0.06]
                border border-yellow-500/20 px-2.5 py-1 rounded-lg">
                {total} trade{total !== 1 ? "s" : ""} on this date
              </span>
            )}
          </div>
        )}

        {/* Date range picker */}
        {filterMode === "range" && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600 uppercase tracking-widest shrink-0">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={dateTo || TODAY}
                className={DATE_INPUT_CLS}
              />
            </div>
            <svg className="w-4 h-4 text-gray-700 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600 uppercase tracking-widest shrink-0">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom || undefined}
                max={TODAY}
                className={DATE_INPUT_CLS}
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); }}
                className="text-[10px] text-gray-600 hover:text-gray-300 transition-colors
                  px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-white/20"
              >
                Clear
              </button>
            )}
            {(dateFrom || dateTo) && (
              <span className="text-[10px] text-yellow-400/60 bg-yellow-500/[0.06]
                border border-yellow-500/20 px-2.5 py-1 rounded-lg">
                {total} trade{total !== 1 ? "s" : ""} in range
              </span>
            )}
          </div>
        )}
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
                    {emptyMsg}
                  </td>
                </tr>
              ) : (
                history.map((h, i) => (
                  <tr
                    key={`${h.ticket}-${i}`}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
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
