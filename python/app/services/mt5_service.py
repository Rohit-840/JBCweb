import MetaTrader5 as mt5
from datetime import datetime, timedelta

_session = {"login": None, "password": None, "server": None}


# ── Connection management ─────────────────────────────────────────────────────

def connect_mt5() -> bool:
    if mt5.initialize():
        acc = mt5.account_info()
        if acc:
            _session["login"]  = acc.login
            _session["server"] = acc.server
            print(f"[MT5] Auto-connected: {acc.name} ({acc.login}) @ {acc.server}")
            return True
    mt5.shutdown()
    print("[MT5] No running terminal — waiting for /mt5/login.")
    return False


def login_mt5(login: int, password: str, server: str) -> bool:
    mt5.shutdown()
    if not mt5.initialize(login=login, password=password, server=server):
        code, msg = mt5.last_error()
        print(f"[MT5] Login failed code={code}: {msg}")
        return False
    _session["login"]    = login
    _session["password"] = password
    _session["server"]   = server
    acc  = mt5.account_info()
    print(f"[MT5] Connected: {acc.name if acc else '?'} ({login}) @ {server}")
    return True


def ensure_connected() -> bool:
    if mt5.account_info() is not None:
        return True
    if _session["login"] is None:
        return False
    if _session.get("password") is None:
        if mt5.initialize():
            return mt5.account_info() is not None
        return False
    print("[MT5] Reconnecting...")
    return login_mt5(_session["login"], _session["password"], _session["server"])


def is_connected() -> bool:
    return mt5.account_info() is not None


# ── Account info ──────────────────────────────────────────────────────────────

def get_account_info() -> dict:
    acc = mt5.account_info()
    if acc is None:
        return {}
    return {
        "login": acc.login, "name": acc.name, "server": acc.server,
        "currency": acc.currency, "balance": acc.balance, "equity": acc.equity,
        "margin": acc.margin, "free_margin": acc.margin_free, "profit": acc.profit,
        "leverage": acc.leverage, "company": acc.company,
    }


# ── Open trades ───────────────────────────────────────────────────────────────

def get_open_trades() -> list:
    positions = mt5.positions_get()
    if positions is None:
        return []
    return [
        {
            "ticket": pos.ticket, "symbol": pos.symbol, "type": pos.type,
            "volume": pos.volume, "price_open": pos.price_open,
            "price_current": pos.price_current, "profit": pos.profit,
            "sl": pos.sl, "tp": pos.tp, "time": pos.time, "comment": pos.comment,
        }
        for pos in positions
    ]


# ── 7-day history (rolling analytics) ────────────────────────────────────────

def get_history() -> list:
    """
    Last 7 days of deals for rolling analytics and the History tab.
    Same position_id symbol-recovery as get_history_with_orders — instruments
    like SpotCrude whose closing deals have d.symbol='' now appear correctly.
    """
    to_date   = datetime.now() + timedelta(hours=3)
    from_date = to_date - timedelta(days=7)
    deals = mt5.history_deals_get(from_date, to_date)
    if deals is None:
        return []

    pos_sym: dict = {}
    for d in deals:
        if d.entry == 0 and d.symbol:
            pos_sym[d.position_id] = d.symbol.strip()

    result = []
    for d in deals:
        symbol = d.symbol.strip() if d.symbol else pos_sym.get(d.position_id, "")
        if not symbol:
            continue
        result.append({
            "ticket":     d.ticket,  "order":      d.order,
            "symbol":     symbol,    "type":        d.type,
            "entry":      d.entry,   "volume":      d.volume,
            "price":      d.price,   "profit":      d.profit,
            "commission": d.commission, "swap":      d.swap,
            "time":       d.time,    "comment":     d.comment,
        })
    return result


# ── Live prices ───────────────────────────────────────────────────────────────

def get_live_prices(symbols: list) -> dict:
    prices = {}
    for symbol in symbols:
        mt5.symbol_select(symbol, True)
        tick = mt5.symbol_info_tick(symbol)
        if tick is not None:
            prices[symbol] = {"bid": tick.bid, "ask": tick.ask, "time": tick.time}
    return prices


