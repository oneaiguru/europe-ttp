# Phase 2: Code Parity Audit

Run this AFTER all Phase 1 implementation tasks have converged.

## Prompt for GLM

Read the Python legacy app and the TypeScript app side by side. Compare feature-for-feature.

**Python source (read-only):**
- `/Users/m/Downloads/europe-ttp-master@44c225683f8/reporting/user_summary.py`
- `/Users/m/Downloads/europe-ttp-master@44c225683f8/reporting/user_integrity.py`
- `/Users/m/Downloads/europe-ttp-master@44c225683f8/reporting/reporting_utils.py`
- `/Users/m/Downloads/europe-ttp-master@44c225683f8/ttc_portal_user.py`
- `/Users/m/Downloads/europe-ttp-master@44c225683f8/admin.py`
- `/Users/m/Downloads/europe-ttp-master@44c225683f8/constants.py`

**TypeScript (the code you're auditing):**
- `app/utils/gcs.ts`
- `app/utils/ttc-portal-user.ts`
- `app/utils/auth-middleware.ts`
- `app/utils/admin-config.ts`
- `app/utils/reporting/reporting-utils.ts`
- `app/utils/reporting/matching.ts`
- `app/utils/reporting/user-summary.ts`
- `app/utils/reporting/user-integrity.ts`
- `app/api/auth/login/route.ts`
- `app/users/*/route.ts`
- `app/api/admin/*/route.ts`
- `app/reporting/*/route.ts`
- `app/integrity/*/route.ts`
- `app/jobs/*/route.ts`

**Check each of these:**
1. Every Python function has a TS equivalent with matching logic
2. Every legacy route has a TS route
3. Auth checks match (which routes need admin, which accept cron, which are public)
4. GCS file paths match constants.py
5. Edge cases ported: name/email swap in matching, Levenshtein thresholds, cron header bypass asymmetry, text/plain content-type on data responses
6. No mock-data.ts imports remain in any route

**Output:** Write findings to `.agent/phase2-parity-results.md`. For each gap: file path, what's missing, severity (blocks-testing / cosmetic / intentional-divergence).

If no gaps found, write: "No gaps found. Code parity audit complete."
