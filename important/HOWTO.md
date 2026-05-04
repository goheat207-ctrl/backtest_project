# HOWTO — Making Changes to the Trading Journal

A practical guide to where things live and what to touch for common changes.

---

## How the Project Works (Big Picture)

```
TOS CSV  ->  server.py  ->  src/parser.py  ->  src/matcher.py  ->  data/journal.db
                                                                           |
                                              browser <-- /api/trades --- server.py
                                                 |
                             dashboard/index.html + js/*.js + css/*.css
```

1. You run `python server.py` (or `run_dashboard.bat`).
2. Flask starts on port 5000 and serves `dashboard/index.html` at the root.
3. The browser loads the dashboard. `data.js` fetches `/api/trades` and `/api/metrics` from Flask.
4. Flask reads SQLite (`data/journal.db`) and returns trades as JSON.
5. All rendering happens in the browser — no page reloads.

---

## The Files

### Python (Backend)

| File | What it does |
|---|---|
| `server.py` | The web server. Add new API routes here. |
| `src/parser.py` | Reads TOS CSV files. Change here if TOS changes its export format. |
| `src/matcher.py` | FIFO trade matching logic. Change here if you need different matching rules (e.g., LIFO, short-selling support). |
| `src/db.py` | All SQLite reads/writes. Add new columns or tables here. |
| `src/metrics.py` | Aggregate statistics calculations. Add new metrics here. |

### JavaScript (Frontend)

| File | What it does |
|---|---|
| `dashboard/js/data.js` | Loads data from API, owns global `trades[]` array, defines `adaptApiTrade()`. |
| `dashboard/js/ui.js` | Dashboard tab: KPI cards, account summary, goal/risk calculator, Chart.js charts. Also renders Calendar tab. |
| `dashboard/js/log.js` | Daily Log tab: trade table, add/edit/delete trades, CSV import modal, TOS account summary parsing. |
| `dashboard/js/playbook.js` | Playbook tab: pattern library with checklists. |
| `dashboard/js/coach.js` | Coach tab: rule engine analysis + Claude AI integration. |
| `dashboard/js/analytics.js` | Analytics tab: all stats cards, bar charts, line charts. |

### HTML / CSS

| File | What it does |
|---|---|
| `dashboard/index.html` | The app shell. Defines all tab panels, modals, the sidebar, and the `<script>` load order. |
| `dashboard/css/theme.css` | Colors (CSS custom properties), fonts, base element resets. |
| `dashboard/css/components.css` | Every visual component: sidebar, cards, tables, forms, modals, charts. |

### Database

| File | What it does |
|---|---|
| `data/journal.db` | SQLite database. Tables: `trades`, `annotations`, `custom_strategies`, `custom_mistake_tags`. |

---

## Common Changes

### Add a new stat to the Analytics tab

1. Open `dashboard/js/analytics.js`.
2. Find the relevant render function: `renderAnStats()` (Detailed Stats), `renderAnDays()` (Days/Times), `renderAnPrice()` (Price/Volume), or `renderAnStreaks()` (Win/Loss).
3. Add your calculation using the `t` array (frontend trade objects). Available fields: `pnl`, `date`, `ticker`, `pattern`, `direction`, `entryPrice`, `exitPrice`, `shares`, `holdSeconds`, `gapPct`, `relVol`, `float`, `catalyst`, `writeUp`.
4. Render using existing helpers: `barRow()`, `zeroBarRow()`, `countBarRow()`, `bucketPair()`, `categoryPair()`, `lineCard()`.

### Add a new API endpoint

1. Open `server.py`.
2. Add a new `@app.route(...)` function following the existing pattern.
3. Use `load_all_trades()` or `load_annotations()` from `src/db.py` for data access.

### Add a new column to the trades database

1. Open `src/db.py`, find `_ensure_schema()`.
2. Add the column to the `CREATE TABLE IF NOT EXISTS trades` statement (SQLite will not add it to existing tables automatically — you'll need to also run `ALTER TABLE trades ADD COLUMN ...` once manually, or delete and re-import).
3. Update `upsert_trades()` to write the new column.
4. Update `load_all_trades()` if you need it returned.
5. Update `server.py` `/api/trades` if you want it sent to the frontend.
6. Update `adaptApiTrade()` in `data.js` to map it to the frontend trade object.

### Change the color scheme

- Open `dashboard/css/theme.css`.
- Edit the CSS custom properties at the top of `:root {}`:
  - `--orange`: accent color (headers, highlights)
  - `--green`: winning trades
  - `--red`: losing trades
  - `--bg`: main background
  - `--surface`, `--surface2`: card backgrounds
  - `--muted`: secondary text

### Change which patterns appear in the add-trade form

1. Open `dashboard/index.html`.
2. Find the `<select id="f-pattern">` element (around line 210).
3. Add or remove `<option>` entries.
4. Also update `PATTERNS_DEFAULT` in `dashboard/js/data.js` to keep the playbook in sync.

### Add a new predefined strategy or mistake tag

**Backend (shows in Flask-served journal annotation dropdowns):**
1. Open `src/db.py`.
2. Add the name to `PREDEFINED_STRATEGIES` or `PREDEFINED_MISTAKES` list.

**Frontend (shows in the add-trade form and coach analysis):**
- Strategies: `server.py` serves `/api/strategies`, which reads from `src/db.py`.
- Mistake tags: `server.py` serves `/api/mistake-tags`.
- Custom ones can be added at runtime through the dashboard UI without touching code.

### Change the Flask port

1. Open `server.py`.
2. Find `app.run(host="127.0.0.1", port=5000, debug=True)` at the bottom.
3. Change the `port` value.
4. Update `run_dashboard.bat` to match.

### Re-import all statements from scratch

1. Delete or rename `data/journal.db` (this wipes all trades and annotations).
2. Drop your CSV files into the `Statements/` folder.
3. Start the server and use the Import CSV modal, or POST to `/api/upload` for each file.

### Test the server without the browser

```
curl http://localhost:5000/api/health
curl http://localhost:5000/api/trades
curl http://localhost:5000/api/metrics
```

---

## What Lives Where (Quick Reference)

| Want to change... | Go to... |
|---|---|
| Colors / fonts | `dashboard/css/theme.css` |
| Layout / component styles | `dashboard/css/components.css` |
| Dashboard KPI cards | `dashboard/js/ui.js` -> `renderDashboard()` |
| Trade table columns | `dashboard/js/log.js` -> `renderLog()` |
| Analytics stats | `dashboard/js/analytics.js` -> `renderAnStats()` |
| Analytics time charts | `dashboard/js/analytics.js` -> `renderAnDays()` |
| Analytics price/volume charts | `dashboard/js/analytics.js` -> `renderAnPrice()` |
| Analytics win/loss charts | `dashboard/js/analytics.js` -> `renderAnStreaks()` |
| How CSV is parsed | `src/parser.py` |
| How trades are matched | `src/matcher.py` |
| Database schema | `src/db.py` -> `_ensure_schema()` |
| Performance metrics math | `src/metrics.py` |
| API routes | `server.py` |
| App tabs / modals (HTML structure) | `dashboard/index.html` |
| Playbook patterns | `dashboard/js/playbook.js` + `data.js` `PLAYBOOK_DEFAULT` |
| Coach rules | `dashboard/js/coach.js` |
