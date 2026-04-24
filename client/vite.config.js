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
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/ws/dashboard': {
        target: 'ws://localhost:8001',
        ws: true,
        changeOrigin: true,    // required when connecting from a different IP/laptop
        rewriteWsOrigin: true, // rewrite the Origin header so the Python server accepts it
      },
    },
  },
})
