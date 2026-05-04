"use strict";

      function renderPlaybook() {
        // Rebuild patternKeyMap for CRUD lookups
        patternKeyMap = {};
        patterns.forEach((p) => {
          patternKeyMap[p.replace(/[^a-z0-9]/gi, "")] = p;
        });
        const sub = document.getElementById("pb-subtitle");
        if (sub)
          sub.textContent =
            patterns.length +
            " Pattern Setups · Interactive Checklists · Live Stats";

        const nav = document.getElementById("pb-nav");
        const cards = document.getElementById("pb-cards");
        nav.innerHTML = patterns
          .map(
            (p, i) =>
              `<div class="pb-nav-item${i === 0 ? " active" : ""}" onclick="jumpPattern('${p.replace(/'/g, "\\'")}',this)">${p}</div>`,
          )
          .join("");
        cards.innerHTML = patterns.map((p) => buildPatternCard(p)).join("");
      }

      function jumpPattern(name, el) {
        document
          .querySelectorAll(".pb-nav-item")
          .forEach((x) => x.classList.remove("active"));
        el.classList.add("active");
        const id = "pattern-" + name.replace(/[^a-z0-9]/gi, "");
        const card = document.getElementById(id);
        if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      function getPatternStats(p) {
        const pt = trades.filter((t) => t.pattern === p);
        if (!pt.length) return null;
        const wins = pt.filter((t) => t.pnl > 0);
        return {
          total: pt.length,
          winRate: wins.length / pt.length,
          avgPnl: pt.reduce((a, x) => a + x.pnl, 0) / pt.length,
          failRate: (pt.length - wins.length) / pt.length,
        };
      }

      function buildPatternCard(p) {
        const pb = playbookData[p] || {
          setup: [],
          entry: "No entry rules defined.",
          failures: [],
        };
        const st = getPatternStats(p);
        const statsHtml = st
          ? `
    <div class="p-stats">
      <div class="p-stat"><div class="p-stat-val ${st.winRate >= 0.5 ? "pos" : "neg"}">${(st.winRate * 100).toFixed(0)}%</div><div class="p-stat-lbl">Win Rate</div></div>
      <div class="p-stat"><div class="p-stat-val ${st.avgPnl >= 0 ? "pos" : "neg"}">${st.avgPnl >= 0 ? "+" : ""}$${Math.abs(st.avgPnl).toFixed(0)}</div><div class="p-stat-lbl">Avg P&L</div></div>
      <div class="p-stat"><div class="p-stat-val neu">${st.total}</div><div class="p-stat-lbl">Trades</div></div>
      <div class="p-stat"><div class="p-stat-val neg">${(st.failRate * 100).toFixed(0)}%</div><div class="p-stat-lbl">Fail Rate</div></div>
    </div>`
          : `<div style="color:var(--muted);font-size:13px;font-style:italic">No trades logged yet — stats will appear after your first ${p} trade.</div>`;
        const safeId = p.replace(/[^a-z0-9]/gi, "");
        const id = "pattern-" + safeId;
        const checks = (pb.setup || [])
          .map(
            (s, i) =>
              `<div class="pb-item-row">
                <div class="chk-item"><input type="checkbox" id="chk-${id}-${i}"><label for="chk-${id}-${i}">${s}</label></div>
                <div class="pb-item-controls">
                  <button class="pb-icon-btn" onclick="pbEditSetup('${safeId}',${i})">✎</button>
                  <button class="pb-icon-btn del" onclick="pbDelSetup('${safeId}',${i})">✕</button>
                </div>
              </div>`,
          )
          .join("");
        const failures = (pb.failures || [])
          .map(
            (f, i) =>
              `<div class="pb-item-row">
                <div style="flex:1"><li>${f}</li></div>
                <div class="pb-item-controls">
                  <button class="pb-icon-btn" onclick="pbEditFailure('${safeId}',${i})">✎</button>
                  <button class="pb-icon-btn del" onclick="pbDelFailure('${safeId}',${i})">✕</button>
                </div>
              </div>`,
          )
          .join("");
        const entryText = pb.entry || "—";
        return `<div class="pattern-card" id="${id}">
    <div class="pb-card-hdr">
      <div class="pattern-name" style="margin-bottom:0">${p}</div>
      <button class="btn btn-danger btn-sm" onclick="pbDelPattern('${safeId}')">Delete Pattern</button>
    </div>
    <div class="p4">
      <div class="p-sect">
        <div class="p-sect-title" style="display:flex;justify-content:space-between;align-items:center">
          <span>A · Setup Checklist</span>
          <button class="pb-icon-btn" onclick="pbAddSetup('${safeId}')" style="font-size:13px;padding:1px 8px">+ Add</button>
        </div>
        ${checks || '<p style="color:var(--muted);font-size:13px">No checklist items — click + Add to create one.</p>'}
      </div>
      <div class="p-sect">
        <div class="p-sect-title" style="display:flex;justify-content:space-between;align-items:center">
          <span>B · Entry &amp; Exit Rules</span>
          <button class="pb-icon-btn" onclick="pbEditEntry('${safeId}')" style="font-size:13px;padding:1px 8px">✎ Edit</button>
        </div>
        <div class="pb-entry-wrap" id="entry-wrap-${safeId}">
          <p id="entry-text-${safeId}">${entryText}</p>
          <textarea class="pb-entry-textarea" id="entry-ta-${safeId}">${entryText}</textarea>
          <div class="pb-entry-save-row" id="entry-save-${safeId}">
            <button class="btn btn-primary btn-sm" onclick="pbSaveEntry('${safeId}')">Save</button>
            <button class="btn btn-secondary btn-sm" onclick="pbCancelEntry('${safeId}')">Cancel</button>
          </div>
        </div>
      </div>
      <div class="p-sect">
        <div class="p-sect-title" style="display:flex;justify-content:space-between;align-items:center">
          <span>C · Small Cap Failure Modes</span>
          <button class="pb-icon-btn" onclick="pbAddFailure('${safeId}')" style="font-size:13px;padding:1px 8px">+ Add</button>
        </div>
        <ul style="list-style:none">${failures || '<li style="color:var(--muted);font-size:13px">No failure modes — click + Add to create one.</li>'}</ul>
      </div>
      <div class="p-sect">
        <div class="p-sect-title">D · Historical Stats</div>
        ${statsHtml}
      </div>
    </div>
  </div>`;
      }

      // ============================================================
      // PLAYBOOK CRUD
      // ============================================================
      function pbPatternFromKey(safeId) {
        return patternKeyMap[safeId];
      }

      function pbAddSetup(safeId) {
        const p = pbPatternFromKey(safeId);
        if (!p) return;
        const item = prompt("New checklist item:");
        if (!item || !item.trim()) return;
        playbookData[p].setup.push(item.trim());
        savePlaybook();
        renderPlaybook();
        document
          .getElementById("pattern-" + safeId)
          .scrollIntoView({ block: "start" });
      }

      function pbEditSetup(safeId, idx) {
        const p = pbPatternFromKey(safeId);
        if (!p) return;
        const current = playbookData[p].setup[idx];
        const updated = prompt("Edit checklist item:", current);
        if (updated === null) return;
        if (updated.trim()) playbookData[p].setup[idx] = updated.trim();
        savePlaybook();
        renderPlaybook();
        document
          .getElementById("pattern-" + safeId)
          .scrollIntoView({ block: "start" });
      }

      function pbDelSetup(safeId, idx) {
        const p = pbPatternFromKey(safeId);
        if (!p || !confirm("Delete this checklist item?")) return;
        playbookData[p].setup.splice(idx, 1);
        savePlaybook();
        renderPlaybook();
        document
          .getElementById("pattern-" + safeId)
          .scrollIntoView({ block: "start" });
      }

      function pbEditEntry(safeId) {
        const wrap = document.getElementById("entry-wrap-" + safeId);
        document.getElementById("entry-text-" + safeId).style.display = "none";
        document.getElementById("entry-ta-" + safeId).classList.add("open");
        document.getElementById("entry-save-" + safeId).classList.add("open");
      }

      function pbSaveEntry(safeId) {
        const p = pbPatternFromKey(safeId);
        if (!p) return;
        const val = document.getElementById("entry-ta-" + safeId).value;
        playbookData[p].entry = val;
        savePlaybook();
        renderPlaybook();
        document
          .getElementById("pattern-" + safeId)
          .scrollIntoView({ block: "start" });
      }

      function pbCancelEntry(safeId) {
        const p = pbPatternFromKey(safeId);
        if (!p) return;
        document.getElementById("entry-text-" + safeId).style.display = "";
        document.getElementById("entry-ta-" + safeId).classList.remove("open");
        document
          .getElementById("entry-save-" + safeId)
          .classList.remove("open");
        document.getElementById("entry-ta-" + safeId).value =
          playbookData[p].entry || "";
      }

      function pbAddFailure(safeId) {
        const p = pbPatternFromKey(safeId);
        if (!p) return;
        const item = prompt("New failure mode:");
        if (!item || !item.trim()) return;
        playbookData[p].failures.push(item.trim());
        savePlaybook();
        renderPlaybook();
        document
          .getElementById("pattern-" + safeId)
          .scrollIntoView({ block: "start" });
      }

      function pbEditFailure(safeId, idx) {
        const p = pbPatternFromKey(safeId);
        if (!p) return;
        const current = playbookData[p].failures[idx];
        const updated = prompt("Edit failure mode:", current);
        if (updated === null) return;
        if (updated.trim()) playbookData[p].failures[idx] = updated.trim();
        savePlaybook();
        renderPlaybook();
        document
          .getElementById("pattern-" + safeId)
          .scrollIntoView({ block: "start" });
      }

      function pbDelFailure(safeId, idx) {
        const p = pbPatternFromKey(safeId);
        if (!p || !confirm("Delete this failure mode?")) return;
        playbookData[p].failures.splice(idx, 1);
        savePlaybook();
        renderPlaybook();
        document
          .getElementById("pattern-" + safeId)
          .scrollIntoView({ block: "start" });
      }

      function pbDelPattern(safeId) {
        const p = pbPatternFromKey(safeId);
        if (
          !p ||
          !confirm(
            `Delete pattern "${p}"?\n\nExisting trades logged with this pattern won't be deleted, but this pattern will be removed from the playbook and dropdown.`,
          )
        )
          return;
        patterns = patterns.filter((x) => x !== p);
        delete playbookData[p];
        savePlaybook();
        // Update the trade form dropdown
        const sel = document.getElementById("f-pattern");
        if (sel) {
          const opt = Array.from(sel.options).find((o) => o.value === p);
          if (opt) sel.removeChild(opt);
        }
        renderPlaybook();
      }

      function pbAddPattern() {
        const name = prompt("New pattern name:");
        if (!name || !name.trim()) return;
        const trimmed = name.trim();
        if (patterns.includes(trimmed)) {
          alert("Pattern already exists.");
          return;
        }
        patterns.push(trimmed);
        playbookData[trimmed] = { setup: [], entry: "", failures: [] };
        savePlaybook();
        // Update the trade form dropdown
        const sel = document.getElementById("f-pattern");
        if (sel) {
          const opt = document.createElement("option");
          opt.value = trimmed;
          opt.textContent = trimmed;
          sel.appendChild(opt);
        }
        renderPlaybook();
        // Scroll to the new card
        requestAnimationFrame(() => {
          const safeId = trimmed.replace(/[^a-z0-9]/gi, "");
          const card = document.getElementById("pattern-" + safeId);
          if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }

      // ============================================================
      // TAB 4: COACH
      // ============================================================
