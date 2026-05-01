export const STRATEGIES = {
  TITAN:   ["XAUUSD", "NAS100", "BTCUSD", "SpotCrude", "US30"],
  ORION:   ["GBPUSD", "USDCAD", "EURUSD"],
  ALPHA:   ["EURUSD"],
  SCRABER: ["GBPJPY"],
};

export const STRATEGY_EXPERT_RULES = {
  TITAN: [
    { symbol: "xauusd",  timeframe: "2", volume: 0.1  },
    { symbol: "xauusd",   timeframe: "1", volume: 0.2  },
    { symbol: "xauusd",  timeframe: "3", volume: 0.3  },
    
    { symbol: "nas100",  timeframe: "1", volume: 1    },
    { symbol: "nas100",   timeframe: "2", volume: 2    },
    { symbol: "nas100",   timeframe: "3", volume: 3    },

    { symbol: "btcusd",   timeframe: "1", volume: 0.1  },
    { symbol: "btcusd",   timeframe: "2", volume: 0.2  },
    { symbol: "btcusd",  timeframe: "3", volume: 0.3  },

    { symbol: "us30",    timeframe: "1", volume: 0.5  },
    { symbol: "us30",   timeframe: "3", volume: 1.5  },

    { symbol: "spotcrude",   timeframe: "3", volume: 0.7  },
    { symbol: "spotcrude",   timeframe: "2", volume: 1  },
  ],
  ORION: [],
  ALPHA: [
    { symbol: "eurusd",  volume: 0.82 },
    { symbol: "eurusd",  volume: 1.07 },
    { symbol: "eurusd",  volume: 1.97 },
    { symbol: "eurusd",  volume: 3.14 },
    { symbol: "eurusd",  volume: 3.3 },
    { symbol: "eurusd",  volume: 3.89 },
    { symbol: "eurusd",  volume: 9.92 },
  ],
  SCRABER: [],
};

// per-strategy, per-symbol fixed t/p and s/l targets (in usd)
// tp/sl can be a number (exact target ± tolerance) or { min, max } for an inclusive range
export const STRATEGY_CONFIG = {};


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
