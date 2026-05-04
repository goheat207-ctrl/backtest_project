"use strict";

function renderLog() {
  const sorted = [...trades].sort((a, b) => {
    const cmp = sortConfig.dir === "asc" ? 1 : -1;
    if (sortConfig.col === "pnl") return cmp * (a.pnl - b.pnl);
    return (
      cmp *
      (a[sortConfig.col] || "")
        .toString()
        .localeCompare((b[sortConfig.col] || "").toString())
    );
  });
  document.getElementById("log-count-label").textContent =
    trades.length +
    " trades · " +
    trades.filter((t) => t.pnl > 0).length +
    " wins · " +
    trades.filter((t) => t.pnl <= 0).length +
    " losses";
  document.getElementById("tbl-count").textContent = trades.length + " trades";

  // Best op banner
  const today = new Date().toISOString().slice(0, 10);
  const bestOp = trades.find((t) => t.isBestOp && t.date === today);
  const banner = document.getElementById("bestop-banner");
  if (bestOp) {
    banner.classList.add("show");
    document.getElementById("bestop-content").innerHTML =
      `<span style="color:var(--orange)">${bestOp.ticker}</span> · ${bestOp.pattern} · <span class="${pnlClass(bestOp.pnl)}">${bestOp.pnl >= 0 ? "+" : ""}$${Math.abs(bestOp.pnl).toFixed(2)}</span><br><span style="color:var(--muted);font-size:10px">${bestOp.writeUp.slice(0, 120)}…</span>`;
  } else {
    banner.classList.remove("show");
  }

  // Group by date
  const dateMap = {};
  sorted.forEach((t) => {
    (dateMap[t.date] = dateMap[t.date] || []).push(t);
  });
  const dates = Object.keys(dateMap).sort((a, b) =>
    sortConfig.dir === "asc" ? a.localeCompare(b) : b.localeCompare(a),
  );

  const tbody = document.getElementById("trade-tbody");
  tbody.innerHTML = dates
    .map((d) => {
      const dayTrades = dateMap[d];
      const dayPnl = dayTrades.reduce((a, x) => a + x.pnl, 0);
      const dateRow = `<tr class="date-row"><td></td><td colspan="15">${d} &nbsp;·&nbsp; ${dayTrades.length} trade${dayTrades.length > 1 ? "s" : ""} &nbsp;·&nbsp; <span class="${pnlClass(dayPnl)}">${dayPnl >= 0 ? "+" : ""}$${Math.abs(dayPnl).toFixed(2)}</span></td></tr>`;
      const tradeRows = dayTrades
        .map(
          (t) => `
      <tr id="row-${t.id}">
        <td><input type="checkbox" class="sel-checkbox" data-id="${t.id}" onchange="toggleTradeSelect('${t.id}',this)" ${selectedTrades.has(t.id) ? "checked" : ""}></td>
        <td>${t.date}</td>
        <td style="font-weight:700;color:var(--text);font-family:var(--display)">${t.isBestOp ? '<span class="star">⭐</span>' : ""}${t.ticker}</td>
        <td><span class="tag tag-${t.direction.toLowerCase()}">${t.direction}</span></td>
        <td style="color:var(--orange);font-family:var(--display);font-weight:600">${t.pattern}</td>
        <td>$${t.entryPrice.toFixed(2)}</td>
        <td>$${t.exitPrice.toFixed(2)}</td>
        <td>${t.shares.toLocaleString()}</td>
        <td class="${pnlClass(t.pnl)}">${t.pnl >= 0 ? "+" : ""}$${Math.abs(t.pnl).toFixed(2)}</td>
        <td><span class="tag ${t.catalyst ? "tag-long" : "tag-short"}">${t.catalyst ? "Yes" : "No"}</span></td>
        <td style="color:${t.relVol >= 5 ? "var(--green)" : "var(--red)"}">${t.relVol || "—"}x</td>
        <td class="grade-${(t.entryGrade || "").toLowerCase()}">${t.entryGrade || "—"}</td>
        <td class="grade-${(t.exitGrade || "").toLowerCase()}">${t.exitGrade || "—"}</td>
        <td style="color:${t.followedRules ? "var(--green)" : "var(--red)"}">${t.followedRules ? "✓" : "✗"}</td>
        <td style="font-size:13px;color:${t.emotionalState === "Calm" ? "var(--green)" : t.emotionalState === "Reactive" ? "var(--red)" : "var(--orange)"}">${t.emotionalState || "—"}</td>
        <td style="white-space:nowrap"><button class="btn btn-edit btn-sm" onclick="openEditModal('${t.id}')">Edit</button> <button class="btn btn-danger btn-sm" onclick="deleteTrade('${t.id}')">Del</button></td>
      </tr>`,
        )
        .join("");
      return dateRow + tradeRows;
    })
    .join("");
  if (!trades.length)
    tbody.innerHTML =
      '<tr><td colspan="16" class="empty-state">No trades yet. Add your first trade above.</td></tr>';
  updateBulkBar();
}

