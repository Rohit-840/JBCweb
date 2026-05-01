# Project Structure

```text
jbcweb/
  client/              React/Vite frontend
  server/              Express API and MongoDB persistence
  python/              FastAPI MT5 bridge
  deploy/
    nginx/             Reverse proxy config for one-domain VPS deployment
    pm2/               Process manager config for API and MT5 bridge
  docs/                Deployment and architecture notes
```

The app is intentionally split into three runtime services:

- `client` builds static files into `client/dist`.
- `server` serves authenticated `/api/*` endpoints on port `3000`.
- `python` serves MT5 bridge endpoints on port `8001`, including `/mt5/*` and `/ws/dashboard`.

In production, Nginx serves the static frontend and proxies the API/MT5 paths to the two backend services.
