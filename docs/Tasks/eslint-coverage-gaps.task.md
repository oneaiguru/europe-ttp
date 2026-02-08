# TASK-069: eslint-coverage-gaps

## Goal
Ensure linting covers application TS/TSX and runtime JS config to avoid lint false-greens.

## Legacy Reference
None (tooling task)

## Acceptance Criteria
1. ESLint runs on `app/**/*.ts` and `app/**/*.tsx` (or an equivalent lint target does).
2. JS config files like `cucumber.cjs` are linted (or explicitly justified if excluded).
3. `bun run lint` passes without new errors.

## Files to Create/Modify
- `eslint.config.js` - Update to include app/ files and JS config

## Test Commands
```bash
bun run lint
bun run typecheck
bun run bdd:verify
```

## Evidence (from review)
- `eslint.config.js:7-17` - Current config ignores *.js/*.mjs and only covers scripts/ and test/
- `cucumber.cjs:1` - JS config file not currently linted
- 22 TS files in `app/**/*.ts` not covered
- 2 TSX files in `app/**/*.tsx` not covered
