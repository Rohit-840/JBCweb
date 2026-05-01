import { defineConfig, loadEnv } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import process from "node:process";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_DEV_API_TARGET || "http://localhost:3000";
  const mt5Target = env.VITE_DEV_MT5_TARGET || "http://localhost:8001";

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
    ],
    server: {
      host: true,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
        "/ws/dashboard": {
          target: mt5Target,
          ws: true,
          changeOrigin: true,
          rewriteWsOrigin: true,
        },
        "/mt5": {
          target: mt5Target,
          changeOrigin: true,
        },
      },
    },
  };
});
