import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import mt5Routes from "./routes/mt5.routes.js";
import strategiesRoutes from "./routes/strategies.routes.js";

const app = express();

// ✅ Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      /^https?:\/\/192\.168\.\d+\.\d+/.test(origin) ||
      /^https?:\/\/10\.\d+\.\d+\.\d+/.test(origin) ||
      /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/.test(origin) ||
      /^https?:\/\/\d+\.\d+\.\d+\.\d+/.test(origin)
    ) {
      return callback(null, true);
    }
    console.warn("CORS blocked origin:", origin);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json());
app.use("/api/mt5", mt5Routes);
app.use("/api/strategies", strategiesRoutes);

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ✅ Routes
app.use("/api/auth", authRoutes);

export default app;