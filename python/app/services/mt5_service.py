import MetaTrader5 as mt5
from datetime import datetime, timedelta

# In-memory session storage (survives WebSocket reconnects, cleared on server restart)
_session = {"login": None, "password": None, "server": None}


def connect_mt5():
    if not mt5.initialize():
        code, msg = mt5.last_error()
        print(f"❌ MT5 Initialization Failed — code {code}: {msg}")
        print("   ⚠  Make sure MetaTrader 5 terminal is OPEN on this machine.")
        return False
    print("✅ MT5 terminal connection established")
    return True


def login_mt5(login: int, password: str, server: str) -> bool:
    """Initialize MT5 and log in. Stores credentials for session restore."""
    if not mt5.initialize():
        code, msg = mt5.last_error()
        print(f"❌ MT5 init failed — {code}: {msg}")
        return False

    if not mt5.login(login=login, password=password, server=server):
        code, msg = mt5.last_error()
        print(f"❌ MT5 login failed — {code}: {msg}")
        return False

    _session["login"]    = login
    _session["password"] = password
    _session["server"]   = server
    print(f"✅ MT5 logged in: {login} @ {server}")
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