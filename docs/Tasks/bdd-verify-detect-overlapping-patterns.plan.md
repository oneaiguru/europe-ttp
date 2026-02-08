# TASK-096: bdd-verify-detect-overlapping-patterns - Implementation Plan

## Overview
Add overlapping pattern detection to `scripts/bdd/verify-alignment.ts` to catch step registry entries where one pattern could match a subset of another pattern's matches (e.g., `I click on {string}` vs `I click on {string} button`).

## Implementation Steps

### Step 1: Add Overlap Type and Detection Function
**File:** `scripts/bdd/verify-alignment.ts`

Add after the `Ambiguity` type definition (after line 198):

```typescript
type Overlap = {
  key1: string;
  key2: string;
  reason: string;  // "prefix", "suffix", or "subset"
  example: string; // Example step text that would match both
  file1: string;
  file2: string;
};
```

Add the overlap detection function after the `getCompiledPattern` function (after line 147):

```typescript
/**
 * Detect if one step pattern could match a subset of another pattern's matches.
 *
 * This catches ambiguous registrations where patterns overlap but are not identical,
 * which can cause non-deterministic step matching at runtime.
 *
 * Detection is conservative: only reports definite overlaps where:
 * 1. Patterns share the same literal prefix through at least one placeholder
 * 2. One pattern has additional literal text after/before the shared placeholder
 *
 * @param key1 - First step registry key
 * @param pattern1 - Compiled regex for first pattern
 * @param key2 - Second step registry key
 * @param pattern2 - Compiled regex for second pattern
 * @returns Overlap info if patterns overlap, null otherwise
 */
function detectOverlap(
  key1: string,
  pattern1: RegExp,
  key2: string,
  pattern2: RegExp
): Overlap | null {
  // Skip exact duplicates (already handled by ambiguity check)
  if (pattern1.source === pattern2.source) {
    return null;
  }

  // Parse placeholder positions and literal segments
  // Pattern format: "literal {placeholder} literal {placeholder} ..."
  const parts1 = parsePatternParts(key1);
  const parts2 = parsePatternParts(key2);

  // Check for trailing literal overlap: A {p} vs A {p} B
  const trailingOverlap = checkTrailingOverlap(parts1, parts2, key1, key2);
  if (trailingOverlap) return trailingOverlap;

  // Check for leading literal overlap: A {p} vs C A {p}
  const leadingOverlap = checkLeadingOverlap(parts1, parts2, key1, key2);
  if (leadingOverlap) return leadingOverlap;

  return null;
}

/**
 * Parse a step pattern into literal segments and placeholders.
 * Returns array of strings and placeholder markers.
 */
function parsePatternParts(key: string): (string | { type: 'placeholder' })[] {
  const parts: (string | { type: 'placeholder' })[] = [];
  let remaining = key;

  while (remaining.length > 0) {
    // Find next placeholder
    const placeholderMatch = remaining.match(/^\{(?:string|int|float)\}/);
    if (placeholderMatch) {
      parts.push({ type: 'placeholder' });
      remaining = remaining.slice(placeholderMatch[0].length);
    } else {
      // Extract literal text until next placeholder or end
      const nextPlaceholder = remaining.search(/\{(?:string|int|float)\}/);
      if (nextPlaceholder === -1) {
        parts.push(remaining);
        remaining = '';
      } else {
        parts.push(remaining.slice(0, nextPlaceholder));
        remaining = remaining.slice(nextPlaceholder);
      }
    }
  }

  return parts;
}

/**
 * Check if pattern2 extends pattern1 with trailing literal.
 * Example: "I click on {string}" vs "I click on {string} button"
 */
function checkTrailingOverlap(
  parts1: (string | { type: 'placeholder' })[],
  parts2: (string | { type: 'placeholder' })[],
  key1: string,
  key2: string
): Overlap | null {
  // Check if parts1 is a prefix of parts2 through at least one placeholder
  const minLen = Math.min(parts1.length, parts2.length);
  let hasSharedPlaceholder = false;

  for (let i = 0; i < minLen; i++) {
    const p1 = parts1[i];
    const p2 = parts2[i];

    if (p1 !== p2) {
      return null;
    }
    if (typeof p1 === 'object' && p1.type === 'placeholder') {
      hasSharedPlaceholder = true;
    }
  }

  // Must share at least one placeholder position
  if (!hasSharedPlaceholder) {
    return null;
  }

  // Check if one pattern extends the other with a literal
  if (parts1.length < parts2.length) {
    const extra = parts2.slice(parts1.length);
    // Extra part must be literal (not placeholder)
    if (extra.length === 1 && typeof extra[0] === 'string') {
      return {
        key1,
        key2,
        reason: 'suffix',
        example: generateExample(parts1),
        file1: '',
        file2: '',
      };
    }
  } else if (parts2.length < parts1.length) {
    const extra = parts1.slice(parts2.length);
    if (extra.length === 1 && typeof extra[0] === 'string') {
      return {
        key1: key2,
        key2: key1,
        reason: 'suffix',
        example: generateExample(parts2),
        file1: '',
        file2: '',
      };
    }
  }

  return null;
}

/**
 * Check if pattern2 extends pattern1 with leading literal.
 * Example: "user is {string}" vs "the user is {string}"
 */
function checkLeadingOverlap(
  parts1: (string | { type: 'placeholder' })[],
  parts2: (string | { type: 'placeholder' })[],
  key1: string,
  key2: string
): Overlap | null {
  // Leading literal overlap is harder to detect without full comparison
  // For conservative detection, skip for now
  // Can be added in future if needed
  return null;
}

/**
 * Generate an example step text that would match the given pattern parts.
 */
function generateExample(parts: (string | { type: 'placeholder' })[]): string {
  return parts
    .map((p) => {
      if (typeof p === 'string') return p;
      if (p.type === 'placeholder') return '"test"';
      return '';
    })
    .join('');
}
```

