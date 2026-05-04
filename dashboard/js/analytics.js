"use strict";

// ── Inject scoped CSS ────────────────────────────────────────────────────────
(function injectAnStyles() {
  if (document.getElementById("an-styles")) return;
  const s = document.createElement("style");
  s.id = "an-styles";
  s.textContent = `
    .an-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .an-card {
      background: var(--surface, #1a1e23);
      border: 1px solid var(--border, #2a2a2a);
      padding: 20px;
    }
    .an-card-full { grid-column: 1 / -1; }
    .an-card-empty {
      color: var(--muted, #666);
      font-size: 12px;
      padding: 26px 0;
      text-align: center;
    }
    .an-stats-table {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      border: 1px solid var(--border, #2a2a2a);
    }
    .an-stat-cell {
      min-height: 52px;
      padding: 13px 15px;
      border-right: 1px solid var(--border, #2a2a2a);
      border-bottom: 1px solid var(--border, #2a2a2a);
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
    }
    .an-stat-cell:nth-child(3n) { border-right: none; }
    .an-stat-name {
      color: var(--muted, #666);
      font-size: 13px;
      line-height: 1.3;
    }
    .an-stat-val {
      color: var(--text, #f4f4f4);
      font-family: var(--mono, monospace);
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
    }
    .an-chart-title {
      font-size: 11px;
      color: var(--orange, #f97316);
      text-transform: uppercase;
      letter-spacing: 2px;
      font-family: var(--display, monospace);
      font-weight: 700;
      margin-bottom: 16px;
    }
    .an-big-num {
      font-size: 52px;
      font-weight: 700;
      font-family: var(--display, monospace);
      color: var(--text, #f4f4f4);
      line-height: 1;
    }
    .an-label {
      font-size: 12px;
      color: var(--muted, #666);
    }
    .an-bar-row {
      display: flex;
      align-items: center;
      margin-bottom: 9px;
      gap: 8px;
    }
    .an-bar-label {
      font-size: 12px;
      color: var(--muted, #666);
      min-width: 110px;
    }
    .an-bar-track {
      flex: 1;
      height: 6px;
      background: var(--border, #2a2a2a);
      border-radius: 3px;
      overflow: hidden;
    }
    .an-bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width .4s ease;
    }
    .an-bar-val {
      min-width: 68px;
      text-align: right;
      font-size: 12px;
      font-family: var(--mono, monospace);
      font-weight: 700;
    }
    .an-bar-pct {
      min-width: 46px;
      text-align: right;
      font-size: 11px;
      color: var(--muted, #666);
    }
    .an-zero-row {
      display: grid;
      grid-template-columns: minmax(92px, 132px) 1fr minmax(74px, auto);
      gap: 10px;
      align-items: center;
      margin-bottom: 9px;
    }
    .an-zero-chart {
      position: relative;
      height: 10px;
      background: rgba(255,255,255,.035);
      border-radius: 5px;
      overflow: hidden;
    }
    .an-zero-axis {
      position: absolute;
      left: 50%;
      top: 0;
      bottom: 0;
      width: 1px;
      background: var(--muted, #666);
      opacity: .7;
    }
    .an-zero-fill {
      position: absolute;
      top: 0;
      height: 100%;
      border-radius: 5px;
    }
    .an-line-outer {
      display: flex;
      gap: 0;
      align-items: stretch;
    }
    .an-line-yaxis {
      display: flex;
      flex-direction: column-reverse;
      justify-content: space-between;
      width: 48px;
      padding: 4px 6px 4px 0;
      font-size: 10px;
      color: var(--muted, #a8a8a8);
      font-family: var(--mono, monospace);
      text-align: right;
      flex-shrink: 0;
    }
    .an-line-wrap {
      height: 180px;
      flex: 1;
    }
    .an-line-labels {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      color: var(--muted, #a8a8a8);
      font-size: 10px;
      font-family: var(--mono, monospace);
      margin-top: 6px;
      padding-left: 54px;
    }
    .an-subnav { display:flex; gap:0; border-bottom:1px solid var(--border,#2a2a2a); margin-bottom:20px; }
    .an-tab { background:none; border:none; border-bottom:3px solid transparent; color:var(--muted,#666); padding:10px 20px; font-size:12px; font-family:var(--display,monospace); font-weight:700; text-transform:uppercase; letter-spacing:1px; cursor:pointer; transition:all .15s; margin-bottom:-1px; }
    .an-tab:hover { color:var(--orange,#da7756); }
    .an-tab.active { color:var(--orange,#da7756); border-bottom-color:var(--orange,#da7756); }
    .an-period-btn { background:none; border:1px solid var(--border,#2a2a2a); color:var(--muted,#a8a8a8); padding:5px 14px; font-size:11px; font-family:var(--display,monospace); font-weight:700; text-transform:uppercase; letter-spacing:1px; cursor:pointer; transition:all .15s; }
    .an-period-btn + .an-period-btn { border-left:none; }
    .an-period-btn:hover { color:var(--orange,#da7756); border-color:var(--orange,#da7756); }
    .an-period-btn.active { color:var(--orange,#da7756); border-color:var(--orange,#da7756); background:var(--orange-dim,rgba(218,119,86,.15)); }
    .an-panel { display:none; }
    .an-panel.active { display:block; }
    @media (max-width: 1100px) { .an-stats-table { grid-template-columns: 1fr 1fr; } .an-stat-cell:nth-child(3n) { border-right: 1px solid var(--border,#2a2a2a); } .an-stat-cell:nth-child(2n) { border-right: none; } }
    @media (max-width: 900px) { .an-grid-2 { grid-template-columns: 1fr; } .an-stats-table { grid-template-columns: 1fr; } .an-stat-cell { border-right: none !important; } }
  `;
  document.head.appendChild(s);
})();

// ── Tab switcher ─────────────────────────────────────────────────────────────
function switchAnTab(name, btn) {
  document
    .querySelectorAll(".an-panel")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".an-tab")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("an-" + name).classList.add("active");
  btn.classList.add("active");
}

// ── Filter helper ─────────────────────────────────────────────────────────────
function getAnTrades() {
  const sym = (document.getElementById("an-filter-sym") || {}).value || "";
  const period =
    (document.getElementById("an-filter-period") || {}).value || "all";
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  let filtered = [...(typeof trades !== "undefined" ? trades : [])];
  if (sym) filtered = filtered.filter((t) => t.ticker === sym);
  if (period === "week") {
    const ws = new Date(now);
    ws.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    filtered = filtered.filter((t) => t.date >= ws.toISOString().slice(0, 10));
  } else if (period === "month") {
    filtered = filtered.filter((t) => t.date.startsWith(todayStr.slice(0, 7)));
  } else if (period === "year") {
    filtered = filtered.filter((t) => t.date.startsWith(todayStr.slice(0, 4)));
  }
  return filtered;
}

