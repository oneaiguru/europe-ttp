# TASK-FIX-012: Remove PII in Experimental Fixtures

## Task Definition

**Task ID:** TASK-FIX-012
**Slug:** remove-pii-experimental-fixtures
**Priority:** p2
**Type:** Fix/Hardening

## Goal
Remove or fully anonymize PII in `experimental/` fixtures and prune unsafe vendored/binary artifacts.

## Status
✅ **COMPLETE** (2026-02-06)

## Implementation

### Action Taken: Deleted experimental/ Directory

The entire `experimental/` directory was removed because:
1. Contained real PII (names, emails, phone numbers, addresses, DOB)
2. Contained binary artifacts (.DS_Store, .zip files)
3. jsPDF library is available via npm (no need for vendored copy)
4. No production code referenced this directory
5. Current BDD tests use proper synthetic fixtures in `test/fixtures/`

### Files Modified
- `eslint.config.js` - Removed `experimental/**` from ignores (directory no longer exists)
- `experimental/` - Entire directory deleted via `git rm -r experimental/`

### Acceptance Criteria
1. ✅ No PII in tracked files (experimental/ directory removed)
2. ✅ No .DS_Store or .zip artifacts
3. ✅ All tests pass (typecheck, lint, BDD)

### Verification Results
```
✓ typecheck passed
✓ lint passed (37 warnings, 0 errors)
✓ 99 TypeScript BDD scenarios passed
✓ 441 steps passed
```
