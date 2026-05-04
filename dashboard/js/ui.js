"use strict";

      function switchTab(name) {
        document
          .querySelectorAll(".tab-panel")
          .forEach((p) => p.classList.remove("active"));
        document
          .querySelectorAll(".nav-item")
          .forEach((n) => n.classList.remove("active"));
        document.getElementById("tab-" + name).classList.add("active");
        document
          .querySelector('[data-tab="' + name + '"]')
          .classList.add("active");
        if (name === "dashboard") renderDashboard();
        else if (name === "log") renderLog();
        else if (name === "playbook") renderPlaybook();
        else if (name === "coach") renderCoach();
        else if (name === "calendar") renderCalendar();
        else if (name === "analytics") renderAnalytics();
      }

      // ============================================================
      // STATS HELPERS
      // ============================================================
      function computeStats(tradeList) {
        const t = tradeList;
        if (!t.length)
          return {
            totalPnl: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            avgWin: 0,
            avgLoss: 0,
            largestWin: 0,
            largestLoss: 0,
            profitFactor: 0,
            expectancy: 0,
            maxDD: 0,
            streak: 0,
          };
        const wins = t.filter((x) => x.pnl > 0),
          losses = t.filter((x) => x.pnl <= 0);
        const totalPnl = t.reduce((a, x) => a + x.pnl, 0);
        const winRate = wins.length / t.length;
        const avgWin = wins.length
          ? wins.reduce((a, x) => a + x.pnl, 0) / wins.length
          : 0;
        const avgLoss = losses.length
          ? losses.reduce((a, x) => a + x.pnl, 0) / losses.length
          : 0;
        const largestWin = wins.length
          ? Math.max(...wins.map((x) => x.pnl))
          : 0;
        const largestLoss = losses.length
          ? Math.min(...losses.map((x) => x.pnl))
          : 0;
        const grossWin = wins.reduce((a, x) => a + x.pnl, 0);
        const grossLoss = Math.abs(losses.reduce((a, x) => a + x.pnl, 0));
        const profitFactor = grossLoss
          ? grossWin / grossLoss
          : grossWin
            ? 999
            : 0;
        const expectancy = winRate * avgWin + (1 - winRate) * avgLoss;
        // max drawdown from running equity
        const sorted = [...t].sort((a, b) => a.date.localeCompare(b.date));
        let peak = 0,
          eq = 0,
          dd = 0;
        sorted.forEach((x) => {
          eq += x.pnl;
          if (eq > peak) peak = eq;
          const cur = peak - eq;
          if (cur > dd) dd = cur;
        });
        // streak
        const byd = [...t].sort((a, b) => b.date.localeCompare(a.date));
        let streak = 0;
        if (byd.length) {
          const s = byd[0].pnl > 0 ? 1 : -1;
          streak = s;
          for (let i = 1; i < byd.length; i++) {
            if ((byd[i].pnl > 0 ? 1 : -1) !== s) break;
            streak += s;
          }
        }
        return {
          totalPnl,
          wins: wins.length,
          losses: losses.length,
          winRate,
          avgWin,
          avgLoss,
          largestWin,
          largestLoss,
          profitFactor,
          expectancy,
          maxDD: dd,
          streak,
        };
      }

      function pnlClass(v) {
        return v > 0 ? "pos" : v < 0 ? "neg" : "neu";
      }
      function fmt$(v) {
        return (v >= 0 ? "+" : "") + v.toFixed(2);
      }
      function fmtPct(v) {
        return (v * 100).toFixed(1) + "%";
      }

      // ============================================================
      // TAB 1: DASHBOARD
      // ============================================================
      function setDashWindow(days) {
        dashWindow = days;
        localStorage.setItem("smc_dash_window", days);
        document.querySelectorAll(".dash-window-btn").forEach((b) => {
          b.classList.toggle("active", parseInt(b.dataset.days, 10) === days);
        });
        renderDashboard();
      }

      function getDashTrades() {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - dashWindow);
        const cutoffStr = cutoff.toISOString().slice(0, 10);
        return trades.filter((t) => t.date >= cutoffStr);
      }

      function renderDashboard() {
        const viewTrades = getDashTrades();
        const s = computeStats(viewTrades);
        const today = new Date().toISOString().slice(0, 10);

        // Sync window buttons
        document.querySelectorAll(".dash-window-btn").forEach((b) => {
          b.classList.toggle("active", parseInt(b.dataset.days, 10) === dashWindow);
        });

        const sorted = [...viewTrades].sort((a, b) => a.date.localeCompare(b.date));
        document.getElementById("dash-date-range").textContent = sorted.length
          ? `${sorted[0].date} – ${sorted[sorted.length - 1].date}`
          : "No trades yet";

        // Primary stats
        const ps = [
          {
            label: "Total P&L",
            val: "$" + Math.abs(s.totalPnl).toFixed(2),
            cls: pnlClass(s.totalPnl),
            sign: s.totalPnl >= 0 ? "+" : "-",
          },
          {
            label: "Avg Win",
            val: "$" + s.avgWin.toFixed(2),
            cls: "pos",
            sign: "+",
          },
          {
            label: "Avg Loss",
            val: "$" + Math.abs(s.avgLoss).toFixed(2),
            cls: s.avgLoss < 0 ? "neg" : "neu",
            sign: s.avgLoss < 0 ? "-" : "",
          },
          {
            label: "Largest Win",
            val: "$" + s.largestWin.toFixed(2),
            cls: "pos",
            sign: "+",
          },
          {
            label: "Largest Loss",
            val: "$" + Math.abs(s.largestLoss).toFixed(2),
            cls: s.largestLoss < 0 ? "neg" : "neu",
            sign: s.largestLoss < 0 ? "-" : "",
          },
          {
            label: "Win Rate",
            val: fmtPct(s.winRate),
            cls: s.winRate >= 0.5 ? "pos" : "win-rate",
            sign: "",
          },
        ];
        document.getElementById("primary-stats").innerHTML = ps
          .map(
            (p) => `
    <div class="card" style="border-top:2px solid var(--orange)">
      <div class="card-label">${p.label}</div>
      <div class="card-value ${p.cls}">${p.sign}${p.val}</div>
      <div class="card-sub">${viewTrades.length} total trades</div>
    </div>`,
          )
          .join("");

        // Secondary stats
        const ss2 = [
          {
            label: "Profit Factor",
            val: s.profitFactor.toFixed(2),
            cls:
              s.profitFactor >= 1.5
                ? "pos"
                : s.profitFactor < 1
                  ? "neg"
                  : "neu",
          },
          {
            label: "Expectancy",
            val: "$" + s.expectancy.toFixed(2) + "/trade",
            cls: pnlClass(s.expectancy),
          },
          { label: "Max Drawdown", val: "$" + s.maxDD.toFixed(2), cls: "neg" },
          {
            label: "Current Streak",
            val:
              (s.streak > 0 ? "+" : "") +
              s.streak +
              " " +
              (s.streak > 0 ? "W" : "L"),
            cls: s.streak > 0 ? "pos" : "neg",
          },
        ];
        document.getElementById("secondary-stats").innerHTML = ss2
          .map(
            (p) => `
    <div class="card">
      <div class="card-label">${p.label}</div>
      <div class="card-value ${p.cls}" style="font-size:18px">${p.val}</div>
    </div>`,
          )
          .join("");

        renderAcctBar(s);
        renderGoalRisk(s);
        renderGoals(s);
        renderCharts(viewTrades);
        renderRecentTrades(viewTrades);
        document.getElementById("sb-trade-count").textContent =
          trades.length + " trades logged";
      }

      // ============================================================
      // UNIFIED ACCOUNT BAR
      // ============================================================
      function getStartingBalance() {
        return parseFloat(localStorage.getItem("smc_starting_balance") || "0");
      }

      function getEffectiveBal(s) {
        return getStartingBalance() + s.totalPnl;
      }

      function saveBalance(raw) {
        const v = parseFloat(String(raw).replace(/[^0-9.-]/g, ""));
        if (!isNaN(v)) {
          localStorage.setItem("smc_starting_balance", v);
          renderDashboard();
        }
      }

      function renderAcctBar(s) {
        const el = document.getElementById("acct-bar");
        if (!el) return;

        const startBal = getStartingBalance();
        const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
        const lastDate = sorted.length ? sorted[sorted.length - 1].date : "—";
        const dayMap = {};
        trades.forEach((t) => { dayMap[t.date] = (dayMap[t.date] || 0) + t.pnl; });
        const dayVals = Object.values(dayMap);
        const bestDay = dayVals.length ? Math.max(...dayVals) : 0;
        const worstDay = dayVals.length ? Math.min(...dayVals) : 0;

        const fmtDollar = (v) => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
        const col = (v) => v >= 0 ? "var(--green)" : "var(--red)";

        // TOS live account data (optional)
        let tos = null;
        try { tos = JSON.parse(localStorage.getItem("smc_acct_info") || "null"); } catch {}

        const tosFmt = (v) => {
          if (v === undefined || v === null) return null;
          return { str: `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`, col: col(v) };
        };

        const netLiq   = tos ? tosFmt(tos["Net Liquidating Value"]) : null;
        const optionBP = tos ? tosFmt(tos["Option Buying Power"])   : null;
        const plDay    = tos ? tosFmt(tos["P/L Day"])               : null;
        const plOpen   = tos ? tosFmt(tos["P/L Open"])              : null;
        const plYear   = tos ? tosFmt(tos["P/L Year"])              : null;

        const field = (lbl, html) => `
          <div class="acct-field">
            <div class="acct-lbl">${lbl}</div>
            <div class="acct-val">${html}</div>
          </div>`;

        const tosField = (lbl, f) => f
          ? field(lbl, `<span style="color:${f.col}">${f.str}</span>`)
          : field(lbl, `<span style="color:var(--muted)">—</span>`);

        el.innerHTML = `
          <div class="acct-card">
            ${field("Starting Balance", `$<span
                class="acct-bal-edit"
                contenteditable="true"
                onblur="saveBalance(this.textContent)"
                onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}"
              >${startBal.toFixed(2)}</span>`)}
            ${tosField("Net Liq",   netLiq)}
            ${tosField("Option BP", optionBP)}
            ${tosField("P/L Day",   plDay)}
            ${tosField("P/L Open",  plOpen)}
            ${field("Best Day",  `<span style="color:${col(bestDay)}">${fmtDollar(bestDay)}</span>`)}
            ${field("Worst Day", `<span style="color:${col(worstDay)}">${fmtDollar(worstDay)}</span>`)}
            ${tosField("P/L Year",  plYear)}
            ${field("Total Trades", `<span class="neu">${trades.length}</span>`)}
            ${field("Last Trade",   `<span class="neu">${lastDate}</span>`)}
          </div>`;
      }

      function getGoalRiskPcts() {
        const g = localStorage.getItem("smc_goal_pcts");
        const r = localStorage.getItem("smc_risk_pcts");
        return {
          goals: g ? JSON.parse(g) : [3, 5.5, 7.75, 9, 12],
          risks: r ? JSON.parse(r) : [0.75, 1.25, 1.85, 2.2, 2.95],
        };
      }

      function saveGoalPct(i, raw) {
        const v = parseFloat(String(raw).replace(/[^0-9.-]/g, ""));
        if (isNaN(v)) return;
        const { goals, risks } = getGoalRiskPcts();
        goals[i] = v;
        localStorage.setItem("smc_goal_pcts", JSON.stringify(goals));
        renderGoalRisk(computeStats(trades));
      }

      function saveRiskPct(i, raw) {
        const v = parseFloat(String(raw).replace(/[^0-9.-]/g, ""));
        if (isNaN(v)) return;
        const { goals, risks } = getGoalRiskPcts();
        risks[i] = v;
        localStorage.setItem("smc_risk_pcts", JSON.stringify(risks));
        renderGoalRisk(computeStats(trades));
      }

      function renderGoalRisk(s) {
        const bal = getStartingBalance();
        const { goals, risks } = getGoalRiskPcts();

        const goalRows = goals
          .map(
            (pct, i) => `
            <div class="gr-row">
              <span contenteditable="true" class="gr-pct"
                onblur="saveGoalPct(${i}, this.textContent)"
                onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}"
              >${pct.toFixed(2)}%</span>
              <span class="gr-dollar pos">+$${(bal * pct / 100).toFixed(2)}</span>
            </div>`,
          )
          .join("");

        const riskRows = risks
          .map(
            (pct, i) => `
            <div class="gr-row">
              <span contenteditable="true" class="gr-pct"
                onblur="saveRiskPct(${i}, this.textContent)"
                onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}"
              >${pct.toFixed(2)}%</span>
              <span class="gr-dollar neg">-$${(bal * pct / 100).toFixed(2)}</span>
            </div>`,
          )
          .join("");

        document.getElementById("gr-card").innerHTML = `
          <div class="gr-card">
            <div class="gr-side">
              <div class="gr-side-lbl">Goal</div>
              <div class="gr-rows">${goalRows}</div>
            </div>
            <div class="gr-divider"></div>
            <div class="gr-side">
              <div class="gr-side-lbl">Risk</div>
              <div class="gr-rows">${riskRows}</div>
            </div>
            <div class="gr-footer">
              <span>Starting With<span class="gr-footer-val">$${bal.toFixed(2)}</span></span>
              <span style="color:var(--border2)">·</span>
              <span>Click any % to edit · Enter or click away to save</span>
            </div>
          </div>`;
      }

      function renderGoals(s) {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const dayOfWeek = now.getDay(); // 0=Sun
        const dayOfMonth = now.getDate();
        const dayOfYear = Math.ceil(
          (now - new Date(now.getFullYear(), 0, 0)) / 864e5,
        );
        const todayPnl = trades
          .filter((t) => t.date === todayStr)
          .reduce((a, x) => a + x.pnl, 0);
        // Week: Mon-today
        const weekStart = new Date(now);
        weekStart.setDate(
          now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1),
        );
        const weekPnl = trades
          .filter((t) => {
            const d = new Date(t.date);
            return d >= weekStart && d <= now;
          })
          .reduce((a, x) => a + x.pnl, 0);
        const monthPnl = trades
          .filter((t) => t.date.startsWith(todayStr.slice(0, 7)))
          .reduce((a, x) => a + x.pnl, 0);
        const yearPnl = trades
          .filter((t) => t.date.startsWith(todayStr.slice(0, 4)))
          .reduce((a, x) => a + x.pnl, 0);
        const items = [
          { label: "Daily", current: todayPnl, target: goals.daily },
          { label: "Weekly", current: weekPnl, target: goals.weekly },
          { label: "Monthly", current: monthPnl, target: goals.monthly },
          { label: "Yearly", current: yearPnl, target: goals.yearly },
        ];
        const now2 = new Date();
        document.getElementById("goal-date-info").textContent =
          now2.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        document.getElementById("goals-display").innerHTML = items
          .map((it) => {
            const pct = it.target
              ? Math.min(100, Math.max(0, (it.current / it.target) * 100))
              : 0;
            const onTrack = it.current >= 0;
            const key = it.label.toLowerCase();
            return `<div>
      <label style="font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:1px">${it.label}</label>
      <div class="goal-nums">
        <span class="${pnlClass(it.current)}">${it.current >= 0 ? "+" : ""}$${Math.abs(it.current).toFixed(0)}</span>
        <span style="color:var(--muted)">/ <span
          contenteditable="true"
          title="Click to edit goal"
          style="cursor:pointer;border-bottom:1px dashed var(--muted);outline:none"
          onblur="updateGoal('${key}', this.textContent)"
          onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur()}"
        >$${it.target.toLocaleString()}</span></span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${onTrack ? "var(--green)" : "var(--red)"}"></div></div>
      <div style="font-size:13px;color:var(--muted);margin-top:3px">${pct.toFixed(0)}% of goal</div>
    </div>`;
          })
          .join("");
      }

      function updateGoal(key, rawText) {
        const val = parseFloat(rawText.replace(/[$,]/g, ""));
        if (isNaN(val) || val <= 0) return;
        goals[key] = val;
        saveGoals();
        renderGoals(computeStats(trades));
      }

      function destroyChart(id) {
        if (charts[id]) {
          charts[id].destroy();
          delete charts[id];
        }
      }

      function renderCharts(viewTrades) {
        const tList = viewTrades || trades;
        const sorted = [...tList].sort((a, b) => a.date.localeCompare(b.date));
        // Cumulative P&L
        destroyChart("cumulative");
        let cum = 0,
          cumLabels = [],
          cumData = [];
        sorted.forEach((t) => {
          cum += t.pnl;
          cumLabels.push(t.date + " " + t.ticker);
          cumData.push(+cum.toFixed(2));
        });
        const ctx1 = document
          .getElementById("chart-cumulative")
          .getContext("2d");
        const lineColor = cumData[cumData.length - 1] >= 0 ? "#22c55e" : "#da7756";
        charts["cumulative"] = new Chart(ctx1, {
          type: "line",
          data: {
            labels: cumLabels,
            datasets: [
              {
                data: cumData,
                borderColor: lineColor,
                backgroundColor: "transparent",
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHoverBackgroundColor: lineColor,
                pointHoverBorderColor: lineColor,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: { label: (ctx) => "$" + ctx.parsed.y.toFixed(2) },
                backgroundColor: "#1a1a1a",
                borderColor: "#2a2a2a",
                borderWidth: 1,
                titleColor: "#a8a8a8",
                bodyColor: "#ebebeb",
              },
            },
            scales: {
              x: {
                display: true,
                grid: { display: false },
                border: { display: false },
                ticks: {
                  color: "#a8a8a8",
                  font: { size: 11, family: "'Space Mono', monospace" },
                  maxRotation: 0,
                  maxTicksLimit: 6,
                },
              },
              y: {
                grid: { color: "#2a2a2a", drawBorder: false },
                border: { display: false, dash: [0] },
                ticks: {
                  color: "#a8a8a8",
                  font: { size: 11, family: "'Space Mono', monospace" },
                  callback: (v) => "$" + v,
                },
              },
            },
            animation: { duration: 400 },
          },
        });

        // Daily P&L
        destroyChart("daily");
        const dayMap = {};
        sorted.forEach((t) => {
          dayMap[t.date] = (dayMap[t.date] || 0) + t.pnl;
        });
        const dayLabels = Object.keys(dayMap),
          dayData = Object.values(dayMap);
        const ctx2 = document.getElementById("chart-daily").getContext("2d");
        charts["daily"] = new Chart(ctx2, {
          type: "bar",
          data: {
            labels: dayLabels,
            datasets: [
              {
                data: dayData,
                backgroundColor: dayData.map((v) =>
                  v >= 0 ? "rgba(34,197,94,.65)" : "rgba(239,68,68,.65)",
                ),
                borderColor: dayData.map((v) =>
                  v >= 0 ? "#22c55e" : "#ef4444",
                ),
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: { label: (ctx) => "$" + ctx.parsed.y.toFixed(2) },
              },
            },
            scales: {
              x: {
                ticks: { color: "#f4f4f4", font: { size: 12 } },
                grid: { color: "#222" },
                border: { color: "#222" },
              },
              y: {
                grid: { color: "#222" },
                ticks: { color: "#f4f4f4", callback: (v) => "$" + v },
                border: { color: "#222" },
              },
            },
            animation: { duration: 400 },
          },
        });

        // Win rate by pattern
        destroyChart("winrate");
        const patStats = {};
        patterns.forEach((p) => {
          patStats[p] = { wins: 0, total: 0 };
        });
        tList.forEach((t) => {
          if (patStats[t.pattern]) {
            patStats[t.pattern].total++;
            if (t.pnl > 0) patStats[t.pattern].wins++;
          }
        });
        const wrLabels = patterns.filter((p) => patStats[p].total > 0);
        const wrData = wrLabels.map((p) =>
          patStats[p].total
            ? +((patStats[p].wins / patStats[p].total) * 100).toFixed(1)
            : 0,
        );
        const wrColors = wrData.map((v) =>
          v >= 50 ? "rgba(34,197,94,.65)" : "rgba(239,68,68,.65)",
        );
        const ctx3 = document.getElementById("chart-winrate").getContext("2d");
        charts["winrate"] = new Chart(ctx3, {
          type: "bar",
          data: {
            labels: wrLabels,
            datasets: [
              {
                data: wrData,
                backgroundColor: wrColors,
                borderColor: wrColors.map((c) => c.replace(".65", ".9")),
                borderWidth: 1,
              },
            ],
          },
          options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: { label: (ctx) => ctx.parsed.x.toFixed(1) + "%" },
              },
            },
            scales: {
              x: {
                max: 100,
                grid: { color: "#222" },
                ticks: { color: "#f4f4f4", callback: (v) => v + "%" },
                border: { color: "#222" },
              },
              y: {
                ticks: { color: "#f4f4f4", font: { size: 12 } },
                grid: { color: "#222" },
                border: { color: "#222" },
              },
            },
            animation: { duration: 400 },
          },
        });

        // P&L by pattern
        destroyChart("pnl-pattern");
        const pnlByPat = {};
        patterns.forEach((p) => {
          pnlByPat[p] = 0;
        });
        tList.forEach((t) => {
          if (pnlByPat[t.pattern] !== undefined) pnlByPat[t.pattern] += t.pnl;
        });
        const ppLabels = patterns.filter((p) => pnlByPat[p] !== 0);
        const ppData = ppLabels.map((p) => +pnlByPat[p].toFixed(2));
        const ppColors = ppData.map((v) =>
          v >= 0 ? "rgba(249,115,22,.65)" : "rgba(239,68,68,.65)",
        );
        const ctx4 = document
          .getElementById("chart-pnl-pattern")
          .getContext("2d");
        charts["pnl-pattern"] = new Chart(ctx4, {
          type: "bar",
          data: {
            labels: ppLabels,
            datasets: [
              {
                data: ppData,
                backgroundColor: ppColors,
                borderColor: ppColors.map((c) => c.replace(".65", ".9")),
                borderWidth: 1,
              },
            ],
          },
          options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: { label: (ctx) => "$" + ctx.parsed.x.toFixed(2) },
              },
            },
            scales: {
              x: {
                grid: { color: "#222" },
                ticks: { color: "#f4f4f4", callback: (v) => "$" + v },
                border: { color: "#222" },
              },
              y: {
                ticks: { color: "#f4f4f4", font: { size: 12 } },
                grid: { color: "#222" },
                border: { color: "#222" },
              },
            },
            animation: { duration: 400 },
          },
        });
      }

      // ============================================================
      // RECENT TRADES CARD
      // ============================================================
      function renderRecentTrades(viewTrades) {
        const el = document.getElementById("recent-trades");
        if (!el) return;

        // Take the 10 most recent trades by date
        const recent = [...viewTrades]
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 10);

        if (!recent.length) {
          el.innerHTML = `<div class="section-label" style="margin-top:20px">Recent Trades</div>
            <div style="color:var(--muted);padding:20px 0">No trades in this window.</div>`;
          return;
        }

        function sparkline(t) {
          // Build a mini SVG path from entry → exit price
          const entry = t.entryPrice || t.avg_entry_price || 0;
          const exit  = t.exitPrice  || t.avg_exit_price  || 0;
          if (!entry || !exit) return "";
          const w = 80, h = 32, pad = 4;
          const lo = Math.min(entry, exit) * 0.999;
          const hi = Math.max(entry, exit) * 1.001;
          const range = hi - lo || 0.001;
          const py = (v) => pad + (h - pad * 2) * (1 - (v - lo) / range);
          // 3-point path: entry → midpoint with slight curve → exit
          const mid = (entry + exit) / 2;
          const x1 = pad, x2 = w / 2, x3 = w - pad;
          const y1 = py(entry), y2 = py(mid) + (exit > entry ? -3 : 3), y3 = py(exit);
          const color = t.pnl >= 0 ? "#22c55e" : "#ef4444";
          return `<svg width="${w}" height="${h}" style="display:block">
            <polyline points="${x1},${y1} ${x2},${y2} ${x3},${y3}"
              fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="${x3}" cy="${y3}" r="2.5" fill="${color}"/>
          </svg>`;
        }

        const cards = recent.map((t) => {
          const sym = t.ticker || t.symbol || "—";
          const pnl = typeof t.pnl === "number" ? t.pnl : 0;
          const cls = pnlClass(pnl);
          const sign = pnl >= 0 ? "+" : "";
          const entry = (t.entryPrice || t.avg_entry_price || 0).toFixed(2);
          const exit  = (t.exitPrice  || t.avg_exit_price  || 0).toFixed(2);
          const qty   = t.shares || t.total_qty || "";
          return `<div class="recent-trade-card">
            <div class="rtc-top">
              <span class="rtc-sym">${sym}</span>
              <span class="rtc-pnl ${cls}">${sign}$${Math.abs(pnl).toFixed(2)}</span>
            </div>
            <div class="rtc-spark">${sparkline(t)}</div>
            <div class="rtc-meta">
              <span>${t.date || ""}</span>
              <span>${qty ? qty + " sh" : ""}</span>
            </div>
            <div class="rtc-prices">
              <span class="rtc-price-lbl">In <b>$${entry}</b></span>
              <span class="rtc-price-lbl">Out <b>$${exit}</b></span>
            </div>
          </div>`;
        }).join("");

        el.innerHTML = `
          <div class="section-label" style="margin-top:20px">Recent Trades</div>
          <div class="recent-trades-grid">${cards}</div>`;
      }

      // ============================================================
      // GOALS MODAL
      // ============================================================
      function openGoalsModal() {
        document.getElementById("g-daily").value = goals.daily;
        document.getElementById("g-weekly").value = goals.weekly;
        document.getElementById("g-monthly").value = goals.monthly;
        document.getElementById("g-yearly").value = goals.yearly;
        document.getElementById("modal-goals").classList.add("show");
      }
      function saveGoalsFromModal() {
        goals.daily =
          parseFloat(document.getElementById("g-daily").value) || goals.daily;
        goals.weekly =
          parseFloat(document.getElementById("g-weekly").value) || goals.weekly;
        goals.monthly =
          parseFloat(document.getElementById("g-monthly").value) ||
          goals.monthly;
        goals.yearly =
          parseFloat(document.getElementById("g-yearly").value) || goals.yearly;
        saveGoals();
        closeModal("modal-goals");
        renderGoals(computeStats(trades));
      }
      function closeModal(id) {
        document.getElementById(id).classList.remove("show");
      }

      // ============================================================
      // TAB 2: DAILY LOG
      // ============================================================
