from math import sqrt
import pandas as pd
import numpy as np
from itertools import groupby


def compute_metrics(trades_df: pd.DataFrame) -> dict:
    if trades_df.empty:
        return _empty_metrics()

    df = trades_df.copy()
    df["first_entry_dt"] = pd.to_datetime(df["first_entry_dt"])

    winners = df[df["gross_pnl"] > 0]
    losers = df[df["gross_pnl"] < 0]
    breakeven = df[df["gross_pnl"] == 0]

    total_trades = len(df)
    win_count = len(winners)
    loss_count = len(losers)
    win_rate = win_count / total_trades if total_trades else 0

    gross_profit = winners["gross_pnl"].sum() if not winners.empty else 0
    gross_loss = abs(losers["gross_pnl"].sum()) if not losers.empty else 0
    profit_factor = gross_profit / gross_loss if gross_loss > 0 else float("inf")
    expectancy = df["gross_pnl"].mean()
    total_pnl = df["gross_pnl"].sum()

    # Equity curve & drawdown
    equity = df["gross_pnl"].cumsum()
    running_max = equity.cummax()
    drawdown = equity - running_max
    max_drawdown = drawdown.min()

    # Daily P/L for Sharpe/Sortino
    df["trade_date"] = df["first_entry_dt"].dt.date
    daily_pnl = df.groupby("trade_date")["gross_pnl"].sum()
    daily_std = daily_pnl.std()
    sharpe = (daily_pnl.mean() / daily_std * sqrt(252)) if daily_std and daily_std > 0 else 0
    downside = daily_pnl[daily_pnl < 0]
    downside_std = downside.std()
    sortino = (daily_pnl.mean() / downside_std * sqrt(252)) if downside_std and downside_std > 0 else 0

    # Hold times
    avg_hold_win = winners["hold_seconds"].mean() if not winners.empty else 0
    avg_hold_loss = losers["hold_seconds"].mean() if not losers.empty else 0
    avg_hold_all = df["hold_seconds"].mean()

    # Streaks
    signs = [1 if p > 0 else -1 for p in df["gross_pnl"]]
    current_streak, max_win_streak, max_loss_streak = _compute_streaks(signs)

    # Best / worst
    best_trade = df["gross_pnl"].max()
    worst_trade = df["gross_pnl"].min()
    avg_win = winners["gross_pnl"].mean() if not winners.empty else 0
    avg_loss = losers["gross_pnl"].mean() if not losers.empty else 0

    return {
        "total_trades": total_trades,
        "win_count": win_count,
        "loss_count": loss_count,
        "breakeven_count": len(breakeven),
        "win_rate": win_rate,
        "profit_factor": profit_factor,
        "expectancy": expectancy,
        "total_pnl": total_pnl,
        "gross_profit": gross_profit,
        "gross_loss": gross_loss,
        "max_drawdown": max_drawdown,
        "sharpe": sharpe,
        "sortino": sortino,
        "avg_hold_win": avg_hold_win,
        "avg_hold_loss": avg_hold_loss,
        "avg_hold_all": avg_hold_all,
        "current_streak": current_streak,
        "max_win_streak": max_win_streak,
        "max_loss_streak": max_loss_streak,
        "best_trade": best_trade,
        "worst_trade": worst_trade,
        "avg_win": avg_win,
        "avg_loss": avg_loss,
    }


def _compute_streaks(signs: list) -> tuple[int, int, int]:
    if not signs:
        return 0, 0, 0

    max_win = max_loss = 0
    for val, group in groupby(signs):
        length = len(list(group))
        if val == 1:
            max_win = max(max_win, length)
        else:
            max_loss = max(max_loss, length)

    # Current streak
    current = signs[-1]
    streak = 0
    for s in reversed(signs):
        if s == current:
            streak += 1
        else:
            break
    current_streak = streak if current == 1 else -streak
    return current_streak, max_win, max_loss


def compute_equity_curve(trades_df: pd.DataFrame) -> pd.DataFrame:
    df = trades_df.copy()
    df["first_entry_dt"] = pd.to_datetime(df["first_entry_dt"])
    df.sort_values("first_entry_dt", inplace=True)
    df["equity"] = df["gross_pnl"].cumsum()
    df["running_max"] = df["equity"].cummax()
    df["drawdown"] = df["equity"] - df["running_max"]
    return df[["first_entry_dt", "gross_pnl", "equity", "drawdown"]]


def compute_heatmap_data(trades_df: pd.DataFrame) -> pd.DataFrame:
    df = trades_df.copy()
    df["first_entry_dt"] = pd.to_datetime(df["first_entry_dt"])
    df["hour"] = df["first_entry_dt"].dt.hour
    df["dow"] = df["first_entry_dt"].dt.day_name()
    pivot = df.pivot_table(values="gross_pnl", index="hour", columns="dow", aggfunc="mean")
    ordered = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    cols = [c for c in ordered if c in pivot.columns]
    return pivot[cols]


def per_symbol_stats(trades_df: pd.DataFrame) -> pd.DataFrame:
    if trades_df.empty:
        return pd.DataFrame()
    df = trades_df.copy()
    rows = []
    for sym, g in df.groupby("symbol"):
        w = g[g["gross_pnl"] > 0]
        l = g[g["gross_pnl"] < 0]
        rows.append({
            "Symbol": sym,
            "Trades": len(g),
            "Win Rate": len(w) / len(g) if len(g) else 0,
            "Total P/L": g["gross_pnl"].sum(),
            "Avg P/L": g["gross_pnl"].mean(),
            "Avg Hold (s)": g["hold_seconds"].mean(),
            "Best Trade": g["gross_pnl"].max(),
            "Worst Trade": g["gross_pnl"].min(),
        })
    return pd.DataFrame(rows).sort_values("Total P/L", ascending=False)


def _empty_metrics() -> dict:
    return {k: 0 for k in [
        "total_trades", "win_count", "loss_count", "breakeven_count",
        "win_rate", "profit_factor", "expectancy", "total_pnl",
        "gross_profit", "gross_loss", "max_drawdown", "sharpe", "sortino",
        "avg_hold_win", "avg_hold_loss", "avg_hold_all",
        "current_streak", "max_win_streak", "max_loss_streak",
        "best_trade", "worst_trade", "avg_win", "avg_loss",
    ]}
