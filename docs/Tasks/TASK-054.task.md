# TASK-054: Fix Legacy XSS Sinks

## Goal
Reduce XSS risk in legacy JS utilities by replacing unsafe `.html(msg)` calls and inline `onclick` string concatenation with escaped text insertion or sanitization.

## Legacy Reference
- File: `javascript/utils.js`
- Lines: 636, 1272-1274

## References
- `docs/review/REVIEW_DRAFTS.md` (2026-02-06 entry for `fix-legacy-xss-sinks`)
- `javascript/utils.js:636` (unsafe `.html()` usage)
- `javascript/utils.js:1272-1274` (inline `onclick` concatenation)

## Acceptance Criteria
1. Replace `.html(msg)` with escaped text insertion or sanitization in `javascript/utils.js:636`
2. Avoid inline `onclick` string concatenation for dynamic content in `javascript/utils.js:1272-1274`
3. Verify changes do not break existing functionality (BDD tests still pass)

## Implementation Notes
- Legacy code is read-only per project rules - this task requires careful analysis
- Options may include:
  - Adding escaping utility functions
  - Using `text()` instead of `html()` where appropriate
  - Replacing inline event handlers with data attributes and event delegation
  - Adding sanitization for required HTML content

## Test Commands
```bash
bun run bdd:verify
bun run typecheck
bun run lint
```

## Safety Considerations
- This is legacy code (Python 2.7 App Engine era JS utilities)
- Changes must not break existing form validation and UI behaviors
- Consider whether fixes should be in legacy code or if Next.js implementation already addresses these issues
