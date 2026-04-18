import mongoose from "mongoose";

const mt5Schema = new mongoose.Schema({
  login: Number,
  password: String, // later encrypt
  server: String
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  mt5Accounts: [mt5Schema]
}, { timestamps: true });

export default mongoose.model("User", userSchema);