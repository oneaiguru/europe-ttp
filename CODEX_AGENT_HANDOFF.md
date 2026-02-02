# Handoff: Europe TTP Migration Project

## Context
Migration project at `/Users/m/git/clients/aol/europe-ttp`
Migrating Python 2.7 App Engine → Bun + Next.js 14 using BDD-first approach.

## Current State
- ✅ Project structure created
- ✅ Legacy code present in root (read-only reference)
- ✅ Git repo initialized (oneaiguru account)
- ✅ BDD infrastructure docs created
- ✅ Critical decisions documented (`docs/decisions/MIGRATION_DECISIONS.md`)
- ✅ Tech stack mapped with web-sourced references (`TECH_STACK_CHECKLIST.md`)

## Files Ready for Codex Plan Agent

``/Users/m/git/clients/aol/europe-ttp/CODEX_PLAN_PROMPT.md
```

This file contains complete instructions for PREP phase:
- Phase 0A: Extract routes.json, models.json, forms.json, emails.json, reports.json
- Phase 0B: Generate .feature files (Gherkin)
- Phase 0C: Create step registry
- Phase 0D: Generate task graph

## Your Codex Agent Role (Docker Container)

### Step 1: Run PREP Phase

Pass this entire file + CODEX_PLAN_PROMPT.md to your Codex agent:

```
Read /Users/m/git/clients/aol/europe-ttp/CODEX_PLAN_PROMPT.md
Execute Phase 0A (extraction), then 0B (features), then 0C (registry), then 0D (task graph)
```

### Step 2: Verify Outputs

After PREP phase, verify:
```bash
cd /Users/m/git/clients/aol/europe-ttp

ls -la specs/extracted/*.json
# Output: routes.json models.json forms.json emails.json reports.json

find specs/features -name "*.feature" | wc -l
# Output: 20+ (should be 30+)

cat test/bdd/step-registry.ts | grep "pattern:" | wc -l
# Output: 50+ step patterns

cat tasks/task_graph.json | jq ".tasks | length"
# Output: 30-60 tasks
```

### Step 3: Resolve Blocking Decisions

Before BUILD phase, review `docs/decisions/MIGRATION_DECISIONS.md` and resolve:

```
[ ] DB Key Strategy        (docs/decisions/MIGRATION_DECISIONS.md #1)
[ ] Upload Strategy        (docs/decisions/MIGRATION_DECISIONS.md #3)
[ ] Session Strategy       (docs/decisions/MIGRATION_DECISIONS.md #5)
```

### Step 4: Hand Off to Weaver (M1 Worker)

Once PREP complete and decisions resolved:

```bash
# On M1 worker, point to this project
COORDINATOR_URL=http://192.168.1.80:8787 \
  WEAVER_REPO_PATH=/Users/m/git/clients/aol/europe-ttp \
  WEAVER_OUTPUT_PATH=/Users/m/aa-output \
  WEAVER_CODEX_HOME=$HOME/.codex \
  pnpm exec tsx /Users/m/aa/apps/worker/src/index.ts

# Submit build tasks
curl -X POST http://192.168.1.80:8787/tasks \
  -H 'Content-Type: application/json' \
  -d '{"provider":"codex","mode":"build"}'
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `CODEX_PLAN_PROMPT.md` | PREP phase instructions (Codex reads this) |
| `PROMPT_build.md` | BUILD phase T→R→P→I loop (Weaver reads this) |
| `IMPLEMENTATION_PLAN.md` | Task queue (populated after PREP) |
| `docs/coverage_matrix.md` | Feature parity tracking |
| `docs/decisions/MIGRATION_DECISIONS.md` | 10 critical decisions |
| `TECH_STACK_CHECKLIST.md` | Tech mapping with sources |
| `test/bdd/step-registry.ts` | Step definitions (single source of truth) |
| `specs/features/**/*.feature` | BDD scenarios |

## BDD Rules (Critical)

- Every `.feature` step must have Python + TypeScript implementations
- Run `bun run bdd:verify` before committing
- Python must pass BEFORE TypeScript implemented
- No orphan steps allowed
- `test/bdd/step-registry.ts` is single source of truth

## Test Commands

```bash
cd /Users/m/git/clients/aol/europe-ttp

bun run bdd:verify          # Alignment check
bun run bdd:python <file>   # Verify against Python
bun run bdd:typescript <file> # Verify new code
bun run typecheck           # Type check
bun run lint                # Lint
```

---

## Summary: What Runs Where

| Phase | Tool | Where | Mode |
|-------|------|-------|------|
| Prep: Extraction | Codex | Docker container | Autonomous |
| Prep: Feature files | Codex | Docker container | Autonomous |
| Prep: Task graph | Codex | Docker container | Autonomous |
| Plan loop | Codex CLI | Local via loop_mix.sh plan | IMPLEMENTATION_PLAN updates |
| Review loop | Codex CLI | Local via loop_mix.sh review | Review drafts |
| Build loop | AA Weaver | M1/PCs via coordinator | Autonomous T→R→P→I |

---

**Status**: READY FOR CODEX PLAN AGENT

**Next**: Pass `CODEX_PLAN_PROMPT.md` to your Codex Docker agent.
