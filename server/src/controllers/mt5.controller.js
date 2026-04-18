import User from "../models/User.js";
import axios from "axios";

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
      "http://localhost:8001/mt5/login",
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
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch MT5 status" });
  }
};