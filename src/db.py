import sqlite3
import json
from pathlib import Path
from datetime import datetime

import pandas as pd

DB_PATH = Path(__file__).parent.parent / "data" / "journal.db"

PREDEFINED_MISTAKES = [
    "FOMO",
    "Ignored Stop",
    "Revenge Trade",
    "Oversize",
    "Rushed Entry",
    "Cut Too Early",
    "Held Too Long",
    "No Plan",
    "Chased Exit",
    "Bad Conditions",
]

PREDEFINED_STRATEGIES = [
    "Gap and Go",
    "VWAP Reclaim",
    "Morning Breakout",
    "Panic Dip Buy",
    "Momentum Scalp",
    "SSR Bounce",
    "Level 2 Read",
    "Other",
]


def get_conn():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    _ensure_schema(conn)
    return conn


def _ensure_schema(conn):
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS trades (
            trade_id        TEXT PRIMARY KEY,
            file_date       TEXT NOT NULL,
            symbol          TEXT NOT NULL,
            first_entry_dt  TEXT,
            last_entry_dt   TEXT,
            first_exit_dt   TEXT,
            last_exit_dt    TEXT,
            avg_entry_price REAL,
            avg_exit_price  REAL,
            total_qty       INTEGER,
            gross_pnl       REAL,
            hold_seconds    INTEGER,
            hold_display    TEXT,
            entry_lots      TEXT,
            exit_lots       TEXT
        );

        CREATE TABLE IF NOT EXISTS annotations (
            trade_id      TEXT PRIMARY KEY REFERENCES trades(trade_id),
            strategy      TEXT DEFAULT '',
            notes         TEXT DEFAULT '',
            mistake_tags  TEXT DEFAULT '[]',
            rating        INTEGER DEFAULT 0,
            updated_at    TEXT
        );

        CREATE TABLE IF NOT EXISTS custom_strategies (
            name TEXT PRIMARY KEY
        );

        CREATE TABLE IF NOT EXISTS custom_mistake_tags (
            name TEXT PRIMARY KEY
        );

        CREATE TABLE IF NOT EXISTS manual_trades (
            id         TEXT PRIMARY KEY,
            date       TEXT NOT NULL,
            data       TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS goals (
            key   TEXT PRIMARY KEY,
            value REAL NOT NULL
        );
    """)
    conn.commit()


def upsert_trades(trades_df):
    if trades_df.empty:
        return
    conn = get_conn()
    cur = conn.cursor()
    for _, row in trades_df.iterrows():
        cur.execute("""
            INSERT OR REPLACE INTO trades
            (trade_id, file_date, symbol, first_entry_dt, last_entry_dt,
             first_exit_dt, last_exit_dt, avg_entry_price, avg_exit_price,
             total_qty, gross_pnl, hold_seconds, hold_display, entry_lots, exit_lots)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            row["trade_id"], row["file_date"], row["symbol"],
            str(row["first_entry_dt"]), str(row.get("last_entry_dt", "")),
            str(row.get("first_exit_dt", "")), str(row["last_exit_dt"]),
            float(row["avg_entry_price"]), float(row["avg_exit_price"]),
            int(row["total_qty"]), float(row["gross_pnl"]),
            int(row["hold_seconds"]), row["hold_display"],
            row.get("entry_lots", "[]"), row.get("exit_lots", "[]"),
        ))
    conn.commit()
    conn.close()


def load_all_trades():
    conn = get_conn()
    df = pd.read_sql("SELECT * FROM trades ORDER BY first_entry_dt", conn)
    conn.close()
    if df.empty:
        return df
    df["first_entry_dt"] = pd.to_datetime(df["first_entry_dt"])
    df["last_exit_dt"] = pd.to_datetime(df["last_exit_dt"])
    return df


def load_annotations():
    conn = get_conn()
    df = pd.read_sql("SELECT * FROM annotations", conn)
    conn.close()
    return df


