# TASK-082: bdd-verify-regex-state-safety - Research

## Evidence Gathering

### 1. Current Implementation Analysis

**File: `scripts/bdd/verify-alignment.ts`**

#### State Safety Analysis

**Finding: No state leakage detected.** The `compiledPatterns` Map (lines 184-188) is correctly implemented:
- Map is instantiated once before the ambiguity detection loop
- Each key maps to a freshly compiled RegExp via `getCompiledPattern()`
- No `RegExp.prototype.test()` usage with `global` flag (ReDoS vector)
- No `lastIndex` mutation risks

**Code references:**
- `scripts/bdd/verify-alignment.ts:184-188` - Pattern caching loop
- `scripts/bdd/verify-alignment.ts:110-129` - `getCompiledPattern()` function

#### ReDoS Vulnerability Analysis

**Finding: Potential ReDoS in `{string}` placeholder pattern (lines 90, 121).**

The pattern `("([^"]*)"|'([^']*)')` contains nested quantifiers:
- Outer group: `("..."|'...')` alternation
- Inner groups: `([^"]*)` and `([^']*)` with Kleene star `*`

**Risk level: LOW** - The pattern is anchored with `^...$` and matches against:
1. Registry keys (trusted, from codebase)
2. Feature file steps (trusted, from codebase)

Both sources are internal to the codebase, not user-controlled. No HTTP input processing.

**Code references:**
- `scripts/bdd/verify-alignment.ts:90` - Placeholder replacement in `stepMatchesPattern()`
- `scripts/bdd/verify-alignment.ts:121` - Placeholder replacement in `getCompiledPattern()`

#### Caching Correctness

**Finding: Caching is functionally correct but redundant.**

The `compiledPatterns` Map is populated (lines 186-188) but each entry is only used once in the pairwise comparison loop (lines 191-210). This is a micro-optimization with negligible impact.

**Code references:**
- `scripts/bdd/verify-alignment.ts:191-210` - Pairwise comparison using cached patterns

### 2. TypeScript Compilation Error

**Finding: Downlevel iteration error at line 145.**

```
scripts/bdd/verify-alignment.ts(145,27): error TS2802: Type 'Set<string>' can only be iterated through when using the '--downlevelIteration' flag or with a '--target' of 'es2015' or higher.
```

**Root cause:** `for (const featureStep of featureSteps)` where `featureSteps` is a `Set<string>`.

**Current tsconfig.json target:** Need to verify but likely `es5` or `es3`.

**Code reference:**
- `scripts/bdd/verify-alignment.ts:145` - `for (const featureStep of featureSteps)`

### 3. Current Runtime Behavior

**Verification command:** `bun run bdd:verify`
**Output:** `✓ 270 steps defined, 0 orphan, 0 dead, 0 ambiguous`

The script executes correctly under Bun runtime despite TypeScript error. Bun uses a modern JS engine that supports Set iteration.

### 4. Step Registry Format

**File: `test/bdd/step-registry.ts`**

Steps are exported as:
```typescript
export const STEPS = {
  'step pattern text': {
    pattern: /^pre-compiled regex$/,
    python: 'path/to/file:line',
    typescript: 'path/to/file:line',
    features: ['list of feature files'],
  },
  // ...
};
```

**Finding:** Pre-compiled `pattern` field is present for most steps, reducing reliance on dynamic regex construction.

### 5. Related Completed Tasks

- **TASK-063 (bdd-verify-placeholder-semantics)** - Already implemented proper Cucumber placeholder semantics
- **TASK-061 (bdd-verify-symlink-cycle)** - Fixed `statSync` → `lstatSync` for safety
- **TASK-081 (bdd-verify-detect-ambiguous-steps)** - Added ambiguity detection using the `compiledPatterns` Map

## Risk Assessment

| Issue | Severity | Likelihood | Mitigation |
|-------|----------|------------|------------|
| TypeScript Set iteration error | LOW | HIGH (already occurs) | Fix tsconfig or use Array.from() |
| ReDoS in `{string}` pattern | LOW | VERY LOW | Input is trusted (codebase only) |
| State leakage | NONE | NONE | No `global` flag usage, no `lastIndex` mutation |

## Recommendations

### Priority 1: Fix TypeScript Compilation Error
The `for...of` on `Set<string>` requires either:
1. Enable `downlevelIteration` in tsconfig.json
2. Change `Set<string>` iteration to `Array.from(featureSteps)`
3. Set `target: es2015` in tsconfig.json

### Priority 2: Document ReDoS Safety
Add inline comment explaining why `{string}` pattern is safe:
- Input sources are trusted (codebase files only)
- Pattern is anchored
- No user-controlled input

### Priority 3: Remove Unnecessary Caching
The `compiledPatterns` Map could be inlined since each pattern is used only once. This would:
- Reduce code complexity
- Eliminate potential confusion about cache correctness
- No measurable performance impact (270 tiny regexes)

## Files Requiring Changes

1. **`scripts/bdd/verify-alignment.ts`**
   - Line 145: Fix Set iteration
   - Lines 184-188: Consider removing or documenting caching rationale

2. **`tsconfig.json`**
   - Consider adding `downlevelIteration: true` or adjusting target

## Test Verification

All verification commands should pass after changes:
```bash
bun run bdd:verify          # Currently passes, should continue to pass
bun run typecheck           # Currently fails on line 145
bun run lint                # Should pass
```
