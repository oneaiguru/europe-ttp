# TASK-093: purge-stale-app-js-artifacts - Implementation Plan

## Overview
Remove 17 stale `.js` files from `app/` directory that have been superseded by `.ts` equivalents. Research confirms these are dead code with no imports or test references.

## Implementation Steps

### Step 1: Pre-removal verification
Run baseline checks to ensure system is healthy before removal:
```bash
bun run typecheck
bun run bdd:verify
```

### Step 2: Remove the 17 `.js` files
Use `git rm` to remove files from git tracking:
```bash
git rm app/admin/permissions/render.js
git rm app/admin/reports_list/render.js
git rm app/admin/settings/render.js
git rm app/admin/ttc_applicants_summary/render.js
git rm app/forms/dsn_application/render.js
git rm app/forms/post_sahaj_ttc_feedback/render.js
git rm app/forms/post_sahaj_ttc_self_evaluation/render.js
git rm app/forms/post_ttc_self_evaluation/render.js
git rm app/forms/ttc_applicant_profile/render.js
git rm app/forms/ttc_application_non_us/render.js
git rm app/forms/ttc_application_us/render.js
git rm app/forms/ttc_evaluation/render.js
git rm app/forms/ttc_evaluator_profile/render.js
git rm app/portal/disabled/render.js
git rm app/portal/home/render.js
git rm app/portal/tabs/render.js
git rm app/users/upload-form-data/route.js
```

Alternatively, use a single command:
```bash
git rm app/**/*.js
```

### Step 3: Post-removal verification
Verify nothing broke:
```bash
bun run typecheck    # Should still pass
bun run bdd:verify   # Should still pass
git status           # Should show 17 deletions
```

## Files Changed

| File | Action |
|------|--------|
| 17 `.js` files in `app/` | Delete (git rm) |

## Tests to Run

1. `bun run typecheck` - Verify TypeScript compilation unaffected
2. `bun run bdd:verify` - Verify step registry alignment
3. `git status` - Confirm 17 deletions staged

## Risks / Rollback

| Risk | Mitigation |
|------|------------|
| None identified - research confirmed no imports, no test references, build system ignores `app/**/*.js` | N/A |
| If unexpected issues arise, restore with `git checkout HEAD -- app/**/*.js` | Simple rollback |

## Completion Criteria

- [ ] All 17 `.js` files removed from git tracking
- [ ] `bun run typecheck` passes
- [ ] `bun run bdd:verify` passes
- [ ] IMPLEMENTATION_PLAN.md updated (move TASK-093 to Done)
- [ ] COMPLETION_LOG.md updated with summary
