"""
Flask Bridge Server — TOS Trading Journal
==========================================
Serves the HTML dashboard as static files AND provides REST API
endpoints that read/write from SQLite (data/journal.db).

Run:  python server.py
Then open:  http://localhost:5000
"""

import json
import sys
from pathlib import Path
from datetime import datetime

from flask import Flask, jsonify, request, send_from_directory, abort

# ── Path setup ─────────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT))

from src.db import (
    load_all_trades,
    load_annotations,
    upsert_annotation,
    get_annotation,
    upsert_trades,
    all_strategies,
    all_mistake_tags,
    add_custom_strategy,
    remove_custom_strategy,
    add_custom_mistake_tag,
    remove_custom_mistake_tag,
    trades_in_db_for_file,
    upsert_manual_trade,
    delete_trade,
    load_manual_trades,
    get_goals,
    save_goals,
    PREDEFINED_MISTAKES,
    PREDEFINED_STRATEGIES,
)
from src.parser import parse_csv, parse_csv_content
from src.matcher import merge_trades_by_day
from src.metrics import compute_metrics, compute_equity_curve, per_symbol_stats

# ── Flask app ──────────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder=str(ROOT / "dashboard"), static_url_path="")


# ── STATIC FILE ROUTES ─────────────────────────────────────────────────────────