// ── Main entry point ──────────────────────────────────────────────────────────
function renderAnalytics() {
  const t = getAnTrades();
  const allTrades = typeof trades !== "undefined" ? trades : [];

  // Populate symbol filter
  const symSel = document.getElementById("an-filter-sym");
  if (symSel) {
    const syms = [...new Set(allTrades.map((x) => x.ticker))].sort();
    const cur = symSel.value;
    symSel.innerHTML =
      '<option value="">All Symbols</option>' +
      syms
        .map(
          (s) =>
            `<option value="${s}"${s === cur ? " selected" : ""}>${s}</option>`,
        )
        .join("");
  }
  const ct = document.getElementById("an-trade-count");
  if (ct) ct.textContent = t.length + " trades";

  renderAnOverview(t, 30);
  renderAnStats(t);
  renderAnDays(t);
  renderAnPrice(t);
  renderAnStreaks(t);
}

// ── Overview tab ──────────────────────────────────────────────────────────────
function renderAnOverview(t, days) {
  days = days || 30;
  const el = document.getElementById("an-overview-content");
  if (!el) return;

  // Filter to last N days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const filtered = t.filter((x) => x.date >= cutoffStr);

  // Aggregate by date
  const dayMap = {};
  filtered.forEach((x) => {
    if (!dayMap[x.date])
      dayMap[x.date] = { pnl: 0, volume: 0, wins: 0, total: 0 };
    dayMap[x.date].pnl += x.pnl;
    dayMap[x.date].volume += x.shares || 0;
    dayMap[x.date].total++;
    if (x.pnl > 0) dayMap[x.date].wins++;
  });

  const dates = Object.keys(dayMap).sort();
  const dailyPnl = dates.map((d) => dayMap[d].pnl);
  const dailyVol = dates.map((d) => dayMap[d].volume);
  const dailyWinPct = dates.map((d) =>
    dayMap[d].total ? (dayMap[d].wins / dayMap[d].total) * 100 : 0,
  );

  let cum = 0;
  const cumPnl = dates.map((d) => {
    cum += dayMap[d].pnl;
    return cum;
  });

  // Destroy any existing overview charts
  Object.values(Chart.instances).forEach((c) => {
    if (
      ["an-ov-daily", "an-ov-cum", "an-ov-vol", "an-ov-winpct"].includes(
        c.canvas.id,
      )
    )
      c.destroy();
  });

  el.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px;gap:0">
      <button class="an-period-btn${days === 30 ? " active" : ""}" onclick="renderAnOverview(getAnTrades(),30)">30D</button>
      <button class="an-period-btn${days === 60 ? " active" : ""}" onclick="renderAnOverview(getAnTrades(),60)">60D</button>
      <button class="an-period-btn${days === 90 ? " active" : ""}" onclick="renderAnOverview(getAnTrades(),90)">90D</button>
    </div>
    <div class="an-grid-2">
      <div class="an-card">
        <div class="an-chart-title">Daily P&amp;L (${days} Days)</div>
        <div style="position:relative;height:260px"><canvas id="an-ov-daily"></canvas></div>
      </div>
      <div class="an-card">
        <div class="an-chart-title">Cumulative P&amp;L (${days} Days)</div>
        <div style="position:relative;height:260px"><canvas id="an-ov-cum"></canvas></div>
      </div>
      <div class="an-card">
        <div class="an-chart-title">Daily Volume (${days} Days)</div>
        <div style="position:relative;height:260px"><canvas id="an-ov-vol"></canvas></div>
      </div>
      <div class="an-card">
        <div class="an-chart-title">Win % by Day (${days} Days)</div>
        <div style="position:relative;height:260px"><canvas id="an-ov-winpct"></canvas></div>
      </div>
    </div>`;

  if (!dates.length) return;

  const xScale = {
    display: true,
    grid: { display: false },
    border: { display: false },
    ticks: {
      color: "#a8a8a8",
      font: { size: 11, family: "'Space Mono', monospace" },
      maxRotation: 0,
      maxTicksLimit: 6,
    },
  };
  const yScale = {
    grid: { color: "#2a2a2a" },
    border: { display: false },
    ticks: { color: "#a8a8a8", font: { size: 11, family: "'Space Mono', monospace" } },
  };
  const tip = {
    backgroundColor: "#1a1a1a",
    borderColor: "#2a2a2a",
    borderWidth: 1,
    titleColor: "#a8a8a8",
    bodyColor: "#ebebeb",
  };

  // Daily P&L
  new Chart(document.getElementById("an-ov-daily"), {
    type: "bar",
    data: {
      labels: dates,
      datasets: [{
        data: dailyPnl,
        backgroundColor: dailyPnl.map((v) =>
          v >= 0 ? "rgba(34,197,94,.7)" : "rgba(239,68,68,.7)",
        ),
        borderColor: dailyPnl.map((v) => (v >= 0 ? "#22c55e" : "#ef4444")),
        borderWidth: 1,
        borderRadius: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tip, callbacks: { label: (c) => "$" + c.parsed.y.toFixed(2) } },
      },
      scales: {
        x: xScale,
        y: { ...yScale, ticks: { ...yScale.ticks, callback: (v) => "$" + v } },
      },
      animation: { duration: 400 },
    },
  });

  // Cumulative P&L
  const lineColor = cumPnl[cumPnl.length - 1] >= 0 ? "#22c55e" : "#da7756";
  new Chart(document.getElementById("an-ov-cum"), {
    type: "line",
    data: {
      labels: dates,
      datasets: [{
        data: cumPnl,
        borderColor: lineColor,
        backgroundColor: "transparent",
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: lineColor,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tip, callbacks: { label: (c) => "$" + c.parsed.y.toFixed(2) } },
      },
      scales: {
        x: xScale,
        y: { ...yScale, ticks: { ...yScale.ticks, callback: (v) => "$" + v } },
      },
      animation: { duration: 400 },
    },
  });

  // Daily Volume
  new Chart(document.getElementById("an-ov-vol"), {
    type: "bar",
    data: {
      labels: dates,
      datasets: [{
        data: dailyVol,
        backgroundColor: "rgba(34,197,94,.65)",
        borderColor: "#22c55e",
        borderWidth: 1,
        borderRadius: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tip, callbacks: { label: (c) => c.parsed.y.toLocaleString() + " sh" } },
      },
      scales: {
        x: xScale,
        y: { ...yScale, ticks: { ...yScale.ticks, callback: (v) => v.toLocaleString() } },
      },
      animation: { duration: 400 },
    },
  });

  // Win % by Day
  new Chart(document.getElementById("an-ov-winpct"), {
    type: "bar",
    data: {
      labels: dates,
      datasets: [{
        data: dailyWinPct,
        backgroundColor: "rgba(34,197,94,.65)",
        borderColor: "#22c55e",
        borderWidth: 1,
        borderRadius: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tip, callbacks: { label: (c) => c.parsed.y.toFixed(0) + "%" } },
      },
      scales: {
        x: xScale,
        y: { ...yScale, min: 0, max: 100, ticks: { ...yScale.ticks, callback: (v) => v + "%" } },
      },
      animation: { duration: 400 },
    },
  });
}

// ── SVG: Semicircle gauge ─────────────────────────────────────────────────────
// greenRatio 0–1 = how much of the arc is green (left portion)
function svgGauge(greenRatio, w, h) {
  w = w || 180;
  h = h || 100;
  const r = w * 0.38;
  const cx = w / 2,
    cy = h * 0.88;
  const toXY = (ang) => [cx + r * Math.cos(ang), cy + r * Math.sin(ang)];
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const gr = clamp(greenRatio);
  const splitAng = Math.PI - gr * Math.PI;
  const [sx, sy] = toXY(Math.PI);
  const [spx, spy] = toXY(splitAng);
  const [ex, ey] = toXY(0);
  const sw = r * 0.2;
  return `
    <svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="display:block;margin:0 auto">
      <path d="M ${sx} ${sy} A ${r} ${r} 0 0 1 ${spx} ${spy}"
            fill="none" stroke="var(--green,#22c55e)" stroke-width="${sw}" stroke-linecap="round"/>
      <path d="M ${spx} ${spy} A ${r} ${r} 0 0 1 ${ex} ${ey}"
            fill="none" stroke="var(--red,#ef4444)" stroke-width="${sw}" stroke-linecap="round"/>
    </svg>`;
}

// ── SVG: Donut ────────────────────────────────────────────────────────────────
function svgDonut(greenRatio, size) {
  size = size || 130;
  const cx = size / 2, cy = size / 2;
  const outerR = size * 0.44;
  const innerR = outerR * 0.66;
  const gr = Math.max(0.001, Math.min(0.999, greenRatio));
  const gapDeg = 3;

  function polar(r, deg) {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  function arcPath(r1, r2, startDeg, endDeg, large) {
    const [ox1, oy1] = polar(r1, startDeg);
    const [ox2, oy2] = polar(r1, endDeg);
    const [ix2, iy2] = polar(r2, endDeg);
    const [ix1, iy1] = polar(r2, startDeg);
    return `M ${ox1.toFixed(2)} ${oy1.toFixed(2)} A ${r1.toFixed(2)} ${r1.toFixed(2)} 0 ${large} 1 ${ox2.toFixed(2)} ${oy2.toFixed(2)} L ${ix2.toFixed(2)} ${iy2.toFixed(2)} A ${r2.toFixed(2)} ${r2.toFixed(2)} 0 ${large} 0 ${ix1.toFixed(2)} ${iy1.toFixed(2)} Z`;
  }

  const greenEnd = -90 + gr * 360 - gapDeg / 2;
  const redStart = -90 + gr * 360 + gapDeg / 2;
  const redEnd = 270 - gapDeg / 2;
  const greenLarge = gr * 360 - gapDeg > 180 ? 1 : 0;
  const redLarge = (1 - gr) * 360 - gapDeg > 180 ? 1 : 0;

  return `
    <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="display:block">
      <path d="${arcPath(outerR, innerR, -90, greenEnd, greenLarge)}" fill="var(--green,#22c55e)"/>
      <path d="${arcPath(outerR, innerR, redStart, redEnd, redLarge)}" fill="var(--red,#ef4444)"/>
    </svg>`;
}

// ── Bar row helper ────────────────────────────────────────────────────────────
function barRow(label, pnl, pctOfTotal, maxAbs, labelWidth) {
  const w = maxAbs > 0 ? (Math.abs(pnl) / maxAbs) * 100 : 0;
  const color = pnl >= 0 ? "var(--green,#22c55e)" : "var(--red,#ef4444)";
  const sign = pnl >= 0 ? "+" : "";
  const lw = labelWidth || "110px";
  return `
    <div class="an-bar-row">
      <div class="an-bar-label" style="min-width:${lw}">${label}</div>
      <div class="an-bar-track">
        <div class="an-bar-fill" style="width:${w.toFixed(1)}%;background:${color}"></div>
      </div>
      <div class="an-bar-val" style="color:${color}">${sign}$${Math.abs(pnl).toFixed(2)}</div>
      <div class="an-bar-pct">${pctOfTotal.toFixed(2)}%</div>
    </div>`;
}

function fmtMoney(v) {
  if (!Number.isFinite(v)) return "n/a";
  const sign = v < 0 ? "-" : "";
  return `${sign}$${Math.abs(v).toFixed(2)}`;
}

function fmtMoneySigned(v) {
  if (!Number.isFinite(v)) return "n/a";
  return `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
}

