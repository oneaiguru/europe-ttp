# Task Execution Order

## Parallel Group 1 (no dependencies — dispatch all simultaneously)

| Task File | Task | Slug | Creates |
|---|---|---|---|
| `task-1-foundation.md` Task 1 | GCS Utility | `gcs-utility` | `app/utils/gcs.ts` |
| `task-1-foundation.md` Task 2 | Login Endpoint | `login-endpoint` | `app/api/auth/login/route.ts` |
| `task-1-foundation.md` Task 3 | Auth Middleware | `auth-middleware` | `app/utils/auth-middleware.ts` |
| `task-4-reporting-utils.md` Task 1 | Status State Machine | `reporting-status` | `app/utils/reporting/reporting-utils.ts` |
| `task-4-reporting-utils.md` Task 2 | Levenshtein Matching | `levenshtein` | `app/utils/reporting/matching.ts` |

All 5 tasks create NEW files with no overlap. Safe to run in parallel.

## Sequential Group 2 (depends on Group 1: gcs-utility)

| Task File | Task | Slug | Depends on |
|---|---|---|---|
| `task-2.1-ttc-portal-user.md` | TTCPortalUser Class | — | `gcs-utility` |

Must run after GCS utility exists.

## Sequential Group 3 (depends on Group 2: TTCPortalUser)

| Task File | Task | Slug | Depends on |
|---|---|---|---|
| `task-2-user-routes.md` Task 1 | Wire Upload Persistence | `wire-upload` | `ttc-portal-user` |
| `task-2-user-routes.md` Task 2 | User Data Routes | `user-data-routes` | `ttc-portal-user` |

These 2 can run in parallel (modify different files).

## Sequential Group 4 (depends on Group 1: gcs-utility)

| Task File | Task | Slug | Depends on |
|---|---|---|---|
| `task-3-admin-config.md` | Admin Config + Wiring | — | `gcs-utility`, `auth-middleware` |

Can run in parallel with Groups 2-3 (different files).

## Sequential Group 5 (depends on Groups 1-2: reporting-utils + levenshtein + TTCPortalUser)

| Task File | Task | Slug | Depends on |
|---|---|---|---|
| `task-4.3-user-summary.md` | **NEEDS OPUS** User Summary | — | `reporting-status`, `levenshtein`, `ttc-portal-user` |
| `task-4.4-user-integrity.md` | User Integrity | — | `reporting-status`, `ttc-portal-user` |

4.3 and 4.4 can run in parallel (write to different files). But 4.3 NEEDS OPUS for the implementation spec before GLM executes.

## Sequential Group 6 (depends on Group 5)

| Task File | Task | Slug | Depends on |
|---|---|---|---|
| `task-4-route-wiring.md` Task 1 | Wire Reporting Routes | `wire-reporting` | `user-summary`, `user-integrity` |
| `task-4-route-wiring.md` Task 2 | Parity Alias Routes | `parity-aliases` | `user-summary`, `user-integrity` |

These 2 can run in parallel.

## Sequential Group 7 (depends on Groups 4-6)

| Task File | Task | Slug | Depends on | Notes |
|---|---|---|---|---|
| `task-5-admin-wiring.md` Task 1 | TTC List Wiring | `ttc-list-wiring` | `gcs-utility` | **FIRST** — creates `admin-helpers.ts`, modifies route files |
| `task-5-admin-wiring.md` Task 2 | Timestamps | `timestamps` | `gcs-utility` | **SECOND** — adds to `admin-helpers.ts` |
| `task-5-admin-wiring.md` Task 3 | Admin Page Auth | `admin-page-auth` | `auth-middleware` | **THIRD** — adds auth to route files modified by Task 1 |
| `task-5-admin-wiring.md` Task 4 | User Report Routes | `user-report-routes` | `ttc-portal-user`, `auth-middleware` | **PARALLEL with 5.1-5.3** — different files |
| `task-5-admin-wiring.md` Task 5 | Fix Test Fixture | `fixture-fix` | 5.1-5.4 complete | Runs after all admin wiring tasks |
| `task-5-admin-wiring.md` Task 6 | Data Shape Validation | `data-shape-validation` | 5.1-5.5 complete | Verification-only, runs last |

Tasks 5.1, 5.2, and 5.3 must run strictly sequentially (shared `admin-helpers.ts` and shared route files).  
Task 5.4 must only run after Tasks 4.3 and 4.4 are complete, and may run while 5.1-5.3 are executing.  
Task 5.5 runs after 5.1-5.4 are complete. Task 5.6 runs last and depends on 5.5.

---

## Summary

```
Group 1:  [1.1] [1.2] [1.3] [4.1] [4.2]     ← 5 parallel tasks
Group 2:  [2.1]                                ← 1 task (waits for 1.1)
Group 3:  [2.2] [2.3]                          ← 2 parallel (waits for 2.1)
Group 4:  [3.1+3.2]                            ← 1 task (waits for 1.1, 1.3)
Group 5:  [4.3*] [4.4]                         ← 2 parallel (waits for 4.1, 4.2, 2.1) *NEEDS OPUS
Group 6:  [4.5] [4.6]                          ← 2 parallel (waits for 4.3, 4.4)
Group 7:  [5.1]→[5.2]→[5.3] (strict) and 5.4 can run alongside them; [5.5] after 5.1-5.4; [5.6] final verification last.
```

Total: 19 tasks across 7 groups. Critical path: Group 1 → 2 → 5 (4.3 NEEDS OPUS) → 6 → 7.

## NEEDS OPUS Tasks

Only **task-4.3-user-summary.md** requires Opus judgment. Specifically:
- The evaluation matching algorithm decomposition (multi-word name variants, Levenshtein thresholds, name/email swap)
- Opus should produce a detailed implementation spec, then GLM executes from it
