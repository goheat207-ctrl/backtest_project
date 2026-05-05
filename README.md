<img width="1869" height="971" alt="Screenshot 2026-05-04 at 15-07-54 Small Cap Trading Dashboard" src="https://github.com/user-attachments/assets/a64c2065-1c84-4dfb-aab3-97d4e70123c8" />

# Backtest Project

Backtest Project is a personal trading journal, analytics dashboard, and performance review tool built for small-cap traders who want real feedback from their own data.

The goal is simple: import broker statements, review every trade, study patterns, track mistakes, and build a cleaner process over time. This project is being built to become a sharper, better-looking, more flexible alternative to paid trading journals like Tradervue. Once it is finished, the aim is for it to be something Tradervue wishes it looked like.

## Why This Exists

This project started because beginner traders need help the most, but so many useful trading tools are locked behind overpriced subscriptions.

When I was a beginner trader, almost everything that could have helped me improve, understand my mistakes, advance faster, and actually make money was hidden behind some lame paywall. That frustration became the fuel for this project.

The number one goal is to build a powerful trading journal that anyone can use for completely free once it is good enough.

No gatekeeping.
No expensive subscription just to learn from your own trades.
No beginner getting stuck because the useful tools are priced like luxury software.

## What It Does

- Imports Thinkorswim / broker statement CSV files
- Stores trades in a local SQLite database
- Shows performance stats, P&L, win rate, drawdown, and trade history
- Supports manual trade edits and notes
- Tracks patterns, grades, mistakes, emotions, and rule-following
- Includes a dashboard, daily log, calendar, playbook, analytics, and coaching views
- Can run locally or be hosted on PythonAnywhere

## Current Stack

- Python
- Flask
- SQLite
- HTML, CSS, and JavaScript
- Chart.js

## Running Locally

Install requirements:

```bash
pip install -r requirements.txt
```

Start the dashboard:

```bash
python server.py
```

Then open:

```txt
http://localhost:5000
```

## Data

The main database is:

```txt
data/journal.db
```

This file stores imported trades, manual trades, annotations, goals, strategies, and tags.

Important: if the app is hosted somewhere like PythonAnywhere, that hosted copy has its own database file. Local database changes do not automatically appear on the live site unless `journal.db` is uploaded or synced there.

## Deployment Note

For code changes:

```txt
git push -> PythonAnywhere git pull -> Reload web app
```

For trade data changes:

```txt
upload data/journal.db -> Reload web app
```

## Long-Term Vision

This is not just meant to be a private dashboard. The bigger plan is to turn it into a free community tool for traders who are still learning, still grinding, and still trying to build consistency.

Once this project reaches the quality bar I want, I plan to let anyone use it for free.

After that, the next ambitious project will be another community-focused trading tool in a space where the best versions are also trapped behind overpriced subscriptions.

The mission is bigger than one dashboard:

Build useful tools.
Make them look good.
Make them practical.
Make them free.
Help traders who are serious but not rich yet.

