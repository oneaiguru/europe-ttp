# B00 Seed Results

**Date:** 2026-04-07
**Status:** PARTIAL — integrity job passed; summary job failed (pre-existing build error)

## Seed Summary

| Step | Status | Notes |
|------|--------|-------|
| TTC list config | OK | 5 TTC sessions seeded |
| Admin config | OK | applicant.gamma whitelisted |
| Persona logins (16) | OK | All 16 + 1 admin token saved |
| Applicant data | OK | alpha (2 instances), beta (1 instance) |
| Evaluator data | OK | 4 evaluations across 2 TTC instances |
| Post-TTC feedback | OK | 4 records (post + sahaj self-eval + feedback) |
| Integrity job | OK | user_integrity_by_user.json written |
| Summary job | FAILED | Turbopack parse error at user-summary.ts:862 |

## Known Issue

The reporting/summary job (`/jobs/reporting/user-summary/load`) fails with a Turbopack compilation error:
```
'import', and 'export' cannot be used outside of module code
```
at `app/utils/reporting/user-summary.ts:862`. This is a pre-existing codebase issue (file not modified in this branch). Previous `user_summary_by_user.json` and `user_summary_by_form_type.json` files from earlier runs are still present in GCS emulator.

## Personas & Tokens

### Admin Token (for other bundles)
```
akshay.ponda@artofliving.org=c2Vzc2lvbjpZV3R6YUdGNUxuQnZibVJoUUdGeWRHOW1iR2wyYVc1bkxtOXladz09OjE3NzU1MzA2Njg6dklZSF9TQ3ExYUt2cThyU1dpRDR4dw.SSfwIH4zxEXDN0SnKZSwspOrsqs8cBPD40Ots2_iCek
```

### All Persona Tokens
```
superadmin@ttc.test=c2Vzc2lvbjpjM1Z3WlhKaFpHMXBia0IwZEdNdWRHVnpkQT09OjE3NzU1MzAxNzk6bVZ2Zm8tNC1EVEdHUXNzQTlDdjM1UQ.x9kRIL2dXr-PdHIxvStWnZ8YKvcRyExf0zQlIBBZHg8
summaryadmin@ttc.test=c2Vzc2lvbjpjM1Z0YldGeWVXRmtiV2x1UUhSMFl5NTBaWE4wOjE3NzU1MzAxNzk6X3BYTzR3aVZkOEhmNlQ3aFl5a3dYZw.d-oc1vFxYwapugFI1g7CBORA3yw5qFJqtfXAjWy5YFw
outsider@ttc.test=c2Vzc2lvbjpiM1YwYzJsa1pYSkFkSFJqTG5SbGMzUT06MTc3NTUzMDE3OTo4dTVyeW4zWXhneFYzcmFVNGZmalp3.fnIi3wmspjpUlTQmkllzE9_GB1oCn6Xd8wJoSLlG7_Y
applicant.alpha@ttc.test=c2Vzc2lvbjpZWEJ3YkdsallXNTBMbUZzY0doaFFIUjBZeTUwWlhOMDoxNzc1NTMwMTgwOkJiclpXUmhBZ1F3R0FZYVRCcHZENGc.3li4fwrYJl-BQHHRdM8DmuRj_MrutP-Wkz9ReRjDhUc
applicant.beta@ttc.test=c2Vzc2lvbjpZWEJ3YkdsallXNTBMbUpsZEdGQWRIUmpMblJsYzNRPToxNzc1NTMwMTgwOlFzUUNTWXMzc3RDam1FT0k3MEJiYWc.9cHOfmL8L9ywpWYqLrsDE_6XVfrIR1-7sZ4BcMq2PhM
applicant.gamma@ttc.test=c2Vzc2lvbjpZWEJ3YkdsallXNTBMbWRoYlcxaFFIUjBZeTUwWlhOMDoxNzc1NTMwMTgwOmVLcU1RMm41ZWh3dzlybzJ1TmtheFE.feK-5YwUgzYE0vat5SwfPk7j8Sg1l3WleqOuqpAfirY
applicant.multi@ttc.test=c2Vzc2lvbjpZWEJ3YkdsallXNTBMbTExYkhScFFIUjBZeTUwWlhOMDoxNzc1NTMwMTgwOnliYzVmS2JaYWh0c2ctNFJSeE1ZVkE.dCS9mirVBopKedZLDyS0AQ3qKAhvEHMSmuZeZ4UyjdQ
evaluator.1@ttc.test=c2Vzc2lvbjpaWFpoYkhWaGRHOXlMakZBZEhSakxuUmxjM1E9OjE3NzU1MzAxODA6ZlM0RExMWEp1TGhWN3hia3hGV01wZw.0FbuZFz7fjXqTweS5rRhPSFZ7un1gjuwq6pHQvRfqUQ
evaluator.2@ttc.test=c2Vzc2lvbjpaWFpoYkhWaGRHOXlMakpBZEhSakxuUmxjM1E9OjE3NzU1MzAxODA6NV9jcy1FTXZhRjhwUUl5TW1iZUdGUQ.jLB_gbrnvPfv7uTs1zMErlosgGH8gSkgDHL-ESvDZts
evaluator.3@ttc.test=c2Vzc2lvbjpaWFpoYkhWaGRHOXlMak5BZEhSakxuUmxjM1E9OjE3NzU1MzAxODE6ZHdPUkdfa3JzempIb29sX1prVnlmdw.eOzx-bUx9evJVLk2LeHc7Qd4d39L3_FV8q2dtGsolWE
evaluator.4@ttc.test=c2Vzc2lvbjpaWFpoYkhWaGRHOXlMalJBZEhSakxuUmxjM1E9OjE3NzU1MzAxODE6LWtqcmhKY1ZlYWd3bk5QWjhKbFRBQQ.F1KX5kp5WqXxaEezz6zsSHuVJ6rotEbjhPeQSY3CuMA
graduate.post@ttc.test=c2Vzc2lvbjpaM0poWkhWaGRHVXVjRzl6ZEVCMGRHTXVkR1Z6ZEE9PToxNzc1NTMwMTgxOndQejN0QVlNcjVMR29haklGNDV4REE.vm8nI0tq-kv_bxeQLzr4ki65nV7y6YHAgXSvsHKU0cc
teacher.post@ttc.test=c2Vzc2lvbjpkR1ZoWTJobGNpNXdiM04wUUhSMFl5NTBaWE4wOjE3NzU1MzAxODE6QWRtOEpJR0dyVnZzR0NMNTdqZHl3QQ.CvECemTr2y-WtAZZcO1A7ZMbqgd-oWOMmVDbJuCMfx4
graduate.sahaj@ttc.test=c2Vzc2lvbjpaM0poWkhWaGRHVXVjMkZvWVdwQWRIUmpMblJsYzNRPToxNzc1NTMwMTgxOjFHZUtkbDlhX1o1clhFWENxYVVlT3c.hYgfsb0z6VAfs-sXC8lNPTyCONbS5lWA-Ypy82r72g8
teacher.sahaj@ttc.test=c2Vzc2lvbjpkR1ZoWTJobGNpNXpZV2hoYWtCMGRHTXVkR1Z6ZEE9PToxNzc1NTMwMTgxOjdqSV9NVGhOR3o2bTFwQWx0d1NFWFE.QzqgSeKr1PCA6V8HM8W2AZitc3BPNMwGiiqEWGmFybM
upload.attacker@ttc.test=c2Vzc2lvbjpkWEJzYjJGa0xtRjBkR0ZqYTJWeVFIUjBZeTUwWlhOMDoxNzc1NTMwMTgxOnlOM211TENrTlctT2IzajlLMkhmMVE.dqsiCAKp6rgp4x_cN4wYJog-Rb65OMNtJpQ8OrTTC4s
```

