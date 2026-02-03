# Europe TTP Migration - Build Loop (BDD-First)

## Context
Build mode implements the migration tasks generated in planning phase.
**BDD-First**: Every scenario must pass in BOTH Python and TypeScript.

## Goal
Migrate legacy functionality by ensuring all BDD scenarios have implementations in both Python and TypeScript.

---

## Bootstrapping (Every Loop)

Before any role, ensure dependencies are present:

```bash
bun install
```

If `node_modules/` already exists, this is fast and safe.

---

## Role Selection (File-Gated)

Determine role by checking file state, then follow ONLY that section:

```
If docs/Tasks/ACTIVE_TASK.md missing      → role = T (Test/Task Intake)
If ACTIVE_TASK exists but no research.md  → role = R (Research)
If research.md exists but no plan.md     → role = P (Plan)
If plan.md exists                         → role = I (Implement)

Run exactly ONE role per loop, then STOP.
```

---

## T (Test / Task Intake)

**Purpose**: Find the next failing scenario or unimplemented step.

### Read
- `IMPLEMENTATION_PLAN.md` (next incomplete task)
- `tasks/task_graph.json` (all tasks)
- `test/bdd/step-registry.ts` (step status)

### Do
1. Run Python BDD tests to find failing scenarios:
   ```bash
   bun scripts/bdd/run-python.ts specs/features/
   ```
2. Run TypeScript BDD tests to find failing scenarios:
   ```bash
   bun scripts/bdd/run-typescript.ts specs/features/
   ```
3. Identify the first scenario/step that is:
   - Not implemented (step missing)
   - Failing in Python
   - Failing in TypeScript
4. Create `docs/Tasks/ACTIVE_TASK.md` with task ID
5. Create `docs/Tasks/<slug>.task.md` with:
   - Task ID and name
   - Feature file path
   - Scenario that's failing
   - Step(s) needing implementation
   - Acceptance criteria (scenarios that must pass)

### Output
```
docs/Tasks/ACTIVE_TASK.md → "TASK-XXX"
docs/Tasks/TASK-XXX.md → task definition
```

### STOP after T.

---

## R (Research)

**Purpose**: Investigate the failing step without writing code.

### Read
- `docs/Tasks/<slug>.task.md`
- Legacy Python files (find the behavior)
- Existing TypeScript code (if any)
- `test/bdd/step-registry.ts` (verify step exists)

### Do
1. **Find Python implementation**:
   - Exact file path and line numbers
   - Class/function names
   - Key logic to replicate

2. **Find TypeScript context**:
   - Existing code to modify OR "new file needed"
   - Parallel directory structure

3. **Verify step registry**:
   - Step exists in `test/bdd/step-registry.ts`
   - Python path is filled
   - TypeScript path exists (or note "TODO")

4. **Document findings** - NO code writing:
   - Legacy behavior summary
   - Code locations (file:line)
   - Implementation notes

### Output
```
docs/Tasks/<slug>.research.md → findings document
```

### STOP after R.

---

## P (Plan)

**Purpose**: Outline the implementation strategy without writing code.

### Read
- `docs/Tasks/<slug>.task.md`
- `docs/Tasks/<slug>.research.md`
- `test/bdd/step-registry.ts`
- Existing code patterns (for consistency)

### Do
1. **Plan Python step definition** (if needed):
   - Step function signature
   - Test data setup
    - Assertion logic

2. **Plan TypeScript implementation**:
   - File(s) to create/modify
   - Function/class structure
   - Step definition signature
   - Test data/factories

3. **Plan step registry updates**:
   - Add new step pattern
   - Map to Python path
   - Map to TypeScript path

4. **Plan test commands**:
   - Specific features to test
   - Verification steps

### Output
```
docs/Tasks/<slug>.plan.md → implementation plan
```

### STOP after P.

---

## I (Implement)

**Purpose**: Execute the plan and verify BDD alignment.

### Read
- `docs/Tasks/<slug>.task.md`
- `docs/Tasks/<slug>.research.md`
- `docs/Tasks/<slug>.plan.md`

### Do

#### Step 1: Update Step Registry (FIRST)
Add or update entries in `test/bdd/step-registry.ts`:
```typescript
'Step text here': {
  pattern: /^Step text here$/,
  python: 'test/python/steps/feature_steps.py:XX',
  typescript: 'test/typescript/steps/feature_steps.ts:XX',
  features: ['specs/features/category/feature.feature:YY'],
}
```

