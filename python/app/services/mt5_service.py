import MetaTrader5 as mt5
from datetime import datetime, timedelta
from pathlib import Path
import os
from dotenv import load_dotenv

# Resolve .env from python/app/.env regardless of where uvicorn is launched from
load_dotenv(Path(__file__).parent.parent / ".env")

# MT5 terminal path — set MT5_PATH in python/app/.env to switch installations
MT5_PATH = Path(os.getenv("MT5_PATH", r"C:\Program Files\MetaTrader 5\terminal64.exe"))

_session = {"login": None, "password": None, "server": None}
_initialized = False  # Tracks whether mt5.initialize() succeeded


def connect_mt5():
    """Startup probe only — real auth happens in login_mt5() once credentials arrive."""
    print("⏳ MT5 startup: waiting for user credentials before connecting.")
    return False


def login_mt5(login: int, password: str, server: str) -> bool:
    """
    Connect and authenticate against the MT5 terminal.
    Uses the path from MT5_PATH (.env) so multiple installations can be targeted.
    """
    global _initialized

    if _initialized:
        mt5.shutdown()
        _initialized = False

    try:
        if not MT5_PATH.exists():
            print(f"❌ MT5 terminal not found at: {MT5_PATH}")
            print("   Update MT5_PATH in python/app/.env to the correct path.")
            return False

        ok = mt5.initialize(
            path=str(MT5_PATH),
            login=login,
            password=password,
            server=server,
            timeout=15000,
        )

        if not ok:
            code, msg = mt5.last_error()
            print(f"❌ MT5 initialize() failed — error {code}: {msg}")
            return False

        _initialized = True
        _session["login"]    = login
        _session["password"] = password
        _session["server"]   = server

        acc  = mt5.account_info()
        name = acc.name if acc else "unknown"
        print(f"✅ MT5 connected: {name} ({login}) @ {server}  [{MT5_PATH.name}]")
        return True

    except Exception as exc:
        code, msg = mt5.last_error()
        print(f"❌ MT5 unexpected error: {exc} | MT5 last_error={code}: {msg}")
        return False


def ensure_connected() -> bool:
    """Re-login with stored credentials if the MT5 session has dropped."""
    if mt5.account_info() is not None:
        return True
    if _session["login"] is None:
        return False
    print("🔄 MT5 session dropped — reconnecting...")
    return login_mt5(_session["login"], _session["password"], _session["server"])


# 📊 ACCOUNT INFO
def get_account_info():
    acc = mt5.account_info()
    if acc is None:
        return {}

    return {
        "login":       acc.login,
        "name":        acc.name,
        "server":      acc.server,
        "currency":    acc.currency,
        "balance":     acc.balance,
        "equity":      acc.equity,
        "margin":      acc.margin,
        "free_margin": acc.margin_free,
        "profit":      acc.profit,
        "leverage":    acc.leverage,
        "company":     acc.company,
    }


# 📈 OPEN TRADES
def get_open_trades():
    positions = mt5.positions_get()
    if positions is None:
        return []

    return [
        {
            "ticket":        pos.ticket,
            "symbol":        pos.symbol,
            "type":          pos.type,
            "volume":        pos.volume,
            "price_open":    pos.price_open,
            "price_current": pos.price_current,
            "profit":        pos.profit,
            "sl":            pos.sl,
            "tp":            pos.tp,
            "time":          pos.time,
            "comment":       pos.comment,
        }
        for pos in positions
    ]


# 📜 HISTORY (LAST 7 DAYS)
def get_history():
    to_date   = datetime.now()
    from_date = to_date - timedelta(days=7)
    deals = mt5.history_deals_get(from_date, to_date)
    if deals is None:
        return []

    return [
        {
            "ticket":     d.ticket,
            "order":      d.order,
            "symbol":     d.symbol,
            "type":       d.type,
            "entry":      d.entry,
            "volume":     d.volume,
            "price":      d.price,
            "profit":     d.profit,
            "commission": d.commission,
            "swap":       d.swap,
            "time":       d.time,
            "comment":    d.comment,
        }
        for d in deals
    ]


def get_raw_mt5_data():
    return {
        "account_raw":   str(mt5.account_info()),
        "positions_raw": str(mt5.positions_get()),
        "history_raw":   str(mt5.history_deals_get()),
    }


def get_live_prices(symbols):
    prices = {}
    for symbol in symbols:
        tick = mt5.symbol_info_tick(symbol)
        if tick is not None:
            prices[symbol] = {"bid": tick.bid, "ask": tick.ask, "time": tick.time}
    return prices


def extract_symbols(trades):
    return list({t["symbol"] for t in trades})


def get_account_snapshot(credentials_list: list) -> list:
    """
    Loop through each credential set, login, fetch account info, collect results.
    Restores the previously active session when finished.
    """
    prev = (_session["login"], _session["password"], _session["server"])
    results = []

    for creds in credentials_list:
        try:
            ok = login_mt5(int(creds["login"]), creds["password"], creds["server"])
            if ok:
                info = get_account_info()
                results.append({"success": True, **info})
            else:
                code, msg = mt5.last_error()
                results.append({
                    "success": False,
                    "login":   creds["login"],
                    "server":  creds["server"],
                    "error":   f"MT5 error {code}: {msg}",
                })
        except Exception as exc:
            results.append({
                "success": False,
                "login":   creds["login"],
                "server":  creds["server"],
                "error":   str(exc),
            })

    if prev[0] is not None:
        login_mt5(prev[0], prev[1], prev[2])

    return results


def get_history_with_orders(days: int = 90):
    """Returns closed trades (entry=1) enriched with SL/TP from their opening orders."""
    to_date   = datetime.now()
    from_date = to_date - timedelta(days=days)

    all_deals = mt5.history_deals_get(from_date, to_date)
    if all_deals is None:
        return []

    opening_map: dict = {}
    for d in all_deals:
        if d.entry == 0 and d.symbol:
            opening_map[d.position_id] = d

    all_orders = mt5.history_orders_get(from_date, to_date)
    order_map: dict = {}
    if all_orders is not None:
        for o in all_orders:
            order_map[o.ticket] = o

    result = []
    for d in all_deals:
        if d.entry != 1 or not d.symbol:
            continue

        open_deal  = opening_map.get(d.position_id)
        open_order = order_map.get(open_deal.order) if open_deal else None

        result.append({
            "ticket":      int(d.ticket),
            "position_id": int(d.position_id),
            "symbol":      d.symbol,
            "type":        int(open_deal.type) if open_deal else int(d.type),
            "volume":      float(d.volume),
            "price_open":  float(open_deal.price) if open_deal else float(d.price),
            "price_close": float(d.price),
            "sl":          float(open_order.sl) if open_order else 0.0,
            "tp":          float(open_order.tp) if open_order else 0.0,
            "profit":      float(d.profit),
            "commission":  float(d.commission),
            "swap":        float(d.swap),
            "time":        int(d.time),
        })

    return sorted(result, key=lambda x: x["time"], reverse=True)
