export const STRATEGIES = {
  TITAN:   ["XAUUSD", "NAS100", "BTCUSD", "SpotCrude"],
  ORION:   ["EURUSD", "GBPUSD", "USDCAD"],
  ALPHA:   ["EURUSD"],
  SCRABER: ["GBPJPY"],
  OMEGA:   ["EURUSD"],
};

// per-strategy, per-symbol fixed t/p and s/l targets (in usd)
// tp/sl can be a number (exact target ± tolerance) or { min, max } for an inclusive range
export const STRATEGY_CONFIG = {
  OMEGA: {
    EURUSD: { tp: { min: 280, max: 320 }, sl: { min: 280, max: 320 } },
  },
};


export function applyTPSLFilter(history, strategyName, tolerance = 2) {
  const strategyCfg = STRATEGY_CONFIG[strategyName];
  if (!strategyCfg) return history;
  return history.filter((h) => {
    const cfg = strategyCfg[h.symbol];
    if (!cfg) return true;
    if (h.profit >= 0) {
      if (typeof cfg.tp === "object") return h.profit >= cfg.tp.min && h.profit <= cfg.tp.max;
      return Math.abs(h.profit - cfg.tp) <= tolerance;
    }
    if (typeof cfg.sl === "object") return -h.profit >= cfg.sl.min && -h.profit <= cfg.sl.max;
    return Math.abs(-h.profit - cfg.sl) <= tolerance;
  });
}
