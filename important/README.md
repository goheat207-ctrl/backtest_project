# Backtest Project — TOS Trading Journal

Local trading journal and analytics dashboard for ThinkorSwim (TOS) account statement data. Parses execution CSVs, matches trades via FIFO, stores data in SQLite, and serves a browser dashboard through a Flask API.

## Requirements

```
pip install -r requirements.txt
```

`requirements.txt` installs: Flask, pandas, numpy, plotly, streamlit (streamlit is listed but not used — see DECISIONS.md).

## Run

```
run_dashboard.bat
```

Or directly:

```
python server.py
```

Then open `http://localhost:5000` in your browser.

## Import Trades

1. Export an Account Statement CSV from TOS: **Monitor → Account Statement → Export to File**
2. In the dashboard, click **Import CSV** (Daily Log tab) and select the file.
3. Or drop the CSV into the `Statements/` folder and use the API directly:

```
POST /api/upload   (multipart with field "csv", or raw body)
```

## Project Control Documents

| File | Purpose |
|---|---|
| `PROJECT_SPEC.md` | Goals and requirements |
| `ARCHITECTURE.md` | File structure and data flow |
| `TASKS.md` | Current task state |
| `CHANGELOG.md` | Version history |
| `DECISIONS.md` | Architectural decisions |
| `BUGS.md` | Known bugs and risks |
| `HOWTO.md` | How to make common changes |
