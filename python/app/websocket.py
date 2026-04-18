from fastapi import WebSocket
from fastapi.websockets import WebSocketDisconnect
import asyncio
from app.services.mt5_service import (
    ensure_connected,
    get_account_info,
    get_open_trades,
    get_history,
    get_live_prices,
    extract_symbols,
)
from app.services.analytics_service import calculate_analytics


async def dashboard_stream(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            connected = ensure_connected()

            if not connected:
                await websocket.send_json({
                    "type": "dashboard",
                    "connected": False,
                    "account": {},
                    "trades": [],
                    "history": [],
                    "analytics": {},
                    "prices": {},
                    "symbols": [],
                })
                await asyncio.sleep(2)
                continue

            account  = get_account_info()
            trades   = get_open_trades()
            history  = get_history()
            symbols  = extract_symbols(trades)
            prices   = get_live_prices(symbols)
            analytics = calculate_analytics(trades, history)

            await websocket.send_json({
                "type": "dashboard",
                "connected": True,
                "account":   account,
                "trades":    trades,
                "history":   history,
                "analytics": analytics,
                "prices":    prices,
                "symbols":   symbols,
            })

            await asyncio.sleep(1)

    except WebSocketDisconnect:
        pass