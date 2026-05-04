# Project Spec

## Goal

Build and maintain a local trading journal dashboard for small-cap ThinkorSwim trading review.

## Core Requirements

- Parse ThinkorSwim Account Statement CSV files (Cash Balance / TRD rows).
- Match executions into completed round-trip trades using FIFO logic.
- Persist trades and annotations (strategy, notes, mistake tags, rating) in local SQLite.
- Serve a browser dashboard via Flask on `http://localhost:5000`.
- Dashboard tabs: Dashboard (overview), Daily Log (trade table + journaling), Playbook (setup library), Coach (rule engine + Claude AI), Calendar (monthly P&L), Analytics (detailed stats).
- Analytics must calculate statistics from the loaded trade data and active filters.

## Current User-Facing Workflow

1. Run `run_dashboard.bat` (or `python server.py`).
2. Open `http://localhost:5000` in the browser.
3. Import a TOS account statement CSV via the Daily Log → Import CSV modal.
4. Review trades, add journal annotations (strategy, mistakes, notes, rating).
5. Use Analytics to inspect performance by stats, time, price/volume, and win/loss breakdown.

## Data Sources

- `Statements/` — TOS account statement CSV files stored locally.
- `data/journal.db` — SQLite database for trades and annotations.
- Browser `localStorage` — goals, playbook notes, starting balance, and demo/fallback trade data.

## Non-Goals

- Cloud deployment is not required.
- Live broker connectivity is not required.
- Multi-account or multi-user support is not required.
