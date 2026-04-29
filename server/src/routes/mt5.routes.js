import express from "express";
import {
  addMT5,
  getMT5Status,
  getAccounts,
  getSnapshot,
  selectAccount,
  deleteAccount,
  closeTrade,
  closeAllTrades,
} from "../controllers/mt5.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/status",                 protect, getMT5Status);
router.post("/add",                   protect, addMT5);
router.get("/accounts",               protect, getAccounts);
router.post("/snapshot",              protect, getSnapshot);
router.post("/select/:accountId",     protect, selectAccount);
router.delete("/accounts/:accountId", protect, deleteAccount);
router.post("/close",                 protect, closeTrade);
router.post("/close-all",             protect, closeAllTrades);

export default router;