## Seeded Data Details

### Applicant Data
- **applicant.alpha@ttc.test** — TTC_OPEN_US_2026 + TTC_PRIOR_EU_2025
  - Enrolled person: John Doe (john@example.com, New York/NY)
  - Org courses: 2026-01-01 to 2026-01-15, Jane Smith teacher
- **applicant.beta@ttc.test** — TTC_OPEN_US_2026
  - Enrolled person: John Doe (john@example.com, Toronto/ON) — shared with alpha for integrity match

### Evaluator Data
| Evaluator | TTC Instance | Applicant Match | Readiness | Rating | Notes |
|-----------|-------------|-----------------|-----------|--------|-------|
| evaluator.1 | TTC_OPEN_US_2026 | Alpha Applicant (exact) | ready | 4 | Perfect match |
| evaluator.2 | TTC_OPEN_US_2026 | alpha APPLICANT (case diff) | ready | 5 | Case-insensitive match test |
| evaluator.3 | TTC_OPEN_US_2026 | Alpha Applicant (no email) | not_ready_now | 2 | Low rating case |
| evaluator.4 | TTC_PRIOR_EU_2025 | Alpha Applicant (no email) | ready | 4 | Lifetime/prior TTC |

### Post-TTC Feedback
| Persona | Form Type | TTC Instance |
|---------|-----------|-------------|
| graduate.post | post_ttc_self_evaluation_form | TTC_OPEN_US_2026 |
| teacher.post | post_ttc_feedback_form | TTC_OPEN_US_2026 |
| graduate.sahaj | post_sahaj_ttc_self_evaluation_form | TTC_OPEN_US_2026 |
| teacher.sahaj | post_sahaj_ttc_feedback_form | TTC_OPEN_US_2026 |

### TTC Sessions
| Key | Display | Country | Display Countries |
|-----|---------|---------|-------------------|
| TTC_OPEN_US_2026 | US TTC June 2026 | US | US, CA |
| TTC_EXPIRED_CA_2026 | Canada TTC February 2026 | CA | CA |
| TTC_GRACE_IN_2026 | India TTC April 2026 | IN | IN |
| TTC_CLOSED_IN_2026 | India TTC January 2026 | IN | IN |
| TTC_PRIOR_EU_2025 | Europe TTC August 2025 | EU | EU |

### Notes for Other Bundles
- Tokens are HMAC-signed and time-limited; re-login may be needed if sessions expire
- Upload API route: `POST /users/upload-form-data` (NOT `/api/users/...`)
- Admin API route prefix: `/api/auth/login`
- Cron job routes: `/jobs/reporting/user-summary/load`, `/jobs/integrity/user-integrity/load`
- The `x-appengine-cron: true` header bypasses admin auth on job routes
- Admin token uses `akshay.ponda@artofliving.org` (in LIST_OF_ADMIN_PERMISSIONS)
