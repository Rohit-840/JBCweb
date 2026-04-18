def calculate_analytics(trades, history):
    total_profit = sum(t["profit"] for t in trades)
    closed_profit = sum(h["profit"] for h in history)

    win_trades = [h for h in history if h["profit"] > 0]
    loss_trades = [h for h in history if h["profit"] < 0]

    win_rate = (len(win_trades) / len(history) * 100) if history else 0

    avg_profit = (closed_profit / len(history)) if history else 0

    return {
        "open_profit": total_profit,
        "closed_profit": closed_profit,
        "win_rate": round(win_rate, 2),
        "avg_profit": round(avg_profit, 2),
        "total_trades": len(history)
    }