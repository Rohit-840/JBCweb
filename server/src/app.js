import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import mt5Routes from "./routes/mt5.routes.js";

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use("/api/mt5", mt5Routes);

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ✅ Routes
app.use("/api/auth", authRoutes);

export default app;