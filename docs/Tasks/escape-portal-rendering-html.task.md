# TASK-058: escape-portal-rendering-html

## Goal
Prevent XSS/HTML injection in portal HTML render helpers by escaping user-controlled values before interpolating into HTML.

## References
- `docs/review/REVIEW_DRAFTS.md` - Task entry under "Processed"
- `app/portal/home/render.ts:16-25` - Home render function with userEmail, homeCountryName, homeCountryIso
- `app/portal/tabs/render.ts:23-29` - Tabs render function with similar interpolation

## Acceptance Criteria
1. `userEmail`, `homeCountryName`, and `homeCountryIso` are escaped before interpolating into HTML.
2. `reportLinks` values (`href`, `label`) are validated or encoded to prevent attribute/text injection.
3. A small unit test (or fixture assertion) demonstrates escaping for `<`, `"`, and `'`.

## Files to Modify
- `app/portal/home/render.ts`
- `app/portal/tabs/render.ts`

## Test Commands
```bash
bun run bdd:verify
bun run typecheck
bun run lint
```
