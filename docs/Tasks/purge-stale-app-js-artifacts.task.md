# TASK-093: purge-stale-app-js-artifacts

## Goal
Remove stale `.js` files from `app/` directory that have been superseded by `.ts` equivalents.

## Context
The Next.js app has 17 duplicate `.js` files with corresponding `.ts` versions. The TypeScript files are more up-to-date (e.g., `upload-form-data/route.ts` has security improvements not in the `.js` version). Since tsconfig includes `app/**/*.ts` but NOT `app/**/*.js`, and no code imports these `.js` files by extension, they are dead code.

## Legacy Reference
N/A - This is purely cleanup of duplicated app code

## References (Files to Delete)
- `app/admin/permissions/render.js` (has `render.ts`)
- `app/admin/reports_list/render.js` (has `render.ts`)
- `app/admin/settings/render.js` (has `render.ts`)
- `app/admin/ttc_applicants_summary/render.js` (has `render.ts`)
- `app/forms/dsn_application/render.js` (has `render.ts`)
- `app/forms/post_sahaj_ttc_feedback/render.js` (has `render.ts`)
- `app/forms/post_sahaj_ttc_self_evaluation/render.js` (has `render.ts`)
- `app/forms/post_ttc_self_evaluation/render.js` (has `render.ts`)
- `app/forms/ttc_applicant_profile/render.js` (has `render.ts`)
- `app/forms/ttc_application_non_us/render.js` (has `render.ts`)
- `app/forms/ttc_application_us/render.js` (has `render.ts`)
- `app/forms/ttc_evaluation/render.js` (has `render.ts`)
- `app/forms/ttc_evaluator_profile/render.js` (has `render.ts`)
- `app/portal/disabled/render.js` (has `render.ts`)
- `app/portal/home/render.js` (has `render.ts`)
- `app/portal/tabs/render.js` (has `render.ts`)
- `app/users/upload-form-data/route.js` (has `route.ts`)

Note: `app/dist/render.js` is not git-tracked and appears to be a build artifact.

## Acceptance Criteria
- [ ] All 17 stale `.js` files removed from git tracking
- [ ] `bun run bdd:verify` passes (should have no steps referencing these files)
- [ ] `bun run typecheck` passes (typecheck should be unaffected)
- [ ] No import statements reference `.js` files with extensions

## Implementation Notes
- Use `git rm` to remove files from tracking
- Verify no `.d.ts` files are affected
- Ensure Next.js routing still works (file-system based routing prefers `.ts` over `.js`)

## Test Commands
```bash
# Verify no imports reference .js files
rg '\.js['\''")]' app/

# Run typecheck to ensure nothing breaks
bun run typecheck

# Verify BDD alignment
bun run bdd:verify
```
