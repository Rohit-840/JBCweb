import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");

import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env, validateEnv } from "./config/env.js";

validateEnv();

connectDB();

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`API server running on port ${env.PORT}`);
});
