# fix-verify-alignment-js: Implementation Plan

## Task ID
`fix-verify-alignment-js`

## Goal
Remove the redundant and outdated JS verification script.

## Implementation Steps

### Step 1: Remove JS file
**File**: `scripts/bdd/verify-alignment.js`
**Action**: Delete file
**Reason**:
- TS version is authoritative (used in package.json)
- JS version has placeholder escape order bug
- No references to JS file in codebase

### Step 2: Verify no references exist
**Command**: `grep -r "verify-alignment.js" --exclude-dir=node_modules --exclude-dir=.git`
**Expected**: Only matches in IMPLEMENTATION_PLAN.md and REVIEW_DRAFTS.md (documentation)

### Step 3: Run quality checks
```bash
# TypeScript typecheck
bun run typecheck

# BDD alignment (using TS version)
bun scripts/bdd/verify-alignment.ts

# Lint
bun run lint
```

### Step 4: Update task tracking
- Mark task complete in task file
- Update IMPLEMENTATION_PLAN.md (remove TODO note)
- Remove ACTIVE_TASK.md

## Acceptance Criteria
1. ✅ `scripts/bdd/verify-alignment.js` removed
2. ✅ No broken references to JS file
3. ✅ TS verification script still works
4. ✅ All quality checks pass

## Notes
- This is a fix/hardening task with no BDD scenarios
- The TS implementation is the single source of truth
