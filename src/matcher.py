import hashlib
import json
from collections import defaultdict, deque

import pandas as pd


def _trade_id(file_date: str, ref_ids: list) -> str:
    key = file_date + "|" + "|".join(sorted(str(r) for r in ref_ids))
    return hashlib.sha256(key.encode()).hexdigest()[:16]


def match_trades(execs: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """
    FIFO round-trip matching: executions -> completed trades.
    Returns (trades_df, warnings).
    """
    warnings = []
    if execs.empty:
        return pd.DataFrame(), warnings

    # Pre-group split fills: same ref_id -> combine qty, keep first datetime
    grouped = (
        execs.groupby(["ref_id", "side", "symbol", "file_date"])
        .agg(qty=("qty", "sum"), price=("price", "mean"), datetime=("datetime", "first"), amount=("amount", "sum"))
        .reset_index()
    )
    grouped.sort_values("datetime", inplace=True)

    # FIFO matching per symbol
    # open_lots[symbol] = deque of dicts {qty, price, datetime, ref_id, amount}
    open_lots: dict[str, deque] = defaultdict(deque)
    # current_entry_lots[symbol] = list of entry lot dicts accumulated since last zero
    current_entry_lots: dict[str, list] = defaultdict(list)
    # current_exit_lots[symbol] = list of ALL exit executions accumulated since last zero
    # (partial sells are tracked here so multi-leg exits get correct P&L)
    current_exit_lots: dict[str, list] = defaultdict(list)
    trades = []

    for _, row in grouped.iterrows():
        sym = row["symbol"]
        side = row["side"]
        qty = int(row["qty"])
        price = float(row["price"])
        dt = row["datetime"]
        ref_id = row["ref_id"]
        amount = float(row["amount"])
        file_date = row["file_date"]

        if side == "BOT":
            open_lots[sym].append({"qty": qty, "price": price, "datetime": dt, "ref_id": ref_id, "amount": amount})
            current_entry_lots[sym].append({"qty": qty, "price": price, "datetime": dt, "ref_id": ref_id})

        elif side == "SOLD":
            remaining_sell = qty
            # Track how many shares from this sell execution actually matched open lots
            matched_qty = 0

            while remaining_sell > 0 and open_lots[sym]:
                lot = open_lots[sym][0]
                if lot["qty"] <= remaining_sell:
                    remaining_sell -= lot["qty"]
                    matched_qty += lot["qty"]
                    open_lots[sym].popleft()
                else:
                    lot["qty"] -= remaining_sell
                    matched_qty += remaining_sell
                    remaining_sell = 0

            if remaining_sell > 0:
                warnings.append(f"Oversell on {sym}: {remaining_sell} shares sold without matching buy (possible open from prior session)")

            # Record only the matched portion of this sell into exit lots
            if matched_qty > 0:
                current_exit_lots[sym].append({"qty": matched_qty, "price": price, "datetime": dt, "ref_id": ref_id})

            if not open_lots[sym]:
                # Position closed to zero — emit trade
                entry_lots = current_entry_lots[sym][:]
                exit_lots = current_exit_lots[sym][:]
                current_entry_lots[sym].clear()
                current_exit_lots[sym].clear()

                if not entry_lots or not exit_lots:
                    continue

                all_ref_ids = [l["ref_id"] for l in entry_lots] + [l["ref_id"] for l in exit_lots]
                tid = _trade_id(file_date, all_ref_ids)

                total_entry_qty = sum(l["qty"] for l in entry_lots)
                total_exit_qty  = sum(l["qty"] for l in exit_lots)
                total_cost      = sum(l["qty"] * l["price"] for l in entry_lots)
                total_proceeds  = sum(l["qty"] * l["price"] for l in exit_lots)

                # avg prices weighted by actual qty transacted
                avg_entry = total_cost / total_entry_qty if total_entry_qty else 0
                avg_exit  = total_proceeds / total_exit_qty if total_exit_qty else 0
                gross_pnl = total_proceeds - total_cost

                entry_dts = [l["datetime"] for l in entry_lots]
                exit_dts  = [l["datetime"] for l in exit_lots]
                first_entry_dt = min(entry_dts)
                last_entry_dt  = max(entry_dts)
                first_exit_dt  = min(exit_dts)
                last_exit_dt   = max(exit_dts)
                hold_seconds = int((last_exit_dt - first_entry_dt).total_seconds())

                h = hold_seconds // 3600
                m = (hold_seconds % 3600) // 60
                s = hold_seconds % 60
                hold_display = f"{h:02d}:{m:02d}:{s:02d}"

                trades.append({
                    "trade_id": tid,
                    "file_date": file_date,
                    "symbol": sym,
                    "first_entry_dt": first_entry_dt,
                    "last_entry_dt": last_entry_dt,
                    "first_exit_dt": first_exit_dt,
                    "last_exit_dt": last_exit_dt,
                    "avg_entry_price": round(avg_entry, 6),
                    "avg_exit_price":  round(avg_exit, 6),
                    "total_qty": total_entry_qty,
                    "gross_pnl": round(gross_pnl, 4),
                    "hold_seconds": hold_seconds,
                    "hold_display": hold_display,
                    "entry_lots": json.dumps([{**l, "datetime": l["datetime"].isoformat()} for l in entry_lots]),
                    "exit_lots":  json.dumps([{**l, "datetime": l["datetime"].isoformat()} for l in exit_lots]),
                })

    # Warn about open positions
    for sym, q in open_lots.items():
        if q:
            remaining = sum(l["qty"] for l in q)
            warnings.append(f"Open position at EOD: {sym} {remaining} shares (partial or unclosed trade)")

    if not trades:
        return pd.DataFrame(), warnings

    df = pd.DataFrame(trades)
    df["first_entry_dt"] = pd.to_datetime(df["first_entry_dt"])
    df["last_exit_dt"] = pd.to_datetime(df["last_exit_dt"])
    df.sort_values("first_entry_dt", inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df, warnings


def merge_trades_by_day(execs: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """
    Day-merge matching: all buys and sells for a symbol on the same calendar day
    are combined into a single trade record (Tradervue 'merge when possible' style).

    Cross-day positions (bought one day, sold another) are matched chronologically
    using a simple carry-forward of the open qty and weighted-average cost basis.

    Returns (trades_df, warnings).
    """
    if execs.empty:
        return pd.DataFrame(), []

    warnings = []
    execs = execs.copy()
    execs["date"] = execs["datetime"].dt.date

    # For cross-day positions we need to track carry-forward state per symbol
    # open_qty[sym] = total open shares still held
    # open_cost[sym] = total cost basis of open shares
    # open_since[sym] = datetime of first open for this carry-forward block
    open_qty: dict[str, int] = {}
    open_cost: dict[str, float] = {}
    open_entry_lots: dict[str, list] = {}   # accumulated entry lots not yet matched
    open_since: dict[str, object] = {}

    trades = []

    # Process day by day, symbol by symbol in chronological order
    days = sorted(execs["date"].unique())
    for day in days:
        day_execs = execs[execs["date"] == day]
        for sym in day_execs["symbol"].unique():
            sym_execs = day_execs[day_execs["symbol"] == sym].sort_values("datetime")
            file_date = sym_execs["file_date"].iloc[0]

            day_bought = sym_execs[sym_execs["side"] == "BOT"]
            day_sold   = sym_execs[sym_execs["side"] == "SOLD"]

            day_buy_qty  = int(day_bought["qty"].sum())
            day_sell_qty = int(day_sold["qty"].sum())

            # Accumulate buys into open position
            if day_buy_qty > 0:
                prev_qty  = open_qty.get(sym, 0)
                prev_cost = open_cost.get(sym, 0.0)
                new_cost  = float((day_bought["qty"] * day_bought["price"]).sum())
                open_qty[sym]  = prev_qty + day_buy_qty
                open_cost[sym] = prev_cost + new_cost
                if sym not in open_entry_lots:
                    open_entry_lots[sym] = []
                    open_since[sym] = day_bought["datetime"].min()
                for _, r in day_bought.iterrows():
                    open_entry_lots[sym].append({
                        "qty": int(r["qty"]), "price": float(r["price"]),
                        "datetime": r["datetime"].isoformat(), "ref_id": r["ref_id"],
                    })

            # Match sells against open position
            if day_sell_qty > 0 and open_qty.get(sym, 0) > 0:
                total_sell_proceeds = float((day_sold["qty"] * day_sold["price"]).sum())
                matched = min(day_sell_qty, open_qty[sym])
                avg_buy  = open_cost[sym] / open_qty[sym] if open_qty[sym] else 0
                avg_sell = total_sell_proceeds / day_sell_qty if day_sell_qty else 0

                # P&L on the matched portion
                gross_pnl = (avg_sell - avg_buy) * matched

                exit_lots = [
                    {"qty": int(r["qty"]), "price": float(r["price"]),
                     "datetime": r["datetime"].isoformat(), "ref_id": r["ref_id"]}
                    for _, r in day_sold.iterrows()
                ]

                # Trade spans from first open entry to last exit today
                first_entry_dt = open_since[sym]
                last_entry_dt  = max(l["datetime"] for l in open_entry_lots[sym])
                if not isinstance(last_entry_dt, object.__class__):
                    last_entry_dt = pd.Timestamp(last_entry_dt)
                first_exit_dt  = day_sold["datetime"].min()
                last_exit_dt   = day_sold["datetime"].max()

                hold_seconds = int((last_exit_dt - (first_entry_dt if hasattr(first_entry_dt, 'total_seconds') else pd.Timestamp(first_entry_dt))).total_seconds())
                h = hold_seconds // 3600
                m_part = (hold_seconds % 3600) // 60
                s_part = hold_seconds % 60
                hold_display = f"{h:02d}:{m_part:02d}:{s_part:02d}"

                all_ref_ids = [l["ref_id"] for l in open_entry_lots[sym]] + [l["ref_id"] for _, l in day_sold.iterrows()]
                tid = _trade_id(file_date, all_ref_ids)

                trades.append({
                    "trade_id": tid,
                    "file_date": file_date,
                    "symbol": sym,
                    "first_entry_dt": first_entry_dt,
                    "last_entry_dt":  pd.Timestamp(last_entry_dt) if isinstance(last_entry_dt, str) else last_entry_dt,
                    "first_exit_dt":  first_exit_dt,
                    "last_exit_dt":   last_exit_dt,
                    "avg_entry_price": round(avg_buy, 6),
                    "avg_exit_price":  round(avg_sell, 6),
                    "total_qty": matched,
                    "gross_pnl": round(gross_pnl, 4),
                    "hold_seconds": hold_seconds,
                    "hold_display": hold_display,
                    "entry_lots": json.dumps(open_entry_lots[sym]),
                    "exit_lots":  json.dumps(exit_lots),
                })

                # Update carry-forward state
                open_qty[sym]  -= matched
                if open_qty[sym] <= 0:
                    open_qty.pop(sym, None)
                    open_cost.pop(sym, None)
                    open_entry_lots.pop(sym, None)
                    open_since.pop(sym, None)
                else:
                    # Reduce cost basis proportionally
                    open_cost[sym] = avg_buy * open_qty[sym]

            elif day_sell_qty > 0:
                warnings.append(f"Oversell on {sym} {day}: sold {day_sell_qty} with no open position")

    # Any remaining open positions
    for sym, qty in open_qty.items():
        if qty > 0:
            warnings.append(f"Open position at statement end: {sym} {qty} shares unmatched")

    if not trades:
        return pd.DataFrame(), warnings

    df = pd.DataFrame(trades)
    df["first_entry_dt"] = pd.to_datetime(df["first_entry_dt"])
    df["last_exit_dt"]   = pd.to_datetime(df["last_exit_dt"])
    df.sort_values("first_entry_dt", inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df, warnings
