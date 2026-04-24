export const STRATEGIES = {
  TITAN:   ["XAUUSD", "NAS100", "BTCUSD", "SpotCrude"],
  ORION:   ["EURUSD", "GBPUSD", "USDCAD"],
  ALPHA:   ["EURUSD"],
  SCRABER: ["GBPJPY"],
  OMEGA:   ["EURUSD"],
};

// per-strategy, per-symbol fixed t/p and s/l targets (in usd)
export const STRATEGY_CONFIG = {
  OMEGA: {
    EURUSD: { tp: 300, sl: 300 },
  },
};


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