function fmtPct(v, digits) {
  if (!Number.isFinite(v)) return "n/a";
  return `${(v * 100).toFixed(digits === undefined ? 1 : digits)}%`;
}

function fmtNum(v, digits) {
  if (!Number.isFinite(v)) return "n/a";
  return v.toFixed(digits === undefined ? 2 : digits);
}

function avg(items, getVal) {
  const vals = items.map(getVal).filter((v) => Number.isFinite(v));
  return vals.length ? vals.reduce((a, v) => a + v, 0) / vals.length : 0;
}

function stddev(vals) {
  const nums = vals.filter((v) => Number.isFinite(v));
  if (nums.length < 2) return 0;
  const mean = nums.reduce((a, v) => a + v, 0) / nums.length;
  const variance =
    nums.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / (nums.length - 1);
  return Math.sqrt(variance);
}

function dayKey(dateStr) {
  return (dateStr || "").slice(0, 10);
}

function groupBy(items, getKey) {
  const out = {};
  items.forEach((item) => {
    const key = getKey(item);
    if (!key) return;
    if (!out[key]) out[key] = [];
    out[key].push(item);
  });
  return out;
}

function sumPnl(items) {
  return +items.reduce((a, x) => a + (Number(x.pnl) || 0), 0).toFixed(2);
}

