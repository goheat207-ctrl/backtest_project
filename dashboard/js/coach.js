"use strict";

      function renderCoach() {
        const insights = runRuleEngine();
        const el = document.getElementById("coach-insights");
        if (!insights.length) {
          el.innerHTML =
            '<div class="insight-card ok"><div class="insight-title"><span style="color:var(--green)">✓</span> No Issues Detected</div><div class="insight-msg">Your recent trading looks clean. Keep it up. Add more trades to get deeper pattern analysis.</div></div>';
        } else {
          el.innerHTML = insights.map(renderInsightCard).join("");
        }
        // Pre-fill Claude textarea
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recent = trades
          .filter((t) => new Date(t.date) >= sevenDaysAgo && t.writeUp)
          .sort((a, b) => b.date.localeCompare(a.date));
        const writeups = recent
          .map(
            (t) =>
              `[${t.date}] ${t.ticker} (${t.pattern}) ${t.pnl >= 0 ? "+" : ""}$${t.pnl.toFixed(2)}\n${t.writeUp}`,
          )
          .join("\n\n---\n\n");
        document.getElementById("claude-writeups").value =
          writeups ||
          "No write-ups in the last 7 days. Add post-trade write-ups in the Daily Log to enable AI analysis.";
        // Restore key
        const k = localStorage.getItem("smc_claude_key") || "";
        document.getElementById("claude-key").value = k;
      }

      function runRuleEngine() {
        const insights = [];
        if (!trades.length) return insights;
        const sorted = [...trades].sort((a, b) => b.date.localeCompare(a.date));
        // 1. No Catalyst
        const noCat = trades.filter((t) => !t.catalyst && t.pnl < 0);
        if (noCat.length >= 2) {
          insights.push({
            type: "warn",
            title: "No-Catalyst Losses",
            count: noCat.length,
            msg: `${noCat.length} losing trades taken without a catalyst. Small Cap setups without a binary catalyst have significantly lower follow-through. Tickers: ${noCat.map((t) => t.ticker).join(", ")}.`,
            action:
              "Require a clear catalyst (FDA, earnings, M&A, contract) before entering any small cap long. If there's no news, wait for the next setup.",
          });
        }
        // 2. Low Rel Vol
        const lowVol = trades.filter((t) => t.relVol > 0 && t.relVol < 5);
        if (lowVol.length >= 2) {
          insights.push({
            type: "danger",
            title: "Low Relative Volume",
            count: lowVol.length,
            msg: `${lowVol.length} trades with relative volume below 5×. Low rel vol is the #1 predictor of failed Small Cap breakouts. These trades: ${lowVol.map((t) => t.ticker + " (" + t.relVol + "x)").join(", ")}.`,
            action:
              "Set a minimum rel vol filter of 5× before entering. Best setups have 10×+ in pre-market. If it's not moving, it's not your trade.",
          });
        }
        // 3. Chasing
        const chasing = trades.filter(
          (t) =>
            t.premarketHigh > 0 &&
            t.entryPrice > t.premarketHigh * 1.03 &&
            t.pnl < 0,
        );
        if (chasing.length >= 1) {
          insights.push({
            type: "danger",
            title: "Chasing Above PM High",
            count: chasing.length,
            msg: `${chasing.length} trades entered more than 3% above the premarket high. These tend to trap late buyers: ${chasing.map((t) => t.ticker).join(", ")}.`,
            action:
              "Only enter at or just above the premarket high level. If the stock has already run 5%+ above PM high, you missed it — wait for the next pullback setup.",
          });
        }
        // 4. Pattern loss rate
        const patLoss = {};
        patterns.forEach((p) => {
          const pt = trades.filter((t) => t.pattern === p);
          if (pt.length >= 3) {
            const wr = pt.filter((t) => t.pnl > 0).length / pt.length;
            if (wr < 0.5) patLoss[p] = { wr, count: pt.length };
          }
        });
        Object.entries(patLoss).forEach(([p, st]) => {
          insights.push({
            type: "warn",
            title: `Over-Trading Weak Pattern: ${p}`,
            count: st.count,
            msg: `Your win rate on "${p}" is ${(st.wr * 100).toFixed(0)}% across ${st.count} trades. You may be forcing this pattern when conditions aren't right.`,
            action: `Review your ${p} entry criteria. Consider stepping back from this setup until you identify what's causing the sub-50% win rate.`,
          });
        });
        // 5. Execution grade drift
        const recent10 = sorted.slice(0, 10);
        const poorGrades = recent10.filter(
          (t) => t.entryGrade === "C" || t.entryGrade === "B",
        );
        if (poorGrades.length >= 5) {
          insights.push({
            type: "warn",
            title: "Entry Quality Declining",
            count: poorGrades.length,
            msg: `${poorGrades.length} of your last 10 trades had B or C entry grades. Your entry quality has declined — this often indicates emotional sizing or reactive entries.`,
            action:
              "Slow down before each entry. Only take A-grade setups. If you've missed a setup, wait for the next one rather than chasing.",
          });
        }
        // 6. Large float violations
        const largeFloat = trades.filter((t) => t.float > 50 && t.pnl < 0);
        if (largeFloat.length >= 2) {
          insights.push({
            type: "warn",
            title: "Large Float Trades",
            count: largeFloat.length,
            msg: `${largeFloat.length} losing trades on stocks with >50M share floats. Small Cap momentum strategies work best on low-float names. High-float stocks don't move the same way.`,
            action:
              "Stick to floats under 20M for your core setups. Larger floats require institutional participation and different catalysts.",
          });
        }
        // 7. Emotional state
        const reactive = sorted
          .slice(0, 10)
          .filter((t) => t.emotionalState === "Reactive" && t.pnl < 0);
        if (reactive.length >= 2) {
          insights.push({
            type: "danger",
            title: "Reactive Trading Losses",
            count: reactive.length,
            msg: `${reactive.length} recent losses were taken while in a "Reactive" emotional state. Reactive decisions consistently underperform rule-based entries.`,
            action:
              "If you notice yourself feeling reactive, step away for 15 minutes. No trade is worth the emotional cost of a reactive loss.",
          });
        }
        return insights;
      }

      function renderInsightCard(ins) {
        return `<div class="insight-card ${ins.type}">
    <div class="insight-title">
      <div class="insight-title-left">
        <span style="color:${ins.type === "danger" ? "var(--red)" : "var(--orange)"}">${ins.type === "danger" ? "⚠" : "◆"} ${ins.title}</span>
        <span class="insight-count ${ins.type === "danger" ? "red" : ""}">${ins.count} trade${ins.count > 1 ? "s" : ""}</span>
      </div>
      <button class="insight-dismiss" onclick="this.closest('.insight-card').remove()" title="Dismiss">✕</button>
    </div>
    <div class="insight-msg">${ins.msg}</div>
    <div class="insight-action">→ ${ins.action}</div>
  </div>`;
      }

      function toggleClaude() {
        const body = document.getElementById("claude-body");
        const lbl = document.getElementById("claude-toggle-lbl");
        const open = body.classList.toggle("open");
        lbl.textContent = open ? "▲ collapse" : "▼ expand";
      }

      async function sendToClaude() {
        const key = document.getElementById("claude-key").value.trim();
        if (!key) {
          alert("Please enter your Anthropic API key.");
          return;
        }
        localStorage.setItem("smc_claude_key", key);
        const writeups = document.getElementById("claude-writeups").value;
        if (!writeups.trim()) {
          alert("No write-ups to analyze.");
          return;
        }
        const btn = document.getElementById("claude-send-btn");
        const resp = document.getElementById("claude-resp");
        btn.innerHTML = '<span class="spinner"></span>Analyzing…';
        btn.disabled = true;
        resp.classList.remove("show");
        const stats = computeStats(trades);
        const prompt = `You are a performance coach for a small cap momentum day trader. Here is their recent trading data:\n\nTotal P&L: $${stats.totalPnl.toFixed(2)}\nWin Rate: ${(stats.winRate * 100).toFixed(1)}%\nProfit Factor: ${stats.profitFactor.toFixed(2)}\nAvg Win: $${stats.avgWin.toFixed(2)} | Avg Loss: $${stats.avgLoss.toFixed(2)}\n\nRecent post-trade write-ups:\n\n${writeups}\n\nPlease provide:\n1. Key behavioral patterns you observe (both positive and negative)\n2. The top 2-3 mistakes to address immediately\n3. Specific rules or filters to implement based on these trades\n4. Mindset coaching for the areas of weakness\n\nBe direct, specific, and actionable. Reference specific trades from the write-ups where relevant.`;
        try {
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": key,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
              "anthropic-dangerous-direct-browser-access": "true",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-6",
              max_tokens: 1024,
              messages: [{ role: "user", content: prompt }],
            }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error?.message || "API error " + res.status);
          }
          const data = await res.json();
          resp.textContent = data.content[0].text;
          resp.classList.add("show");
        } catch (e) {
          resp.textContent = "Error: " + e.message;
          resp.classList.add("show");
        }
        btn.innerHTML = "Send to Claude for Deep Analysis";
        btn.disabled = false;
      }

      // ============================================================
      // TAB 5: CALENDAR
      // ============================================================
      function renderCalendar() {
        document.getElementById("yr-display").textContent = calYear;
        const yearTrades = trades.filter((t) =>
          t.date.startsWith(calYear + ""),
        );
        const yearPnl = yearTrades.reduce((a, x) => a + x.pnl, 0);
        const tradingDays = new Set(yearTrades.map((t) => t.date)).size;
        document.getElementById("cal-year-pnl").textContent =
          (yearPnl >= 0 ? "+" : "") + "$" + Math.abs(yearPnl).toFixed(2);
        document.getElementById("cal-year-pnl").className =
          yearPnl >= 0 ? "pos" : "neg";
        document.getElementById("cal-trading-days").textContent = tradingDays;
        // Build date → pnl map
        const dayMap = {};
        trades
          .filter((t) => t.date.startsWith(calYear + ""))
          .forEach((t) => {
            dayMap[t.date] = (dayMap[t.date] || 0) + t.pnl;
          });
        const maxAbs = Math.max(1, ...Object.values(dayMap).map(Math.abs));
        const today = new Date().toISOString().slice(0, 10);
        const months = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
        const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
        document.getElementById("months-grid").innerHTML = months
          .map((mname, mi) => {
            const mStr = calYear + "-" + (mi + 1).toString().padStart(2, "0");
            const mTrades = Object.entries(dayMap).filter(([d]) =>
              d.startsWith(mStr),
            );
            const mPnl = mTrades.reduce((a, [, v]) => a + v, 0);
            const pnlStr = mTrades.length
              ? `<span class="${mPnl >= 0 ? "pos" : "neg"}">${mPnl >= 0 ? "+" : ""}$${Math.abs(mPnl).toFixed(0)}</span>`
              : '<span style="color:var(--muted)">—</span>';
            const firstDay = new Date(calYear, mi, 1).getDay(); // 0=Sun
            const dim = daysInMonth(calYear, mi);
            let dayCells = "";
            for (let i = 0; i < firstDay; i++)
              dayCells += '<div class="day-cell empty"></div>';
            for (let d = 1; d <= dim; d++) {
              const ds =
                calYear +
                "-" +
                (mi + 1).toString().padStart(2, "0") +
                "-" +
                d.toString().padStart(2, "0");
              const pnl = dayMap[ds];
              let cls = "day-cell no-trade",
                bg = "";
              if (pnl !== undefined) {
                const intensity = Math.min(1, Math.abs(pnl) / maxAbs);
                if (pnl > 0) {
                  const g = Math.round(60 + intensity * 120);
                  bg = `background:rgba(16,${g + 70},129,${0.3 + intensity * 0.6})`;
                  cls = "day-cell profit";
                } else {
                  const r = Math.round(150 + intensity * 100);
                  bg = `background:rgba(${r},68,68,${0.3 + intensity * 0.6})`;
                  cls = "day-cell loss";
                }
              }
              const isToday = ds === today ? " today-cell" : "";
              dayCells += `<div class="${cls}${isToday}" style="${bg}" onclick="showDayDetail('${ds}')" title="${ds}${pnl !== undefined ? ": " + (pnl >= 0 ? "+" : "") + "$" + Math.abs(pnl).toFixed(2) : ""}">${d}</div>`;
            }
            return `<div class="month-card">
      <div class="month-hdr"><span class="month-name">${mname}</span>${pnlStr}</div>
      <div class="cal-dow">${["S", "M", "T", "W", "T", "F", "S"].map((d) => `<div class="dow-lbl">${d}</div>`).join("")}</div>
      <div class="day-grid">${dayCells}</div>
    </div>`;
          })
          .join("");
      }

      function changeYear(d) {
        calYear += d;
        renderCalendar();
        document.getElementById("day-detail").classList.remove("show");
      }

      function showDayDetail(ds) {
        const dayTrades = trades.filter((t) => t.date === ds);
        const panel = document.getElementById("day-detail");
        document.getElementById("day-detail-title").textContent =
          ds +
          (dayTrades.length
            ? ` · ${dayTrades.length} trade${dayTrades.length > 1 ? "s" : ""}`
            : " · No trades");
        if (!dayTrades.length) {
          panel.classList.add("show");
          document.getElementById("day-detail-trades").innerHTML =
            '<div style="color:var(--muted);font-size:11px;padding:8px 0">No trades logged for this day.</div>';
          return;
        }
        const dayPnl = dayTrades.reduce((a, x) => a + x.pnl, 0);
        document.getElementById("day-detail-trades").innerHTML =
          `<div style="margin-bottom:8px;font-size:11px;color:var(--muted)">Day P&L: <span class="${pnlClass(dayPnl)}" style="font-weight:600">${dayPnl >= 0 ? "+" : ""}$${Math.abs(dayPnl).toFixed(2)}</span></div>` +
          dayTrades
            .map(
              (t) => `<div class="day-trade-row">
      <span>${t.isBestOp ? "⭐ " : ""}<span style="font-weight:600;color:var(--text)">${t.ticker}</span> · <span style="color:var(--orange)">${t.pattern}</span></span>
      <span class="${pnlClass(t.pnl)}">${t.pnl >= 0 ? "+" : ""}$${Math.abs(t.pnl).toFixed(2)}</span>
    </div>`,
            )
            .join("");
        panel.classList.add("show");
        panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

      // ============================================================
      // INIT
      // ============================================================
      (function init() {
        loadData();
        // Set Chart.js defaults
        Chart.defaults.color = "#a8a8a8";
        Chart.defaults.borderColor = "#2a2a2a";
        Chart.defaults.font.family = "'Space Mono',monospace";
        Chart.defaults.font.size = 12;
        renderDashboard();
        // Close modals on background click
        document.querySelectorAll(".modal-bg").forEach((bg) =>
          bg.addEventListener("click", (e) => {
            if (e.target === bg) bg.classList.remove("show");
          }),
        );
      })();
