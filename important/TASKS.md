# Tasks

## TODO

- **Cache-busting process** — The current `?v=2` approach requires manually incrementing the version number in `index.html` every time a JS file changes. Consider scripting this or switching to a hash-based approach to avoid forgetting.
- **Goal/Risk localStorage migration** — Users who had the old 3-value arrays saved in `localStorage` must manually clear `smc_goal_pcts` and `smc_risk_pcts` to get the new 5-row defaults. Consider adding a version check in `getGoalRiskPcts()` that auto-migrates when the saved array length < 5.
- Verify Analytics card rendering in the browser after the 0.2.0 card additions.
- Test CSV upload end-to-end with a real TOS Account Statement file (multi-day, with blank separators between dates) to confirm all trades appear in the Daily Log after the 0.7.0 parser fix.
- Verify that editing an imported TOS trade and saving now correctly persists across page reloads (the B-R06 fix needs a real round-trip test with data in the DB).
- Consider whether the Net Balance / All-Time P&L stats (removed from the old `acct-card`) should be added back somewhere — they are no longer shown anywhere on the dashboard.

## IN PROGRESS

None.

## DONE

- **B-R08 CSV parser fix (0.7.0)** — Fixed three bugs causing Daily Log to show no trades after CSV import: (1) backend parser broke on blank lines between dates in Cash Balance section; (2) hardcoded column-header offset broke on format variations; (3) 0-trade imports showed no warning to user. Fixed in `src/parser.py`, `server.py`, `dashboard/js/log.js`, and `dashboard/index.html`.

- Expanded Goal/Risk card from 3 rows to 5 rows; updated defaults in `getGoalRiskPcts()` in `ui.js`.
- Added `?v=2` cache-busting query strings to all script tags in `index.html` to fix Flask static file caching.
- Unified dashboard account bar: replaced `#acct-card` + `#tos-acct-bar` with single `#acct-bar`; removed `renderTosAcctBar()` and `renderAcctCard()`, added `renderAcctBar(s)` in `ui.js`.
- Added Worst Day stat to the unified account bar (next to Best Day).
- Fixed Goal/Risk card base: now uses `getStartingBalance()` instead of `getEffectiveBal(s)`.
- Fixed trade history edits not saving for imported trades (`loadData()` merge logic in `data.js`).
- Added reference-style Analytics cards to `dashboard/js/analytics.js` (stats, days/times, price/volume, win/loss, equity, drawdown).
- Fixed Analytics opening-gap card to use `gapPct` instead of unsupported `prevClose`.
- Recreated all 7 project control documents.
- Removed dead-weight files: `app.py`, `launch.pyw`, `run.bat`, `src/charts.py`, `tos_csv_loader.py`, `small-cap-trading-dashboard-v2.html`, `TradingJournal.html`, `Analytics cards/`, `references/`, `src/__pycache__/`.
- Rewrote all control documents and created `HOWTO.md` to reflect post-cleanup state.
- Fixed CSV importer: added `parseTOSCashBalance()` for TOS Account Statement exports; fixed cross-day FIFO matching.
- Deleted `dashboard/js/journal.js` (orphaned — host HTML deleted, never loaded by `index.html`).
