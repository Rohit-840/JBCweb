import express from "express";
import {
  getStrategies,
  addSymbol,
  removeSymbol,
  deleteStrategy,
} from "../controllers/strategies.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/",                            protect, getStrategies);
router.post("/:strategy/add",              protect, addSymbol);
router.delete("/:strategy/symbol/:symbol", protect, removeSymbol);
router.delete("/:strategy",               protect, deleteStrategy);

export default router;
