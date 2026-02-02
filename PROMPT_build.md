# Europe TTP Migration - Build Loop

## Role Selection (file-gated)
Determine role first, then follow ONLY that section:

- If `docs/Tasks/ACTIVE_TASK.md` missing → role = **T** (Task intake)
- If ACTIVE_TASK exists but `<slug>.research.md` missing → role = **R**
- If research exists but `<slug>.plan.md` missing → role = **P**
- If plan exists → role = **I**

Run exactly ONE role per loop, then STOP.

---

## T (Task Intake)

Read:
- AGENTS.md
- IMPLEMENTATION_PLAN.md
- docs/Tasks/README.md
- docs/coverage_matrix.md

Do:
1. Find next incomplete P1 item in IMPLEMENTATION_PLAN.md
2. Create `docs/Tasks/ACTIVE_TASK.md` pointing to task slug
3. Create `docs/Tasks/<slug>.task.md` with:
   - Goal (one sentence)
   - Feature file path (if implementing a feature)
   - Legacy reference (file:line in Python)
   - Acceptance criteria (list of scenarios that must pass)

STOP after T.

---

## R (Research)

Read:
- `docs/Tasks/<slug>.task.md`
- Legacy files referenced in task
- Existing TypeScript code in app/

Do:
1. Find exact Python implementation (file:line ranges)
2. Find existing TypeScript code to modify (or note "new file needed")
3. List all step definitions needed for this feature
4. Verify steps exist in `test/bdd/step-registry.ts`

Output: `docs/Tasks/<slug>.research.md`

STOP after R.

---

## P (Plan)

Read:
- `docs/Tasks/<slug>.task.md`
- `docs/Tasks/<slug>.research.md`
- `test/bdd/step-registry.ts`

Do:
1. Plan exact files to create/modify
2. Plan step definitions to add (with exact patterns)
3. Plan test commands to verify

Output: `docs/Tasks/<slug>.plan.md`

STOP after P.

---

## I (Implement)

Read:
- `docs/Tasks/<slug>.task.md`
- `docs/Tasks/<slug>.research.md`
- `docs/Tasks/<slug>.plan.md`

Do:
1. Implement EXACTLY as planned (no deviations)
2. Add steps to registry first
3. Implement Python step definitions
4. Verify Python passes: `bun run bdd:python <feature>`
5. Implement TypeScript code
6. Implement TypeScript step definitions
7. Verify TypeScript passes: `bun run bdd:typescript <feature>`
8. Run alignment check: `bun run bdd:verify`
9. Update docs/coverage_matrix.md (mark feature as ✓ TypeScript)
10. Update IMPLEMENTATION_PLAN.md (mark task complete)
11. Log in docs/SESSION_HANDOFF.md
12. Remove docs/Tasks/ACTIVE_TASK.md

STOP after I.

---

## Constraints
- **BDD Alignment is Sacred**: Every step in a feature file MUST have implementations in BOTH Python and TypeScript
- **No Orphan Steps**: Run `bun run bdd:verify` before committing
- **Python Must Pass First**: Never implement TypeScript for a scenario until Python step passes
- **No Stubs**: Implement fully or don't implement at all
- **Legacy is Read-Only**: Never modify legacy/

## Test Commands
```bash
# Alignment verification (run before every commit)
bun run bdd:verify

# Run specific feature against Python
bun run bdd:python specs/features/forms/ttc_application_us.feature

# Run specific feature against TypeScript
bun run bdd:typescript specs/features/forms/ttc_application_us.feature

# Run all features
bun run bdd:all

# Type check
bun run typecheck

# Lint
bun run lint
```
