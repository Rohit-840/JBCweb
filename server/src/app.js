// import express from "express";
// import cors from "cors";
// import authRoutes from "./routes/auth.routes.js";
// import mt5Routes from "./routes/mt5.routes.js";
// import strategiesRoutes from "./routes/strategies.routes.js";

// const app = express();

// // ✅ Middleware
// app.use(cors({
//   origin: function (origin, callback) {
//     // Allow requests with no origin (mobile apps, curl, etc.)
//     if (!origin) return callback(null, true);
//     // Allow any localhost or local-network origin
//     if (
//       origin.includes("localhost") ||
//       origin.includes("127.0.0.1") ||
//       /^https?:\/\/192\.168\.\d+\.\d+/.test(origin) ||
//       /^https?:\/\/10\.\d+\.\d+\.\d+/.test(origin) ||
//       /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/.test(origin)
      
//     ) {
//       return callback(null, true);
//     }
//     callback(new Error("Not allowed by CORS"));
//   },
//   credentials: true
// }));
// app.use(express.json());
// app.use("/api/mt5", mt5Routes);
// app.use("/api/strategies", strategiesRoutes);

// // ✅ Health check route
// app.get("/", (req, res) => {
//   res.send("API is running...");
// });

// // ✅ Routes
// app.use("/api/auth", authRoutes);

// export default app;

// ✅ Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Define your allowed origins
    const allowedOrigins = [
      "http://localhost:3000",      // Local React development
      "http://localhost:5173",      // Local Vite development
      "http://38.255.35.152:5173",  // New specific IP
      process.env.FRONTEND_URL      // Your VPS Public IP or Domain Name (from .env)
    ];

    // Check if the incoming origin is in our allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // You can keep the local network regex if you test on LAN
    if (
      /^https?:\/\/192\.168\.\d+\.\d+/.test(origin) ||
      /^https?:\/\/10\.\d+\.\d+\.\d+/.test(origin) ||
      /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/.test(origin)
    ) {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));