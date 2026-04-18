import express from "express";
import { addMT5, getMT5Status } from "../controllers/mt5.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/status", protect, getMT5Status);
router.post("/add", protect, addMT5);

export default router;