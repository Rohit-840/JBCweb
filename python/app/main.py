from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket
from typing import List
from app.websocket import dashboard_stream
from app.services.mt5_service import (
    connect_mt5,
    login_mt5,
    get_account_snapshot,
    get_history_symbols,
    get_symbol_deals,
    get_raw_deals_sample,
    is_connected,
    ensure_connected,
    close_position,
    close_all_positions,
)
from pydantic import BaseModel
import MetaTrader5 as mt5


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Try to attach to a running MT5 terminal immediately on startup.
    # If MT5 is already open and logged in the dashboard streams right away
    # without the user re-selecting an account.
    connect_mt5()
    print("[Server] MT5 bridge ready.")
    yield


app = FastAPI(lifespan=lifespan)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "JB Crownstone MT5 Bridge", "mt5_ready": is_connected()}


# ── WebSocket ─────────────────────────────────────────────────────────────────

@app.websocket("/ws/dashboard")
async def websocket_endpoint(websocket: WebSocket):
    await dashboard_stream(websocket)


# ── MT5 login / snapshot ──────────────────────────────────────────────────────

class MT5Login(BaseModel):
    login:    int
    password: str
    server:   str


@app.post("/mt5/login")
async def mt5_login(data: MT5Login):
    # async so this runs in the same event-loop thread as the WebSocket,
    # keeping the MT5 IPC connection in one OS thread.
    ok = login_mt5(data.login, data.password, data.server)
    if not ok:
        code, msg = mt5.last_error()
        return {"success": False, "message": f"MT5 error {code}: {msg}"}

    acc = mt5.account_info()
    return {
        "success": True,
        "account": {"login": acc.login, "name": acc.name, "server": acc.server},
    }


@app.post("/mt5/snapshot")
async def mt5_snapshot(accounts: List[MT5Login]):
    # async — same event-loop thread, no cross-thread MT5 access.
    credentials = [
        {"login": a.login, "password": a.password, "server": a.server}
        for a in accounts
    ]
    return {"results": get_account_snapshot(credentials)}


# ── Trade close endpoints ─────────────────────────────────────────────────────

class ClosePositionRequest(BaseModel):
    ticket: int


class CloseAllRequest(BaseModel):
    tickets: List[int] = []


@app.post("/mt5/close")
async def mt5_close(data: ClosePositionRequest):
    if not ensure_connected():
        return {"success": False, "error": "MT5 not connected"}
    return close_position(data.ticket)


@app.post("/mt5/close-all")
async def mt5_close_all(data: CloseAllRequest):
    if not ensure_connected():
        return {"success": False, "error": "MT5 not connected"}
    return close_all_positions(data.tickets if data.tickets else None)


# ── Debug endpoints ───────────────────────────────────────────────────────────

@app.get("/debug/status")
async def debug_status():
    """
    Quick health check.
    http://localhost:8001/debug/status
    """
    if not is_connected():
        return {
            "connected": False,
            "message":   "MT5 not connected. Log in through the website first.",
        }
    acc = mt5.account_info()
    return {
        "connected": True,
        "login":     acc.login,
        "name":      acc.name,
        "server":    acc.server,
        "balance":   acc.balance,
        "equity":    acc.equity,
    }


@app.get("/debug/history-symbols")
async def debug_history_symbols(days: int = 365):
    """
    Lists every symbol found in deal history with deal counts and entry types.
    Use this to check what name MT5 uses for crude oil — it might be "USOIL"
    instead of "SpotCrude".

    http://localhost:8001/debug/history-symbols
    http://localhost:8001/debug/history-symbols?days=730
    """
    return get_history_symbols(days)


@app.get("/debug/symbol/{symbol}")
async def debug_symbol(symbol: str, days: int = 365):
    """
    Shows every raw deal for a specific symbol (case-insensitive search).
    Also shows total deal count and empty-symbol count for diagnosis.

    http://localhost:8001/debug/symbol/SpotCrude
    http://localhost:8001/debug/symbol/USOIL
    """
    return get_symbol_deals(symbol, days)


@app.get("/debug/raw-deals")
async def debug_raw_deals(limit: int = 30):
    """
    Returns the last N raw deals exactly as MT5 returns them.
    symbol is shown with repr() so an empty string appears as "" not blank.
    Use this to confirm whether SpotCrude deals have d.symbol="" (empty).

    http://localhost:8001/debug/raw-deals
    http://localhost:8001/debug/raw-deals?limit=50
    """
    return get_raw_deals_sample(limit)