@app.route("/")
def index():
    """Serve the main dashboard."""
    return send_from_directory(str(ROOT / "dashboard"), "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    """Serve any file inside dashboard/ folder (css, js, sections, etc.)."""
    return send_from_directory(str(ROOT / "dashboard"), filename)


# ── API: TRADES ────────────────────────────────────────────────────────────────

@app.route("/api/trades", methods=["GET"])
def get_trades():
    """
    Return all completed trades merged with their annotations.
    Query params: symbol, date_from, date_to, strategy, mistake_tag
    """
    trades_df = load_all_trades()
    if trades_df.empty:
        return jsonify([])

    ann_df = load_annotations()

    # Merge annotations onto trades
    if not ann_df.empty:
        ann_df = ann_df.set_index("trade_id")
        trades_df = trades_df.join(ann_df, on="trade_id", how="left")

    # Fill missing annotation fields
    for col, default in [("strategy", ""), ("notes", ""), ("mistake_tags", "[]"), ("rating", 0)]:
        if col not in trades_df.columns:
            trades_df[col] = default
        else:
            trades_df[col] = trades_df[col].fillna(default)

    # Apply filters from query string
    sym = request.args.get("symbol")
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    strategy = request.args.get("strategy")
    mistake = request.args.get("mistake_tag")

    if sym:
        trades_df = trades_df[trades_df["symbol"] == sym.upper()]
    if date_from:
        trades_df = trades_df[trades_df["first_entry_dt"] >= date_from]
    if date_to:
        trades_df = trades_df[trades_df["first_entry_dt"] <= date_to]
    if strategy:
        trades_df = trades_df[trades_df["strategy"] == strategy]
    if mistake:
        trades_df = trades_df[trades_df["mistake_tags"].str.contains(mistake, na=False)]

    # Convert datetime columns to strings for JSON
    for col in ["first_entry_dt", "last_exit_dt", "first_exit_dt", "last_entry_dt"]:
        if col in trades_df.columns:
            trades_df[col] = trades_df[col].astype(str)

    records = trades_df.to_dict(orient="records")

    # Parse mistake_tags JSON string → list in each record
    for r in records:
        try:
            if isinstance(r.get("mistake_tags"), str):
                r["mistake_tags"] = json.loads(r["mistake_tags"])
        except Exception:
            r["mistake_tags"] = []

    return jsonify(records)


# ── API: METRICS ───────────────────────────────────────────────────────────────

@app.route("/api/metrics", methods=["GET"])
def get_metrics():
    """Return computed performance metrics for all (or filtered) trades."""
    trades_df = load_all_trades()
    if trades_df.empty:
        return jsonify({
            "total_trades": 0, "win_rate": 0, "total_pnl": 0,
            "profit_factor": 0, "expectancy": 0, "max_drawdown": 0,
            "sharpe": 0, "sortino": 0
        })

    metrics = compute_metrics(trades_df)

    # Convert any numpy types → plain Python for JSON
    clean = {}
    for k, v in metrics.items():
        if hasattr(v, "item"):
            clean[k] = v.item()
        elif v != v:  # NaN check
            clean[k] = None
        else:
            clean[k] = v

    return jsonify(clean)


@app.route("/api/equity-curve", methods=["GET"])
def get_equity_curve():
    """Return equity curve data as [{date, cumulative_pnl, pnl}]."""
    trades_df = load_all_trades()
    if trades_df.empty:
        return jsonify([])

    try:
        curve = compute_equity_curve(trades_df)
        return jsonify(curve.to_dict(orient="records"))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/symbols", methods=["GET"])
def get_symbols():
    """Return sorted list of all traded symbols."""
    trades_df = load_all_trades()
    if trades_df.empty:
        return jsonify([])
    return jsonify(sorted(trades_df["symbol"].unique().tolist()))


@app.route("/api/per-symbol", methods=["GET"])
def get_per_symbol():
    """Return per-symbol stats table."""
    trades_df = load_all_trades()
    if trades_df.empty:
        return jsonify([])
    try:
        stats = per_symbol_stats(trades_df)
        return jsonify(stats.to_dict(orient="records"))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── API: ANNOTATIONS ───────────────────────────────────────────────────────────

@app.route("/api/annotations/<trade_id>", methods=["GET"])
def get_annotation_route(trade_id):
    """Return annotation for a specific trade."""
    return jsonify(get_annotation(trade_id))


@app.route("/api/annotations/<trade_id>", methods=["POST"])
def save_annotation(trade_id):
    """
    Save/update annotation for a trade.
    Body JSON: { strategy, notes, mistake_tags: [], rating }
    """
    data = request.get_json(force=True)
    if not data:
        abort(400, "JSON body required")

    upsert_annotation(
        trade_id=trade_id,
        strategy=data.get("strategy", ""),
        notes=data.get("notes", ""),
        mistake_tags=data.get("mistake_tags", []),
        rating=int(data.get("rating", 0)),
    )
    return jsonify({"ok": True, "trade_id": trade_id})


# ── API: STRATEGIES & TAGS ─────────────────────────────────────────────────────

@app.route("/api/strategies", methods=["GET"])
def get_strategies():
    return jsonify(all_strategies())


@app.route("/api/strategies", methods=["POST"])
def add_strategy():
    data = request.get_json(force=True)
    name = (data or {}).get("name", "").strip()
    if not name:
        abort(400, "name required")
    add_custom_strategy(name)
    return jsonify({"ok": True, "strategies": all_strategies()})


@app.route("/api/strategies/<name>", methods=["DELETE"])
def delete_strategy(name):
    if name in PREDEFINED_STRATEGIES:
        abort(400, "Cannot delete a predefined strategy")
    remove_custom_strategy(name)
    return jsonify({"ok": True, "strategies": all_strategies()})


@app.route("/api/mistake-tags", methods=["GET"])
def get_mistake_tags():
    return jsonify(all_mistake_tags())


@app.route("/api/mistake-tags", methods=["POST"])
def add_mistake_tag():
    data = request.get_json(force=True)
    name = (data or {}).get("name", "").strip()
    if not name:
        abort(400, "name required")
    add_custom_mistake_tag(name)
    return jsonify({"ok": True, "tags": all_mistake_tags()})


@app.route("/api/mistake-tags/<name>", methods=["DELETE"])
def delete_mistake_tag(name):
    if name in PREDEFINED_MISTAKES:
        abort(400, "Cannot delete a predefined tag")
    remove_custom_mistake_tag(name)
    return jsonify({"ok": True, "tags": all_mistake_tags()})


# ── API: UPLOAD CSV ────────────────────────────────────────────────────────────

@app.route("/api/upload", methods=["POST"])
def upload_csv():
    """
    Upload a TOS account statement CSV.
    Accepts multipart/form-data with field 'csv', OR raw text body.
    Returns: { trades_found, new_trades, already_in_db, errors }
    """
    errors = []
    filename = ""

    if request.files.get("csv"):
        f = request.files["csv"]
        filename = f.filename or ""
        content = f.read().decode("utf-8", errors="replace")
    elif request.data:
        content = request.data.decode("utf-8", errors="replace")
        filename = request.headers.get("X-Filename", "")
    else:
        abort(400, "No CSV data received")

    try:
        executions_df, parse_warnings = parse_csv_content(content, filename=filename)
        errors.extend(parse_warnings)
    except Exception as e:
        return jsonify({"error": f"Parse failed: {e}"}), 422

    if executions_df.empty:
        return jsonify({"trades_found": 0, "new_trades": 0, "already_in_db": 0, "errors": errors or ["No executions found in CSV"]}), 200

    try:
        trades_df, match_warnings = merge_trades_by_day(executions_df)
        errors.extend(match_warnings)
    except Exception as e:
        return jsonify({"error": f"Match failed: {e}"}), 422

    # Determine file_date and which trades are new
    file_date = str(executions_df["file_date"].iloc[0]) if "file_date" in executions_df.columns else "unknown"
    existing_ids = trades_in_db_for_file(file_date)
    new_count = sum(1 for tid in trades_df["trade_id"] if tid not in existing_ids)
    already_count = len(trades_df) - new_count

    upsert_trades(trades_df)

    return jsonify({
        "trades_found": len(trades_df),
        "new_trades": new_count,
        "already_in_db": already_count,
        "file_date": file_date,
        "errors": errors,
    })


# ── API: MANUAL TRADES ────────────────────────────────────────────────────────

@app.route("/api/trades/manual", methods=["GET"])
def get_manual_trades():
    """Return all manually-entered trades."""
    return jsonify(load_manual_trades())


@app.route("/api/trades/manual", methods=["POST"])
def create_manual_trade():
    """
    Create or update a manually-entered trade.
    Body JSON must include 'id' and 'date' fields plus all trade data.
    """
    data = request.get_json(force=True)
    if not data:
        abort(400, "JSON body required")
    trade_id = data.get("id")
    date = data.get("date", "")
    if not trade_id:
        abort(400, "id required")
    upsert_manual_trade(trade_id, date, data)
    return jsonify({"ok": True, "id": trade_id})


@app.route("/api/trades/<trade_id>", methods=["DELETE"])
def delete_trade_route(trade_id):
    """Delete a trade by ID (works for both imported and manual trades)."""
    delete_trade(trade_id)
    return jsonify({"ok": True, "id": trade_id})


@app.route("/api/trades/bulk-delete", methods=["POST"])
def bulk_delete_trades():
    """
    Delete multiple trades.
    Body JSON: { "ids": ["id1", "id2", ...] }
    """
    data = request.get_json(force=True)
    ids = (data or {}).get("ids", [])
    for tid in ids:
        delete_trade(tid)
    return jsonify({"ok": True, "deleted": len(ids)})


# ── API: GOALS ────────────────────────────────────────────────────────────────

@app.route("/api/goals", methods=["GET"])
def get_goals_route():
    """Return current goal targets."""
    return jsonify(get_goals())


@app.route("/api/goals", methods=["POST"])
def save_goals_route():
    """
    Save goal targets.
    Body JSON: { daily, weekly, monthly, yearly }
    """
    data = request.get_json(force=True)
    if not data:
        abort(400, "JSON body required")
    save_goals(
        daily=float(data.get("daily", 600)),
        weekly=float(data.get("weekly", 3000)),
        monthly=float(data.get("monthly", 12000)),
        yearly=float(data.get("yearly", 150000)),
    )
    return jsonify({"ok": True, "goals": get_goals()})


# ── API: HEALTH CHECK ──────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    trades_df = load_all_trades()
    return jsonify({
        "status": "ok",
        "total_trades_in_db": len(trades_df),
        "db_path": str(ROOT / "data" / "journal.db"),
        "dashboard_path": str(ROOT / "dashboard"),
        "server_time": datetime.utcnow().isoformat(),
    })


# ── ENTRY POINT ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV") != "production"
    print("\n" + "="*60)
    print("  TOS Trading Journal — Flask Bridge Server")
    print("="*60)
    print(f"  Dashboard:  http://localhost:{port}")
    print(f"  API health: http://localhost:{port}/api/health")
    print(f"  DB path:    {ROOT / 'data' / 'journal.db'}")
    print("="*60 + "\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
