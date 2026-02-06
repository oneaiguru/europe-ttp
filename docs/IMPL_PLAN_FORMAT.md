# IMPLEMENTATION_PLAN.md — Canonical Format Spec

## Why this matters

Scripts (`queue-sequential.sh`, `generate_task_graph.ts`) parse `IMPLEMENTATION_PLAN.md` to determine which tasks to queue. Agents (Haiku, Sonnet, Codex) read and update it every loop. If the format drifts, queues break silently and agents hallucinate status.

## The format: one table per section

```markdown
# Implementation Plan

## Backlog

| task_key | name | priority | status | refs |
|----------|------|----------|--------|------|
| TASK-041 | Add rate limiting to coordinator | P1 | TODO | specs/coordinator.md |
| TASK-042 | Worker graceful shutdown | P1 | TODO | specs/worker.md |
| TASK-043 | Dashboard dark mode | P2 | TODO | docs/plan_scope.md |

## Active

| task_key | name | priority | status | claimed_by | refs |
|----------|------|----------|--------|------------|------|
| TASK-040 | Fix ledger cursor encoding | P0 | IN_PROGRESS | codex-worker-1 | packages/contracts/src/ledger.ts |

## Done

| task_key | name | completed | summary |
|----------|------|-----------|---------|
| TASK-039 | Entrypoint bad files status | 2026-02-06 | Set RUN_STATUS=error on banned files |
| TASK-038 | Extractor run status gate | 2026-02-06 | Skip skills pipeline on failed runs |
```

## Field rules

| field | format | required | notes |
|-------|--------|----------|-------|
| `task_key` | `TASK-NNN` (zero-padded 3 digits) | yes | Monotonic, never reused |
| `name` | kebab-style slug ≤60 chars | yes | Matches `docs/Tasks/<slug>.task.md` |
| `priority` | `P0` / `P1` / `P2` | yes | P0=correctness, P1=robustness, P2=ergonomics |
| `status` | `TODO` / `IN_PROGRESS` / `BLOCKED` / `DONE` / `SKIPPED` | yes | Only these 5 values |
| `refs` | comma-separated file paths or spec refs | yes | At least one ref |
| `completed` | `YYYY-MM-DD` | Done only | Date task was completed |
| `summary` | ≤120 chars, one sentence | Done only | What changed, not how |
| `claimed_by` | worker id or agent name | Active only | Who is working on it |

## Parsing contract (for scripts)

```bash
# Get all TODO task_keys
grep '| TODO |' IMPLEMENTATION_PLAN.md | awk -F'|' '{print $2}' | tr -d ' '

# Get all DONE task_keys
grep '| DONE |' IMPLEMENTATION_PLAN.md | awk -F'|' '{print $2}' | tr -d ' '
# OR from Done section:
sed -n '/^## Done/,/^## /p' IMPLEMENTATION_PLAN.md | grep '^|' | tail -n+2

# Count remaining work
grep -c '| TODO |' IMPLEMENTATION_PLAN.md
```

## Archive rules

When the Done table exceeds 30 rows:
1. Move oldest entries to `docs/archive/IMPL_PLAN_ARCHIVE_YYYY-MM.md`
2. Archive file has the same table format (task_key, name, completed, summary)
3. Add a link at the bottom of IMPLEMENTATION_PLAN.md: `> Archived: [Jan 2026](docs/archive/IMPL_PLAN_ARCHIVE_2026-01.md) (35 tasks)`
4. Keep the 10 most recent Done entries in IMPLEMENTATION_PLAN.md for context

## Completion log (separate file)

Detailed implementation notes go in `docs/COMPLETION_LOG.md`, not in the plan:

```markdown
# Completion Log

## TASK-039: entrypoint-bad-files-status (2026-02-06)

Added `RUN_STATUS="error"` and `EXIT_CODE=1` before `exit` in both Claude
(lines 496-501) and Codex (lines 949-954) entrypoints' banned-files checks.
Follows existing error-handling pattern from PROMPT_FILE missing check.
Finalize trap now writes correct status/exit_code to meta.json.

Files: images/weaver/Dockerfile:496-501, 949-954
Tests: 2 new tests in entrypoint banned-files suite
Task docs: docs/Tasks/entrypoint-bad-files-status.*
```

This keeps the plan scannable and moves the verbose notes where agents can read them only when needed.
