# TASK-058: escape-portal-rendering-html - Implementation Plan

## Overview
Fix XSS vulnerabilities in portal HTML render helpers by escaping user-controlled values before interpolating into HTML strings.

## Implementation Steps

### Step 1: Create HTML Escape Utility
**File:** `app/utils/html.ts` (new)

Create two escape functions based on the legacy pattern in `javascript/utils.js:207-214`:

```typescript
/**
 * Escape HTML text content (interpolated outside tags/attributes).
 * Converts: < > & → &lt; &gt; &amp;
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Escape HTML attribute values (interpolated inside double-quoted attributes).
 * Converts: < > & " ' → &lt; &gt; &amp; &quot; &#x27;
 */
export function escapeHtmlAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
```

### Step 2: Fix `app/portal/home/render.ts`
**File:** `app/portal/home/render.ts`

1. Import escape utilities:
   ```typescript
   import { escapeHtml, escapeHtmlAttr } from '../../utils/html';
   ```

2. Escape `userEmail`, `homeCountryName`, `homeCountryIso` with `escapeHtml()` (text content).

3. Escape `link.href` with `escapeHtmlAttr()` (attribute value).

4. Escape `link.label` with `escapeHtml()` (text content).

### Step 3: Fix `app/portal/tabs/render.ts`
**File:** `app/portal/tabs/render.ts`

1. Import escape utilities:
   ```typescript
   import { escapeHtml, escapeHtmlAttr } from '../../utils/html';
   ```

2. Escape `homeCountryName` with `escapeHtml()` (text content).

3. Escape `email` with `escapeHtmlAttr()` when used in `href` attribute.

4. Escape `email` with `escapeHtml()` when used as text content.

### Step 4: Add Escaping Test
**File:** `test/typescript/steps/portal_steps.ts` (extend existing)

Add new scenario or assertion:
```typescript
Then('the HTML output should have dangerous characters escaped', function () {
  const html = world.responseHtml || '';

  // Verify < is escaped
  assert.ok(!html.includes('<script>'), 'Should not contain raw script tag');
  assert.ok(html.includes('&lt;') || !html.includes('<'), '< should be escaped');

  // Verify quotes in attributes are escaped
  assert.ok(!html.includes('onclick='), 'Should not contain onclick handler');
});
```

Or add fixture test in `test/typescript/fixtures/html-escape.test.ts`.

## Files to Change

| File | Change Type | Description |
|------|-------------|-------------|
| `app/utils/html.ts` | Create | New escape utility functions |
| `app/portal/home/render.ts` | Modify | Import and use escape functions |
| `app/portal/tabs/render.ts` | Modify | Import and use escape functions |
| `test/typescript/steps/portal_steps.ts` | Modify | Add escaping verification |

## Verification Commands

```bash
# Type check
bun run typecheck

# Lint
bun run lint

# BDD verify
bun run bdd:verify

# Run specific portal test
bun test test/typescript/features/portal.feature
```

## Risks / Rollback

| Risk | Mitigation |
|------|------------|
| Over-escaping existing values | Audit all interpolated values; only escape user/admin-controlled ones |
| Breaking existing tests | Tests check for `includes(email)`; escaped email `&lt;@&gt;` still contains `@` so should pass |
| Double-escaping | Only escape at render boundary, not before storing |
| Performance impact | Minimal: regex replace on short strings |

**Rollback:** Revert the 4 modified files if tests fail or rendering breaks.

## Edge Cases

1. **Empty values** - Escape functions handle empty strings (return empty).
2. **Null/undefined** - TypeScript types enforce string; if needed, add `?? ''` fallback.
3. **Already-escaped values** - Double-escaping (e.g. `&amp;` → `&amp;amp;`) is safe but displays incorrectly. Ensure values are not pre-escaped.
4. **International characters** - Escape functions only target HTML metacharacters; UTF-8 passes through.

## Definition of Done

- [x] Research complete with file:line references
- [x] `app/utils/html.ts` created with `escapeHtml()` and `escapeHtmlAttr()`
- [x] `app/portal/home/render.ts` uses escape functions for all user values
- [x] `app/portal/tabs/render.ts` uses escape functions for all user values
- [x] Test demonstrates escaping of `<`, `"`, `'` characters
- [x] `bun run typecheck` passes
- [x] `bun run lint` passes
- [x] `bun run bdd:verify` passes
