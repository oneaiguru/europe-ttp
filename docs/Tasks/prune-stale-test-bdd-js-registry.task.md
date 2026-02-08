# TASK-097: prune-stale-test-bdd-js-registry

## Goal
Remove stale/unused JavaScript BDD step registry files that have been superseded by TypeScript versions.

## References
- `test/bdd/step-registry.js`
- `test/bdd/step-registry.js.bak`

## Acceptance Criteria
- [ ] Determine if `test/bdd/step-registry.js` and `.bak` are still needed
- [ ] Remove if superseded by TypeScript version (`test/bdd/step-registry.ts`)
- [ ] Verify no scripts or workflows reference the removed files
- [ ] `bun run bdd:verify` still passes
- [ ] Git status shows files removed (if applicable)

## Files to Check
- `test/bdd/step-registry.js` - JavaScript step registry
- `test/bdd/step-registry.js.bak` - Backup of JavaScript registry
- `test/bdd/step-registry.ts` - TypeScript version (current source of truth)

## Test Commands
```bash
# Check if anything references the JS files
grep -r "step-registry.js" --include="*.sh" --include="*.ts" --include="*.js" --include="*.md" .

# Verify BDD still works after removal
bun run bdd:verify
bun run bdd:typescript specs/features/test/placeholder_matching.feature
```

## Notes
- Similar work was done in TASK-091 (prune-stale-bdd-js-scripts) for BDD runners
- The TypeScript step registry at `test/bdd/step-registry.ts` should be the single source of truth
