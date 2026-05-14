import re
import pandas as pd
from pathlib import Path


def _clean_ref(raw: str) -> str:
    """Strip Excel formula wrapper: =\"12345\" -> 12345"""
    if isinstance(raw, str):
        raw = raw.strip()
        m = re.match(r'^="?(\d+)"?$', raw)
        if m:
            return m.group(1)
    return str(raw).strip()


def _parse_amount(val) -> float:
    if pd.isna(val) or str(val).strip() == "":
        return 0.0
    s = str(val).strip().replace("$", "").replace(",", "")
    if s.startswith("(") and s.endswith(")"):
        return -float(s[1:-1])
    try:
        return float(s)
    except ValueError:
        return 0.0


_CUSIP_RE = re.compile(r"^\d{6}[A-Z0-9]{2}\d$")   # strict 9-char CUSIP
_VALID_TICKER_RE = re.compile(r"^[A-Z]{1,5}$")       # standard US stock: 1-5 uppercase letters


def _is_stock_symbol(sym: str) -> bool:
    """Return True only for standard US equity tickers (1-5 uppercase letters).
    Rejects CUSIP codes (9-char alphanumeric starting with digits) and other
    non-stock instruments that TOS includes in account statements."""
    if _CUSIP_RE.match(sym):
        return False
    # Also reject anything that starts with a digit or is suspiciously long
    if sym[0].isdigit():
        return False
    if len(sym) > 6:
        return False
    return True


def _parse_description(desc: str):
    """
    Returns (side, qty, symbol, price) or None if not parseable.
    Handles: BOT +15 YAAS @1.155   SOLD -15 YAAS @1.24
    Skips non-stock instruments (CUSIP codes, bonds, preferred shares).
    """
    desc = str(desc).strip()
    m = re.match(r"^(BOT|SOLD)\s+[+-]?(\d+)\s+(\w+)\s+@([\d.]+)", desc)
    if not m:
        return None
    side = "BOT" if m.group(1) == "BOT" else "SOLD"
    qty = int(m.group(2))
    symbol = m.group(3)
    price = float(m.group(4))
    if not _is_stock_symbol(symbol):
        return None
    return side, qty, symbol, price


