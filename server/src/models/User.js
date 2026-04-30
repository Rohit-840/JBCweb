import mongoose from "mongoose";
import { encrypt, isEncrypted } from "../utils/crypto.js";

// Schema-level setter: any time a password is written to an mt5Account,
// it is encrypted automatically. Already-encrypted values are passed through.
const mt5Schema = new mongoose.Schema({
  login: Number,
  password: {
    type: String,
    set: (val) => (!val || isEncrypted(val)) ? val : encrypt(val),
  },
  server: String,
});

const expertRuleSchema = new mongoose.Schema({
  symbol:    { type: String, required: true },
  magic:     { type: Number, required: true },
  timeframe: { type: String, required: true },
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  mt5Accounts: [mt5Schema],

  // Stores the user's strategy customisations as delta objects
  // (added symbols + removed symbols) per strategy name.
  strategyCustomizations: {
    type: Map,
    of: new mongoose.Schema({
      added:       { type: [String], default: [] },
      removed:     { type: [String], default: [] },
      expertRules: { type: [expertRuleSchema], default: [] },
    }, { _id: false }),
    default: () => new Map(),
  },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
