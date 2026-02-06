# TASK: fix-verify-alignment-js

## Task ID
fix-verify-alignment-js

## Priority
p2

## Status
✅ COMPLETE

## Type
Fix/Hardening (no BDD scenarios)

## Source
docs/review/REVIEW_DRAFTS.md

## Description
Remove or align `scripts/bdd/verify-alignment.js` with the TypeScript implementation.

## Acceptance Criteria
1. ✅ `scripts/bdd/verify-alignment.js` removed
2. ✅ Tooling references only one verifier entrypoint (`.ts`)
3. ✅ Quality checks pass

## Implementation Summary
**Removed**: `scripts/bdd/verify-alignment.js`

**Reasoning**:
- TS version (`scripts/bdd/verify-alignment.ts`) is the authoritative implementation
- JS version had placeholder escape order bug (lines 45-63)
- No code or package.json referenced the JS version
- Project uses `bun` which can run `.ts` files directly

**Verification**:
- ✅ `bun run typecheck` - 0 errors
- ✅ `bun scripts/bdd/verify-alignment.ts` - 243 steps, 0 orphan, 0 dead
- ✅ `bun run lint` - passed (warnings only in third-party jsPDF)

## Notes
The TypeScript implementation is the single source of truth for BDD step registry alignment verification.
