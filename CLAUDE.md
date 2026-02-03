# Project Instructions

Read and follow @AGENTS.md. These rules are authoritative for task state, roles, and invariants.

Key non-negotiables:
- Legacy code is read-only. There is no `legacy/` folder here; this refers to the existing Python 2.7 App Engine codebase in the repo root (e.g., `form.py`, `ttc_portal.py`, `admin.py`, etc.).
- Use the ACTIVE_TASK state machine (R → P → I, then remove `docs/Tasks/ACTIVE_TASK.md`).
- Keep step registry aligned and run `bun scripts/bdd/verify-alignment.ts` before commits.
