# JBCweb

Trading dashboard for MT5 accounts.

## Applications

- `client/` - React/Vite frontend
- `server/` - Express API, authentication, MongoDB storage
- `python/` - FastAPI MT5 bridge and dashboard websocket stream

## Deployment Files

- `deploy/nginx/jbcweb.conf` - Nginx reverse proxy for one-domain deployment
- `deploy/pm2/ecosystem.config.cjs` - PM2 process config for API and MT5 bridge
- `docs/DEPLOYMENT_VPS.md` - VPS deployment steps
- `docs/PROJECT_STRUCTURE.md` - folder overview

## Common Commands

```bash
npm run client:dev
npm run server:start
npm run python:dev
npm run server:check
npm run build
npm run check:services
```

## Environment

Start from:

- `client/.env.example`
- `server/.env.example`
- `python/.env.example`

Never commit real `.env` files.
