# TASK-FIX-010: Remove node_modules Cycle

## Task Definition

**Task ID:** TASK-FIX-010
**Slug:** remove-node-modules-cycle
**Priority:** p2
**Type:** Fix/Hardening

## Goal
Remove `node_modules/node_modules` symlink workaround in TypeScript runner.

## Status
- **Task Definition:** Complete
- **Research:** Complete
- **Plan:** Complete
- **Implementation:** ✅ Complete
- **Verification:** ✅ Complete

## Changes Made

### scripts/bdd/run-typescript.ts
- Removed import of `lstat`, `realpath`, `symlink` from 'fs/promises'
- Removed lines 21-31 that created the nested symlink

### Verification Results
```
✓ All 99 TypeScript BDD scenarios pass
✓ All 441 steps pass
✓ No nested node_modules symlink created
✓ No filesystem cycle
```

## Acceptance Criteria
1. ✅ Cucumber runs without creating a nested `node_modules` symlink
2. ✅ Tooling does not create filesystem cycles

## Evidence Locations
- `scripts/bdd/run-typescript.ts:21-30` (code removed)
