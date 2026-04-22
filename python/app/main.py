from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket
from typing import List
from app.websocket import dashboard_stream
from app.services.mt5_service import login_mt5, get_account_snapshot
from pydantic import BaseModel
import MetaTrader5 as mt5


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("✅ Python MT5 bridge ready — waiting for credentials via /mt5/login")
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/")
def root():
    return {"message": "Backend running"}


@app.websocket("/ws/dashboard")
async def websocket_endpoint(websocket: WebSocket):
    await dashboard_stream(websocket)


class MT5Login(BaseModel):
    login: int
    password: str
    server: str


@app.post("/mt5/login")
def mt5_login(data: MT5Login):
    ok = login_mt5(data.login, data.password, data.server)
    if not ok:
        code, msg = mt5.last_error()
        return {"success": False, "message": f"MT5 error {code}: {msg}"}

    acc = mt5.account_info()
    return {
        "success": True,
        "account": {
            "login": acc.login,
            "name":  acc.name,
            "server": acc.server,
        }
    }


@app.post("/mt5/snapshot")
def mt5_snapshot(accounts: List[MT5Login]):
    credentials = [
        {"login": a.login, "password": a.password, "server": a.server}
        for a in accounts
    ]
    results = get_account_snapshot(credentials)
    return {"results": results}