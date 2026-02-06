# fix-verify-alignment-js: Research

## Task ID
`fix-verify-alignment-js`

## Goal
Remove or align `scripts/bdd/verify-alignment.js` with the TypeScript implementation.

## Evidence Locations
- `scripts/bdd/verify-alignment.js:45-63` - Placeholder matching escape order

## Research Findings

### 1. JS File Still Exists
File: `scripts/bdd/verify-alignment.js` (4383 bytes, dated Feb 22 09:22)

The JS file appears to be a transpiled/duplicate version of the TS implementation:
- Both files implement the same functionality (step registry alignment verification)
- JS imports from `../../test/bdd/step-registry.js` (ESM import syntax)
- Has similar placeholder matching logic (lines 45-63)

### 2. TypeScript Implementation is Authoritative
File: `scripts/bdd/verify-alignment.ts`

All documentation references the TS version:
- `package.json` line 7: `"bdd:verify": "bun scripts/bdd/verify-alignment.ts"`
- All task files reference `.ts` extension
- `CLAUDE.md` line 8: references TS version for commits

### 3. No References to JS File in Codebase
Grep search for `verify-alignment.js` across all source files returns:
- Only found in `IMPLEMENTATION_PLAN.md` line 186 noting it's still present
- Only found in `docs/review/REVIEW_DRAFTS.md` as the task evidence

No active scripts, package.json entries, or documentation tell users to run the JS version.

### 4. Placeholder Escape Order Difference
The JS file (lines 45-63) has the same escape order issue that was fixed in TS:
- Line 52: Escapes regex special chars AFTER replacing placeholders
- This means `{string}` replacement `[.*]` gets escaped to `\[.*\]`

The TS implementation fixed this by escaping BEFORE replacing placeholders.

## Analysis

The JS file is:
1. **Unused** - No script or documentation references it
2. **Outdated** - Has the placeholder matching bug
3. **Redundant** - TS version is the authoritative implementation

## Recommendation

**Remove the JS file** (`scripts/bdd/verify-alignment.js`). Rationale:
- TS version is the single source of truth
- JS file has known bugs (placeholder escape order)
- No tooling or documentation depends on it
- The project uses `bun` which can run `.ts` files directly
