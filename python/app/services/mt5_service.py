import MetaTrader5 as mt5
from datetime import datetime, timedelta

# In-memory session storage (survives WebSocket reconnects, cleared on server restart)
_session = {"login": None, "password": None, "server": None}


def connect_mt5():
    """
    Startup probe only — does NOT attempt login.
    Real authentication happens in login_mt5() once credentials arrive.
    Error -6 (AUTH_FAILED) here is normal and expected.
    """
    print("⏳ MT5 startup: waiting for user credentials before connecting.")
    return False


def login_mt5(login: int, password: str, server: str) -> bool:
    """
    Connect and authenticate in one call by passing credentials directly to
    mt5.initialize(). This bypasses error -6 (AUTH_FAILED) which occurs when
    calling initialize() without credentials on a terminal that requires auth.
    """
    # Shut down any stale connection first
    mt5.shutdown()

    if not mt5.initialize(login=login, password=password, server=server):
        code, msg = mt5.last_error()
        print(f"❌ MT5 connect failed — code {code}: {msg}")
        return False

    _session["login"]    = login
    _session["password"] = password
    _session["server"]   = server
    acc = mt5.account_info()
    name = acc.name if acc else "unknown"
    print(f"✅ MT5 connected: {name} ({login}) @ {server}")
    return True


def ensure_connected() -> bool:
    """Re-login with stored credentials if the MT5 session has dropped."""
    if mt5.account_info() is not None:
        return True  # Already live
    if _session["login"] is None:
        return False  # No credentials stored yet
    print("🔄 MT5 session dropped — reconnecting...")
    return login_mt5(_session["login"], _session["password"], _session["server"])


# 📊 ACCOUNT INFO
def get_account_info():
    acc = mt5.account_info()
    if acc is None:
        return {}

    return {
        # 🔑 Identity
        "login": acc.login,
        "name": acc.name,
        "server": acc.server,
        "currency": acc.currency,

        # 💰 Financials
        "balance": acc.balance,
        "equity": acc.equity,
        "margin": acc.margin,
        "free_margin": acc.margin_free,
        "profit": acc.profit,

        # ⚙️ Extra (useful later)
        "leverage": acc.leverage,
        "company": acc.company
    }


# 📈 OPEN TRADES
def get_open_trades():
    positions = mt5.positions_get()
    if positions is None:
        return []

    trades = []
    for pos in positions:
        trades.append({
            "ticket": pos.ticket,
            "symbol": pos.symbol,
            "type": pos.type,
            "volume": pos.volume,
            "price_open": pos.price_open,
            "price_current": pos.price_current,
            "profit": pos.profit,
            "sl": pos.sl,
            "tp": pos.tp,
            "time": pos.time,
            "comment": pos.comment
        })

    return trades


# 📜 HISTORY (LAST 7 DAYS)
from datetime import datetime, timedelta

def get_history():
    to_date = datetime.now()
    from_date = to_date - timedelta(days=7)

    deals = mt5.history_deals_get(from_date, to_date)

    if deals is None:
        return []

    history = []
    for d in deals:
        history.append({
            "ticket": d.ticket,
            "order": d.order,
            "symbol": d.symbol,
            "type": d.type,
            "entry": d.entry,
            "volume": d.volume,
            "price": d.price,
            "profit": d.profit,
            "commission": d.commission,
            "swap": d.swap,
            "time": d.time,
            "comment": d.comment
        })

    return history

def get_raw_mt5_data():
    return {
        "account_raw": str(mt5.account_info()),
        "positions_raw": str(mt5.positions_get()),
        "history_raw": str(mt5.history_deals_get())
    }
    
    
def get_live_prices(symbols):
    prices = {}

    for symbol in symbols:
        tick = mt5.symbol_info_tick(symbol)

        if tick is not None:
            prices[symbol] = {
                "bid": tick.bid,
                "ask": tick.ask,
                "time": tick.time
            }

    return prices


def extract_symbols(trades):
    symbols = set()
    for t in trades:
        symbols.add(t["symbol"])
    return list(symbols)


def get_history_with_orders(days: int = 90):
    """Returns closed trades (entry=1) enriched with SL/TP from their opening orders."""
    to_date   = datetime.now()
    from_date = to_date - timedelta(days=days)

    all_deals = mt5.history_deals_get(from_date, to_date)
    if all_deals is None:
        return []

    # Map position_id → opening deal
    opening_map: dict = {}
    for d in all_deals:
        if d.entry == 0 and d.symbol:
            opening_map[d.position_id] = d

    # Map order ticket → order (for SL / TP)
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