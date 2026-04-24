from fastapi import WebSocket
from fastapi.websockets import WebSocketDisconnect
from websockets.exceptions import ConnectionClosedError, ConnectionClosedOK
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
    "type":         "dashboard",
    "connected":    False,
    "account":      {},
    "trades":       [],
    "history":      [],
    "analytics":    {},
    "prices":       {},
    "symbols":      [],
    "full_history": [],
}

# Refresh the 365-day history every N ticks (1 tick ≈ 1 second).
# 10 = closed trades appear within 10 seconds of being closed in MT5.
_HISTORY_INTERVAL = 10


async def dashboard_stream(websocket: WebSocket):
    await websocket.accept()

    full_history: list = []
    tick: int = 0

    try:
        while True:

            # ── Ensure MT5 session is live ────────────────────────────────
            if not ensure_connected():
                await websocket.send_json(_EMPTY)
                await asyncio.sleep(2)
                continue

            # ── Full history refresh (every _HISTORY_INTERVAL seconds) ────
            # All MT5 calls MUST stay in the asyncio event-loop thread —
            # asyncio.to_thread() would move them to a different OS thread
            # which breaks MT5's IPC connection and causes -10004 errors.
            if tick % _HISTORY_INTERVAL == 0:
                try:
                    full_history = get_history_with_orders(365)
                except Exception as exc:
                    print(f"⚠️  history refresh error: {exc}")
                    # keep using last good full_history

            tick += 1

            # ── Per-tick live data ────────────────────────────────────────
            try:
                account   = get_account_info()
                trades    = get_open_trades()
                history   = get_history()
                symbols   = extract_symbols(trades)
                prices    = get_live_prices(symbols)
                analytics = calculate_analytics(trades, history)
            except Exception as exc:
                print(f"⚠️  tick data error: {exc}")
                await asyncio.sleep(1)
                continue

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

    except (WebSocketDisconnect, ConnectionClosedError, ConnectionClosedOK):
        pass   # normal client disconnect — no action needed
    except Exception as exc:
        # Catch anything else (MT5 error mid-send, serialisation failure, etc.)
        # so the handler exits cleanly instead of sending TCP RST to the Vite proxy,
        # which would appear as "ws proxy error: ECONNRESET" in the terminal.
        print(f"[WS] stream error: {exc}")
