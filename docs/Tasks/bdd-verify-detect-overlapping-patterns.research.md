# TASK-096: bdd-verify-detect-overlapping-patterns - Research

## Current State

### Existing Ambiguity Detection
`scripts/bdd/verify-alignment.ts:189-233` already has **exact duplicate pattern detection**:

```typescript
// Line 221: Exact duplicate check
if (pattern1.source === pattern2.source) {
  // Reports as "ambiguous"
  ambiguities.push({...});
}
```

This catches **identical** patterns but NOT overlapping patterns.

### What Are Overlapping Patterns?

Overlapping patterns are step registry entries where **one pattern could match a subset of another pattern's matches**, but they are not identical.

**Examples:**

| Pattern A | Pattern B | Overlap Type | Example That Matches Both |
|-----------|-----------|--------------|---------------------------|
| `I click on {string}` | `I click on {string} button` | Subset | `I click on "submit"` |
| `I have {int} items` | `I have {int} items in my cart` | Prefix | `I have 5 items` |
| `user is {string}` | `the user is {string}` | Similar | Different prefixes |
| `I am authenticated` | `I am authenticated as {string}` | Specialization | `I am authenticated` vs `I am authenticated as admin` |

## Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `scripts/bdd/verify-alignment.ts` | 189-233 | Existing ambiguity detection (exact duplicates) |
| `scripts/bdd/verify-alignment.ts` | 128-147 | `getCompiledPattern()` - converts registry key to RegExp |
| `scripts/bdd/verify-alignment.ts` | 71-106 | `stepMatchesPattern()` - matching logic |
| `test/bdd/step-registry.ts` | 1-1515 | Step registry with patterns |
| `specs/features/test/placeholder_matching.feature` | - | Test fixture for placeholder matching |

## Existing Test Fixtures

Located in `specs/features/test/`:
- `placeholder_matching.feature` - Tests `{string}`, `{int}`, `{float}` placeholder semantics
- `asterisk-step.feature` - Tests asterisk (`*`) step detection

These are used to verify the verifier's behavior.

## Algorithm Considerations

### Option 1: String Prefix/Suffix Matching (Simple)
Check if one pattern string is a prefix/suffix of another.

**Pros:** Simple, fast
**Cons:** Misses regex overlaps, false positives on literals

### Option 2: Intersection Testing (Conservative)
Generate test strings for each pattern and check if any string matches both patterns.

**Pros:** More accurate, handles regex
**Cons:** Complex, requires test case generation

### Option 3: Regex Subset Detection (Thorough)
Analyze if Pattern A's regex matches a strict subset of Pattern B's matches.

**Pros:** Most accurate
**Cons:** Complex to implement, may have edge cases

### Recommended: Hybrid Approach
1. **Exact duplicate**: Already implemented (line 221)
2. **Literal overlap**: If pattern A's literal (without placeholders) is a prefix of pattern B's literal
3. **Placeholder overlap**: If patterns are identical except one has additional suffix/prefix after placeholder

**Example of detection:**
```
Pattern A: "I click on {string}"
Pattern B: "I click on {string} button"

Detection: Both start with "I click on" and both have {string} placeholder.
Pattern B has additional suffix " button" → Report overlap
```

## Edge Cases to Consider

| Case | Example | Handling |
|------|---------|----------|
| Identical patterns | `I click {string}` x2 | Already handled (exact duplicate) |
| Different placeholders | `{string}` vs `{int}` | Different match sets - not overlap |
| Regex vs literal | `/click.*/` vs `I click` | Use compiled patterns for comparison |
| Special characters | `I click {string} button` vs `I click {string} button.` | Period in literal makes them distinct |
| Word boundaries | `user {string}` vs `username {string}` | Different words - not overlap |

## Implementation Strategy

### New Overlap Detection Function

Add to `scripts/bdd/verify-alignment.ts` after line 233:

```typescript
type Overlap = {
  key1: string;
  key2: string;
  reason: string;  // "prefix", "suffix", "subset"
  file1: string;
  file2: string;
};

function detectOverlaps(stepKeys: string[], compiledPatterns: Map<string, RegExp>): Overlap[] {
  const overlaps: Overlap[] = [];

  for (let i = 0; i < stepKeys.length; i++) {
    for (let j = i + 1; j < stepKeys.length; j++) {
      const key1 = stepKeys[i];
      const key2 = stepKeys[j];
      // ... detection logic
    }
  }
  return overlaps;
}
```

### Detection Heuristics (Conservative)

1. **Trailing literal overlap**: `A {p}` vs `A {p} B` where `A` and `B` are literals
2. **Leading literal overlap**: `A {p}` vs `C A {p}` where `C` is literal prefix
3. **Placeholder subset**: Same placeholder, one has more literals

**False positive prevention:**
- Only report if patterns share at least one placeholder position
- Skip if patterns are identical (handled by existing ambiguity check)
- Skip if the additional literal starts a new word (e.g., `button` vs `buttonbar`)

## Test Fixture Requirements

Create `specs/features/test/overlapping_patterns.feature` with intentional overlaps:

```gherkin
Feature: Overlapping Pattern Detection Test
  This feature tests that verify-alignment.ts catches overlapping step patterns

  Scenario: Should detect overlapping patterns
    # These two steps have overlapping patterns in registry:
    # Pattern 1: "test overlap base {string}"
    # Pattern 2: "test overlap base {string} with suffix"
    Given test overlap base "example"
    # This could match BOTH patterns above!
```

And add corresponding registry entries (without implementations) to trigger detection.

## Acceptance Criteria Mapping

| Criterion | Verification |
|-----------|--------------|
| Add pattern overlap detection | New function in verify-alignment.ts |
| Detect cases where multiple patterns could match same step | Test with overlapping fixture |
| Report with file:line references | Use existing `STEPS[key].typescript` paths |
| Test with fixture | Create `overlapping_patterns.feature` |
| `bun run bdd:verify` passes | No false positives on existing steps |
| `bun run typecheck` passes | Type-safe implementation |

## Risks

| Risk | Mitigation |
|------|------------|
| False positives on legitimate patterns | Conservative detection - only report definite overlaps |
| Performance on large registries | O(n²) is acceptable for ~270 steps |
| Complex regex edge cases | Focus on literal+placeholder patterns first |
| Breaking existing workflow | overlaps are warnings, not errors (or configurable) |
