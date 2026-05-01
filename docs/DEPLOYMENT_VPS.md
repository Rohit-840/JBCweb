# VPS Deployment

This project deploys cleanly as three services behind Nginx:

1. React static build from `client/dist`
2. Express API on `127.0.0.1:3000`
3. FastAPI MT5 bridge on `127.0.0.1:8001`

## 1. Prepare Environment Files

Create these files from the examples:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
cp python/.env.example python/.env
```

Set `server/.env` carefully. `JWT_SECRET` must be long and stable because it also encrypts stored MT5 passwords.

## 2. Install Dependencies

```bash
cd client && npm ci && cd ..
cd server && npm ci && cd ..
cd python
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cd ..
```

On Windows VPS, activate Python with:

```powershell
python\.venv\Scripts\Activate.ps1
```

## 3. Build Frontend

```bash
npm --prefix client run build
```

## 4. Run Services With PM2

```bash
npm install -g pm2
pm2 start deploy/pm2/ecosystem.config.cjs
pm2 save
```

## 5. Configure Nginx

Copy `deploy/nginx/jbcweb.conf` to your Nginx sites folder, update `server_name`, and make `root` point to your deployed `client/dist` directory.

Then reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Notes

- The MT5 bridge must run on a machine where MetaTrader 5 is installed and logged in.
- For HTTPS, add Certbot or your provider's TLS certificate after the HTTP config is working.
- Keep `.env` files out of git.