function tradeMovementPct(x) {
  if (!x.entryPrice || !x.exitPrice || x.entryPrice <= 0) return null;
  const raw = ((x.exitPrice - x.entryPrice) / x.entryPrice) * 100;
  return x.direction === "Short" ? -raw : raw;
}

function countBarRow(label, count, maxCount, labelWidth) {
  const w = maxCount > 0 ? (count / maxCount) * 100 : 0;
  const lw = labelWidth || "110px";
  return `
    <div class="an-bar-row">
      <div class="an-bar-label" style="min-width:${lw}">${label}</div>
      <div class="an-bar-track">
        <div class="an-bar-fill" style="width:${w.toFixed(1)}%;background:var(--green,#22c55e)"></div>
      </div>
      <div class="an-bar-val" style="color:var(--text,#f4f4f4)">${count}</div>
    </div>`;
}

function zeroBarRow(label, pnl, maxAbs, labelWidth) {
  const halfWidth = maxAbs > 0 ? (Math.abs(pnl) / maxAbs) * 50 : 0;
  const color = pnl >= 0 ? "var(--green,#22c55e)" : "var(--red,#ef4444)";
  const style =
    pnl >= 0
      ? `left:50%;width:${halfWidth.toFixed(1)}%`
      : `right:50%;width:${halfWidth.toFixed(1)}%`;
  return `
    <div class="an-zero-row" style="grid-template-columns:${labelWidth || "132px"} 1fr minmax(74px,auto)">
      <div class="an-bar-label">${label}</div>
      <div class="an-zero-chart">
        <div class="an-zero-axis"></div>
        <div class="an-zero-fill" style="${style};background:${color}"></div>
      </div>
      <div class="an-bar-val" style="color:${color}">${fmtMoneySigned(pnl)}</div>
    </div>`;
}

function bucketCard(title, buckets, trades, getVal, labelWidth) {
  const stats = buckets.map((b) => {
    const items = trades.filter((x) => {
      const v = getVal(x);
      return v !== null && v !== undefined && b.test(v);
    });
    return {
      label: b.label,
      pnl: +items.reduce((a, x) => a + x.pnl, 0).toFixed(2),
    };
  });
  const maxAbs = Math.max(...stats.map((s) => Math.abs(s.pnl)), 0.01);
  const totalAbs = stats.reduce((a, s) => a + Math.abs(s.pnl), 0) || 1;
  return `
    <div class="an-card">
      <div class="an-chart-title">${title}</div>
      ${stats.map((s) => barRow(s.label, s.pnl, (Math.abs(s.pnl) / totalAbs) * 100, maxAbs, labelWidth)).join("")}
    </div>`;
}

function bucketPair(title, buckets, trades, getVal, labelWidth) {
  const rows = buckets.map((b) => {
    const items = trades.filter((x) => {
      const raw = getVal(x);
      const v = Number(raw);
      return (
        raw !== null && raw !== undefined && Number.isFinite(v) && b.test(v)
      );
    });
    return {
      label: b.label,
      count: items.length,
      pnl: sumPnl(items),
    };
  });
  const maxCount = Math.max(...rows.map((r) => r.count), 1);
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.pnl)), 0.01);
  return `
    <div class="an-card">
      <div class="an-chart-title">Trade Distribution By ${title}</div>
      ${rows.map((r) => countBarRow(r.label, r.count, maxCount, labelWidth)).join("")}
    </div>
    <div class="an-card">
      <div class="an-chart-title">Performance By ${title}</div>
      ${rows.map((r) => zeroBarRow(r.label, r.pnl, maxAbs, labelWidth)).join("")}
    </div>`;
}

function categoryPair(title, labels, trades, getKey, labelWidth) {
  const rows = labels.map((label) => {
    const items = trades.filter((x) => getKey(x) === label);
    return { label, count: items.length, pnl: sumPnl(items) };
  });
  const maxCount = Math.max(...rows.map((r) => r.count), 1);
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.pnl)), 0.01);
  return `
    <div class="an-card">
      <div class="an-chart-title">Trade Distribution By ${title}</div>
      ${rows.map((r) => countBarRow(r.label, r.count, maxCount, labelWidth)).join("")}
    </div>
    <div class="an-card">
      <div class="an-chart-title">Performance By ${title}</div>
      ${rows.map((r) => zeroBarRow(r.label, r.pnl, maxAbs, labelWidth)).join("")}
    </div>`;
}

function topBottomSymbolCards(trades) {
  const grouped = groupBy(trades, (x) => x.ticker || "Unknown");
  const rows = Object.keys(grouped)
    .map((symbol) => ({ symbol, pnl: sumPnl(grouped[symbol]) }))
    .sort((a, b) => b.pnl - a.pnl);
  const top = rows.slice(0, 20);
  const bottom = [...rows].sort((a, b) => a.pnl - b.pnl).slice(0, 20);
  const renderRows = (items) => {
    if (!items.length) return '<div class="an-card-empty">No symbol data</div>';
    const maxAbs = Math.max(...items.map((r) => Math.abs(r.pnl)), 0.01);
    return items
      .map((r) => zeroBarRow(r.symbol, r.pnl, maxAbs, "72px"))
      .join("");
  };
  return `
    <div class="an-card">
      <div class="an-chart-title">Performance By Symbol - Top 20</div>
      ${renderRows(top)}
    </div>
    <div class="an-card">
      <div class="an-chart-title">Performance By Symbol - Bottom 20</div>
      ${renderRows(bottom)}
    </div>`;
}