function sortTable(col) {
  if (sortConfig.col === col)
    sortConfig.dir = sortConfig.dir === "asc" ? "desc" : "asc";
  else {
    sortConfig.col = col;
    sortConfig.dir = "desc";
  }
  renderLog();
}

// ============================================================
// FORM TOGGLES
// ============================================================
function setTog(field, btn) {
  const grp = btn.parentElement;
  const val = btn.dataset.val;
  const parsed = val === "true" ? true : val === "false" ? false : val;
  formState[field] = parsed;
  grp.querySelectorAll(".tog-btn").forEach((b) => {
    b.className = "tog-btn";
  });
  // Assign active class
  const classMap = {
    Long: "on-long",
    Short: "on-short",
    true: "on-yes",
    false: "on-no",
    A: "on-a",
    B: "on-b",
    C: "on-c",
    Calm: "on-calm",
    "Slightly Anxious": "on-anxious",
    Reactive: "on-reactive",
  };
  btn.classList.add(classMap[val] || "on-yes");
}

function resetToggles() {
  const defaults = {
    direction: "Long",
    catalyst: true,
    entryGrade: "A",
    exitGrade: "A",
    followedRules: true,
    emotionalState: "Calm",
    sizedCorrectly: true,
  };
  Object.assign(formState, defaults);
  Object.keys(defaults).forEach((field) => {
    const grp = document.getElementById("tog-" + field);
    if (!grp) return;
    grp.querySelectorAll(".tog-btn").forEach((b) => {
      b.className = "tog-btn";
      const dv = String(defaults[field]);
      if (b.dataset.val === dv) setTog(field, b);
    });
  });
}

// ============================================================
// ADD TRADE FORM
// ============================================================
function toggleAddForm() {
  const f = document.getElementById("add-trade-form");
  const lbl = document.getElementById("add-toggle-label");
  const open = f.classList.toggle("open");
  lbl.textContent = open ? "− Close" : "+ Add Trade";
  if (open) {
    resetForm();
    document.getElementById("f-date").value = new Date()
      .toISOString()
      .slice(0, 10);
  }
}

