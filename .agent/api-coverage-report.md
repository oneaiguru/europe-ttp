# API Coverage Report — Python → Next.js

## Summary
- Total Python endpoints: 26
- Covered in Next.js: 18
- Missing from Next.js: 8
- Next.js-only (no Python equivalent): 7

## Covered Endpoints

| # | Python Route | Methods | Python Handler | Next.js Route File |
|---|---|---|---|---|
| 1 | `/admin/get-config` | GET | `Admin.get` | `app/api/admin/admin/get-config/route.ts` |
| 2 | `/admin/set-config` | POST | `Admin.post` | `app/api/admin/admin/set-config/route.ts` |
| 3 | `/admin/admin_settings.html` | GET | `Admin.get` | `app/api/admin/settings/route.ts` |
| 4 | `/admin/ttc_applicants_summary.html` | GET | `Admin.get` | `app/api/admin/ttc_applicants_summary/route.ts` |
| 5 | `/admin/ttc_applicants_integrity.html` | GET | `Admin.get` | `app/api/admin/ttc_applicants_integrity/route.ts` |
| 6 | `/admin/ttc_applicants_reports.html` | GET | `Admin.get` | `app/api/admin/ttc_applicants_reports/route.ts` |
| 7 | `/admin/post_ttc_course_feedback_summary.html` | GET | `Admin.get` | `app/api/admin/post_ttc_course_feedback/route.ts` |
| 8 | `/admin/post_sahaj_ttc_course_feedback_summary.html` | GET | `Admin.get` | `app/api/admin/post_sahaj_ttc_course_feedback/route.ts` |
| 9 | `/reporting/user-summary/get-by-user` | GET | `Reporting.get` | `app/api/admin/reporting/user-summary/get-by-user/route.ts` |
| 10 | `/reporting/user-report/get-user-application-html` | GET | `UserReport.get` | `app/api/admin/reporting/user-report/get-user-application-html/route.ts` |
| 11 | `/integrity/user-integrity/get-by-user` | GET | `Integrity.get` | `app/api/admin/integrity/user-integrity/get-by-user/route.ts` |
| 12 | `/form/ttc_application.html` | GET | `PrintForm.get` | `app/api/forms/ttc_application_us/route.ts` + `ttc_application_non_us/route.ts` |
| 13 | `/form/ttc_evaluation.html` | GET | `PrintForm.get` | `app/api/forms/ttc_evaluation/route.ts` |
| 14 | `/form/ttc_applicant_profile.html` | GET | `PrintForm.get` | `app/api/forms/ttc_applicant_profile/route.ts` |
| 15 | `/form/ttc_evaluator_profile.html` | GET | `PrintForm.get` | `app/api/forms/ttc_evaluator_profile/route.ts` |
| 16 | `/form/post_ttc_self_evaluation_form.html` | GET | `PrintForm.get` | `app/api/forms/post_ttc_self_evaluation/route.ts` |
| 17 | `/form/post_ttc_feedback_form.html` | GET | `PrintForm.get` | `app/api/forms/post_ttc_feedback/route.ts` |
| 18 | `/form/ttc_portal_settings.html` | GET | `PrintForm.get` | `app/api/forms/ttc_portal_settings/route.ts` |

**Note:** Python's single `/form/ttc_application.html` (country-agnostic) maps to two Next.js routes split by country (`ttc_application_us`, `ttc_application_non_us`).

## Missing Endpoints

| # | Python Route | Methods | Python Handler | Purpose |
|---|---|---|---|---|
| 1 | `/reporting/user-summary/load` | GET+POST | `Reporting.load_user_summary` | Cron job — rebuilds summary data from all user files in GCS |
| 2 | `/jobs/reporting/user-summary/load` | GET+POST | `Reporting.load_user_summary` | Alias of #1 (App Engine cron route) |
| 3 | `/reporting/user-report/get-user-application` | GET | `UserReport.get_user_application` | Returns single application form data (non-HTML) |
| 4 | `/reporting/user-report/get-user-application-combined` | GET | `UserReport.get_user_application` | Returns combined multi-form HTML for printing |
| 5 | `/integrity/user-integrity/load` | GET+POST | `Integrity.load_user_integrity` | Cron job — rebuilds integrity data (enrolled/org course matches) |
| 6 | `/jobs/integrity/user-integrity/load` | GET+POST | `Integrity.load_user_integrity` | Alias of #5 (App Engine cron route) |
| 7 | `/integrity/user-integrity/postload` | GET+POST | `Integrity.post_load_user_integrity` | Cron job — generates enrolled CSV from integrity data |
| 8 | `/jobs/integrity/user-integrity/postload` | GET+POST | `Integrity.post_load_user_integrity` | Alias of #7 (App Engine cron route) |

**Breakdown of missing:**
- **4 cron/ETL endpoints** (#1, #2, #5, #6) — background data rebuild jobs triggered by App Engine cron. These likely need a different mechanism in Next.js (e.g., serverless functions, scheduled tasks, or admin-triggered rebuild).
- **2 cron post-processing** (#7, #8) — CSV generation after integrity load.
- **2 report rendering** (#3, #4) — `get-user-application` returns raw form JSON; `get-user-application-combined` renders multiple forms as printable HTML.

## Next.js Only (no Python equivalent)

| # | Next.js Route | Purpose |
|---|---|---|
| 1 | `app/api/admin/reporting/user-summary/get-by-form-type/route.ts` | New aggregation — summary data grouped by form type (not in Python) |
| 2 | `app/api/admin/permissions/route.ts` | New dedicated permissions management page |
| 3 | `app/api/admin/reports_list/route.ts` | New reports list/landing page |
| 4 | `app/api/forms/dsn_application/route.ts` | New form type — DSN application (not in Python) |
| 5 | `app/api/upload/signed-url/route.ts` | New — generates signed upload URLs (Python used blobstore directly) |
| 6 | `app/api/upload/verify/route.ts` | New — verifies uploaded files |
| 7 | `app/users/upload-form-data/route.ts` | New — client-side form data upload endpoint |

## Source Files Audited

**Python (route definitions):**
- `admin.py` — Admin page serving + config get/set (8 endpoints)
- `reporting/user_summary.py` — Summary data load + get-by-user (3 routes)
- `reporting/user_report.py` — Report HTML rendering (3 routes)
- `reporting/user_integrity.py` — Integrity data load + get-by-user + postload (6 routes)
- `reporting/print_form.py` — Form page rendering (7 form types)

**HTML templates served:**
- `admin/admin_settings.html`
- `admin/ttc_applicants_summary.html`
- `admin/ttc_applicants_integrity.html`
- `admin/ttc_applicants_reports.html`
- `admin/post_ttc_course_feedback_summary.html`
- `admin/post_sahaj_ttc_course_feedback_summary.html`

**Next.js route files:** 28 files under `app/api/` and `app/users/`
