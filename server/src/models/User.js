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
}, { timestamps: true });

export default mongoose.model("User", userSchema);
