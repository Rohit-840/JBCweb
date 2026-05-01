const path = require("node:path");

const pythonBin = process.platform === "win32"
  ? path.join(__dirname, "../../python/.venv/Scripts/python.exe")
  : path.join(__dirname, "../../python/.venv/bin/python");

module.exports = {
  apps: [
    {
      name: "jbc-api",
      cwd: path.join(__dirname, "../../server"),
      script: "src/server.js",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "jbc-mt5-bridge",
      cwd: path.join(__dirname, "../../python"),
      script: pythonBin,
      args: "-m uvicorn app.main:app --host 127.0.0.1 --port 8001",
      interpreter: "none",
      env: {
        PYTHONUNBUFFERED: "1"
      }
    }
  ]
};
