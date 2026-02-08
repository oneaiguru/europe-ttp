# TASK-091: Prune Stale BDD JS Scripts

## Goal
Remove obsolete JavaScript BDD runner scripts that have been superseded by TypeScript versions, to reduce codebase maintenance burden and eliminate confusion about which scripts to use.

## Background
The project has migrated BDD runners from JavaScript to TypeScript, but stale `.js` and `.mjs` files remain in `scripts/bdd/`:
- `run-verify.mjs` - Superseded by `scripts/bdd/verify-alignment.ts` (called via `bun run bdd:verify`)
- `run-python.js` - Superseded by `scripts/bdd/run-python.ts`
- `run-typescript.js` - Superseded by `scripts/bdd/run-typescript.ts`

These stale files are not referenced in `package.json` scripts (which use `.ts` files directly via `bun`).

## Refs
- `scripts/bdd/run-verify.mjs`
- `scripts/bdd/run-python.js`
- `scripts/bdd/run-typescript.js`
- `package.json` (scripts section uses `.ts` files)

## Acceptance Criteria
- [ ] Stale `scripts/bdd/run-verify.mjs` deleted
- [ ] Stale `scripts/bdd/run-python.js` deleted
- [ ] Stale `scripts/bdd/run-typescript.js` deleted
- [ ] `bun run bdd:verify` still works (uses TS version)
- [ ] `bun run bdd:python` still works (uses TS version)
- [ ] `bun run bdd:typescript` still works (uses TS version)

## Files to Delete
- [ ] `scripts/bdd/run-verify.mjs`
- [ ] `scripts/bdd/run-python.js`
- [ ] `scripts/bdd/run-typescript.js`

## Test Commands
```bash
# After deletion, verify all BDD scripts still work
bun run bdd:verify
bun run bdd:python
bun run bdd:typescript
bun run typecheck
bun run lint
```

## Risks / Rollback
- **Risk**: None - these files are not referenced by any tooling
- **Rollback**: Restore from git if needed
