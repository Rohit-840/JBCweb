import express from "express";
import {
  getStrategies,
  addSymbol,
  removeSymbol,
} from "../controllers/strategies.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/",                           protect, getStrategies);
router.post("/:strategy/add",             protect, addSymbol);
router.delete("/:strategy/symbol/:symbol", protect, removeSymbol);

export default router;
