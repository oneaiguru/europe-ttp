# Implementation: P1-PR97-PLAYWRIGHT-SEPARATE-PAGES

## Status: COMPLETED

## Summary
Fixed buggy page resolution in Playwright UI parity tests by replacing fragile browser context traversal with explicit page creation and proper cleanup.

## Problem
The original code at lines 271-273 attempted to resolve pages by traversing browser context internals:

```typescript
// OLD (buggy):
const legacyPage = page.context().browser()?.contexts()[0]?.pages()[0] || page;
const newPage = page.context().browser()?.contexts()[0]?.pages()?.[1] || page;
```

**Issues:**
1. Fragile chain of optional accessors that could fail unexpectedly
2. Assumes specific browser context/page ordering
3. Falls back to same `page` object for both, defeating the purpose of separate pages
4. No cleanup of created pages

## Solution
Replaced with explicit page creation using the Playwright API:

```typescript
// NEW (correct):
const legacyPage = page;
const newPage = await page.context().newPage();

let parityResult;
try {
  // Load both snapshots
  await legacyPage.goto(legacyFileUrl);
  await newPage.goto(newFileUrl);

  // Run parity checks
  parityResult = await runParityCheck(
    legacyPage,
    newPage,
    mapping.parity_checks || { ... }
  );
} finally {
  // Ensure new page is always closed to prevent resource leaks
  await newPage.close();
}
```

## Changes Made
- `/Users/m/git/clients/aol/europe-ttp/test/playwright/ui_parity.spec.ts` (lines 271-295)

## Verification
- Project-level TypeScript check passes: `npx tsc --noEmit` (no errors)
- Note: Playwright test files have pre-existing ESM configuration issues unrelated to this fix

## Benefits
1. **Reliability**: Uses stable Playwright API instead of fragile traversal
2. **Resource Management**: Proper cleanup with try/finally ensures no page leaks
3. **Correctness**: Actually creates separate pages for comparison instead of potentially reusing the same page
