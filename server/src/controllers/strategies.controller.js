import User from "../models/User.js";

// Normalise: lowercase, trim, remove internal whitespace, preserve dots
const normalise = (raw) => raw.trim().replace(/\s+/g, "").toLowerCase();

// Valid normalised symbol: letters, digits, dots only, 1-20 chars
const isValid = (sym) => /^[a-z0-9.]{1,20}$/.test(sym);

// ── GET /api/strategies ───────────────────────────────────────────────────────
export const getStrategies = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("strategyCustomizations");

    // Convert Map → plain object for JSON serialisation
    const customizations = {};
    if (user.strategyCustomizations) {
      for (const [key, val] of user.strategyCustomizations.entries()) {
        customizations[key] = { added: val.added, removed: val.removed };
      }
    }

    res.json({ customizations });
  } catch {
    res.status(500).json({ message: "Failed to fetch strategy customisations" });
  }
};

// ── POST /api/strategies/:strategy/add ───────────────────────────────────────
export const addSymbol = async (req, res) => {
  try {
    const { strategy } = req.params;
    const raw = req.body.symbol;

    if (!raw || typeof raw !== "string") {
      return res.status(400).json({ message: "Symbol is required" });
    }

    const symbol = normalise(raw);

    if (!isValid(symbol)) {
      return res.status(400).json({
        message: "Invalid symbol. Use letters, digits and dots only (max 20 chars).",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user.strategyCustomizations) {
      user.strategyCustomizations = new Map();
    }

    const entry = user.strategyCustomizations.get(strategy) || { added: [], removed: [] };

    // If previously removed → undo the removal instead of adding to `added`
    const removedIdx = entry.removed.findIndex((s) => s === symbol);
    if (removedIdx !== -1) {
      entry.removed.splice(removedIdx, 1);
      user.strategyCustomizations.set(strategy, entry);
      user.markModified("strategyCustomizations");
      await user.save();
      return res.json({ message: "Symbol restored", symbol });
    }

    // Idempotent: skip if already present
    if (entry.added.includes(symbol)) {
      return res.json({ message: "Symbol already exists", symbol });
    }

    entry.added.push(symbol);
    user.strategyCustomizations.set(strategy, entry);
    user.markModified("strategyCustomizations");
    await user.save();

    res.json({ message: "Symbol added", symbol });
  } catch {
    res.status(500).json({ message: "Failed to add symbol" });
  }
};

// ── DELETE /api/strategies/:strategy/symbol/:symbol ──────────────────────────
export const removeSymbol = async (req, res) => {
  try {
    const { strategy, symbol: rawSymbol } = req.params;
    const symbol = normalise(rawSymbol);

    const user = await User.findById(req.user.id);

    if (!user.strategyCustomizations) {
      user.strategyCustomizations = new Map();
    }

    const entry = user.strategyCustomizations.get(strategy) || { added: [], removed: [] };

    // Remove from added list if it was a custom symbol
    const addedIdx = entry.added.findIndex((s) => s === symbol);
    if (addedIdx !== -1) {
      entry.added.splice(addedIdx, 1);
    } else {
      // It's a static symbol — add to removed list (if not already there)
      if (!entry.removed.includes(symbol)) {
        entry.removed.push(symbol);
      }
    }

    user.strategyCustomizations.set(strategy, entry);
    user.markModified("strategyCustomizations");
    await user.save();

    res.json({ message: "Symbol removed", symbol });
  } catch {
    res.status(500).json({ message: "Failed to remove symbol" });
  }
};
