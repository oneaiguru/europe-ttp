# Europe TTP Migration - Agent Operations

## Overview
This file defines how agents (Claude Code, Codex, Weaver) interact with this project.

---

## Agent Roles

### Claude Code (Interactive - Prep Phase)
**Location:** Local, interactive session
**Responsibilities:**
- Extraction from legacy Python code
- Feature file generation
- Step registry creation
- Task graph generation

**Entry Point:** PROMPT_plan.md
**Output:** specs/extracted/*.json, specs/features/**/*.feature, tasks/task_graph.json

---

### Codex CLI (Local via loop_mix.sh)
**Location:** Local, non-interactive
**Responsibilities:**
- **Plan loop**: Update IMPLEMENTATION_PLAN.md based on progress
- **Review loop**: Review implementation drafts

**Commands:**
```bash
loop_mix.sh plan    # Update plan from current state
loop_mix.sh review  # Review pending work
```

---

### AA Weaver (Autonomous - Build Phase)
**Location:** M1/PC workers via coordinator
**Responsibilities:**
- Execute T→R→P→I build loop
- Run BDD verification
- Update coverage matrix

**Entry Point:** PROMPT_build.md
**Environment Variables:**
```bash
COORDINATOR_URL=http://192.168.1.80:8787
WEAVER_REPO_PATH=/Users/m/projects/europe-ttp-migration
WEAVER_OUTPUT_PATH=/Users/m/aa-output
WEAVER_CODEX_HOME=$HOME/.codex
```

**Worker Start:**
```bash
pnpm exec tsx /Users/m/aa/apps/worker/src/index.ts
```

**Submit Task:**
```bash
curl -X POST http://192.168.1.80:8787/tasks \
  -H 'Content-Type: application/json' \
  -d '{"provider":"codex","mode":"build"}'
```

---

## File State Machine

```
ACTIVE_TASK.md exists → Worker picks task
├── <slug>.research.md missing → Run R (Research)
├── <slug>.plan.md missing → Run P (Plan)
└── <slug>.plan.md exists → Run I (Implement)

After I complete → Remove ACTIVE_TASK.md
```

---

## Critical Invariants

1. **BDD Alignment**: Every .feature step must have Python + TypeScript impl
2. **No Orphan Steps**: `bun run bdd:verify` must pass before commit
3. **Python First**: TypeScript impl only after Python passes
4. **Legacy Read-Only**: Never modify legacy/

---

## Test Commands (All Agents Run These)

```bash
bun run bdd:verify          # Alignment check
bun run bdd:python <file>   # Verify against Python
bun run bdd:typescript <file> # Verify new code
bun run typecheck           # Type check
bun run lint                # Lint
```
