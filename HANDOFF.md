# Europe TTP Migration - HANDOFF

## Project
Migrate Python 2.7 App Engine app → Bun + Next.js 14 using BDD-first approach.

## Location
`/Users/m/git/clients/aol/europe-ttp`

## Git Repo
Initialized (oneaiguru), 2960 files tracked (monorepo: legacy Python + migration infra)

---

## Key Files Created

### Entry Points (LOOP FILES - pass these to Codex/Weaver)
```
PROMPT_plan.md    # Extraction phase (read Python, output JSON/features)
PROMPT_build.md   # T→R→P→I build loop (implement features with BDD)
```

### Operational Docs
```
AGENTS.md                     # Agent roles (Claude Code, Codex, Weaver)
IMPLEMENTATION_PLAN.md        # Task list (priority-ordered)
docs/SESSION_HANDOFF.md       # Session tracking
docs/coverage_matrix.md       # Feature parity checklist
docs/Tasks/README.md          # Task file state machine
docs/Tasks/templates/task.md  # Task template
```

### Structure Created
```
specs/extracted/    # JSON extractions from Python (routes, models, forms, etc.)
specs/features/     # Gherkin .feature files (BDD scenarios)
specs/database/     # Prisma schema (NDB → PostgreSQL mapping)
test/bdd/           # Step registry (single source of truth)
test/python/steps/  # Python step definitions
test/typescript/steps/ # TypeScript step definitions
scripts/bdd/        # BDD verification scripts
scripts/loop_mix*.sh # Loop runners (copied from aa)
tasks/              # task_graph.json (when generated)
```

### Tracking
```
progress.md         # Progress log (session history)
```

---

## Workflow

### Phase 0: PREP (Claude Code, Interactive)
Read `PROMPT_plan.md` → Extract → Generate features → Create task graph

### Phase 1: BUILD (Weaver/Codex, Autonomous)
Read `PROMPT_build.md` → Run T→R→P→I loop per task

---

## Loop Commands
```bash
# Plan loop (Codex smart model)
./scripts/loop_mix.sh plan

# Build loop (Claude opus) - or Weaver
./scripts/loop_mix.sh

# Review loop
./scripts/loop_mix.sh review
```

---

## BDD Rules (Sacred)
- Every .feature step needs Python + TypeScript implementations
- Run `bun run bdd:verify` before commit (no orphan steps)
- Python must pass BEFORE TypeScript implemented
- Legacy is read-only reference

---

## Next Action
Phase 0A: Extract from Python code
- routes.json (webapp2 routes)
- models.json (NDB models)
- forms.json (form fields)
- emails.json (SendGrid triggers)
- reports.json (report logic)

Tell agent: "Run PROMPT_plan.md Phase 0A"
