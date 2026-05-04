# Architecture

## Overview

Local Flask-backed trading journal with a static HTML/CSS/JavaScript dashboard. The backend parses broker CSVs, stores trades in SQLite, and exposes a REST API. The frontend fetches from the API and renders all UI client-side.

---

## Backend (`server.py` + `src/`)

| File              | Role                                                                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `server.py`       | Flask server on port 5000. Serves `dashboard/` as static files and exposes all REST API routes.                                                                                                              |
| `src/parser.py`   | Reads a TOS Account Statement CSV, finds the Cash Balance section, extracts TRD rows, and returns a DataFrame of executions (`ref_id`, `datetime`, `side`, `qty`, `symbol`, `price`, `amount`, `file_date`). |
| `src/matcher.py`  | FIFO round-trip matching: takes executions DataFrame -> returns completed trades DataFrame. Each trade contains entry/exit lots, average prices, hold time, gross P&L, and a deterministic `trade_id` hash.   |
| `src/db.py`       | SQLite interface (`data/journal.db`). Tables: `trades`, `annotations`, `custom_strategies`, `custom_mistake_tags`. Provides upsert, load, and annotation CRUD functions.                                     |
| `src/metrics.py`  | Computes aggregate performance metrics (win rate, profit factor, drawdown, Sharpe, Sortino, streaks, per-symbol stats) from a trades DataFrame.                                                              |
| `src/__init__.py` | Empty package marker.                                                                                                                                                                                        |

## REST API Routes (`server.py`)

| Method   | Path                       | Description                                                                                 |
| -------- | -------------------------- | ------------------------------------------------------------------------------------------- |
| GET      | `/`                        | Serves `dashboard/index.html`                                                               |
| GET      | `/<path>`                  | Serves any file inside `dashboard/`                                                         |
| GET      | `/api/trades`              | All trades merged with annotations; filterable by symbol, date range, strategy, mistake_tag |
| GET      | `/api/metrics`             | Aggregate performance metrics for all trades                                                |
| GET      | `/api/equity-curve`        | Equity curve data points                                                                    |
| GET      | `/api/symbols`             | Sorted list of all traded symbols                                                           |
| GET      | `/api/per-symbol`          | Per-symbol stats table                                                                      |
| GET/POST | `/api/annotations/<id>`    | Get or save annotation for a trade                                                          |
| GET/POST | `/api/strategies`          | List or add strategies                                                                      |
| DELETE   | `/api/strategies/<name>`   | Remove a custom strategy                                                                    |
| GET/POST | `/api/mistake-tags`        | List or add mistake tags                                                                    |
| DELETE   | `/api/mistake-tags/<name>` | Remove a custom tag                                                                         |
| POST     | `/api/upload`              | Upload and parse a TOS CSV (multipart or raw body)                                          |
| GET      | `/api/health`              | Server status and DB path                                                                   |

---

## Frontend (`dashboard/`)

| File                           | Role                                                                                                                                                                                                                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dashboard/index.html`         | Main shell: defines sidebar nav, 6 tab panels, 3 modals (Goals, CSV Import, Edit Trade), and loads all JS/CSS.                                                                                                                                                               |
| `dashboard/js/data.js`         | App entry point. Loads trades from `/api/trades` + `/api/metrics` (falls back to `localStorage` demo data if Flask is unavailable). Adapts API trade objects to the frontend `trades` array. Owns global state: `trades`, `patterns`, `playbookData`, `goals`, `apiMetrics`. |
| `dashboard/js/ui.js`           | Tab routing (`switchTab`). Renders Dashboard tab: KPI cards, unified account bar (`renderAcctBar`), goal/risk calculator, goal progress bars, Chart.js charts (cumulative P&L, daily P&L, win rate by pattern, P&L by pattern). Also renders Calendar tab.                    |
| `dashboard/js/log.js`          | Daily Log tab: trade table, add-trade form (manual entry), edit modal, bulk delete, CSV import modal (maps columns to app fields), CSV export. Parses TOS Account Summary section on import.                                                                                 |
| `dashboard/js/playbook.js`     | Playbook tab: pattern setup library with checklists, entry criteria, and failure modes. Patterns stored in `localStorage`.                                                                                                                                                   |
| `dashboard/js/coach.js`        | Coach tab: local rule engine that scans trade data for patterns (bad conditions, sizing, emotional state). Optional Claude AI deep analysis via user-supplied Anthropic API key.                                                                                             |
| `dashboard/js/analytics.js`    | Analytics tab: detailed stats grid, days/times distribution, price/volume buckets, win/loss streaks and equity curves. All calculated from the frontend `trades` array.                                                                                                      |
| `dashboard/css/theme.css`      | CSS custom properties (colors, fonts) and base element styles.                                                                                                                                                                                                               |
| `dashboard/css/components.css` | Component styles: sidebar, cards, tables, modals, forms, charts.                                                                                                                                                                                                             |

---

## Data Flow

```
TOS CSV file
    |
    v
src/parser.py  ->  executions DataFrame
    |
    v
src/matcher.py  ->  trades DataFrame (FIFO round-trip)
    |
    v
src/db.py  ->  data/journal.db (SQLite)
    |
    v
server.py /api/trades  ->  JSON (trades + annotations merged)
    |
    v
dashboard/js/data.js  ->  adaptApiTrade()  ->  frontend trades[]
    |
    +-- ui.js         -> Dashboard tab
    +-- log.js        -> Daily Log tab
    +-- playbook.js   -> Playbook tab
    +-- coach.js      -> Coach tab
    +-- ui.js         -> Calendar tab
    +-- analytics.js  -> Analytics tab
```

## Storage Split

| Data                                         | Where                                                                 |
| -------------------------------------------- | --------------------------------------------------------------------- |
| Imported trades (from CSV)                   | `data/journal.db` `trades` table via `POST /api/upload`               |
| Manual trades (added in UI)                  | `data/journal.db` `manual_trades` table via `POST /api/trades/manual`; falls back to `localStorage` (`smc_trades`) if Flask is unavailable |
| Edits to imported trades                     | `data/journal.db` `manual_trades` table (same upsert as manual trades); `loadData()` in `data.js` applies the override at merge time |
| Annotations                                  | `data/journal.db` `annotations` table via `POST /api/annotations/<id>` |
| Goals, starting balance                      | `localStorage`                                                        |
| Playbook notes                               | `localStorage`                                                        |
| TOS account summary values (Net Liq, BP, etc.) | `localStorage` (`smc_acct_info`, set on CSV import)                |

## Key Constraints

- Keep Analytics calculations tied to fields present in the frontend `trades` array.
- The static-dashboard pattern (no build step, no bundler) must be preserved unless the spec changes.
