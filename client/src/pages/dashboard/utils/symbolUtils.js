import { STRATEGIES } from "../constants.js";

/**
 * Normalise a raw symbol string entered by the user:
 *   - Trim surrounding whitespace
 *   - Remove internal spaces   ("SPOT CRUDE" → "spotcrude")
 *   - Lowercase                ("SpotCrude"  → "spotcrude")
 *   - Dots are preserved       ("US30.m"     → "us30.m")
 */
export const normaliseSymbol = (raw) =>
  raw.trim().replace(/\s+/g, "").toLowerCase();

/**
 * Validate a normalised symbol: letters, digits, dots only, 1–20 chars.
 */
export const isValidSymbol = (sym) => /^[a-z0-9.]{1,20}$/.test(sym);

/**
 * Merge the static strategy definitions from constants.js with the user's
 * saved customisations (deltas: added symbols + removed symbols).
 *
 * Rules:
 *  - Static symbols that are in `removed` are excluded.
 *  - Custom `added` symbols that duplicate a still-present static symbol
 *    (case-insensitive) are silently dropped.
 *
 * @param {Record<string, {added: string[], removed: string[]}>} customizations
 * @returns {Record<string, string[]>}
 */
export const buildEffectiveStrategies = (customizations = {}) => {
  const result = {};

  // Static strategies merged with user customizations
  for (const [name, staticSymbols] of Object.entries(STRATEGIES)) {
    const delta        = customizations[name] || { added: [], removed: [] };
    const removed      = new Set(delta.removed.map((s) => s.toLowerCase()));
    const base         = staticSymbols.filter((s) => !removed.has(s.toLowerCase()));
    const baseUpperSet = new Set(base.map((s) => s.toUpperCase()));
    const extra        = (delta.added || []).filter((s) => !baseUpperSet.has(s.toUpperCase()));
    result[name]       = [...base, ...extra];
  }

  // Custom-only strategies (not in static STRATEGIES)
  for (const [name, delta] of Object.entries(customizations)) {
    if (name in result) continue;
    const syms = (delta.added || []).filter(
      (s) => !(delta.removed || []).includes(s)
    );
    if (syms.length > 0) result[name] = syms;
  }

  return result;
};
