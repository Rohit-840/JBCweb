import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ws/dashboard': {
        target: 'ws://localhost:8001',
        ws: true,
        changeOrigin: true,
        rewriteWsOrigin: true,
      },
      // Direct Python MT5 bridge (trade operations — close, etc.)
      '/mt5': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
})