#### Step 2: Implement Python Step Definition
Create/modify `test/python/steps/*_steps.py`:
```python
from behave import given, when, then

@given('step text here')
def step_impl(context):
    # Implementation
    pass
```

#### Step 3: Verify Python Passes
```bash
bun scripts/bdd/run-python.ts specs/features/category/feature.feature
```
**DO NOT proceed until Python passes.**

#### Step 4: Implement TypeScript Code
Create/modify TypeScript files following Next.js 14 patterns:
- App Router structure (`app/` directory)
- Server components where appropriate
- API routes for form handling
- Prisma for data access

#### Step 5: Implement TypeScript Step Definition
Create/modify `test/typescript/steps/*_steps.ts`:
```typescript
import { Given, When, Then } from '@cucumber/cucumber';

Given('step text here', async function () {
  // Implementation
});
```

#### Step 6: Verify TypeScript Passes
```bash
bun scripts/bdd/run-typescript.ts specs/features/category/feature.feature
```

#### Step 7: Run Alignment Check
```bash
bun scripts/bdd/verify-alignment.ts
```
Must pass: 0 orphan steps, 0 dead steps.

#### Step 8: Quality Checks
```bash
bun run typecheck
bun run lint
```

#### Step 9: Update Tracking
- Update `docs/coverage_matrix.md` (mark ✓ for TypeScript)
- Update `IMPLEMENTATION_PLAN.md` (mark task complete)
- Log in `docs/SESSION_HANDOFF.md`

#### Step 10: Clean Up
Remove `docs/Tasks/ACTIVE_TASK.md`

### STOP after I.

---

## BDD Migration Invariants (Non-Negotiable)

1. **Step Registry is Sacred**: Update registry FIRST, before any code
2. **Python Must Pass First**: Never implement TypeScript for a step until Python passes
3. **No Orphan Steps**: `verify-alignment.ts` must pass before every commit
4. **One Scenario at a Time**: Complete one scenario fully before moving to next
5. **No Stubs**: Implement fully or don't implement at all
6. **Legacy is Read-Only**: Never modify files in root (legacy Python)

---

## Test Commands (Required)

```bash
# Alignment verification (run BEFORE every commit)
bun scripts/bdd/verify-alignment.ts

# Run Python BDD tests
bun scripts/bdd/run-python.ts specs/features/

# Run TypeScript BDD tests
bun scripts/bdd/run-typescript.ts specs/features/

# Run specific feature
bun scripts/bdd/run-python.ts specs/features/forms/ttc_application_us.feature
bun scripts/bdd/run-typescript.ts specs/features/forms/ttc_application_us.feature

# Type check
bun run typecheck

# Lint
bun run lint
```

---

## Verification Scripts

### `scripts/bdd/verify-alignment.ts`
Must check:
1. ✓ All feature steps have registry entries
2. ✓ All registry entries have Python impl path
3. ✓ All registry entries have TypeScript impl path
4. ✓ 0 orphan steps (in registry but not in features)
5. ✓ 0 dead steps (in features but not in registry)

### `scripts/bdd/run-python.ts`
Runs behave/pytest against Python legacy code with feature files.

### `scripts/bdd/run-typescript.ts`
Runs @cucumber/cucumber against TypeScript code with feature files.

---

## Success Criteria

A build loop iteration is complete when:
- [ ] Target scenario passes in Python
- [ ] Target scenario passes in TypeScript
- [ ] `verify-alignment.ts` passes (0 orphan, 0 dead)
- [ ] `typecheck` passes
- [ ] `lint` passes
- [ ] `coverage_matrix.md` updated
- [ ] `IMPLEMENTATION_PLAN.md` updated
- [ ] `ACTIVE_TASK.md` removed

---

## Required Reading

1. `docs/Tasks/<slug>.task.md` - Task definition
2. `docs/Tasks/<slug>.research.md` - Research findings
3. `docs/Tasks/<slug>.plan.md` - Implementation plan
4. `test/bdd/step-registry.ts` - Step mappings
5. `HANDOFF.md` - Project context
6. `AGENTS.md` - Agent roles (for reference)
