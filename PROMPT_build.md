# Europe TTP Migration - Build Loop (Task-Driven, BDD-Gated)

## Role Selection (File-Gated)
Determine role by checking file state, then follow ONLY that section:

- If `docs/Tasks/ACTIVE_TASK.md` is missing: role = **T** (Task Intake)
- If `docs/Tasks/ACTIVE_TASK.md` exists:
  - If `docs/Tasks/<slug>.research.md` is missing: role = **R** (Research)
  - Else if `docs/Tasks/<slug>.plan.md` is missing: role = **P** (Plan)
  - Else: role = **I** (Implement)

Run exactly ONE role per loop, then STOP.

---

## Canonical Implementation Plan Format (MUST FOLLOW)
`docs/IMPL_PLAN_FORMAT.md` is the source of truth for how to edit `IMPLEMENTATION_PLAN.md`.

Rules (summary):
- The plan uses three markdown tables: `## Backlog` (TODO items), `## Active` (IN_PROGRESS), `## Done` (completed).
- Only update the `## Backlog` / `## Active` / `## Done` tables. Do not edit other plan sections unless explicitly asked.
- Allowed statuses: `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`, `SKIPPED`.
- `task_key` is monotonic `TASK-NNN` (zero-padded). Never reuse keys.
- `name` is a kebab-style slug <= 60 chars.
- `summary` in Done is <= 120 chars, one sentence (what changed, not how).
- Verbose implementation notes go in `docs/COMPLETION_LOG.md`, not in plan tables.
- If Done exceeds 30 rows, archive oldest to `docs/archive/IMPL_PLAN_ARCHIVE_YYYY-MM.md`.

---

## Bootstrapping (Every Loop)
Before any role, confirm you are in the repo root. In the Weaver container, the repo is mounted at `/workspace`.

Required reading (customize per task):
- `AGENTS.md`
- `IMPLEMENTATION_PLAN.md`
- `docs/IMPL_PLAN_FORMAT.md`
- `docs/Tasks/README.md`
- `docs/SESSION_HANDOFF.md` (log only; do NOT use it to decide whether work remains)
- `HANDOFF.md` / `CODEX_AGENT_HANDOFF.md` (context)

Ensure JS dependencies are present (lockfile-aware; do not run `npm ci` unless `package-lock.json` exists):

```bash
if [ ! -d node_modules ]; then
  if command -v bun >/dev/null 2>&1 && ( [ -f bun.lockb ] || [ -f bun.lock ] ); then
    bun install
  elif [ -f pnpm-lock.yaml ]; then
    corepack enable >/dev/null 2>&1 || true
    pnpm install --frozen-lockfile
  elif [ -f package-lock.json ]; then
    npm ci
  elif [ -f yarn.lock ]; then
    yarn install --frozen-lockfile
  elif command -v bun >/dev/null 2>&1; then
    bun install
  else
    npm install
  fi
fi
```

Common verification commands (all agents run these):
```bash
bun run bdd:verify
bun run bdd:python <file>
bun run bdd:typescript <file>
bun run typecheck
bun run lint
```

---

## T (Task Intake)

Purpose: Pick the next TODO item from `IMPLEMENTATION_PLAN.md` and create an active task file.

Read:
- `IMPLEMENTATION_PLAN.md`
- `docs/IMPL_PLAN_FORMAT.md`
- `AGENTS.md`

Do:
1. Select the next task from `IMPLEMENTATION_PLAN.md` `## Backlog` table where `status` is `TODO`.
   - Choose highest priority first: `P0` -> `P1` -> `P2`.
   - Tie-breaker: lowest `TASK-NNN`.
   - If Backlog has no TODO rows, STOP and report that no updates are needed.
2. Let `<slug>` be the Backlog row `name` value.
3. Create `docs/Tasks/ACTIVE_TASK.md` containing exactly:
   - `<slug>`
4. Create `docs/Tasks/<slug>.task.md` (use `docs/Tasks/templates/task.md` as a starting point) including:
   - `task_key`, `slug`, goal, refs
   - Acceptance criteria (tests and behavior)

Stop after T.

---

## R (Research)

Purpose: Gather evidence and constraints. No code edits.

Read:
- `docs/Tasks/ACTIVE_TASK.md` to get `<slug>`
- `docs/Tasks/<slug>.task.md`
- Referenced files in `refs`

Do:
- Search the repo with `rg` before assuming anything is missing.
- Produce `docs/Tasks/<slug>.research.md` using file:line references only.
- No edits, no tests.

Stop after R.

---

## P (Plan)

Purpose: Produce an implementation plan. No code edits.

Read:
- `docs/Tasks/<slug>.task.md`
- `docs/Tasks/<slug>.research.md`

Output `docs/Tasks/<slug>.plan.md` with:
- Implementation steps
- Files to change
- Tests to run
- Risks / rollback

Stop after P.

---

## I (Implement)

Purpose: Implement exactly the plan, then verify.

Read:
- `docs/Tasks/<slug>.task.md`
- `docs/Tasks/<slug>.research.md`
- `docs/Tasks/<slug>.plan.md`

Critical invariants (from `AGENTS.md`):
- Legacy is read-only.
- `bun run bdd:verify` must pass before commit.
- Python-first: TypeScript implementation only after Python passes.

Verification gate (minimum):
```bash
bun run bdd:verify
bun run bdd:python <file>
bun run bdd:typescript <file>
bun run typecheck
bun run lint
```

Update `IMPLEMENTATION_PLAN.md` (strict):
1. Move the task row from `## Backlog` to `## Done`.
2. Set `completed` to today (YYYY-MM-DD).
3. Write a <= 120 char, one sentence summary.
4. If the task appears in `## Active`, remove it.

Append details to `docs/COMPLETION_LOG.md` under:
- `## TASK-NNN: <slug> (YYYY-MM-DD)`

Cleanup:
- Remove `docs/Tasks/ACTIVE_TASK.md`.

Stop after I.
