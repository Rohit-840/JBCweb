import { useState, useMemo, useRef, useEffect } from "react";
import { normaliseSymbol, isValidSymbol } from "../utils/symbolUtils.js";

export default function AddSymbolInput({
  strategyName,
  onAdd,
  loading,
  suggestions = [],
  openSymbols,
}) {
  const [value,    setValue]    = useState("");
  const [error,    setError]    = useState("");
  const [flash,    setFlash]    = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [cursor,   setCursor]   = useState(-1);
  const [dropPos,  setDropPos]  = useState({});
  const inputRef = useRef(null);
  const wrapRef  = useRef(null);

  // sorted suggestions: startsWith matches first, then contains
  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return suggestions.slice(0, 8);
    const starts   = suggestions.filter(s => s.startsWith(q));
    const contains = suggestions.filter(s => !s.startsWith(q) && s.includes(q));
    return [...starts, ...contains].slice(0, 8);
  }, [value, suggestions]);

  const updatePos = () => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 200) });
    }
  };

  // close dropdown on outside click or scroll
  useEffect(() => {
    if (!dropOpen) return;
    const close    = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setDropOpen(false); };
    const onScroll = () => setDropOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("scroll",    onScroll, true);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("scroll",    onScroll, true);
    };
  }, [dropOpen]);

  const doSubmit = async (symOverride) => {
    const normalised = normaliseSymbol(symOverride || value);
    if (!normalised) { setError("Enter a symbol name."); return; }
    if (!isValidSymbol(normalised)) { setError("Letters, digits and dots only (max 20 chars)."); return; }
    setError("");
    setDropOpen(false);
    setCursor(-1);
    const ok = await onAdd(normalised);
    if (ok !== false) {
      setValue("");
      setFlash(true);
      setTimeout(() => setFlash(false), 1500);
    }
  };

  const pick = (sym) => { setDropOpen(false); setCursor(-1); doSubmit(sym); };

  const handleKey = (e) => {
    if (e.key === "Enter") {
      if (dropOpen && cursor >= 0 && matches[cursor]) pick(matches[cursor]);
      else doSubmit();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setDropOpen(true); updatePos();
      setCursor(c => Math.min(c + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor(c => Math.max(c - 1, 0));
    } else if (e.key === "Escape") {
      setDropOpen(false); setCursor(-1);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-white/5" ref={wrapRef}>
      <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-2">
        Add symbol to {strategyName}
      </p>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-[220px]">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(""); setCursor(-1); setDropOpen(true); updatePos(); }}
            onFocus={() => { setDropOpen(true); updatePos(); }}
            onKeyDown={handleKey}
            disabled={loading}
            placeholder="e.g. gbpjpy or us30.m"
            className="w-full bg-white/[0.04] border border-white/10 rounded-lg
              px-3 py-1.5 text-xs text-white placeholder-gray-700
              outline-none focus:border-yellow-500/40 focus:bg-white/[0.07]
              disabled:opacity-40 transition-colors duration-200"
          />
        </div>

        <button
          onClick={() => doSubmit()}
          disabled={loading || !value.trim()}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold
            bg-yellow-500/15 border border-yellow-500/30 text-yellow-400
            hover:bg-yellow-500/25 hover:border-yellow-500/50
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all duration-200"
        >
          {loading ? (
            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                strokeDasharray="40" strokeDashoffset="10" />
            </svg>
          ) : flash ? (
            <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor"
              strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor"
              strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          )}
          Add
        </button>
      </div>

      {error && <p className="mt-1.5 text-[10px] text-red-400">{error}</p>}

      {/* fixed-position dropdown */}
      {dropOpen && matches.length > 0 && (
        <div
          style={{ position: "fixed", top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
          className="bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="px-3 py-1.5 border-b border-white/5 flex items-center gap-1.5 bg-[#1a1a1a]">
            <svg className="w-2.5 h-2.5 text-yellow-400/50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-[9px] text-yellow-400/50 uppercase tracking-widest font-medium">
              From your trades
            </span>
          </div>
          <div className="max-h-44 overflow-y-auto">
            {matches.map((sym, i) => {
              const isLive = openSymbols?.has(sym);
              return (
                <button
                  key={sym}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(sym)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between
                    transition-colors duration-100 ${
                    i === cursor
                      ? "bg-yellow-500/15 text-yellow-300"
                      : "text-gray-300 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isLive ? "bg-green-400 animate-pulse" : "bg-gray-600"
                    }`} />
                    <span className="font-mono">{sym}</span>
                  </span>
                  {isLive && (
                    <span className="text-[8px] bg-green-500/10 border border-green-500/20 text-green-400
                      px-1.5 py-0.5 rounded font-bold tracking-widest uppercase">
                      Live
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
