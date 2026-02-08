# TASK-081: bdd-verify-detect-ambiguous-steps - Research

## Current State Analysis

### Existing Verification Logic
**File:** `scripts/bdd/verify-alignment.ts:1-164`

The current verification script performs three types of checks:

1. **Dead Steps Detection** (lines 112-128): Steps used in `.feature` files but not defined in the step registry
2. **Orphan Steps Detection** (line 132): Steps defined in the step registry but never used in any `.feature` file
3. **Missing Implementation Paths** (lines 134-140): Registry entries missing Python or TypeScript file paths

**Missing:** No detection of ambiguous step patterns where multiple registry entries could match the same feature file step.

### Step Registry Structure
**File:** `test/bdd/step-registry.ts:1-5000+`

Each step registry entry has this structure:
```typescript
'step pattern with {placeholders}': {
  pattern: /^regex\ pattern\ for\ matching$/,
  python: 'test/python/steps/file.py:line',
  typescript: 'test/typescript/steps/file.ts:line',
  features: ['specs/features/file.feature:line'],
}
```

### Step Matching Logic
**File:** `scripts/bdd/verify-alignment.ts:71-100`

The `stepMatchesPattern` function performs three types of matching:

1. **Exact string match** (line 73-75)
2. **Pre-compiled regex pattern** (line 78-80) - uses `stepEntry.pattern` if exists
3. **Fallback placeholder matching** (line 84-97) - for `{string}`, `{int}`, `{float}` following Cucumber expression semantics

### How Cucumber/Behandle Handles Ambiguity

Both Python's `behave` and TypeScript's `@cucumber/cucumber` have specific rules:

1. **Python (behave):** When multiple step definitions match the same step text, behave raises an `AmbiguousStep` error at runtime, listing all conflicting patterns.

2. **TypeScript (@cucumber/cucumber):** Similar behavior - when multiple step definitions could match, Cucumber throws an error listing all ambiguous matches.

3. **Order of definition does NOT matter** - the ambiguity is always detected and reported, not silently resolved.

### Examples of Potential Ambiguities

From the step registry analysis:

1. **Authentication steps:**
   - `'I am authenticated as a Sahaj TTC graduate'` (exact)
   - `'I am authenticated as a TTC admin'` (exact)
   - `'I am authenticated as {string}'` (with pattern requiring quotes: `/^I\ am\ authenticated\ as\ "([^"]*)"$/`)

   These are NOT ambiguous because the parameterized version requires quoted strings like `"admin"`, which doesn't match the exact steps.

2. **Placeholder patterns:**
   - Many steps use `{string}` placeholder
   - Some have pre-compiled patterns with double quotes: `/^...\ "([^"]*)"...$/`
   - Some rely on fallback placeholder matching

   The fallback matches both `'text'` and `"text"` per Cucumber spec (line 89-90 of verify-alignment.ts)

### Key Insight: What Constitutes Ambiguity?

Two step registry entries are **ambiguous** when:
1. They produce different compiled regex patterns, AND
2. Both patterns could successfully match the same feature file step text

For example:
- Registry entry A: `'user {string} exists'` with pattern `/^user\ "([^"]*)"\ exists$/`
- Registry entry B: `'user {string} exists'` with pattern `/^user\ (\S+)\ exists$/`

Both would match the feature step: `Given user "alice" exists`

This is duplicate registration, which should be flagged.

### Another Ambiguity Case: Overlapping Patterns

- Registry entry A: `'I have {int} items'` with pattern `/^I\ have\ (\d+)\ items$/`
- Registry entry B: `'I have {string} items'` with pattern `/^I\ have\ "([^"]*)"\ items$/`

These are NOT ambiguous because:
- Entry A only matches digits: `I have 5 items`
- Entry B only matches quoted strings: `I have "five" items`

But if:
- Registry entry A: `'I send {string} request'` with pattern `/^I\ send\ (\S+)\ request$/`
- Registry entry B: `'I send {string} request'` with pattern `/^I\ send\ "([^"]*)"\ request$/`

Then feature step `Given I send "GET" request` could match both if the first pattern's `\S+` captures quoted strings.

## Technical Constraints

### Pattern Compilation
The step registry already contains pre-compiled `RegExp` objects in the `pattern` field. For ambiguity detection:
1. Must use these existing patterns (if present)
2. Must fall back to dynamic pattern building for entries without `pattern` field
3. Must handle Cucumber placeholder semantics consistently

### Performance Considerations
- The registry has ~5000+ lines / ~100+ steps
- Pairwise comparison would be O(n²) = ~10,000 comparisons
- Each comparison requires testing multiple sample inputs
- This is acceptable for a verification script that runs occasionally

### Edge Cases to Handle

1. **Identical patterns** - Exact duplicate registrations (same regex source)
2. **Functionally identical patterns** - Different regex that match the same strings
3. **Subset patterns** - One pattern is a strict subset of another
4. **Placeholder vs exact** - Parameterized vs exact text patterns

## Evidence References

| Aspect | File Location |
|--------|---------------|
| Current verification logic | `scripts/bdd/verify-alignment.ts:1-164` |
| Step matching function | `scripts/bdd/verify-alignment.ts:71-100` |
| Step registry structure | `test/bdd/step-registry.ts:1-200` (sample) |
| Placeholder matching test | `specs/features/test/placeholder_matching.feature:1-28` |
| Python step definitions | `test/python/steps/*.py` (various) |
| TypeScript step definitions | `test/typescript/steps/*.ts` (various) |

## Proposed Approach Summary

1. **Add ambiguity detection phase** after orphan/dead steps checking
2. **For each pair of registry entries**, test if they could match the same step text
3. **Generate test cases** by:
   - Checking if one pattern is a subset of another (one matches all strings the other does)
   - For placeholders, generating sample values and testing both patterns
4. **Report ambiguities** with:
   - Both conflicting registry keys
   - Both conflicting patterns (regex source)
   - Implementation file locations for both
   - Exit with non-zero status

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| False positives from conservative detection | Medium | Focus on exact regex duplicates first; expand to functional equivalence later |
| Performance with large registry | Low | Pairwise comparison is only ~10K checks, very fast |
| Missing subtle ambiguities | Low | Start with duplicate detection; add semantic analysis later |