def _parse_lines(lines: list[str], file_date: str, source_name: str = "upload") -> tuple[pd.DataFrame, list[str]]:
    """
    Core parser: given raw text lines from a TOS Account Statement and the file_date string,
    return (executions_df, warnings).
    """
    import csv as _csv
    warnings = []

    # Find Cash Balance section header
    cb_start = None
    for i, line in enumerate(lines):
        if line.strip() == "Cash Balance":
            cb_start = i
            break

    if cb_start is None:
        warnings.append(f"{source_name}: 'Cash Balance' section not found.")
        return pd.DataFrame(), warnings

    # Find the column header row — skip any blank lines after "Cash Balance"
    header_idx = cb_start + 1
    while header_idx < len(lines) and not lines[header_idx].strip():
        header_idx += 1

    if header_idx >= len(lines):
        warnings.append(f"{source_name}: No header found in Cash Balance section.")
        return pd.DataFrame(), warnings

    # Read actual column names dynamically (robust to column additions / reordering)
    try:
        header_cells = [c.strip().lower() for c in next(_csv.reader([lines[header_idx]]))]
    except Exception:
        warnings.append(f"{source_name}: Could not parse Cash Balance column header.")
        return pd.DataFrame(), warnings

    def _col_idx(patterns):
        for idx, h in enumerate(header_cells):
            for p in patterns:
                if p in h:
                    return idx
        return -1

    i_date = _col_idx(["date"])
    i_time = _col_idx(["time"])
    i_type = _col_idx(["type"])
    i_desc = _col_idx(["description", "desc"])
    i_ref  = _col_idx(["ref #", "ref#", "ref"])
    i_amt  = _col_idx(["amount"])

    if i_type < 0 or i_desc < 0:
        warnings.append(f"{source_name}: Required columns (TYPE, DESCRIPTION) not found in Cash Balance header.")
        return pd.DataFrame(), warnings

    # Section headers that mark the end of the Cash Balance block
    _STOP_SECTIONS = (
        "Futures Statements", "Forex Statements", "Crypto Statements", "Crypto",
        "Profits and Losses", "Account Trade History", "Account Summary",
        "Symbol Ownership", "Order History",
    )

    records = []
    for line in lines[header_idx + 1:]:
        stripped = line.strip()
        if not stripped:
            # Skip blank lines within the section (TOS sometimes inserts blank
            # lines between trading dates; do NOT treat them as section endings)
            continue
        if any(stripped == s or stripped.startswith(s + ",") for s in _STOP_SECTIONS):
            break

        try:
            cells = next(_csv.reader([stripped]))
        except Exception:
            continue

        if len(cells) <= i_type or cells[i_type].strip() != "TRD":
            continue

        date_str = cells[i_date].strip() if i_date >= 0 and i_date < len(cells) else ""
        time_str = cells[i_time].strip() if i_time >= 0 and i_time < len(cells) else ""
        ref_raw  = cells[i_ref].strip()  if i_ref  >= 0 and i_ref  < len(cells) else ""
        desc     = cells[i_desc].strip() if i_desc >= 0 and i_desc < len(cells) else ""
        amt_raw  = cells[i_amt].strip()  if i_amt  >= 0 and i_amt  < len(cells) else ""

        ref_id = _clean_ref(ref_raw)

        try:
            dt = pd.to_datetime(f"{date_str} {time_str}", format="%m/%d/%y %H:%M:%S")
        except Exception:
            try:
                dt = pd.to_datetime(f"{date_str} {time_str}")
            except Exception:
                warnings.append(f"Could not parse datetime: {date_str} {time_str}")
                continue

        parsed = _parse_description(desc)
        if parsed is None:
            continue

        side, qty, symbol, price = parsed
        amount = _parse_amount(amt_raw)

        records.append({
            "ref_id": ref_id,
            "datetime": dt,
            "side": side,
            "qty": qty,
            "symbol": symbol,
            "price": price,
            "amount": amount,
            "file_date": file_date,
        })

    if not records:
        warnings.append(f"{source_name}: No parseable TRD executions found.")
        return pd.DataFrame(), warnings

    execs = pd.DataFrame(records)
    execs.sort_values("datetime", inplace=True)
    execs.reset_index(drop=True, inplace=True)
    return execs, warnings


def parse_csv(filepath) -> tuple[pd.DataFrame, list[str]]:
    """
    Parse a TOS AccountStatement CSV from a file path.
    Returns (executions_df, warnings).
    """
    path = Path(filepath)
    file_date = _extract_file_date(path)
    with open(path, "r", encoding="utf-8-sig") as f:
        lines = f.readlines()
    return _parse_lines(lines, file_date, source_name=path.name)


def parse_csv_content(text: str, filename: str = "") -> tuple[pd.DataFrame, list[str]]:
    """
    Parse a TOS AccountStatement CSV from an already-read string.
    filename is used only for extracting a date from the filename (if provided)
    and for error messages. Falls back to extracting the date from the last TRD row.
    Returns (executions_df, warnings).
    """
    file_date = ""
    if filename:
        m = re.match(r"(\d{4}-\d{2}-\d{2})", filename)
        if m:
            file_date = m.group(1)

    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    execs, warnings = _parse_lines(lines, file_date or "unknown", source_name=filename or "upload")

    # If file_date wasn't in filename, derive it from the latest execution date
    if not file_date and not execs.empty:
        latest = execs["datetime"].max()
        file_date = latest.strftime("%Y-%m-%d")
        execs["file_date"] = file_date

    return execs, warnings


def _extract_file_date(path: Path) -> str:
    """Extract date from filename like 2026-04-27-AccountStatement.csv"""
    name = path.stem
    m = re.match(r"(\d{4}-\d{2}-\d{2})", name)
    if m:
        return m.group(1)
    return name
