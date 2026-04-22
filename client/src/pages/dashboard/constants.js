export const STRATEGIES = {
  TITAN:   ["XAUUSD", "NAS100", "BTCUSD"],
  ORION:   ["EURUSD", "GBPUSD", "USDCAD"],
  ALPHA:   ["EURUSD"],
  SCRABER: ["GBPJPY"],
  OMEGA:   ["EURUSD"],
};

// Per-strategy, per-symbol fixed T/P and S/L targets (in USD)
export const STRATEGY_CONFIG = {
  OMEGA: {
    EURUSD: { tp: 300, sl: 300 },
  },
};

// Filters a history array to only include trades that hit TP or SL
// for symbols that have a config entry. Trades on unconfigured symbols pass through.
export function applyTPSLFilter(history, strategyName, tolerance = 2) {
  const strategyCfg = STRATEGY_CONFIG[strategyName];
  if (!strategyCfg) return history;
  return history.filter((h) => {
    const cfg = strategyCfg[h.symbol];
    if (!cfg) return true;
    if (h.profit >= 0) return Math.abs(h.profit - cfg.tp) <= tolerance;
    return Math.abs(-h.profit - cfg.sl) <= tolerance;
  });
}
