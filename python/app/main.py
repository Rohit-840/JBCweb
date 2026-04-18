from fastapi import FastAPI, WebSocket
from app.websocket import dashboard_stream
from app.services.mt5_service import connect_mt5, login_mt5
from pydantic import BaseModel
import MetaTrader5 as mt5

app = FastAPI()


@app.on_event("startup")
def startup():
    # Only tries to attach to a running terminal — won't fail the server if MT5 is closed
    connect_mt5()


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
            "server": acc.server
        }
    }