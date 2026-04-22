import User from "../models/User.js";
import axios from "axios";

const PYTHON = "http://localhost:8001";

// ─── List accounts (no passwords exposed) ────────────────────────────────────
export const getAccounts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("mt5Accounts");
    const accounts = user.mt5Accounts.map((acc) => ({
      id: String(acc._id),
      login: acc.login,
      server: acc.server,
    }));
    res.json({ accounts });
  } catch {
    res.status(500).json({ message: "Failed to fetch accounts" });
  }
};

// ─── Snapshot: equity + profit for every saved account ───────────────────────
export const getSnapshot = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("mt5Accounts");

    const payload = user.mt5Accounts.map((acc) => ({
      login:    acc.login,
      password: acc.password,
      server:   acc.server,
    }));

    const { data } = await axios.post(`${PYTHON}/mt5/snapshot`, payload);

    const accounts = data.results.map((result, i) => ({
      id: String(user.mt5Accounts[i]._id),
      ...result,
    }));

    res.json({ accounts });
  } catch {
    res.status(500).json({ message: "Failed to fetch account snapshot" });
  }
};

// ─── Select account: tell Python bridge which account to stream ───────────────
export const selectAccount = async (req, res) => {
  try {
    const user    = await User.findById(req.user.id).select("mt5Accounts");
    const account = user.mt5Accounts.id(req.params.accountId);

    if (!account) return res.status(404).json({ message: "Account not found" });

    const { data } = await axios.post(`${PYTHON}/mt5/login`, {
      login:    account.login,
      password: account.password,
      server:   account.server,
    });

    if (!data.success) return res.status(400).json({ message: data.message });

    res.json({ message: "Account selected", account: data.account });
  } catch {
    res.status(500).json({ message: "Failed to select account" });
  }
};

// ─── Delete account: removes from MongoDB ─────────────────────────────────────
export const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const exists = user.mt5Accounts.id(req.params.accountId);

    if (!exists) return res.status(404).json({ message: "Account not found" });

    user.mt5Accounts.pull({ _id: req.params.accountId });
    await user.save();

    res.json({ message: "Account removed" });
  } catch {
    res.status(500).json({ message: "Failed to remove account" });
  }
};

// ─── Add MT5 account ─────────────────────────────────────────────────────────
export const addMT5 = async (req, res) => {
  try {
    const { login, password, server } = req.body;

    const user = await User.findById(req.user.id);

    // Prevent duplicate: same login + server already saved
    const alreadyExists = user.mt5Accounts.some(
      (acc) => acc.login === Number(login) && acc.server === server
    );

    if (alreadyExists) {
      return res.json({
        message: "MT5 account already connected",
        alreadyConnected: true
      });
    }

    // Verify credentials with Python MT5 bridge
    const response = await axios.post(
      `${PYTHON}/mt5/login`,
      { login, password, server }
    );

    if (!response.data.success) {
      return res.status(400).json({
        message: response.data.message
      });
    }

    user.mt5Accounts.push({ login, password, server });
    await user.save();

    res.json({
      message: "MT5 connected successfully",
      account: response.data.account
    });

  } catch (err) {
    res.status(500).json({
      message: "MT5 connection failed"
    });
  }
};

export const getMT5Status = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("mt5Accounts");
    res.json({ hasAccounts: user.mt5Accounts.length > 0 });
  } catch {
    res.status(500).json({ message: "Failed to fetch MT5 status" });
  }
};