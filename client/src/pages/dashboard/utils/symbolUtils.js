import { STRATEGIES, STRATEGY_EXPERT_RULES } from "../constants.js";

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

export const normaliseTimeframe = (raw) =>
  raw.trim().replace(/\s+/g, "").toUpperCase();

export const isValidTimeframe = (tf) =>
  /^(M[1-9][0-9]*|H[1-9][0-9]*|D1|W1|MN1|RENKO)$/i.test(tf);

export const sameVolume = (a, b) =>
  Math.abs(Number(a) - Number(b)) < 0.0001;

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

export const buildStrategyExpertRules = (customizations = {}) => {
  const result = {};

  for (const [name, rules] of Object.entries(STRATEGY_EXPERT_RULES)) {
    result[name] = (rules || [])
      .filter((rule) => rule?.symbol)
      .map((rule) => ({
        symbol:    rule.symbol.toLowerCase(),
        magic:     rule.magic    === undefined ? null : Number(rule.magic),
        volume:    rule.volume   === undefined ? null : Number(rule.volume),
        timeframe: rule.timeframe ? String(rule.timeframe).toUpperCase() : null,
      }));
  }

  for (const [name, delta] of Object.entries(customizations)) {
    if (name === "ORION") continue;

    const rules = delta.expertRules || [];
    const savedRules = rules
      .filter((rule) => rule?.symbol && rule?.magic !== undefined && rule?.timeframe)
      .map((rule) => ({
        symbol: rule.symbol.toLowerCase(),
        magic: Number(rule.magic),
        volume: rule.volume === undefined ? null : Number(rule.volume),
        timeframe: String(rule.timeframe).toUpperCase(),
      }));

    const existingKeys = new Set((result[name] || []).map((rule) => `${rule.symbol}:${rule.magic}:${rule.volume ?? ""}`));
    const mergedSavedRules = savedRules.filter((rule) => !existingKeys.has(`${rule.symbol}:${rule.magic}:${rule.volume ?? ""}`));
    result[name] = [...(result[name] || []), ...mergedSavedRules];
  }

  result.ORION = result.ORION || [];
  return result;
};

export const findExpertRuleForTrade = (item, expertRules = []) => {
  const symbol = item.symbol?.trim().toLowerCase();
  if (!symbol) return null;

  return expertRules.find((rule) =>
    rule.symbol === symbol
    && (
      rule.magic === null
      || rule.magic === undefined
      || Number(item.magic) === Number(rule.magic)
      || Number(item.opening_magic) === Number(rule.magic)
    )
    && (rule.volume === null || rule.volume === undefined || sameVolume(item.volume, rule.volume))
  ) || null;
};

export const matchesStrategyRule = (
  item,
  strategyName,
  strategySymbols = [],
  expertRulesByStrategy = {}
) => {
  const symbol = item.symbol?.trim().toUpperCase();
  if (!symbol || !strategySymbols.map((s) => s.toUpperCase()).includes(symbol)) {
    return false;
  }

  if (
    strategyName === "ORION"
    && symbol === "EURUSD"
    && findExpertRuleForTrade(item, expertRulesByStrategy.ALPHA || [])
  ) {
    return false;
  }

  const rulesForSymbol = (expertRulesByStrategy[strategyName] || []).filter(
    (rule) => rule.symbol.toUpperCase() === symbol
  );
  if (rulesForSymbol.length === 0) return true;

  return !!findExpertRuleForTrade(item, rulesForSymbol);
};
