import { useState } from "react";
import { normaliseSymbol, isValidSymbol } from "../utils/symbolUtils.js";

/**
 * Inline "Add symbol" input that sits below the symbol chips in the active
 * strategy bar. Normalises the user's input before calling `onAdd`.
 */
export default function AddSymbolInput({ strategyName, onAdd, loading }) {
  const [value,  setValue]  = useState("");
  const [error,  setError]  = useState("");
  const [flash,  setFlash]  = useState(false);

  const handleSubmit = async () => {
    const normalised = normaliseSymbol(value);

    if (!normalised) {
      setError("Enter a symbol name.");
      return;
    }
    if (!isValidSymbol(normalised)) {
      setError("Letters, digits and dots only (max 20 chars).");
      return;
    }

    setError("");
    const ok = await onAdd(normalised);

    if (ok !== false) {
      setValue("");
      setFlash(true);
      setTimeout(() => setFlash(false), 1500);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-2">
        Add symbol to {strategyName}
      </p>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-[220px]">
          <input
            type="text"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(""); }}
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
          onClick={handleSubmit}
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

      {error && (
        <p className="mt-1.5 text-[10px] text-red-400">{error}</p>
      )}
    </div>
  );
}