function resetForm() {
  [
    "f-date",
    "f-ticker",
    "f-entry",
    "f-exit",
    "f-shares",
    "f-pnl",
    "f-cat-type",
    "f-relvol",
    "f-float",
    "f-pmhigh",
    "f-gap",
    "f-writeup",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("f-bestop").checked = false;
  document.getElementById("f-pattern").value = "";
  document
    .querySelectorAll("#f-dil-type-grp .dil-btn")
    .forEach((b) => b.classList.remove("active"));
  [
    "f-dil-status",
    "f-dil-atm",
    "f-dil-warrants",
    "f-dil-conv",
    "f-dil-notes",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  resetToggles();
  editingId = null;
  document.getElementById("form-title-label").textContent = "New Trade";
}

function toggleDilType(btn) {
  btn.classList.toggle("active");
}

function calcPnl() {
  const entry = parseFloat(document.getElementById("f-entry").value) || 0;
  const exit = parseFloat(document.getElementById("f-exit").value) || 0;
  const shares = parseInt(document.getElementById("f-shares").value) || 0;
  const dir = formState.direction === "Long" ? 1 : -1;
  if (entry && exit && shares)
    document.getElementById("f-pnl").value = (
      (exit - entry) *
      shares *
      dir
    ).toFixed(2);
}

async function submitTrade() {
  const ticker = document.getElementById("f-ticker").value.trim().toUpperCase();
  const pattern = document.getElementById("f-pattern").value;
  const date = document.getElementById("f-date").value;
  if (!ticker || !pattern || !date) {
    alert("Ticker, Pattern, and Date are required.");
    return;
  }
  const entry = parseFloat(document.getElementById("f-entry").value) || 0;
  const exit = parseFloat(document.getElementById("f-exit").value) || 0;
  const shares = parseInt(document.getElementById("f-shares").value) || 0;
  const dir = formState.direction === "Long" ? 1 : -1;
  const pnl =
    parseFloat(document.getElementById("f-pnl").value) ||
    (exit - entry) * shares * dir;
  const t = {
    id: editingId || uid(),
    date,
    ticker,
    pattern,
    direction: formState.direction,
    entryPrice: entry,
    exitPrice: exit,
    shares,
    pnl,
    catalyst: formState.catalyst,
    catalystType: document.getElementById("f-cat-type").value,
    relVol: parseFloat(document.getElementById("f-relvol").value) || 0,
    float: parseFloat(document.getElementById("f-float").value) || 0,
    premarketHigh: parseFloat(document.getElementById("f-pmhigh").value) || 0,
    gapPct: parseFloat(document.getElementById("f-gap").value) || 0,
    entryGrade: formState.entryGrade,
    exitGrade: formState.exitGrade,
    followedRules: formState.followedRules,
    emotionalState: formState.emotionalState,
    sizedCorrectly: formState.sizedCorrectly,
    writeUp: document.getElementById("f-writeup").value,
    isBestOp: document.getElementById("f-bestop").checked,
    dilTypes: [
      ...document.querySelectorAll("#f-dil-type-grp .dil-btn.active"),
    ].map((b) => b.dataset.val),
    dilStatus: document.getElementById("f-dil-status").value,
    dilAtm: parseFloat(document.getElementById("f-dil-atm").value) || 0,
    dilWarrants: parseInt(document.getElementById("f-dil-warrants").value) || 0,
    dilConv: parseInt(document.getElementById("f-dil-conv").value) || 0,
    dilNotes: document.getElementById("f-dil-notes").value,
  };
  try {
    const resp = await fetch("/api/trades/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(t),
    });
    if (!resp.ok) throw new Error(await resp.text());
    toggleAddForm();
    await loadData();
  } catch (err) {
    // Fallback: save locally if API unavailable
    if (editingId) {
      trades = trades.map((x) => (x.id === editingId ? t : x));
    } else {
      trades.push(t);
    }
    saveTrades();
    toggleAddForm();
    renderLog();
  }
}

async function deleteTrade(id) {
  if (!confirm("Delete this trade?")) return;
  try {
    const resp = await fetch(`/api/trades/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!resp.ok) throw new Error(await resp.text());
    selectedTrades.delete(id);
    await loadData();
  } catch (err) {
    // Fallback: remove locally if API unavailable
    trades = trades.filter((t) => t.id !== id);
    selectedTrades.delete(id);
    saveTrades();
    renderLog();
  }
}

// ============================================================
// MULTI-SELECT
// ============================================================
function toggleTradeSelect(id, checkbox) {
  if (checkbox.checked) selectedTrades.add(id);
  else selectedTrades.delete(id);
  updateBulkBar();
}

function toggleSelectAll(checkbox) {
  if (checkbox.checked) {
    trades.forEach((t) => selectedTrades.add(t.id));
  } else {
    selectedTrades.clear();
  }
  renderLog();
}

function clearSelection() {
  selectedTrades.clear();
  const sa = document.getElementById("select-all");
  if (sa) sa.checked = false;
  renderLog();
}

async function deleteSelected() {
  if (!selectedTrades.size) return;
  if (
    !confirm(
      `Delete ${selectedTrades.size} selected trade${selectedTrades.size > 1 ? "s" : ""}? This cannot be undone.`,
    )
  )
    return;
  const ids = [...selectedTrades];
  try {
    const resp = await fetch("/api/trades/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!resp.ok) throw new Error(await resp.text());
    selectedTrades.clear();
    await loadData();
  } catch (err) {
    // Fallback: remove locally if API unavailable
    trades = trades.filter((t) => !selectedTrades.has(t.id));
    selectedTrades.clear();
    saveTrades();
    renderLog();
  }
}

function updateBulkBar() {
  const bar = document.getElementById("bulk-bar");
  const cnt = document.getElementById("bulk-count");
  if (selectedTrades.size > 0) {
    bar.classList.add("show");
    cnt.textContent = `${selectedTrades.size} trade${selectedTrades.size > 1 ? "s" : ""} selected`;
  } else {
    bar.classList.remove("show");
  }
  const sa = document.getElementById("select-all");
  if (sa)
    sa.checked =
      selectedTrades.size > 0 && selectedTrades.size === trades.length;
}

// ============================================================
// EDIT MODAL
// ============================================================
function openEditModal(id) {
  const t = trades.find((x) => x.id === id);
  if (!t) return;
  editingId = id;
  // Populate main form instead of modal for simplicity
  document.getElementById("add-trade-form").classList.add("open");
  document.getElementById("add-toggle-label").textContent = "− Close";
  document.getElementById("form-title-label").textContent =
    "Edit Trade — " + t.ticker;
  document.getElementById("f-date").value = t.date;
  document.getElementById("f-ticker").value = t.ticker;
  document.getElementById("f-pattern").value = t.pattern;
  document.getElementById("f-entry").value = t.entryPrice;
  document.getElementById("f-exit").value = t.exitPrice;
  document.getElementById("f-shares").value = t.shares;
  document.getElementById("f-pnl").value = t.pnl;
  document.getElementById("f-cat-type").value = t.catalystType || "";
  document.getElementById("f-relvol").value = t.relVol || "";
  document.getElementById("f-float").value = t.float || "";
  document.getElementById("f-pmhigh").value = t.premarketHigh || "";
  document.getElementById("f-gap").value = t.gapPct || "";
  document.getElementById("f-writeup").value = t.writeUp || "";
  document.getElementById("f-bestop").checked = t.isBestOp || false;
  // Set toggles
  const setT = (field, val) => {
    const grp = document.getElementById("tog-" + field);
    if (!grp) return;
    grp.querySelectorAll(".tog-btn").forEach((b) => {
      if (b.dataset.val === String(val)) setTog(field, b);
    });
  };
  setT("direction", t.direction);
  setT("catalyst", t.catalyst);
  setT("entryGrade", t.entryGrade);
  setT("exitGrade", t.exitGrade);
  setT("followedRules", t.followedRules);
  setT("emotionalState", t.emotionalState);
  setT("sizedCorrectly", t.sizedCorrectly);
  // Dilution fields
  const dg = document.getElementById("f-dil-type-grp");
  dg.querySelectorAll(".dil-btn").forEach((b) => {
    b.classList.toggle("active", (t.dilTypes || []).includes(b.dataset.val));
  });
  document.getElementById("f-dil-status").value = t.dilStatus || "";
  document.getElementById("f-dil-atm").value = t.dilAtm || "";
  document.getElementById("f-dil-warrants").value = t.dilWarrants || "";
  document.getElementById("f-dil-conv").value = t.dilConv || "";
  document.getElementById("f-dil-notes").value = t.dilNotes || "";
  document
    .getElementById("add-trade-form")
    .scrollIntoView({ behavior: "smooth", block: "start" });
}

// ============================================================
// EXPORT CSV
// ============================================================
function exportTrades() {
  const headers =
    "date,ticker,pattern,direction,entryPrice,exitPrice,shares,pnl,catalyst,catalystType,relVol,float,premarketHigh,gapPct,entryGrade,exitGrade,followedRules,emotionalState,sizedCorrectly,writeUp,isBestOp";
  const rows = trades.map((t) =>
    [
      t.date,
      t.ticker,
      t.pattern,
      t.direction,
      t.entryPrice,
      t.exitPrice,
      t.shares,
      t.pnl,
      t.catalyst,
      t.catalystType,
      t.relVol,
      t.float,
      t.premarketHigh,
      t.gapPct,
      t.entryGrade,
      t.exitGrade,
      t.followedRules,
      t.emotionalState,
      t.sizedCorrectly,
      '"' + (t.writeUp || "").replace(/"/g, '""') + '"',
      t.isBestOp,
    ].join(","),
  );
  const csv = [headers, ...rows].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "trades-" + new Date().toISOString().slice(0, 10) + ".csv";
  a.click();
}

// ============================================================
// CSV IMPORT — TOS ACCOUNT STATEMENT NATIVE PARSER
// ============================================================
function openCsvModal() {
  document.getElementById("modal-csv").classList.add("show");
  document.getElementById("csv-mapper").style.display = "none";
  document.getElementById("csv-import-btn").style.display = "none";
  document.getElementById("csv-preview").textContent = "";
  document.getElementById("csv-file").value = "";
  csvHeaders = [];
  csvRows = [];
}

// RFC-4180 compliant CSV line parser
function parseCSVLine(line) {
  const cells = [];
  let inQuote = false,
    cell = "",
    i = 0;
  // Strip BOM if present
  if (line.charCodeAt(0) === 0xfeff) line = line.slice(1);
  while (i < line.length) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        cell += '"';
        i += 2;
        continue;
      }
      inQuote = !inQuote;
      i++;
      continue;
    }
    if (ch === "," && !inQuote) {
      cells.push(cell.trim());
      cell = "";
      i++;
      continue;
    }
    cell += ch;
    i++;
  }
  cells.push(cell.trim());
  return cells;
}

// Parse entire CSV text into array of string arrays
function parseCSVText(text) {
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // Strip BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  return text
    .split("\n")
    .filter((l) => l.trim())
    .map(parseCSVLine);
}

// Normalize a date string to YYYY-MM-DD
function normalizeDate(raw) {
  if (!raw) return "";
  // Handle "4/23/26" → 2026-04-23
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    let yr = parseInt(m[3]);
    if (yr < 100) yr += 2000;
    return `${yr}-${String(m[1]).padStart(2, "0")}-${String(m[2]).padStart(2, "0")}`;
  }
  // Handle "4/23/26 07:10:37" — take date part only
  const m2 = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s/);
  if (m2) {
    let yr = parseInt(m2[3]);
    if (yr < 100) yr += 2000;
    return `${yr}-${String(m2[1]).padStart(2, "0")}-${String(m2[2]).padStart(2, "0")}`;
  }
  // ISO or other standard formats
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toISOString().slice(0, 10);
}

// -------------------------------------------------------
// TOS Account Statement detector + FIFO trade builder
// -------------------------------------------------------
function isTOSAccountStatement(text) {
  return (
    text.includes("Account Statement") || text.includes("Account Trade History")
  );
}

// Extract the "Account Trade History" section rows from a TOS account statement
// Columns: (blank), Exec Time, Spread, Side, Qty, Pos Effect, Symbol, Exp, Strike, Type, Price, Net Price, Order Type
function parseTOSAccountStatement(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  // Find "Account Trade History" header line
  let sectionStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "Account Trade History") {
      sectionStart = i;
      break;
    }
  }
  if (sectionStart < 0) return null;

  // Header is the next non-empty line after the section label
  let headerIdx = sectionStart + 1;
  while (headerIdx < lines.length && !lines[headerIdx].trim()) headerIdx++;
  if (headerIdx >= lines.length) return null;

  const headers = parseCSVLine(lines[headerIdx]).map((h) =>
    h.toLowerCase().trim(),
  );
  // Expected: , exec time, spread, side, qty, pos effect, symbol, exp, strike, type, price, net price, order type
  // Indices (flexible — find by name):
  const iExecTime = headers.findIndex(
    (h) => h.includes("exec time") || h.includes("time"),
  );
  const iSide = headers.findIndex((h) => h === "side");
  const iQty = headers.findIndex((h) => h === "qty");
  const iPosEffect = headers.findIndex(
    (h) => h.includes("pos effect") || h.includes("effect"),
  );
  const iSymbol = headers.findIndex((h) => h === "symbol");
  const iSpread = headers.findIndex((h) => h === "spread");
  const iPrice = headers.findIndex((h) => h === "net price" || h === "price");

  const legs = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    // Stop at next section header (a line that is a plain label with no commas or very few)
    const commas = (line.match(/,/g) || []).length;
    if (commas < 2 && line.trim() && !line.startsWith(",")) break;

    const cells = parseCSVLine(line);
    const side = iSide >= 0 ? (cells[iSide] || "").trim().toUpperCase() : "";
    const qty =
      iQty >= 0
        ? Math.abs(parseInt((cells[iQty] || "0").replace(/[^0-9-]/g, "")) || 0)
        : 0;
    const posEffect =
      iPosEffect >= 0 ? (cells[iPosEffect] || "").trim().toUpperCase() : "";
    const symbol =
      iSymbol >= 0 ? (cells[iSymbol] || "").trim().toUpperCase() : "";
    const execTime = iExecTime >= 0 ? (cells[iExecTime] || "").trim() : "";
    const spread =
      iSpread >= 0 ? (cells[iSpread] || "").trim().toUpperCase() : "";
    const price =
      iPrice >= 0
        ? parseFloat((cells[iPrice] || "0").replace(/[^0-9.]/g, "")) || 0
        : 0;

    // Only STOCK legs for now (skip options, futures)
    if (!symbol || spread !== "STOCK") continue;
    if (!side || !qty || !price) continue;

    legs.push({ execTime, side, qty, posEffect, symbol, price });
  }

  return legs;
}

// Parse TOS Account Statement "Cash Balance" section (DATE/TIME/TYPE/DESCRIPTION columns)
// Each TRD row has a description like "BOT +10 UAVS @1.09" or "SOLD -5 UAVS @1.40"
function parseTOSCashBalance(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  let sectionStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "Cash Balance") { sectionStart = i; break; }
  }
  if (sectionStart < 0) return null;

  let headerIdx = sectionStart + 1;
  while (headerIdx < lines.length && !lines[headerIdx].trim()) headerIdx++;
  if (headerIdx >= lines.length) return null;

  const headers = parseCSVLine(lines[headerIdx]).map((h) => h.toLowerCase().trim());
  const iDate = headers.findIndex((h) => h === "date");
  const iTime = headers.findIndex((h) => h === "time");
  const iType = headers.findIndex((h) => h === "type");
  const iDesc = headers.findIndex((h) => h.includes("description"));
  if (iDate < 0 || iType < 0 || iDesc < 0) return null;

  const legs = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cells = parseCSVLine(line);
    if ((cells[iType] || "").trim() !== "TRD") continue;

    const rawDate = (cells[iDate] || "").trim();
    const rawTime = iTime >= 0 ? (cells[iTime] || "").trim() : "";
    const desc = (cells[iDesc] || "").trim();

    // Only match stock tickers (1–6 uppercase letters, no digits)
    const m = desc.match(/^(BOT|SOLD)\s+[+-](\d+)\s+([A-Z]{1,6})\s+@([\d.]+)/i);
    if (!m) continue;

    const qty = parseInt(m[2]);
    const price = parseFloat(m[4]);
    if (!qty || !price) continue;

    legs.push({
      execTime: rawDate + " " + rawTime,
      side: m[1].toUpperCase() === "BOT" ? "BUY" : "SELL",
      qty,
      symbol: m[3].toUpperCase(),
      price,
      date: normalizeDate(rawDate),
    });
  }

  return legs.length ? legs : null;
}

// Parse Account Summary and Profits and Losses OVERALL TOTALS from TOS CSV
function parseTOSAccountSummary(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const info = {};

  // Account Summary section
  let inAcct = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "Account Summary") { inAcct = true; continue; }
    if (inAcct) {
      if (!trimmed) { inAcct = false; continue; }
      const cells = parseCSVLine(line);
      if (cells.length >= 2) {
        const key = (cells[0] || "").trim();
        const raw = (cells[1] || "").trim();
        const negative = raw.includes("(");
        const num = parseFloat(raw.replace(/[$,() ]/g, ""));
        if (key && !isNaN(num)) info[key] = negative ? -num : num;
      }
    }
  }

  // Profits and Losses OVERALL TOTALS row
  let inPnL = false;
  let pnlHeaders = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "Profits and Losses") { inPnL = true; continue; }
    if (!inPnL) continue;
    if (!trimmed) continue;
    const cells = parseCSVLine(line);
    if (!pnlHeaders) {
      if (cells.some((c) => c.toLowerCase().includes("p/l open"))) {
        pnlHeaders = cells.map((c) => c.toLowerCase().trim());
      }
      continue;
    }
    if ((cells[1] || "").toUpperCase().includes("OVERALL TOTALS")) {
      const parseVal = (s) => {
        if (!s) return 0;
        const neg = s.includes("(");
        const n = parseFloat(s.replace(/[$,%() ]/g, ""));
        return isNaN(n) ? 0 : neg ? -n : n;
      };
      const iOpen = pnlHeaders.findIndex((h) => h === "p/l open");
      const iDay  = pnlHeaders.findIndex((h) => h === "p/l day");
      const iYtd  = pnlHeaders.findIndex((h) => h === "p/l ytd");
      if (iOpen >= 0) info["P/L Open"] = parseVal(cells[iOpen]);
      if (iDay  >= 0) info["P/L Day"]  = parseVal(cells[iDay]);
      if (iYtd  >= 0) info["P/L Year"] = parseVal(cells[iYtd]);
      break;
    }
  }

  return Object.keys(info).length > 0 ? info : null;
}

// FIFO trade reconstruction: match BUY legs with SELL legs per symbol.
// Uses leg.date (if present) for the trade date so cross-day positions are dated correctly.
function buildTradesFromLegs(legs, dateStr) {
  const bySymbol = {};
  for (const leg of legs) {
    if (!bySymbol[leg.symbol]) bySymbol[leg.symbol] = [];
    bySymbol[leg.symbol].push(leg);
  }

  const result = [];
  for (const [symbol, symLegs] of Object.entries(bySymbol)) {
    const openQueue = [];
    const completedTrades = [];

    for (const leg of symLegs) {
      const legDate = leg.date || dateStr;
      if (leg.side === "BUY") {
        openQueue.push({ qty: leg.qty, price: leg.price, time: leg.execTime });
      } else if (leg.side === "SELL") {
        let remaining = leg.qty;
        while (remaining > 0 && openQueue.length > 0) {
          const open = openQueue[0];
          const matchedQty = Math.min(remaining, open.qty);
          completedTrades.push({
            entryTime: open.time,
            exitTime: leg.execTime,
            exitDate: legDate,
            entryPrice: open.price,
            exitPrice: leg.price,
            shares: matchedQty,
            pnl: parseFloat(((leg.price - open.price) * matchedQty).toFixed(2)),
            direction: "Long",
          });
          open.qty -= matchedQty;
          remaining -= matchedQty;
          if (open.qty <= 0) openQueue.shift();
        }
        if (remaining > 0) {
          completedTrades.push({
            entryTime: "",
            exitTime: leg.execTime,
            exitDate: legDate,
            entryPrice: leg.price,
            exitPrice: leg.price,
            shares: remaining,
            pnl: 0,
            direction: "Short",
          });
        }
      }
    }

    let tradeGroup = null;
    for (const ct of completedTrades) {
      if (!tradeGroup) {
        tradeGroup = { ...ct };
      } else {
        tradeGroup.pnl = parseFloat((tradeGroup.pnl + ct.pnl).toFixed(2));
        tradeGroup.shares += ct.shares;
        tradeGroup.exitPrice = ct.exitPrice;
        tradeGroup.exitTime = ct.exitTime;
        tradeGroup.exitDate = ct.exitDate;
      }
      const nextIdx = completedTrades.indexOf(ct) + 1;
      const next = completedTrades[nextIdx];
      if (!next || !timesClose(ct.exitTime, next.entryTime, 120)) {
        result.push(buildTradeObj(tradeGroup, symbol, tradeGroup.exitDate || dateStr));
        tradeGroup = null;
      }
    }
  }
  return result;
}

function timesClose(t1str, t2str, secondsThreshold) {
  if (!t1str || !t2str) return false;
  const parse = (s) => {
    const p = s.match(/(\d{1,2}):(\d{2}):(\d{2})$/);
    return p ? parseInt(p[1]) * 3600 + parseInt(p[2]) * 60 + parseInt(p[3]) : 0;
  };
  return Math.abs(parse(t1str) - parse(t2str)) <= secondsThreshold;
}

function buildTradeObj(ct, symbol, dateStr) {
  return {
    id: uid(),
    date: dateStr,
    ticker: symbol,
    pattern: "Gap & Go", // default — user fills in later
    direction: ct.direction || "Long",
    entryPrice: parseFloat(ct.entryPrice.toFixed(4)),
    exitPrice: parseFloat(ct.exitPrice.toFixed(4)),
    shares: ct.shares,
    pnl: parseFloat(ct.pnl.toFixed(2)),
    catalyst: false,
    catalystType: "",
    relVol: 0,
    float: 0,
    premarketHigh: 0,
    gapPct: 0,
    entryGrade: "B",
    exitGrade: "B",
    followedRules: true,
    emotionalState: "Calm",
    sizedCorrectly: true,
    writeUp: "",
    isBestOp: false,
  };
}

// -------------------------------------------------------
// Main file handler — detects format and routes
// -------------------------------------------------------
let _pendingTOSTrades = [];
let _pendingTOSRawText = "";
let _pendingTOSFilename = "";

function parseCsvFile(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const previewEl = document.getElementById("csv-preview");

    if (isTOSAccountStatement(text)) {
      // Try Cash Balance format first (standard TOS Account Statement export),
      // then fall back to Account Trade History format
      let legs = parseTOSCashBalance(text);
      if (!legs || !legs.length) legs = parseTOSAccountStatement(text);

      if (!legs || !legs.length) {
        previewEl.textContent =
          "⚠ TOS Account Statement detected but no trade data found. Make sure you exported a full Account Statement (not just Trade History).";
        return;
      }

      _pendingTOSTrades = buildTradesFromLegs(legs, new Date().toISOString().slice(0, 10));
      _pendingTOSRawText = text;
      _pendingTOSFilename = file.name;

      // Parse and persist account summary info
      const acctInfo = parseTOSAccountSummary(text);
      if (acctInfo) {
        localStorage.setItem(
          "smc_acct_info",
          JSON.stringify({ ...acctInfo, importedAt: new Date().toISOString() }),
        );
      }

      const tickers = [...new Set(_pendingTOSTrades.map((t) => t.ticker))];
      const dates = [...new Set(_pendingTOSTrades.map((t) => t.date))].sort();
      const dateRange = dates.length === 1
        ? `Date: ${dates[0]}`
        : `${dates.length} trading days (${dates[0]} – ${dates[dates.length - 1]})`;

      previewEl.innerHTML =
        `<span style="color:var(--green)">✓ TOS Account Statement detected</span><br>` +
        `${legs.length} execution legs → <strong style="color:var(--orange)">${_pendingTOSTrades.length} completed round-trip trades</strong> via FIFO matching.<br>` +
        `${dateRange} · Tickers: ${tickers.join(", ")}<br>` +
        `<span style="color:var(--muted)">Pattern, grades, and notes default to placeholders — edit each trade after import.</span>`;

      document.getElementById("csv-mapper").style.display = "none";
      document.getElementById("csv-import-btn").style.display = "inline-flex";
      document.getElementById("csv-import-btn").textContent =
        "Import " + _pendingTOSTrades.length + " Trades";
      document.getElementById("csv-import-btn").onclick = importTOSTrades;
    } else {
      // Generic CSV path — show column mapper
      _pendingTOSTrades = [];
      const allRows = parseCSVText(text);
      if (!allRows.length) {
        previewEl.textContent = "No data found.";
        return;
      }

      // Find header row (first row with 3+ non-numeric cells)
      let hi = 0;
      for (let i = 0; i < Math.min(10, allRows.length); i++) {
        if (
          allRows[i].filter((c) => c && isNaN(c.replace(/[$,%()]/g, "")))
            .length >= 3
        ) {
          hi = i;
          break;
        }
      }
      csvHeaders = allRows[hi]
        .map((h) => h.replace(/^"|"$/g, "").trim())
        .filter(Boolean);
      csvRows = allRows.slice(hi + 1).filter((r) => r.some((c) => c.trim()));

      previewEl.textContent = `Found ${csvRows.length} rows · ${csvHeaders.length} columns\nColumns: ${csvHeaders.join(" | ")}`;
      buildCsvMapper();
      document.getElementById("csv-mapper").style.display = "block";
      document.getElementById("csv-import-btn").style.display = "inline-flex";
      document.getElementById("csv-import-btn").textContent = "Import Trades";
      document.getElementById("csv-import-btn").onclick = importCsv;
    }
  };
  reader.readAsText(file);
}

async function importTOSTrades() {
  if (!_pendingTOSRawText) {
    alert("No trades to import.");
    return;
  }

  const btn = document.getElementById("csv-import-btn");
  if (btn) { btn.disabled = true; btn.textContent = "Uploading…"; }

  try {
    const formData = new FormData();
    const blob = new Blob([_pendingTOSRawText], { type: "text/csv" });
    formData.append("csv", blob, _pendingTOSFilename || "statement.csv");

    const resp = await fetch("/api/upload", { method: "POST", body: formData });
    const result = await resp.json();

    if (!resp.ok || result.error) {
      alert("Upload failed: " + (result.error || resp.statusText));
      return;
    }

    closeModal("modal-csv");
    await loadData();

    const dupeNote = result.already_in_db > 0
      ? `\n${result.already_in_db} duplicate(s) skipped (already in database).`
      : "";
    alert(
      `✓ Import complete!\n` +
      `${result.new_trades} new trade(s) added · ${result.trades_found} total found.${dupeNote}\n\n` +
      `Next step: open each trade and fill in Pattern, grades, and notes.`
    );
  } catch (err) {
    alert("Upload error: " + err.message);
  } finally {
    if (btn) { btn.disabled = false; }
    _pendingTOSTrades = [];
    _pendingTOSRawText = "";
    _pendingTOSFilename = "";
  }
}

// Generic CSV mapper builder
const TOS_ALIASES = {
  date: ["date", "exec date", "trade date", "date/time"],
  ticker: ["ticker", "symbol", "symb", "underlying"],
  direction: ["side", "action", "buy/sell", "type"],
  entryPrice: ["entry price", "entry", "buy price", "avg price", "price"],
  exitPrice: ["exit price", "exit", "sell price", "close price"],
  shares: ["shares", "qty", "quantity", "amount", "size"],
  pnl: ["p&l", "pnl", "net p&l", "profit/loss", "gain/loss"],
  relVol: ["rel vol", "rvol", "relative volume"],
  float: ["float", "float (m)"],
  pattern: ["pattern", "setup"],
  catalyst: ["catalyst", "has catalyst", "news"],
  catalystType: ["catalyst type", "news type"],
  premarketHigh: ["premarket high", "pm high"],
  gapPct: ["gap %", "gap pct", "gap"],
  entryGrade: ["entry grade"],
  exitGrade: ["exit grade"],
};

function autoMatchField(field, headers) {
  const aliases = (TOS_ALIASES[field] || [field]).map((a) => a.toLowerCase());
  for (const h of headers) {
    if (aliases.includes(h.toLowerCase().trim())) return h;
  }
  for (const h of headers) {
    if (
      aliases.some(
        (a) =>
          h.toLowerCase().includes(a) || a.includes(h.toLowerCase().trim()),
      )
    )
      return h;
  }
  return "— skip —";
}

function buildCsvMapper() {
  const appFields = [
    "date",
    "ticker",
    "pattern",
    "direction",
    "entryPrice",
    "exitPrice",
    "shares",
    "pnl",
    "catalyst",
    "catalystType",
    "relVol",
    "float",
    "premarketHigh",
    "gapPct",
    "entryGrade",
    "exitGrade",
  ];
  const skipOpt = '<option value="— skip —">— skip —</option>';
  document.getElementById("csv-map-grid").innerHTML = appFields
    .map((f) => {
      const matched = autoMatchField(f, csvHeaders);
      const opts = csvHeaders
        .map(
          (h) =>
            `<option value="${h}"${h === matched ? " selected" : ""}>${h}</option>`,
        )
        .join("");
      return `<div class="csv-map-label">${f}</div><select class="csv-map-sel" id="csv-map-${f}">${skipOpt}${opts}</select>`;
    })
    .join("");
}

function importCsv() {
  const appFields = [
    "date",
    "ticker",
    "pattern",
    "direction",
    "entryPrice",
    "exitPrice",
    "shares",
    "pnl",
    "catalyst",
    "catalystType",
    "relVol",
    "float",
    "premarketHigh",
    "gapPct",
    "entryGrade",
    "exitGrade",
  ];
  const fieldMap = {};
  appFields.forEach((f) => {
    const sel = document.getElementById("csv-map-" + f);
    if (sel) fieldMap[f] = sel.value;
  });
  let imported = 0,
    skipped = 0;
  csvRows.forEach((row) => {
    const t = {
      id: uid(),
      isBestOp: false,
      writeUp: "",
      emotionalState: "Calm",
      followedRules: true,
      sizedCorrectly: true,
      entryGrade: "B",
      exitGrade: "B",
      catalyst: false,
      catalystType: "",
      relVol: 0,
      float: 0,
      premarketHigh: 0,
      gapPct: 0,
      pattern: "Gap & Go",
      direction: "Long",
    };
    appFields.forEach((f) => {
      const col = fieldMap[f];
      if (!col || col === "— skip —") return;
      const idx = csvHeaders.indexOf(col);
      if (idx < 0) return;
      const raw = (row[idx] || "").replace(/[$,%()]/g, "").trim();
      if (
        [
          "entryPrice",
          "exitPrice",
          "pnl",
          "relVol",
          "float",
          "premarketHigh",
          "gapPct",
        ].includes(f)
      )
        t[f] = parseFloat(raw) || 0;
      else if (f === "shares") t[f] = parseInt(raw.replace(/,/g, "")) || 0;
      else if (f === "catalyst")
        t[f] = ["true", "yes", "1", "y"].includes(raw.toLowerCase());
      else if (f === "direction") {
        const rv = raw.toLowerCase();
        t[f] = rv.includes("sell") || rv.includes("short") ? "Short" : "Long";
      } else if (f === "date") t[f] = normalizeDate(raw);
      else t[f] = raw;
    });
    if (!t.pnl && t.entryPrice && t.exitPrice && t.shares) {
      const dir = t.direction === "Short" ? -1 : 1;
      t.pnl = parseFloat(
        ((t.exitPrice - t.entryPrice) * t.shares * dir).toFixed(2),
      );
    }
    if (t.date && t.ticker) {
      trades.push(t);
      imported++;
    } else skipped++;
  });
  saveTrades();
  closeModal("modal-csv");
  renderLog();
  alert(
    `✓ Imported ${imported} trades.${skipped ? " " + skipped + " rows skipped." : ""}`,
  );
}

// ============================================================
// TAB 3: PLAYBOOK
// ============================================================
