def calculate_analytics(trades, history):
    open_profit = sum(t["profit"] for t in trades)

    # Only count actual closing deals for win/loss analytics.
    # entry == 0 are opening deals and balance operations — they have profit=0
    # and inflate trade counts, distorting win-rate.
    closed = [h for h in history if h.get("entry", 1) != 0 and h.get("symbol")]

    closed_profit = sum(h["profit"] for h in closed)
    wins = [h for h in closed if h["profit"] > 0]

    win_rate   = (len(wins) / len(closed) * 100) if closed else 0
    avg_profit = (closed_profit / len(closed))    if closed else 0

    return {
        "open_profit":   open_profit,
        "closed_profit": closed_profit,
        "win_rate":      round(win_rate,   2),
        "avg_profit":    round(avg_profit, 2),
        "total_trades":  len(closed),
    }