function lineCard(title, points, color) {
  if (!points.length) {
    return `
      <div class="an-card">
        <div class="an-chart-title">${title}</div>
        <div class="an-card-empty">Not enough data to create this chart.</div>
      </div>`;
  }
  const w = 600, h = 180;
  const padT = 6, padB = 6;
  const plotH = h - padT - padB;

  const vals = points.map((p) => p.value);
  const min = Math.min(...vals, 0);
  const max = Math.max(...vals, 0);
  const span = max - min || 1;

  const xFor = (i) =>
    points.length === 1 ? w / 2 : (i / (points.length - 1)) * w;
  const yFor = (v) => padT + plotH - ((v - min) / span) * plotH;

  // Smooth Catmull-Rom to cubic bezier
  const tension = 0.3;
  let d = `M ${xFor(0).toFixed(1)} ${yFor(points[0].value).toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const x0 = xFor(Math.max(0, i - 1));
    const y0 = yFor(points[Math.max(0, i - 1)].value);
    const x1 = xFor(i), y1 = yFor(points[i].value);
    const x2 = xFor(i + 1), y2 = yFor(points[i + 1].value);
    const x3 = xFor(Math.min(points.length - 1, i + 2));
    const y3 = yFor(points[Math.min(points.length - 1, i + 2)].value);
    const cp1x = x1 + (x2 - x0) * tension;
    const cp1y = y1 + (y2 - y0) * tension;
    const cp2x = x2 - (x3 - x1) * tension;
    const cp2y = y2 - (y3 - y1) * tension;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }

  // Horizontal grid lines (5 evenly spaced)
  const gridCount = 4;
  const gridLines = Array.from({ length: gridCount + 1 }, (_, gi) => {
    const y = (padT + plotH - (gi / gridCount) * plotH).toFixed(1);
    return `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#2a2a2a" stroke-width="1"/>`;
  }).join("");

  // Y-axis labels (HTML, bottom→top, matching grid lines)
  const fmtVal = (v) => {
    if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(1)}k`;
    return (v >= 0 ? "$" : "-$") + Math.abs(v).toFixed(0);
  };
  const yLabels = Array.from({ length: gridCount + 1 }, (_, gi) => {
    const v = min + (span * gi) / gridCount;
    return `<span>${fmtVal(v)}</span>`;
  }).join("");

  const first = points[0].label;
  const last = points[points.length - 1].label;

  return `
    <div class="an-card">
      <div class="an-chart-title">${title}</div>
      <div class="an-line-outer">
        <div class="an-line-yaxis">${yLabels}</div>
        <div class="an-line-wrap">
          <svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="none">
            ${gridLines}
            <path d="${d}" fill="none" stroke="${color || "var(--green,#22c55e)"}" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
      <div class="an-line-labels"><span>${first}</span><span>${last}</span></div>
    </div>`;
}

function fmtSecs(s) {
  if (!s) return "--";
  if (s < 60) return Math.round(s) + "s";
  if (s < 3600) return Math.round(s / 60) + "m";
  const h = Math.floor(s / 3600),
    m = Math.round((s % 3600) / 60);
  return h + "h" + (m ? " " + m + "m" : "");
}

// ── Render: Detailed Stats ────────────────────────────────────────────────────
function renderAnStats(t) {
  const el = document.getElementById("an-stats-content");
  if (!el) return;
  if (!t.length) {
    el.innerHTML =
      '<div style="color:var(--muted);padding:60px;text-align:center;font-size:14px">No trades in selected filter</div>';
    return;
  }

  const wins = t.filter((x) => x.pnl > 0);
  const losses = t.filter((x) => x.pnl < 0);
  const scratch = t.filter((x) => x.pnl === 0);
  const totalPnl = sumPnl(t);
  const grossWin = wins.reduce((a, x) => a + x.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((a, x) => a + x.pnl, 0));
  const pf = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 99 : 0;
  const pfDisplay = pf >= 99 ? "inf" : pf.toFixed(2);
  const pfRatio = Math.min(pf / 3, 1); // 3.0 = full green

  const winRatio = t.length ? wins.length / t.length : 0;
  const lossRatio = t.length ? losses.length / t.length : 0;

  const largestGain = wins.length ? Math.max(...wins.map((x) => x.pnl)) : 0;
  const largestLoss = losses.length ? Math.min(...losses.map((x) => x.pnl)) : 0;
  const glTotal = largestGain + Math.abs(largestLoss) || 1;
  const glRatio = largestGain / glTotal;

  // Hold times
  const avgHW = wins.length
    ? wins.reduce((a, x) => a + (x.holdSeconds || 0), 0) / wins.length
    : 0;
  const avgHL = losses.length
    ? losses.reduce((a, x) => a + (x.holdSeconds || 0), 0) / losses.length
    : 0;
  const avgHA = t.length
    ? t.reduce((a, x) => a + (x.holdSeconds || 0), 0) / t.length
    : 0;
  const holdMax = Math.max(avgHW, avgHL, 1);

  // Duration: intraday (<86400s) vs multiday
  const intra = t.filter((x) => (x.holdSeconds || 0) < 86400);
  const multi = t.filter((x) => (x.holdSeconds || 0) >= 86400);
  const intraPnl = intra.reduce((a, x) => a + x.pnl, 0);
  const multiPnl = multi.reduce((a, x) => a + x.pnl, 0);
  const durTotal = Math.abs(intraPnl) + Math.abs(multiPnl) || 1;

  // Consecutive streaks
  const sorted = [...t].sort((a, b) => a.date.localeCompare(b.date));
  let maxW = 0,
    maxL = 0,
    cw = 0,
    cl = 0;
  sorted.forEach((x) => {
    if (x.pnl > 0) {
      cw++;
      cl = 0;
      maxW = Math.max(maxW, cw);
    } else if (x.pnl < 0) {
      cl++;
      cw = 0;
      maxL = Math.max(maxL, cl);
    } else {
      cw = 0;
      cl = 0;
    }
  });

  const byDay = groupBy(t, (x) => dayKey(x.date));
  const dailyPnls = Object.keys(byDay).map((d) => sumPnl(byDay[d]));
  const avgDaily = dailyPnls.length
    ? dailyPnls.reduce((a, v) => a + v, 0) / dailyPnls.length
    : 0;
  const avgTrade = t.length ? totalPnl / t.length : 0;
  const avgWin = wins.length ? grossWin / wins.length : 0;
  const avgLoss = losses.length ? -grossLoss / losses.length : 0;
  const avgVolume = avg(t, (x) => Number(x.shares) || 0);
  const avgPerShare = avg(t, (x) =>
    x.shares ? (Number(x.pnl) || 0) / Number(x.shares) : null,
  );
  const pnlStd = stddev(t.map((x) => Number(x.pnl) || 0));
  const payoffRatio = avgWin && avgLoss ? avgWin / Math.abs(avgLoss) : 0;
  const kelly = payoffRatio > 0 ? winRatio - (1 - winRatio) / payoffRatio : 0;
  const expectancy = avgTrade;
  const sqn = pnlStd > 0 ? (avgTrade / pnlStd) * Math.sqrt(t.length) : 0;
  const randomChance = 1 - Math.abs(winRatio - 0.5) * 2;

  const statRows = [
    ["Total Gain/Loss", fmtMoneySigned(totalPnl)],
    ["Largest Gain", fmtMoney(largestGain)],
    ["Largest Loss", fmtMoney(largestLoss)],
    ["Average Daily Gain/Loss", fmtMoneySigned(avgDaily)],
    ["Average Daily Volume", Math.round(avgVolume).toLocaleString()],
    ["Average Per-share Gain/Loss", fmtMoneySigned(avgPerShare)],
    ["Average Trade Gain/Loss", fmtMoneySigned(avgTrade)],
    ["Average Winning Trade", fmtMoney(avgWin)],
    ["Average Losing Trade", fmtMoney(avgLoss)],
    ["Total Number of Trades", String(t.length)],
    ["Number of Winning Trades", `${wins.length} (${fmtPct(winRatio)})`],
    ["Number of Losing Trades", `${losses.length} (${fmtPct(lossRatio)})`],
    ["Average Hold Time (all trades)", fmtSecs(avgHA)],
    ["Average Hold Time (winning trades)", fmtSecs(avgHW)],
    ["Average Hold Time (losing trades)", fmtSecs(avgHL)],
    ["Number of Scratch Trades", String(scratch.length)],
    ["Max Consecutive Wins", String(maxW)],
    ["Max Consecutive Losses", String(maxL)],
    ["Trade P&L Standard Deviation", fmtMoney(pnlStd)],
    ["System Quality Number (SQN)", fmtNum(sqn, 2)],
    ["Probability of Random Chance", fmtPct(randomChance, 1)],
    ["Kelly Percentage", fmtPct(kelly, 1)],
    ["K-Ratio", "n/a"],
    ["Profit Factor", pfDisplay],
    ["Total Commissions", "n/a"],
    ["Total Fees", "n/a"],
    ["Average position MAE", "n/a"],
    ["Average Position MFE", "n/a"],
  ];

  el.innerHTML = `
    <div class="an-grid-2">

      <div class="an-card an-card-full">
        <div class="an-chart-title">Stats</div>
        <div class="an-stats-table">
          ${statRows
            .map(
              ([name, val]) => `
                <div class="an-stat-cell">
                  <span class="an-stat-name">${name}</span>
                  <span class="an-stat-val">${val}</span>
                </div>`,
            )
            .join("")}
        </div>
      </div>

      <!-- Total Trades -->
      <div class="an-card" style="display:flex;flex-direction:column;justify-content:space-between;min-height:140px">
        <div class="an-label">Total Number of Trades</div>
        <div class="an-big-num" style="margin-top:auto">${t.length}</div>
      </div>

      <!-- Winning vs Losing -->
      <div class="an-card">
        <div class="an-chart-title">Winning vs Losing Trades</div>
        <div style="display:flex;align-items:center;gap:20px">
          ${svgDonut(winRatio, 120)}
          <div>
            <div style="font-size:13px;color:var(--green);margin-bottom:6px">▲ ${wins.length} wins</div>
            <div style="font-size:13px;color:var(--muted);margin-bottom:6px">${(winRatio * 100).toFixed(1)}% win rate</div>
            <div style="font-size:13px;color:var(--red)">▼ ${losses.length} losses</div>
          </div>
        </div>
      </div>

      <!-- Hold Time -->
      <div class="an-card">
        <div class="an-chart-title">Hold Time — Winning vs Losing</div>
        <div style="margin-bottom:14px">
          <div class="an-label" style="margin-bottom:6px">Winners · ${fmtSecs(avgHW)}</div>
          <div class="an-bar-track" style="height:8px">
            <div class="an-bar-fill" style="width:${((avgHW / holdMax) * 100).toFixed(1)}%;background:var(--green)"></div>
          </div>
        </div>
        <div>
          <div class="an-label" style="margin-bottom:6px">Losers · ${fmtSecs(avgHL)}</div>
          <div class="an-bar-track" style="height:8px">
            <div class="an-bar-fill" style="width:${((avgHL / holdMax) * 100).toFixed(1)}%;background:var(--red)"></div>
          </div>
        </div>
      </div>

      <!-- Max Consecutive Wins -->
      <div class="an-card" style="display:flex;flex-direction:column;justify-content:space-between;min-height:140px">
        <div class="an-label">Max Consecutive Wins</div>
        <div class="an-big-num" style="margin-top:auto;color:var(--green)">${maxW}</div>
      </div>

      <!-- Max Consecutive Losses -->
      <div class="an-card" style="display:flex;flex-direction:column;justify-content:space-between;min-height:140px">
        <div class="an-label">Max Consecutive Losses</div>
        <div class="an-big-num" style="margin-top:auto;color:var(--red)">${maxL}</div>
      </div>

      <!-- Performance By Duration -->
      <div class="an-card">
        <div class="an-chart-title">Performance By Duration</div>
        <div style="margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span class="an-label">Intraday</span>
            <span style="font-size:12px;font-weight:700;color:${intraPnl >= 0 ? "var(--green)" : "var(--red)"}">
              ${intraPnl >= 0 ? "+" : ""}$${Math.abs(intraPnl).toFixed(2)}
              <span style="font-weight:400;color:var(--muted)">${((Math.abs(intraPnl) / durTotal) * 100).toFixed(2)}%</span>
            </span>
          </div>
          <div class="an-bar-track" style="height:8px">
            <div class="an-bar-fill" style="width:${((Math.abs(intraPnl) / durTotal) * 100).toFixed(1)}%;background:${intraPnl >= 0 ? "var(--green)" : "var(--red)"}"></div>
          </div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span class="an-label">Multiday</span>
            <span style="font-size:12px;font-weight:700;color:${multiPnl >= 0 ? "var(--green)" : "var(--red)"}">
              ${multiPnl >= 0 ? "+" : ""}$${Math.abs(multiPnl).toFixed(2)}
              <span style="font-weight:400;color:var(--muted)">${((Math.abs(multiPnl) / durTotal) * 100).toFixed(2)}%</span>
            </span>
          </div>
          <div class="an-bar-track" style="height:8px">
            <div class="an-bar-fill" style="width:${((Math.abs(multiPnl) / durTotal) * 100).toFixed(1)}%;background:${multiPnl >= 0 ? "var(--green)" : "var(--red)"}"></div>
          </div>
        </div>
      </div>

    </div>`;
}

// ── Render: Days / Times ──────────────────────────────────────────────────────
function renderAnDays(t) {
  const el = document.getElementById("an-days-content");
  if (!el) return;
  if (!t.length) {
    el.innerHTML =
      '<div style="color:var(--muted);padding:40px;text-align:center">No data</div>';
    return;
  }

  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const years = [
    ...new Set(t.map((x) => new Date(x.date).getFullYear()).filter(Boolean)),
  ]
    .sort()
    .map(String);
  const yearPairs = categoryPair(
    "Year",
    years,
    t,
    (x) => String(new Date(x.date).getFullYear()),
    "70px",
  );
  const monthPairs = categoryPair(
    "Month",
    MONTHS,
    t,
    (x) => MONTHS[new Date(x.date).getMonth()],
    "48px",
  );
  const dayWeekPairs = categoryPair(
    "Day Of Week",
    DAYS,
    t,
    (x) =>
      ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        new Date(x.date).getDay()
      ],
    "54px",
  );
  const durationBuckets = [
    { label: "Intraday", test: (v) => v < 86400 },
    { label: "Multiday", test: (v) => v >= 86400 },
  ];
  const intradayBuckets = [
    { label: "< 1:00", test: (v) => v < 60 },
    { label: "1:00 - 1:59", test: (v) => v >= 60 && v < 120 },
    { label: "2:00 - 4:59", test: (v) => v >= 120 && v < 300 },
    { label: "5:00 - 9:59", test: (v) => v >= 300 && v < 600 },
    { label: "10:00 - 19:59", test: (v) => v >= 600 && v < 1200 },
    { label: "20:00 - 39:59", test: (v) => v >= 1200 && v < 2400 },
    { label: "40:00 - 59:59", test: (v) => v >= 2400 && v < 3600 },
    { label: "1:00:00 - 1:59:59", test: (v) => v >= 3600 && v < 7200 },
    { label: "2:00:00 - 3:59:59", test: (v) => v >= 7200 && v < 14400 },
    { label: "4:00:00 >", test: (v) => v >= 14400 && v < 86400 },
  ];

  el.innerHTML = `
    ${yearPairs}
    ${monthPairs}
    ${dayWeekPairs}
    ${bucketPair("Duration", durationBuckets, t, (x) => x.holdSeconds || 0, "82px")}
    ${bucketPair("Intraday Duration", intradayBuckets, t, (x) => x.holdSeconds || 0, "118px")}
  `;
}

// ── Render: Price / Volume ────────────────────────────────────────────────────
function renderAnPrice(t) {
  const el = document.getElementById("an-price-content");
  if (!el) return;
  if (!t.length) {
    el.innerHTML =
      '<div style="color:var(--muted);padding:40px;text-align:center">No data</div>';
    return;
  }

  const priceBuckets = [
    { label: "$0.00 - $0.09", test: (v) => v >= 0 && v < 0.1 },
    { label: "$0.10 - $0.24", test: (v) => v >= 0.1 && v < 0.25 },
    { label: "$0.25 - $0.49", test: (v) => v >= 0.25 && v < 0.5 },
    { label: "$0.50 - $0.99", test: (v) => v >= 0.5 && v < 1 },
    { label: "$1 - $4.99", test: (v) => v >= 1 && v < 5 },
    { label: "$5 - $9.99", test: (v) => v >= 5 && v < 10 },
    { label: "$10 - $19.99", test: (v) => v >= 10 && v < 20 },
    { label: "$20 - $49.99", test: (v) => v >= 20 && v < 50 },
    { label: "$50 - $99.99", test: (v) => v >= 50 && v < 100 },
    { label: "$100+", test: (v) => v >= 100 },
  ];

  const movBuckets = [
    { label: "< -10%", test: (v) => v < -10 },
    { label: "-2% to -10%", test: (v) => v >= -10 && v < -2 },
    { label: "-1% to -2%", test: (v) => v >= -2 && v < -1 },
    { label: "0 to -1%", test: (v) => v >= -1 && v < 0 },
    { label: "0 to +1%", test: (v) => v >= 0 && v < 1 },
    { label: "+1% to +2%", test: (v) => v >= 1 && v < 2 },
    { label: "+2% to +10%", test: (v) => v >= 2 && v < 10 },
    { label: "> +10%", test: (v) => v >= 10 },
  ];

  const shareBuckets = [
    { label: "1 - 99", test: (v) => v > 0 && v < 100 },
    { label: "100 - 499", test: (v) => v >= 100 && v < 500 },
    { label: "500 - 999", test: (v) => v >= 500 && v < 1000 },
    { label: "1K - 4.9K", test: (v) => v >= 1000 && v < 5000 },
    { label: "5K - 9.9K", test: (v) => v >= 5000 && v < 10000 },
    { label: "10K+", test: (v) => v >= 10000 },
  ];

  const gapBuckets = [
    { label: "< -2%", test: (v) => v < -2 },
    { label: "-1% to -2%", test: (v) => v >= -2 && v < -1 },
    { label: "0 to -1%", test: (v) => v >= -1 && v < 0 },
    { label: "0 to +1%", test: (v) => v >= 0 && v < 1 },
    { label: "+1% to +2%", test: (v) => v >= 1 && v < 2 },
    { label: "> +2%", test: (v) => v >= 2 },
  ];

  const relVolBuckets = [
    { label: "0 - 1.9x", test: (v) => v >= 0 && v < 2 },
    { label: "2x - 4.9x", test: (v) => v >= 2 && v < 5 },
    { label: "5x - 9.9x", test: (v) => v >= 5 && v < 10 },
    { label: "10x - 14.9x", test: (v) => v >= 10 && v < 15 },
    { label: "15x - 19.9x", test: (v) => v >= 15 && v < 20 },
    { label: "20x+", test: (v) => v >= 20 },
  ];

  const floatBuckets = [
    { label: "< 2M", test: (v) => v > 0 && v < 2 },
    { label: "2M - 4.9M", test: (v) => v >= 2 && v < 5 },
    { label: "5M - 9.9M", test: (v) => v >= 5 && v < 10 },
    { label: "10M - 24.9M", test: (v) => v >= 10 && v < 25 },
    { label: "25M - 49.9M", test: (v) => v >= 25 && v < 50 },
    { label: "50M+", test: (v) => v >= 50 },
  ];

  const patternLabels = [
    ...new Set(t.map((x) => x.pattern || "Unassigned")),
  ].sort();
  const directionLabels = ["Long", "Short"];
  const catalystLabels = ["Catalyst", "No Catalyst"];

  el.innerHTML = `
    ${bucketPair("In-Trade Price Range", priceBuckets, t, (x) => x.entryPrice || null, "118px")}
    ${topBottomSymbolCards(t)}
    ${bucketPair("Position Size (Shares)", shareBuckets, t, (x) => x.shares || null, "88px")}
    ${bucketPair("Trade Movement %", movBuckets, t, tradeMovementPct, "112px")}
    ${bucketPair("Opening Gap %", gapBuckets, t, (x) => (Number.isFinite(Number(x.gapPct)) ? Number(x.gapPct) : null), "112px")}
    ${bucketPair("Instrument Relative Volume", relVolBuckets, t, (x) => x.relVol || null, "96px")}
    ${bucketPair("Float", floatBuckets, t, (x) => x.float || null, "104px")}
    ${categoryPair("Pattern", patternLabels, t, (x) => x.pattern || "Unassigned", "150px")}
    ${categoryPair("Side", directionLabels, t, (x) => x.direction || "Long", "70px")}
    ${categoryPair("Catalyst", catalystLabels, t, (x) => (x.catalyst ? "Catalyst" : "No Catalyst"), "92px")}
  `;
}

// ── Render: Win/Loss ──────────────────────────────────────────────────────────
function renderAnStreaks(t) {
  const el = document.getElementById("an-streaks-content");
  if (!el) return;
  if (!t.length) {
    el.innerHTML =
      '<div style="color:var(--muted);padding:40px;text-align:center">No data</div>';
    return;
  }

  const sorted = [...t].sort((a, b) => a.date.localeCompare(b.date));
  const wins = t.filter((x) => x.pnl > 0);
  const losses = t.filter((x) => x.pnl < 0);
  const winPct = t.length ? wins.length / t.length : 0;

  // Build streak run blocks
  const runs = [];
  let cur = null,
    len = 0;
  sorted.forEach((x, i) => {
    const type = x.pnl > 0 ? "W" : x.pnl < 0 ? "L" : "S";
    if (type === cur) {
      len++;
    } else {
      if (cur) runs.push({ type: cur, len });
      cur = type;
      len = 1;
    }
    if (i === sorted.length - 1) runs.push({ type: cur, len });
  });

  const lastN = sorted.slice(-30);
  const barMax = Math.max(...lastN.map((x) => Math.abs(x.pnl)), 0.01);
  const grossWin = sumPnl(wins);
  const grossLoss = sumPnl(losses);
  const expectation = t.length ? sumPnl(t) / t.length : 0;
  const winLossRows = [
    { label: "Gain", pnl: grossWin },
    { label: "Loss", pnl: grossLoss },
  ];
  const winLossMax = Math.max(...winLossRows.map((r) => Math.abs(r.pnl)), 0.01);
  const equityPoints = [];
  let equity = 0;
  sorted.forEach((x) => {
    equity = +(equity + x.pnl).toFixed(2);
    equityPoints.push({ label: x.date, value: equity });
  });
  let highWater = 0;
  const drawdownPoints = equityPoints.map((p) => {
    highWater = Math.max(highWater, p.value);
    return { label: p.label, value: +(p.value - highWater).toFixed(2) };
  });

  el.innerHTML = `
    <div class="an-grid-2">

      <!-- Last 30 trades bar chart -->
      <div class="an-card an-card-full">
        <div class="an-chart-title">Last ${lastN.length} Trades</div>
        <div style="display:flex;gap:3px;align-items:flex-end;height:80px;margin-bottom:6px">
          ${lastN
            .map((x) => {
              const h = Math.max(
                4,
                Math.round((Math.abs(x.pnl) / barMax) * 74),
              );
              const col = x.pnl > 0 ? "var(--green)" : "var(--red)";
              const sign = x.pnl >= 0 ? "+" : "";
              return `<div title="${x.ticker} ${x.date}: ${sign}$${x.pnl.toFixed(2)}"
              style="flex:1;min-width:4px;height:${h}px;background:${col};border-radius:2px 2px 0 0;cursor:default"></div>`;
            })
            .join("")}
        </div>
        <div style="display:flex;gap:3px">
          ${lastN.map((x) => `<div style="flex:1;font-size:9px;color:var(--muted);text-align:center;overflow:hidden;white-space:nowrap">${x.ticker}</div>`).join("")}
        </div>
      </div>

      <!-- Win Rate -->
      <div class="an-card">
        <div class="an-chart-title">Win Rate</div>
        <div class="an-big-num" style="color:${winPct >= 0.5 ? "var(--green)" : "var(--red)"}">${(winPct * 100).toFixed(1)}%</div>
        <div style="height:6px;background:var(--border);border-radius:3px;margin:16px 0 10px">
          <div style="height:100%;width:${(winPct * 100).toFixed(1)}%;background:var(--green);border-radius:3px"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px">
          <span style="color:var(--green)">${wins.length} wins</span>
          <span style="color:var(--red)">${losses.length} losses</span>
        </div>
      </div>

      <div class="an-card">
        <div class="an-chart-title">Win/Loss P&L Comparison</div>
        ${winLossRows.map((r) => zeroBarRow(r.label, r.pnl, winLossMax, "64px")).join("")}
      </div>

      <div class="an-card">
        <div class="an-chart-title">Trade Expectation</div>
        ${zeroBarRow("Expectation", expectation, Math.max(Math.abs(expectation), 0.01), "92px")}
      </div>

      ${lineCard("Cumulative P&L", equityPoints, "var(--green,#22c55e)")}
      ${lineCard("Cumulative Drawdown", drawdownPoints, "var(--red,#ef4444)")}

      <!-- Streak history -->
      <div class="an-card">
        <div class="an-chart-title">Streak History (most recent)</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:flex-start;padding-top:6px">
          ${runs
            .slice(-24)
            .map((s) => {
              const col = s.type === "W" ? "var(--green)" : "var(--red)";
              const show = Math.min(s.len, 6);
              return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px">
              <div style="display:flex;gap:2px">
                ${Array(show)
                  .fill(0)
                  .map(
                    () =>
                      `<div style="width:13px;height:13px;border-radius:2px;background:${col}"></div>`,
                  )
                  .join("")}
                ${s.len > 6 ? `<div style="font-size:10px;color:var(--muted);align-self:center;margin-left:2px">+${s.len - 6}</div>` : ""}
              </div>
              <div style="font-size:9px;color:var(--muted)">${s.len}${s.type}</div>
            </div>`;
            })
            .join("")}
        </div>
      </div>

    </div>`;
}