def extract_symbols(trades: list) -> list:
    return list({t["symbol"] for t in trades})


# ── Full history with SL/TP enrichment ───────────────────────────────────────

def get_history_with_orders(days: int = 365) -> list:
    """
    Returns all CLOSING deals for the last `days` days.

    KEY FIX: Some brokers (including Pepperstone Demo) return closing deals
    with d.symbol = "" (empty string).  We recover the symbol by cross-
    referencing the deal's position_id against the opening deal map.
    Without this, SpotCrude (and other CFD instruments) silently disappear
    from the history even though the MT5 terminal shows them.

    MT5 DEAL_ENTRY values:
      0 = DEAL_ENTRY_IN      — open    (excluded)
      1 = DEAL_ENTRY_OUT     — close   (included)
      2 = DEAL_ENTRY_INOUT   — reversal (included)
      3 = DEAL_ENTRY_OUT_BY  — close-by (included)
    """
    to_date   = datetime.now() + timedelta(hours=3)   # 3-h buffer for server TZ
    from_date = to_date - timedelta(days=days)

    all_deals = mt5.history_deals_get(from_date, to_date)
    if all_deals is None:
        code, msg = mt5.last_error()
        print(f"[MT5] history_deals_get failed code={code}: {msg}")
        return []

    print(f"[MT5] history_deals_get: {len(all_deals)} raw deals over {days}d")

    # ── Pass 1: build maps ────────────────────────────────────────────────────
    opening_map:    dict = {}   # position_id → opening deal
    position_symbol: dict = {}  # position_id → symbol  (recovered from opening deal)
    order_map:      dict = {}   # order ticket → order

    for d in all_deals:
        if d.entry == 0:
            if d.symbol:
                opening_map[d.position_id]     = d
                position_symbol[d.position_id] = d.symbol.strip()
            # Some brokers store the opening deal WITHOUT symbol too — skip those

    all_orders = mt5.history_orders_get(from_date, to_date)
    if all_orders is not None:
        for o in all_orders:
            order_map[o.ticket] = o

    # ── Pass 2: collect closing deals ─────────────────────────────────────────
    result   = []
    skipped_no_symbol = 0

    for d in all_deals:
        if d.entry == 0:          # opening deal — skip
            continue

        # Resolve symbol: use d.symbol if present, else fall back to the
        # opening deal of the same position.  This fixes empty-symbol closes.
        symbol = d.symbol.strip() if d.symbol else position_symbol.get(d.position_id, "")
        if not symbol:
            skipped_no_symbol += 1
            continue

        open_deal  = opening_map.get(d.position_id)
        open_order = order_map.get(open_deal.order) if open_deal else None

        result.append({
            "ticket":      int(d.ticket),
            "position_id": int(d.position_id),
            "symbol":      symbol,
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

    per_sym = {}
    for r in result:
        per_sym[r["symbol"]] = per_sym.get(r["symbol"], 0) + 1

    print(f"[MT5] full_history: {len(result)} closing deals "
          f"(skipped {skipped_no_symbol} empty-symbol) | {per_sym}")

    return sorted(result, key=lambda x: x["time"], reverse=True)


# ── Multi-account snapshot ────────────────────────────────────────────────────

def get_account_snapshot(credentials_list: list) -> list:
    prev    = (_session["login"], _session.get("password"), _session["server"])
    results = []
    for creds in credentials_list:
        try:
            ok = login_mt5(int(creds["login"]), creds["password"], creds["server"])
            if ok:
                results.append({"success": True, **get_account_info()})
            else:
                code, msg = mt5.last_error()
                results.append({"success": False, "login": creds["login"],
                                 "server": creds["server"], "error": f"MT5 {code}: {msg}"})
        except Exception as exc:
            results.append({"success": False, "login": creds["login"],
                             "server": creds["server"], "error": str(exc)})
    if prev[0] is not None and prev[1] is not None:
        login_mt5(prev[0], prev[1], prev[2])
    return results


# ── Debug helpers ─────────────────────────────────────────────────────────────

def get_history_symbols(days: int = 365) -> dict:
    if not ensure_connected():
        return {"error": "MT5 not connected. Log in through the website first.",
                "tip":   "Go to Account Selector → Enter Dashboard, then retry.",
                "symbols": []}

    to_date   = datetime.now() + timedelta(hours=3)
    from_date = to_date - timedelta(days=days)
    deals = mt5.history_deals_get(from_date, to_date)

    if deals is None:
        code, msg = mt5.last_error()
        return {"error": f"MT5 error {code}: {msg}", "symbols": []}

    counts:      dict = {}
    entry_types: dict = {}
    empty_sym    = 0

    for d in deals:
        if not d.symbol:
            empty_sym += 1
            continue
        s = d.symbol.strip()
        counts[s]      = counts.get(s, 0) + 1
        entry_types[s] = entry_types.get(s, set()) | {d.entry}

    acc = mt5.account_info()
    return {
        "account":             acc.login if acc else None,
        "days":                days,
        "total_deals":         len(deals),
        "deals_empty_symbol":  empty_sym,
        "symbols": [
            {
                "symbol":      s,
                "deals":       counts[s],
                "entry_types": sorted(entry_types[s]),
            }
            for s in sorted(counts)
        ],
    }


def get_symbol_deals(symbol: str, days: int = 365) -> dict:
    """All raw deals for a specific symbol (case-insensitive) plus diagnostics."""
    if not ensure_connected():
        return {"error": "MT5 not connected", "deals": []}

    to_date   = datetime.now() + timedelta(hours=3)
    from_date = to_date - timedelta(days=days)
    all_deals = mt5.history_deals_get(from_date, to_date)

    if all_deals is None:
        code, msg = mt5.last_error()
        return {"error": f"MT5 error {code}: {msg}", "deals": []}

    matched     = []
    empty_sym   = 0
    all_symbols = set()

    for d in all_deals:
        if not d.symbol:
            empty_sym += 1
        else:
            all_symbols.add(d.symbol.strip())
            if d.symbol.strip().lower() == symbol.lower():
                matched.append({
                    "ticket":  int(d.ticket),
                    "symbol":  d.symbol.strip(),
                    "entry":   d.entry,
                    "type":    d.type,
                    "volume":  float(d.volume),
                    "price":   float(d.price),
                    "profit":  float(d.profit),
                    "time":    datetime.fromtimestamp(d.time).strftime("%Y-%m-%d %H:%M:%S"),
                })

    return {
        "searched_for":       symbol,
        "days":               days,
        "total_all_deals":    len(all_deals),
        "deals_empty_symbol": empty_sym,
        "all_symbols_found":  sorted(all_symbols),
        "total_found":        len(matched),
        "deals":              matched,
        "diagnosis": (
            "SpotCrude deals exist but have empty d.symbol — fixed by position_id cross-ref in get_history_with_orders"
            if empty_sym > 0 and len(matched) == 0
            else ("SpotCrude deals found" if matched else
                  "No SpotCrude deals found in MT5 history for this period")
        ),
    }


def get_raw_deals_sample(limit: int = 30) -> dict:
    """Returns the first N raw deals exactly as MT5 returns them — for deep debugging."""
    if not ensure_connected():
        return {"error": "MT5 not connected", "deals": []}

    to_date   = datetime.now() + timedelta(hours=3)
    from_date = to_date - timedelta(days=7)       # last 7 days only
    all_deals = mt5.history_deals_get(from_date, to_date)

    if all_deals is None:
        code, msg = mt5.last_error()
        return {"error": f"MT5 error {code}: {msg}", "deals": []}

    sample = []
    for d in list(all_deals)[-limit:]:            # most recent N deals
        sample.append({
            "ticket":      int(d.ticket),
            "symbol":      repr(d.symbol),        # repr shows empty string clearly
            "entry":       d.entry,
            "type":        d.type,
            "volume":      float(d.volume),
            "price":       float(d.price),
            "profit":      float(d.profit),
            "position_id": int(d.position_id),
            "time":        datetime.fromtimestamp(d.time).strftime("%Y-%m-%d %H:%M:%S"),
        })

    return {
        "window":      "last 7 days",
        "total_deals": len(all_deals),
        "sample_size": len(sample),
        "note":        "symbol shown with repr() so empty string appears as \"\" not blank",
        "deals":       sample,
    }
