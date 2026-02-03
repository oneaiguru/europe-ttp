# Project Instructions

Read and follow @AGENTS.md. These rules are authoritative for task state, roles, and invariants.

Additional references:
- @PROMPT_build.md
- @PROMPT_plan.md

Key non-negotiables:
- Legacy is read-only (`legacy/` must never be modified).
- Use the ACTIVE_TASK state machine (R → P → I, then remove `docs/Tasks/ACTIVE_TASK.md`).
- Keep step registry aligned and run `bun scripts/bdd/verify-alignment.ts` before commits.
