# Bugs & Risks

## Open

### B-005 — Flask static file caching requires manual version bump
Flask's `send_from_directory` sets `Cache-Control: public, max-age=43200` (12 hours) for static files. After any JS change, browsers serve the old cached file until the cache expires or the user hard-refreshes. Workaround: increment the `?v=N` query string on affected `<script src>` tags in `index.html`. Risk: easy to forget, leaving users on stale code. Proper fix: automate the version bump or switch to content-hash naming.

### B-006 — Goal/Risk localStorage migration not automatic
Users who saved the old 3-value goal/risk arrays (`smc_goal_pcts`, `smc_risk_pcts`) before 0.6.0 will not pick up the new 5-value defaults automatically. The code only uses defaults when the key is absent. Workaround: clear both keys in DevTools console. Proper fix: add a length-check migration in `getGoalRiskPcts()`.

### B-002 — Analytics browser rendering unverified
Browser rendering of the Analytics cards has not been verified with real data in all four sub-tabs (Detailed Stats, Days/Times, Price/Volume, Win/Loss).

### B-003 — Some Analytics fields unavailable for API-imported trades
Trades imported via the Flask API (`/api/trades`) are adapted to the frontend format in `adaptApiTrade()` in `data.js`. Fields like `relVol`, `float`, `gapPct`, `catalyst`, `direction`, `pattern`, `entryGrade`, `exitGrade`, `emotionalState` default to `0`, `false`, or `''` for API trades because the SQLite schema does not store them. Analytics cards that use these fields will show empty/zero data for imported trades. Only manually entered trades carry these values.

### B-004 — Commissions, fees, MAE, MFE not tracked
The SQLite `trades` table only stores gross P&L. Net P&L (after commissions/fees) and trade-level MAE/MFE are not tracked. Analytics cards for these metrics display `n/a`.

---

## Resolved

### B-R06 — Trade history edits not persisting for imported trades
**Resolved 0.5.0** — `loadData()` in `data.js` built `importedSet` from `apiTrades.map(t => t.trade_id)` and then filtered manual trades with `!importedSet.has(t.id)`. When a user edited an imported trade, the edit was saved to `manual_trades` with the same ID as the imported trade — so the filter always discarded it and the original imported version was shown instead. Fixed by merging per-trade: imported trades now check for a manual override by ID and use it if present.

### B-R07 — Goal/Risk card calculating from wrong base value
**Resolved 0.5.0** — `renderGoalRisk()` used `getEffectiveBal(s)` (Starting Balance + All-Time P&L) as the base for goal/risk dollar amounts. With a negative all-time P&L this produced negative or misleading targets. Changed to `getStartingBalance()` so the card always reflects the value typed in the Starting Balance field.

### B-R01 — Required project control documents were missing
**Resolved 0.1.0** — All 7 control documents recreated.

### B-R02 — Analytics opening-gap card used unsupported `prevClose` field
**Resolved 0.2.0** — Card updated to use `gapPct` which is present in the frontend trade model.

### B-R03 — Broken `tos_csv_loader.py` importing non-existent package
**Resolved 0.3.0** — File deleted. It imported `project.ingestion.tos_loader` which never existed in this project.

### B-R04 — CSV importer failed to parse TOS Account Statement files
**Resolved 0.4.0** — `parseTOSAccountStatement()` looked for an "Account Trade History" section that doesn't exist in standard TOS Account Statement exports. Added `parseTOSCashBalance()` which correctly parses the "Cash Balance" section (DATE/TIME/TYPE/DESCRIPTION columns, TRD rows with BOT/SOLD descriptions). FIFO matching now runs across the full date range so cross-day positions are handled correctly.

### B-R05 — `dashboard/js/journal.js` was orphaned
**Resolved 0.4.0** — File deleted. It targeted DOM elements that don't exist in `index.html` and was never loaded.
