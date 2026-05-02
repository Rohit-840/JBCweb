import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import mt5Routes from "./routes/mt5.routes.js";
import strategiesRoutes from "./routes/strategies.routes.js";
import { allowedCorsOrigins, env } from "./config/env.js";

const app = express();

const privateNetworkOrigin = (origin = "") =>
  /^https?:\/\/192\.168\.\d+\.\d+/.test(origin) ||
  /^https?:\/\/10\.\d+\.\d+\.\d+/.test(origin) ||
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/.test(origin);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedCorsOrigins.includes(origin)) return callback(null, true);
    if (env.NODE_ENV !== "production" && /^https?:\/\/localhost:\d+/.test(origin)) {
      return callback(null, true);
    }
    if ((env.NODE_ENV !== "production" || env.ALLOW_PRIVATE_NETWORK_CORS) && privateNetworkOrigin(origin)) {
      return callback(null, true);
    }

    console.warn("CORS blocked origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ name: "JBC API", status: "ok" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/mt5", mt5Routes);
app.use("/api/strategies", strategiesRoutes);

export default app;
