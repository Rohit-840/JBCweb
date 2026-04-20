from fastapi import WebSocket
from fastapi.websockets import WebSocketDisconnect
import asyncio
from app.services.mt5_service import (
    ensure_connected,
    get_account_info,
    get_open_trades,
    get_history,
    get_history_with_orders,
    get_live_prices,
    extract_symbols,
)
from app.services.analytics_service import calculate_analytics

_EMPTY = {
    "type": "dashboard",
    "connected": False,
    "account": {},
    "trades": [],
    "history": [],
    "analytics": {},
    "prices": {},
    "symbols": [],
    "full_history": [],
}


async def dashboard_stream(websocket: WebSocket):
    await websocket.accept()

    full_history: list = []
    tick: int = 0

    try:
        while True:
            if not ensure_connected():
                await websocket.send_json(_EMPTY)
                await asyncio.sleep(2)
                continue

            # Refresh full history (with SL/TP) every 30 seconds
            if tick % 30 == 0:
                full_history = get_history_with_orders(days=90)

            tick += 1

            account  = get_account_info()
            trades   = get_open_trades()
            history  = get_history()
            symbols  = extract_symbols(trades)
            prices   = get_live_prices(symbols)
            analytics = calculate_analytics(trades, history)

            await websocket.send_json({
                "type":         "dashboard",
                "connected":    True,
                "account":      account,
                "trades":       trades,
                "history":      history,
                "analytics":    analytics,
                "prices":       prices,
                "symbols":      symbols,
                "full_history": full_history,
            })

            await asyncio.sleep(1)

    except WebSocketDisconnect:
        pass