def upsert_annotation(trade_id, strategy, notes, mistake_tags, rating):
    conn = get_conn()
    conn.execute("""
        INSERT INTO annotations (trade_id, strategy, notes, mistake_tags, rating, updated_at)
        VALUES (?,?,?,?,?,?)
        ON CONFLICT(trade_id) DO UPDATE SET
            strategy=excluded.strategy,
            notes=excluded.notes,
            mistake_tags=excluded.mistake_tags,
            rating=excluded.rating,
            updated_at=excluded.updated_at
    """, (trade_id, strategy, notes, json.dumps(mistake_tags), rating, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()


def get_annotation(trade_id):
    conn = get_conn()
    row = conn.execute("SELECT * FROM annotations WHERE trade_id=?", (trade_id,)).fetchone()
    conn.close()
    if row:
        d = dict(row)
        d["mistake_tags"] = json.loads(d.get("mistake_tags") or "[]")
        return d
    return {"trade_id": trade_id, "strategy": "", "notes": "", "mistake_tags": [], "rating": 0}


def add_custom_strategy(name):
    conn = get_conn()
    conn.execute("INSERT OR IGNORE INTO custom_strategies (name) VALUES (?)", (name,))
    conn.commit()
    conn.close()


def remove_custom_strategy(name):
    conn = get_conn()
    conn.execute("DELETE FROM custom_strategies WHERE name=?", (name,))
    conn.commit()
    conn.close()


def get_custom_strategies():
    conn = get_conn()
    rows = conn.execute("SELECT name FROM custom_strategies ORDER BY name").fetchall()
    conn.close()
    return [r["name"] for r in rows]


def add_custom_mistake_tag(name):
    conn = get_conn()
    conn.execute("INSERT OR IGNORE INTO custom_mistake_tags (name) VALUES (?)", (name,))
    conn.commit()
    conn.close()


def remove_custom_mistake_tag(name):
    conn = get_conn()
    conn.execute("DELETE FROM custom_mistake_tags WHERE name=?", (name,))
    conn.commit()
    conn.close()


def get_custom_mistake_tags():
    conn = get_conn()
    rows = conn.execute("SELECT name FROM custom_mistake_tags ORDER BY name").fetchall()
    conn.close()
    return [r["name"] for r in rows]


def all_strategies():
    return PREDEFINED_STRATEGIES + get_custom_strategies()


def all_mistake_tags():
    return PREDEFINED_MISTAKES + get_custom_mistake_tags()


def trades_in_db_for_file(file_date):
    conn = get_conn()
    rows = conn.execute("SELECT trade_id FROM trades WHERE file_date=?", (file_date,)).fetchall()
    conn.close()
    return {r["trade_id"] for r in rows}


def get_goals():
    defaults = {"daily": 600, "weekly": 3000, "monthly": 12000, "yearly": 150000}
    conn = get_conn()
    rows = conn.execute("SELECT key, value FROM goals").fetchall()
    conn.close()
    result = dict(defaults)
    for r in rows:
        result[r["key"]] = r["value"]
    return result


def save_goals(daily, weekly, monthly, yearly):
    conn = get_conn()
    for key, val in [("daily", daily), ("weekly", weekly), ("monthly", monthly), ("yearly", yearly)]:
        conn.execute(
            "INSERT OR REPLACE INTO goals (key, value) VALUES (?, ?)",
            (key, val)
        )
    conn.commit()
    conn.close()


def upsert_manual_trade(trade_id, date, data):
    conn = get_conn()
    conn.execute(
        "INSERT OR REPLACE INTO manual_trades (id, date, data) VALUES (?,?,?)",
        (trade_id, date, json.dumps(data))
    )
    conn.commit()
    conn.close()


def delete_trade(trade_id):
    conn = get_conn()
    conn.execute("DELETE FROM trades WHERE trade_id=?", (trade_id,))
    conn.execute("DELETE FROM manual_trades WHERE id=?", (trade_id,))
    conn.execute("DELETE FROM annotations WHERE trade_id=?", (trade_id,))
    conn.commit()
    conn.close()


def load_manual_trades():
    conn = get_conn()
    rows = conn.execute("SELECT id, date, data FROM manual_trades ORDER BY date").fetchall()
    conn.close()
    result = []
    for r in rows:
        try:
            d = json.loads(r["data"])
            d["id"] = r["id"]
            result.append(d)
        except Exception:
            pass
    return result
