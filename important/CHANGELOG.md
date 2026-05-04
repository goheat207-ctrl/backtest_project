# Changelog

## 0.6.0 - 2026-05-04

### Features & Fixes

- **Goal/Risk card expanded to 5 rows each** — `getGoalRiskPcts()` in `ui.js` updated default goal percentages from `[3, 5, 12]` to `[3, 5.5, 7.75, 9, 12]` and default risk percentages from `[1.5, 2, 4]` to `[0.75, 1.25, 1.85, 2.2, 2.95]`. Users with old values saved in `localStorage` (`smc_goal_pcts` / `smc_risk_pcts`) must clear those keys to pick up the new defaults.
- **Cache-busting query strings added to all script tags** — All six `<script src>` tags in `index.html` now carry `?v=2`. Flask serves static files with a 12-hour `Cache-Control` header by default; without versioning, browsers served stale JS after code changes. Increment to `?v=3`, `?v=4`, etc. whenever a JS file changes and a forced reload is needed.

---

## 0.5.0 - 2026-05-03

### Features & Fixes

- **Unified account bar** — Replaced the two separate dashboard header rows (`#acct-card` and `#tos-acct-bar`) with a single `#acct-bar` element. Removed `renderTosAcctBar()` and `renderAcctCard()` from `ui.js` and replaced them with `renderAcctBar(s)`. The new bar renders all fields in one row: Starting Balance (editable), Net Liq, Option BP, P/L Day, P/L Open, Best Day, Worst Day, P/L Year, Total Trades, Last Trade. TOS fields show `—` in grey when no TOS data has been imported.
- **Worst Day stat** — Added Worst Day (minimum daily P&L across all trade dates) to the unified account bar, rendered in red immediately after Best Day.
- **Goal/Risk card now uses Starting Balance as base** — `renderGoalRisk()` previously calculated from `getEffectiveBal(s)` (Starting Balance + All-Time P&L), which produced wrong dollar targets when P&L was negative. Changed to use `getStartingBalance()` directly. Whatever value is typed in the Starting Balance field is now the exact base for all goal and risk dollar calculations.
- **Fixed trade history edits not saving for imported trades** — `loadData()` in `data.js` was filtering out manual overrides for imported trades: the `manualTrades.filter(t => !importedSet.has(t.id))` check discarded any manual edit whose ID matched an imported `trade_id`. Fixed by building a `manualById` map and checking it per imported trade — if a manual override exists for an imported trade, the override is used; otherwise the adapted API trade is used. Purely new manual trades (not edits) are still appended.

---

## 0.4.0 - 2026-05-03

### Features & Fixes
- Fixed CSV importer: added `parseTOSCashBalance()` to correctly handle TOS Account Statement exports. Parser reads the "Cash Balance" section (TRD rows, BOT/SOLD descriptions). The old parser only handled a non-standard "Account Trade History" format.
- FIFO matching now runs across the full statement date range per symbol, so cross-day positions close correctly with their exit date.
- CSV import now also parses the "Account Summary" and "Profits and Losses" sections and stores Net Liq, Option Buying Power, P/L Day, P/L Open, and P/L Year in localStorage.
- Added TOS account info bar at the top of the Dashboard tab — populated on CSV import, shows live broker values with P&L coloring.
- Added `parseTOSAccountSummary()` to `log.js`.
- Moved Goal/Risk card to just above Goal Progress on the Dashboard tab.
- Removed "Trade Distribution By Day Of Month" and "Performance By Day Of Month" cards from the Analytics Days/Times tab.
- Removed Profit Factor and Largest Gain vs Largest Loss half-moon gauge cards from the Analytics Detailed Stats tab.
- Deleted `dashboard/js/journal.js` (orphaned, never loaded by `index.html`).

---

## 0.3.0 - 2026-05-03

### Cleanup & Documentation
- Removed dead-weight files: `app.py` (retired Streamlit UI), `launch.pyw`, `run.bat`, `src/charts.py` (Streamlit-only charts), `tos_csv_loader.py` (broken import path), `small-cap-trading-dashboard-v2.html` (old prototype), `TradingJournal.html` (old prototype), `Analytics cards/` folder (55 Tradervue reference screenshots), `references/` folder (9 reference images), `src/__pycache__/` (bytecode cache).
- Rewrote all 7 project control documents to reflect the actual post-cleanup state.
- Created `HOWTO.md` — guide for making common changes to HTML, CSS, Python, JS, and the database.
- Documented `dashboard/js/journal.js` as orphaned in ARCHITECTURE.md and BUGS.md.

---

## 0.2.0 - 2026-05-03

- Added reference-style Analytics cards for detailed stats, day/time distributions, price/volume breakdowns, symbol performance, setup attributes, win/loss expectation, cumulative P&L, and drawdown.
- Linked supported cards to frontend trade fields including `pnl`, `date`, `ticker`, `entryPrice`, `exitPrice`, `shares`, `holdSeconds`, `gapPct`, `relVol`, `float`, `pattern`, `direction`, and `catalyst`.
- Fixed the Analytics opening-gap card to use existing `gapPct` data instead of unsupported `prevClose` data.

---

## 0.1.0 - 2026-05-03

- Recreated required project control documents.
- Established current architecture, spec, tasks, decisions, and risk tracking.
