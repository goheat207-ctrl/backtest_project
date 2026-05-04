# Decisions

## 2026-05-03 — Remove Streamlit Stack

Decision: Delete `app.py`, `launch.pyw`, `run.bat`, and `src/charts.py`.

Reason: The project migrated from a Streamlit UI to a Flask + static HTML dashboard. `ARCHITECTURE.md` and `README.md` already described only the Flask stack. The Streamlit files were fully functional but architecturally retired — every feature was replicated in `server.py` + `dashboard/`. Keeping both created confusion about which system to use.

---

## 2026-05-03 — Remove Standalone HTML Prototypes

Decision: Delete `small-cap-trading-dashboard-v2.html` and `TradingJournal.html`.

Reason: Both files were single-file prototypes superseded by the `dashboard/` folder. Neither was served by `server.py`, neither was referenced in `ARCHITECTURE.md`, and neither was imported by any active code. Retaining them created false ambiguity about which HTML was the live app.

---

## 2026-05-03 — Remove Reference Image Folders

Decision: Delete `Analytics cards/` (55 PNGs) and `references/` (9 PNGs).

Reason: Screenshot and reference images inside the project directory are not code, not served, and not imported anywhere. They belong in a separate notes or design folder outside the project, not inside the repository root.

---

## 2026-05-03 — Delete `dashboard/js/journal.js`

Decision: Delete `journal.js`.

Reason: `journal.js` contained a complete self-contained implementation (parser, FIFO matcher, metrics, SVG charts, journal UI). Its host file (`TradingJournal.html`) was removed in 0.3.0. After review, no code was found worth salvaging into the active stack — the active modules (`data.js`, `analytics.js`, etc.) already cover the same functionality. Deleted in 0.4.0.

---

## 2026-05-03 — Preserve Existing Dashboard Structure

Decision: Continue implementing Analytics card work inside `dashboard/js/analytics.js` using the existing static HTML/JavaScript architecture.

Reason: The current app already loads dashboard modules directly from `dashboard/index.html`, and the requested work is scoped to Analytics cards rather than a framework migration.

---

## 2026-05-03 — Unified Account Bar (replaces two separate header rows)

Decision: Merge the old `#acct-card` (Starting Balance, Net Balance, All-Time P&L, Win Rate, Total Trades, Best Day, Last Trade) and `#tos-acct-bar` (Net Liq, Option BP, P/L Day, P/L Open, P/L Year) into a single `#acct-bar` rendered by `renderAcctBar(s)` in `ui.js`.

Reason: Two stacked rows with overlapping metrics created visual clutter. The unified bar puts all live account data and computed stats in one scannable row. TOS-sourced fields gracefully degrade to `—` when no TOS CSV has been imported.

Trade-off: Net Balance and All-Time P&L are no longer surfaced on the dashboard (they were in the old `acct-card`). If those are needed, they should be added back as fields in the unified bar or as primary stat cards.

---

## 2026-05-04 — Goal/Risk Card Expanded to 5 Rows

Decision: Change default goal percentages from `[3, 5, 12]` to `[3, 5.5, 7.75, 9, 12]` and default risk percentages from `[1.5, 2, 4]` to `[0.75, 1.25, 1.85, 2.2, 2.95]` in `getGoalRiskPcts()` (`ui.js`).

Reason: The scoreboard display (TOS or equivalent) the user references shows 5 goal tiers and 5 risk tiers. The 3-row card was missing intermediate levels that are meaningful for trade sizing decisions.

Trade-off: Existing users with values saved in `localStorage` are not auto-migrated — they must clear `smc_goal_pcts` and `smc_risk_pcts` manually to get the new defaults.

---

## 2026-05-04 — Cache-Busting via Query String Versioning

Decision: Append `?v=2` to all `<script src>` tags in `index.html`. Increment the version whenever a JS file changes and a forced browser cache refresh is needed.

Reason: Flask's default `Cache-Control` header causes browsers to serve stale JS for up to 12 hours after a code change. A query string version forces the browser to treat the URL as a new resource and fetch fresh.

Trade-off: Manual — the developer must remember to increment the version. No build tooling exists to automate this.

---

## 2026-05-03 — Goal/Risk Base = Starting Balance Only

Decision: `renderGoalRisk()` uses `getStartingBalance()` as its dollar base, not `getEffectiveBal(s)` (Starting Balance + All-Time P&L).

Reason: The user's intent is to plan goals and risk as a percentage of the account they started with, not the current net balance. Using net balance caused the card to show negative or misleading dollar amounts whenever all-time P&L was negative.
