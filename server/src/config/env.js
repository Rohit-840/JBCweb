import dotenv from "dotenv";

dotenv.config();

const splitList = (value = "") =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 3000),
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  PYTHON_SERVICE_URL: process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8001",
  CORS_ORIGINS: splitList(process.env.CORS_ORIGINS),
  FRONTEND_URL: process.env.FRONTEND_URL,
  ALLOW_PRIVATE_NETWORK_CORS: process.env.ALLOW_PRIVATE_NETWORK_CORS === "true",
};

export const allowedCorsOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  env.FRONTEND_URL,
  ...env.CORS_ORIGINS,
].filter(Boolean);

export function validateEnv() {
  const missing = ["MONGO_URI", "JWT_SECRET"].filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(", ")}`);
  }
}
