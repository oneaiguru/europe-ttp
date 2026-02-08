# TASK-069: eslint-coverage-gaps - Research

## Evidence

### Current ESLint Configuration (`eslint.config.js:1-35`)

The flat config currently has:
- **Ignores** (lines 7-14):
  - `"*.js"` - ALL JavaScript files ignored
  - `"*.mjs"` - All ES module JS files ignored
  - `"javascript/**"` - Legacy JS directory ignored
  - `"dist/**"` - Build outputs ignored
- **Files covered** (line 17): `["scripts/**/*.ts", "test/**/*.ts"]` ONLY
- **Missing from coverage**: `app/**/*.ts`, `app/**/*.tsx`, and runtime JS config

### Files Not Linted

**Application TypeScript (24 files)** - All in `app/` directory:
- API routes:
  - `app/api/upload/signed-url/route.ts:1` - Signed upload URL generation
  - `app/api/upload/verify/route.ts:1` - Upload token verification
- Utilities:
  - `app/utils/crypto.ts:1` - HMAC token generation/verification
  - `app/utils/html.ts:1` - HTML escaping helpers
- User endpoints:
  - `app/users/upload-form-data/route.ts:1` - Form data upload handler
- Admin renderers (4 files):
  - `app/admin/permissions/render.ts:1`
  - `app/admin/reports_list/render.ts:1`
  - `app/admin/settings/render.ts:1`
  - `app/admin/ttc_applicants_summary/render.ts:1`
- Portal renderers (3 files):
  - `app/portal/home/render.ts:1`
  - `app/portal/tabs/render.ts:1`
  - `app/portal/disabled/render.ts:1`
- Form renderers (12 files):
  - `app/forms/dsn_application/render.ts:1`
  - `app/forms/post_sahaj_ttc_feedback/render.ts:1`
  - `app/forms/post_sahaj_ttc_self_evaluation/render.ts:1`
  - `app/forms/ttc_application_us/render.ts:1`
  - `app/forms/ttc_evaluation/render.ts:1`
  - `app/forms/ttc_applicant_profile/render.ts:1`
  - `app/forms/ttc_evaluator_profile/render.ts:1`
  - `app/forms/post_ttc_self_evaluation/render.ts:1`
  - `app/forms/post_ttc_feedback/render.ts:1`
  - `app/forms/ttc_application_non_us/render.ts:1`
  - `app/forms/ttc_portal_settings/render.ts:1`
  - Plus 2 TSX files:
    - `app/forms/ttc_application_non_us/render.tsx:1`
    - `app/forms/ttc_portal_settings/render.tsx:1`

**Runtime JavaScript config (3 files)** - Currently ignored by `"*.js"` rule:
- `cucumber.cjs:1` - Cucumber test runner config (spec paths, formatters, step imports)
- `.cucumberrc.cjs:1` - Cucumber config (format options, ts-node registration)
- `test/typescript/steps/forms_steps.cjs:1` - Compiled CommonJS output (has `.ts` source)

### Verification of Gap

Running `bun run lint app/api/upload/signed-url/route.ts` produces:
```
File ignored because no matching configuration was supplied
```

This confirms `app/` files are NOT linted.

### TypeScript Config Alignment (`tsconfig.json:14`)

The tsconfig already includes `app/**/*.tsx` and `app/**/*.ts`, but ESLint does not follow this pattern.

### Current Lint Status

Running `bun run lint` passes but only covers:
- `scripts/**/*.ts` - Tooling scripts
- `test/**/*.ts` - Test code (with warnings for unused vars)

### Known Type Errors (Not Lint Issues)

`bun run typecheck` currently fails on:
- Missing `next/server` module (expected - not installed, this is a migration project)
- Missing `@/utils/crypto` path alias (tsconfig `baseUrl` is set but ts-node may not resolve it)

These are **type errors**, not lint issues. The task is specifically about ESLint coverage.

## Proposed Solution

Modify `eslint.config.js` to:
1. Add `app/**/*.ts` and `app/**/*.tsx` to the `files` glob
2. Create a separate config entry for `.cjs` config files (cucumber.cjs, .cucumberrc.cjs)
3. Keep `forms_steps.cjs` ignored (it's compiled output, source is `.ts`)

## Constraints

- Legacy `javascript/**` should remain ignored (not project's JS)
- `experimental/**` contains third-party jsPDF and should be ignored
- `node_modules/` must remain ignored
- The compiled `.cjs` file is build artifact, ignore it

## Files to Modify

- `eslint.config.js` - Add app/ patterns and selective .cjs config linting