### Step 2: Add Overlap Detection Loop
**File:** `scripts/bdd/verify-alignment.ts`

Add after the ambiguity detection loop (after line 233):

```typescript
// Check for overlapping step patterns (one pattern matches subset of another)
const overlaps: Overlap[] = [];

for (let i = 0; i < stepKeys.length; i++) {
  for (let j = i + 1; j < stepKeys.length; j++) {
    const key1 = stepKeys[i];
    const key2 = stepKeys[j];
    const pattern1 = compiledPatterns.get(key1)!;
    const pattern2 = compiledPatterns.get(key2)!;

    const overlap = detectOverlap(key1, pattern1, key2, pattern2);
    if (overlap) {
      // Populate file paths
      overlap.file1 = (STEPS[key1 as keyof typeof STEPS] as { typescript?: string }).typescript || 'unknown';
      overlap.file2 = (STEPS[key2 as keyof typeof STEPS] as { typescript?: string }).typescript || 'unknown';
      overlaps.push(overlap);
    }
  }
}
```

### Step 3: Update Error Reporting
**File:** `scripts/bdd/verify-alignment.ts`

Modify the condition and error reporting (lines 235-263):

```typescript
if (orphanSteps.length || deadSteps.length || missingPython.length || missingTypescript.length || ambiguities.length || overlaps.length) {
  console.error('BDD alignment failed');
  // ... existing reporting ...
  if (overlaps.length) {
    console.error(`Overlapping step patterns: ${overlaps.length}`);
    overlaps.forEach((o) => {
      console.error(`  - Overlap detected (${o.reason}):`);
      console.error(`      Pattern 1: "${o.key1}" -> ${o.file1}`);
      console.error(`      Pattern 2: "${o.key2}" -> ${o.file2}`);
      console.error(`      Example that could match both: "${o.example}"`);
    });
  }
  process.exit(1);
}

console.log(
  `✓ ${Object.keys(STEPS).length} steps defined, ${orphanSteps.length} orphan, ${deadSteps.length} dead, ` +
  `${ambiguities.length} ambiguous, ${overlaps.length} overlapping`
);
```

### Step 4: Create Test Fixture
**File:** `specs/features/test/overlapping_patterns.feature`

```gherkin
Feature: Overlapping Pattern Detection Test
  This feature tests that verify-alignment.ts catches overlapping step patterns

  Scenario: Should detect overlapping patterns
    # These two steps have overlapping patterns in registry:
    # Pattern 1: "test overlap base {string}"
    # Pattern 2: "test overlap base {string} with suffix"
    # The step below could match BOTH patterns!
    Given test overlap base "example"
```

**File:** `test/bdd/step-registry.ts`

Add test registry entries (without implementations, just for detection):

```typescript
// Test overlapping pattern detection
'test overlap base {string}': {
  python: 'test/python/steps/test_steps.py',
  typescript: 'test/typescript/steps/test_steps.ts',
},
'test overlap base {string} with suffix': {
  python: 'test/python/steps/test_steps.py',
  typescript: 'test/typescript/steps/test_steps.ts',
},
```

### Step 5: Run Verification
After implementation, run:

```bash
bun run bdd:verify
bun run typecheck
```

Expected: The verifier should report 1 overlapping pattern.

Then remove the test entries from `step-registry.ts` and verify passes.

## Files to Change
1. `scripts/bdd/verify-alignment.ts` - Add overlap detection logic (~120 lines)
2. `specs/features/test/overlapping_patterns.feature` - Create test fixture (new file)
3. `test/bdd/step-registry.ts` - Add test registry entries (temporary)

## Tests to Run
- `bun run bdd:verify` - Should detect overlaps in test fixture
- `bun run typecheck` - Must pass with no type errors

## Risks and Rollback
| Risk | Mitigation |
|------|------------|
| False positives on legitimate patterns | Conservative detection - only suffix overlaps, not leading |
| Performance O(n²) on 270 steps | Acceptable for current size (~36k comparisons) |
| Breaking existing workflow | overlaps are warnings that fail CI - can be fixed by renaming patterns |

**Rollback:** If issues arise, revert the changes to `verify-alignment.ts` and remove the test fixture.

## Success Criteria
- [ ] Overlap detection function added to `verify-alignment.ts`
- [ ] Test fixture `overlapping_patterns.feature` triggers detection
- [ ] `bun run bdd:verify` reports 1 overlapping pattern with test fixture
- [ ] `bun run bdd:verify` passes with no overlaps after removing test entries
- [ ] `bun run typecheck` passes
