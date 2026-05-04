# Claude Code — Project Operating Instructions
# Backtest Project (TOS Trading Journal)

## IDENTITY

You are a stateful engineering assistant for this project. Maintaining the
control documents in `important/` is a first-class responsibility — not an
afterthought. State continuity across sessions is your job.

---

## RULE 0 — SESSION START (MANDATORY)

Before doing any work, read these files to restore state:

- `important/TASKS.md`      → what is TODO / IN PROGRESS / DONE
- `important/CHANGELOG.md`  → what version we are on and what changed last
- `important/BUGS.md`       → open bugs and risks to avoid

If any control document is missing or clearly stale, STOP and rebuild it
before any other work. Do not proceed with features on an unknown baseline.

---

## RULE 1 — SESSION END (MANDATORY)

Before ending any session you MUST update all 7 control documents.
All 7 live in `important/`:

| File | Update when |
|---|---|
| `important/TASKS.md` | Move completed tasks to DONE; add any new tasks discovered |
| `important/CHANGELOG.md` | Append a version entry for everything changed this session |
| `important/BUGS.md` | Log any new bugs or risks introduced; mark resolved bugs |
| `important/DECISIONS.md` | Log any architectural decisions made this session |
| `important/ARCHITECTURE.md` | Update if any files or modules were added, removed, or changed |
| `important/PROJECT_SPEC.md` | Update if project scope or requirements changed |
| `important/README.md` | Update if setup steps or run instructions changed |

**How to update each file correctly:**

### TASKS.md
- Move tasks you completed from TODO to DONE (with a brief description of what was done).
- Add new tasks you discovered during the session under TODO.
- Keep IN PROGRESS honest — only tasks actively being worked right now.
- Do NOT delete DONE entries; they are the audit trail.

### CHANGELOG.md
- Add a new `## X.Y.Z - YYYY-MM-DD` heading at the top (above previous entries).
- Bump the patch version for fixes/tweaks, minor for new features, major for breaking changes.
- List every file you modified and what changed. Be specific enough that someone can understand what happened without reading the diff.

### BUGS.md
- Open bugs: add `### B-XXX — Short title` with one paragraph describing the symptom, affected files, and how to reproduce.
- Resolved bugs: move the entry to the `## Resolved` section and prefix with `**Resolved X.Y.Z**`.
- Do not delete bug entries.

### DECISIONS.md
- Add `## YYYY-MM-DD — Short title` for each architectural decision made.
- Include: what was decided, why (the constraint or trade-off), and what was rejected.
- If a previous "do not do X yet" decision was overturned, add a new entry — do not edit the old one.

### ARCHITECTURE.md
- Update the file table if any file was added, removed, or had its role changed.
- Update the REST API table if any routes were added or removed.
- Update the Data Flow diagram if the data pipeline changed.
- Update the Storage Split table if new storage locations were introduced.

### PROJECT_SPEC.md
- Update Core Requirements if the feature set changed.
- Update the workflow section if the user-facing steps changed.
- Update Non-Goals if scope boundaries shifted.

### README.md
- Update the Run section if the startup procedure changed.
- Update the Import Trades section if the CSV import flow changed.
- Update the requirements section if `requirements.txt` changed.

Do NOT end a session without completing all 7. If asked to close out early,
remind the user that the control documents still need updating.

---

## RULE 2 — CONTEXT EMERGENCY PROTOCOL (CRITICAL)

If context limits are approaching (long session, many files read, heavy output):

1. STOP all feature work immediately.
2. Say exactly: "⚠️ CONTEXT LIMIT APPROACHING — Running emergency save now."
3. Update all 7 control documents with current state.
4. Append a HANDOFF NOTE to `important/TASKS.md`:

```
### 🚨 HANDOFF NOTE — YYYY-MM-DD

**Session ended due to context limit.**

- Last task worked on: [task name]
- Current status: [what was done / what was not]
- Next step: [exactly what to do first in the next session]
- Files modified this session: [list]
- Risks to know: [anything unstable or incomplete]
```

5. Confirm: "✅ Emergency save complete. Safe to continue in a new session."

---

## RULE 3 — NEVER LOSE STATE

- If control documents are missing → rebuild them before any work.
- If control documents are stale (describe files that no longer exist, or
  omit files that do) → correct them before any work.
- If you deleted a file → remove or update its entry in ARCHITECTURE.md
  and HOWTO.md in the same session, not a future one.
- If you resolved a bug → move it to Resolved in BUGS.md immediately.
- If you completed a task → move it to DONE in TASKS.md immediately.

You are responsible for state continuity across sessions. Act like it.
