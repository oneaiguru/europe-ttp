# TASK-091: Prune Stale BDD JS Scripts - Plan

## Implementation Steps

### Step 1: Delete Stale JS Files
Delete three obsolete JavaScript BDD runner scripts:
```bash
rm scripts/bdd/run-verify.mjs
rm scripts/bdd/run-python.js
rm scripts/bdd/run-typescript.js
```

### Step 2: Verify BDD Scripts Still Work
Run all BDD-related npm scripts to confirm TypeScript versions work:
```bash
bun run bdd:verify
bun run bdd:python
bun run bdd:typescript
```

### Step 3: Run Quality Gates
Verify no regressions:
```bash
bun run typecheck
bun run lint
bun run bdd:verify
```

## Files to Change
- **Delete**: `scripts/bdd/run-verify.mjs`
- **Delete**: `scripts/bdd/run-python.js`
- **Delete**: `scripts/bdd/run-typescript.js`

## Tests to Run
```bash
bun run bdd:verify       # Verify step registry alignment
bun run bdd:python       # Verify Python BDD runner works
bun run bdd:typescript   # Verify TypeScript BDD runner works
bun run typecheck        # Ensure no type errors
bun run lint            # Ensure no lint errors
```

## Risks / Rollback
- **Risk**: None - research confirmed these files are not referenced by any tooling
- **Rollback**: `git checkout scripts/bdd/run-verify.mjs scripts/bdd/run-python.js scripts/bdd/run-typescript.js`

## Completion Criteria
- [ ] All three stale JS files deleted
- [ ] `bun run bdd:verify` passes
- [ ] `bun run bdd:python` passes
- [ ] `bun run bdd:typescript` passes
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] `bun run bdd:verify` passes (step registry alignment)
