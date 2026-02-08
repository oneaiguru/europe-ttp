# TASK-093: purge-stale-app-js-artifacts - Research

## Finding: All 17 `.js` files are confirmed stale and safe to remove

### Evidence of staleness

**1. All have corresponding `.ts` versions**
- All 17 `.js` files have matching `.ts` files at the same path
- Verified with: `for f in $(git ls-files app/**/*.js); do ts="${f%.js}.ts"; [ -f "$ts" ] && echo "OK: $ts"; done`

**2. tsconfig does NOT include `app/**/*.js`**
- File: `tsconfig.json:15`
- Include pattern: `"app/**/*.tsx", "app/**/*.ts"`
- Missing: `app/**/*.js`
- Result: TypeScript ignores these files completely

**3. No imports reference these `.js` files**
- Searched: `rg '\.js['\''")]' app/` → no results
- Searched: `rg 'from ['\''].*render\.js' . --type js --type ts` → no results
- Searched: `rg 'upload-form-data/route\.js' .` → only found in task doc and plan

**4. No BDD steps reference these files**
- Searched: `rg 'render\.js|route\.js' test/ specs/` → no results
- Searched: `rg '\.js' test/bdd/step-registry.ts` → no results

**5. Next.js routing prefers `.ts` over `.js`**
- File-system based routing: `app/users/upload-form-data/route.ts` takes precedence
- The `.js` version is never loaded

## Files to remove (17 total)

| Path | Status |
|------|--------|
| `app/admin/permissions/render.js` | git-tracked, has `.ts` |
| `app/admin/reports_list/render.js` | git-tracked, has `.ts` |
| `app/admin/settings/render.js` | git-tracked, has `.ts` |
| `app/admin/ttc_applicants_summary/render.js` | git-tracked, has `.ts` |
| `app/forms/dsn_application/render.js` | git-tracked, has `.ts` |
| `app/forms/post_sahaj_ttc_feedback/render.js` | git-tracked, has `.ts` |
| `app/forms/post_sahaj_ttc_self_evaluation/render.js` | git-tracked, has `.ts` |
| `app/forms/post_ttc_self_evaluation/render.js` | git-tracked, has `.ts` |
| `app/forms/ttc_applicant_profile/render.js` | git-tracked, has `.ts` |
| `app/forms/ttc_application_non_us/render.js` | git-tracked, has `.ts` |
| `app/forms/ttc_application_us/render.js` | git-tracked, has `.ts` |
| `app/forms/ttc_evaluation/render.js` | git-tracked, has `.ts` |
| `app/forms/ttc_evaluator_profile/render.js` | git-tracked, has `.ts` |
| `app/portal/disabled/render.js` | git-tracked, has `.ts` |
| `app/portal/home/render.js` | git-tracked, has `.ts` |
| `app/portal/tabs/render.js` | git-tracked, has `.ts` |
| `app/users/upload-form-data/route.js` | git-tracked, has `.ts` |

## Risks identified

**Risk: None identified**
- No code imports these files
- No tests reference these files
- Build system ignores `.js` in `app/`
- All functionality preserved in `.ts` versions

## Verification approach (for plan phase)

```bash
# Pre-removal verification
bun run typecheck    # Should pass before
bun run bdd:verify   # Should pass before

# Removal
git rm app/**/*.js   # Batch remove all 17 files

# Post-removal verification
bun run typecheck    # Should still pass
bun run bdd:verify   # Should still pass
git status           # Should show 17 deletions staged
```

## Related work

- TASK-086: Removed duplicate TSX files that had corresponding TS versions
- TASK-091: Pruned stale BDD .js scripts (keep pattern established)
