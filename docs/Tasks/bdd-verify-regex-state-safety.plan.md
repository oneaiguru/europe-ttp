# TASK-082: bdd-verify-regex-state-safety - Implementation Plan

## Executive Summary

**Status: VERIFY/DOCUMENT ONLY**

Research confirms that `verify-alignment.ts` is already state-safe and has no ReDoS vulnerabilities. The task is reduced to:
1. Adding inline documentation explaining the safety properties
2. Running verification to confirm all checks pass

**No code changes required** - this is a documentation task.

---

## Research Findings

### State Safety: ✓ PASS
- The `compiledPatterns` Map is instantiated once (line 184) and populated before use (lines 186-188)
- No `RegExp.prototype.test()` usage with `global` flag
- No `lastIndex` mutation risks
- Each iteration gets a fresh RegExp object via `getCompiledPattern()`

### ReDoS Vulnerability: ✓ PASS (Low Risk)
- The `{string}` placeholder pattern `("([^"]*)"|'([^']*)')` has nested quantifiers
- **Mitigation:** Input sources are trusted (codebase files only) - no user-controlled input
- Pattern is anchored with `^...$`
- Both registry keys and feature files are internal to the codebase

### TypeScript Compilation: ✓ PASS
- Current `tsconfig.json` has `target: "ES2022"` which supports Set iteration
- `bun run typecheck` passes without errors
- Previous research noted a TS2802 error at line 145, but this is no longer present

### Caching Correctness: MINOR ISSUE
- The `compiledPatterns` Map is populated but each entry is only used once
- This is a micro-optimization with negligible impact
- **Recommendation:** Document rationale or remove to reduce complexity

---

## Implementation Steps

### Step 1: Add Safety Documentation
**File:** `scripts/bdd/verify-alignment.ts`

Add JSDoc comment to `getCompiledPattern()` function explaining:
- RegExp objects are created fresh each call (no state sharing)
- No `global` flag usage (no `lastIndex` mutation)
- Input sources are trusted (codebase only)

### Step 2: Document ReDoS Safety
**File:** `scripts/bdd/verify-alignment.ts`

Add inline comment near the `{string}` placeholder pattern (line 90, 121) explaining:
- Pattern has nested quantifiers (theoretical ReDoS risk)
- Safe because inputs are from trusted sources (codebase files)
- No user-controlled input processed

### Step 3: Document Caching Rationale
**File:** `scripts/bdd/verify-alignment.ts`

Add comment before the `compiledPatterns` Map (line 184):
- Explains why patterns are pre-compiled (readability, micro-optimization)
- Notes each pattern is used exactly once in pairwise comparison

### Step 4: Verify All Checks Pass
```bash
bun run bdd:verify     # Should show: ✓ 270 steps defined, 0 orphan, 0 dead, 0 ambiguous
bun run typecheck      # Should pass without errors
bun run lint           # Should pass
```

---

## Files to Modify

1. **`scripts/bdd/verify-alignment.ts`**
   - Line ~110: Add JSDoc to `getCompiledPattern()`
   - Line ~90: Add comment about ReDoS safety
   - Line ~184: Add comment about caching rationale

## Files to Read (Context)

- `scripts/bdd/verify-alignment.ts:110-129` - `getCompiledPattern()` function
- `scripts/bdd/verify-alignment.ts:184-188` - Pattern caching loop
- `test/bdd/step-registry.ts` - Step registry format

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Documentation inaccuracy | LOW | Verify against actual code behavior |
| Introducing new issues | NONE | Only adding comments, no code changes |

---

## Rollback Plan

N/A - This task only adds documentation. If comments are incorrect, they can be removed or corrected without affecting functionality.

---

## Test Verification

After adding documentation, verify:
```bash
bun run bdd:verify    # ✓ 270 steps defined, 0 orphan, 0 dead, 0 ambiguous
bun run typecheck     # Should pass (already passing)
bun run lint          # Should pass
```

---

## Success Criteria

- [ ] Safety documentation added to `getCompiledPattern()`
- [ ] ReDoS safety documented near `{string}` placeholder
- [ ] Caching rationale documented
- [ ] All verification commands pass
- [ ] No code changes (comments only)

---

## Notes

The original task concern about "state leakage" was based on a misunderstanding. The code is already correct:
- The `compiledPatterns` Map is not modified after creation
- No `lastIndex` manipulation occurs
- Each `getCompiledPattern()` call returns a fresh RegExp

The original concern about "ReDoS" is mitigated by trusted inputs. The pattern itself has nested quantifiers, but since it only matches against internal codebase files (not user input), there is no security risk.
