"""Quick smoke test for the _parse_lines parser fixes."""
import sys
sys.path.insert(0, '.')
from src.parser import _parse_lines

PASS = 0
FAIL = 0

def check(name, got, expected):
    global PASS, FAIL
    if got == expected:
        print(f"  PASS  {name}")
        PASS += 1
    else:
        print(f"  FAIL  {name}: expected {expected}, got {got}")
        FAIL += 1

# ── Test 1: standard format ──────────────────────────────────────────────────
csv1 = [
    "Account Statement",
    "Account Summary",
    "Net Liq,25000.00",
    "",
    "Cash Balance",
    "DATE,TIME,TYPE,REF #,DESCRIPTION,Misc Fees,Commissions & Fees,AMOUNT,BALANCE",
    '04/27/26,09:30:00,TRD,111,"BOT +100 UAVS @1.09",,0.65,109.00,25109.00',
    '04/27/26,10:15:00,TRD,222,"SOLD -100 UAVS @1.40",,0.65,140.00,25249.00',
    "",
    "Profits and Losses",
]
df, warns = _parse_lines(csv1, "2026-04-27", "test1")
check("standard format", len(df), 2)

# ── Test 2: blank line between Cash Balance and column header ─────────────────
csv2 = [
    "Cash Balance",
    "",
    "DATE,TIME,TYPE,REF #,DESCRIPTION,Misc Fees,Commissions & Fees,AMOUNT,BALANCE",
    '04/27/26,09:30:00,TRD,111,"BOT +100 UAVS @1.09",,0.65,109.00,25109.00',
    '04/27/26,10:15:00,TRD,222,"SOLD -100 UAVS @1.40",,0.65,140.00,25249.00',
]
df, warns = _parse_lines(csv2, "2026-04-27", "test2")
check("blank before header", len(df), 2)

# ── Test 3: blank lines BETWEEN trading dates (was the old bug) ───────────────
csv3 = [
    "Cash Balance",
    "DATE,TIME,TYPE,REF #,DESCRIPTION,Misc Fees,Commissions & Fees,AMOUNT,BALANCE",
    '04/27/26,09:30:00,TRD,111,"BOT +100 UAVS @1.09",,0.65,109.00,25109.00',
    '04/27/26,10:15:00,TRD,222,"SOLD -100 UAVS @1.40",,0.65,140.00,25249.00',
    "",
    '04/28/26,09:35:00,TRD,333,"BOT +200 RGTI @2.50",,0.65,500.00,25749.00',
    '04/28/26,11:00:00,TRD,444,"SOLD -200 RGTI @3.10",,0.65,620.00,26369.00',
    "",
    "Profits and Losses",
]
df, warns = _parse_lines(csv3, "", "test3")
check("blank between trading dates (old bug)", len(df), 4)

# ── Test 4: extra column added by TOS update ──────────────────────────────────
csv4 = [
    "Cash Balance",
    "DATE,TIME,TYPE,REF #,DESCRIPTION,Misc Fees,Commissions & Fees,AMOUNT,BALANCE,EXTRA",
    '04/27/26,09:30:00,TRD,111,"BOT +100 UAVS @1.09",,0.65,109.00,25109.00,X',
    '04/27/26,10:15:00,TRD,222,"SOLD -100 UAVS @1.40",,0.65,140.00,25249.00,X',
]
df, warns = _parse_lines(csv4, "2026-04-27", "test4")
check("extra column in header", len(df), 2)

# ── Test 5: no Cash Balance section ──────────────────────────────────────────
csv5 = [
    "Account Trade History",
    "Exec Time,Side,Qty,Symbol,Price",
]
df, warns = _parse_lines(csv5, "2026-04-27", "test5")
check("no Cash Balance section returns empty", len(df), 0)
assert any("Cash Balance" in w for w in warns), "expected warning about missing section"

# ── Test 6: BAL/EOD rows within Cash Balance are ignored ─────────────────────
csv6 = [
    "Cash Balance",
    "DATE,TIME,TYPE,REF #,DESCRIPTION,Misc Fees,Commissions & Fees,AMOUNT,BALANCE",
    '04/27/26,09:30:00,TRD,111,"BOT +100 UAVS @1.09",,0.65,109.00,25109.00',
    '04/27/26,16:00:00,BAL,,,,,0.00,25109.00',
    '04/27/26,10:15:00,TRD,222,"SOLD -100 UAVS @1.40",,0.65,140.00,25249.00',
]
df, warns = _parse_lines(csv6, "2026-04-27", "test6")
check("BAL rows skipped, only TRD kept", len(df), 2)

print()
print(f"Results: {PASS} passed, {FAIL} failed")
sys.exit(FAIL)
