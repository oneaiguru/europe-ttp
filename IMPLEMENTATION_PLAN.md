# Europe TTP Migration - Implementation Plan

## Status
🟢 **Phase 0 Complete** - All planning artifacts generated, build tools ready

---

## Phase 0: Planning ✅ DONE

| Task | Status | Output |
|------|--------|--------|
| 0A - Extract routes.json | 🟢 DONE | specs/extracted/routes.json |
| 0B - Extract models.json | 🟢 DONE | specs/extracted/models.json |
| 0C - Extract forms.json | 🟢 DONE | specs/extracted/forms.json |
| 0D - Extract emails.json | 🟢 DONE | specs/extracted/emails.json |
| 0E - Extract reports.json | 🟢 DONE | specs/extracted/reports.json |
| 0F - Generate feature files | 🟢 DONE | specs/features/**/*.feature |
| 0G - Create step registry | 🟢 DONE | test/bdd/step-registry.ts |
| 0H - Generate task graph | 🟢 DONE | tasks/task_graph.json |

---

## Phase 0I: Build-Tool Readiness ✅ DONE

> **Goal**: Make PROMPT_build.md runnable without failing on missing tooling.

### Implementation (Fix 0I-1A - Symlink Approach)

Created symlinks for standard Behave layout:
```bash
test/python/features -> ../../specs/features  # Features directory
specs/features/steps -> ../../test/python/steps  # Steps directory
```

Updated `scripts/bdd/run-python.ts` to run Behave from `test/python/` directory.

### All Fixes Complete

| Task | Status | Details |
|------|--------|---------|
| 0I-1 - Python BDD path | ✅ DONE | Symlink approach (0I-1A), run from test/python |
| 0I-1B - Python deps | ✅ DONE | Added webtest, behave to requirements.txt |
| 0I-2 - TS BDD path | ✅ DONE | run-typescript.ts uses `test/reports/` |
| 0I-3 - TS BDD deps | ✅ DONE | Uses root `node_modules/.bin/cucumber-js` + `ts-node/register` |
| 0I-4 - Reports dir | ✅ DONE | `test/reports/` exists, scripts create if needed |
| 0I-5 - typecheck/lint | ✅ DONE | tsconfig.json + eslint.config.js (ESLint v9 flat config) |
| 0I-6 - Queue payload | ✅ DONE | queue-from-graph.sh uses coordinator schema |
| 0I-7 - Weaver image | ✅ DONE | Python 2.7 + Behave verified |
| 0I-8 - Single-worker | ✅ DONE | Note: one worker per repo until leases |

---

### Phase 0I: Readiness Checklist ✅ ALL COMPLETE

Before running build loop (PROMPT_build.md):

- [x] BDD runners succeed on at least 1 feature (Python + TS)
- [x] `test/reports/` exists and JSON outputs are produced
- [x] PROMPT_build.md only calls valid commands
- [x] Queue script accepts coordinator payload
- [x] `bun install` run at root
- [x] Symlinks created for Behave standard layout

---

## Phase 1: Foundation

| Task | Priority | Feature File | Status |
|------|----------|--------------|--------|
| TASK-001 | p1 | specs/features/auth/login.feature | 🔴 TODO |
| TASK-002 | p1 | specs/features/auth/logout.feature | 🔴 TODO |
| TASK-003 | p3 | specs/features/auth/password_reset.feature | 🔴 TODO |
| TASK-004 | p1 | specs/features/portal/home.feature | 🔴 TODO |
| TASK-005 | p2 | specs/features/portal/disabled.feature | 🔴 TODO |
| TASK-006 | p3 | specs/features/portal/tabs.feature | 🔴 TODO |
| TASK-007 | p2 | specs/features/admin/access.feature | 🔴 TODO |
| TASK-008 | p1 | specs/features/admin/permissions.feature | 🔴 TODO |
| TASK-009 | p2 | specs/features/admin/reports_pages.feature | 🔴 TODO |
| TASK-010 | p3 | specs/features/admin/settings.feature | 🔴 TODO |
| TASK-011 | p1 | specs/features/forms/ttc_application_us.feature | 🔴 TODO |
| TASK-012 | p2 | specs/features/forms/ttc_application_non_us.feature | 🔴 TODO |
| TASK-013 | p2 | specs/features/forms/ttc_evaluation.feature | 🔴 TODO |
| TASK-014 | p2 | specs/features/forms/ttc_applicant_profile.feature | 🔴 TODO |
| TASK-015 | p2 | specs/features/forms/ttc_evaluator_profile.feature | 🔴 TODO |
| TASK-016 | p2 | specs/features/forms/post_ttc_self_eval.feature | 🔴 TODO |
| TASK-017 | p2 | specs/features/forms/post_ttc_feedback.feature | 🔴 TODO |
| TASK-018 | p2 | specs/features/forms/post_sahaj_ttc_self_eval.feature | 🔴 TODO |
| TASK-019 | p2 | specs/features/forms/post_sahaj_ttc_feedback.feature | 🔴 TODO |
| TASK-020 | p3 | specs/features/forms/ttc_portal_settings.feature | 🔴 TODO |
| TASK-021 | p3 | specs/features/forms/dsn_application.feature | 🔴 TODO |
| TASK-022 | p1 | specs/features/uploads/photo_upload.feature | 🔴 TODO |
| TASK-023 | p2 | specs/features/uploads/document_upload.feature | 🔴 TODO |
| TASK-024 | p1 | specs/features/api/upload_form.feature | 🔴 TODO |
| TASK-025 | p1 | specs/features/user/form_data_upload.feature | 🔴 TODO |
| TASK-026 | p2 | specs/features/user/get_form_data.feature | 🔴 TODO |
| TASK-027 | p2 | specs/features/user/get_form_instances.feature | 🔴 TODO |
| TASK-028 | p2 | specs/features/user/config_management.feature | 🔴 TODO |
| TASK-029 | p2 | specs/features/user/reporting_get_form_data.feature | 🔴 TODO |
| TASK-030 | p1 | specs/features/reports/user_summary.feature | 🔴 TODO |
| TASK-031 | p1 | specs/features/reports/user_integrity.feature | 🔴 TODO |
| TASK-032 | p2 | specs/features/reports/user_report.feature | 🔴 TODO |
| TASK-033 | p3 | specs/features/reports/print_form.feature | 🔴 TODO |
| TASK-034 | p2 | specs/features/reports/participant_list.feature | 🔴 TODO |
| TASK-035 | p3 | specs/features/reports/certificate.feature | 🔴 TODO |

## Phase 2: Core Features (Not Started)

---

## Phase 3: Advanced Features (Not Started)

---

## Phase 4: Polish & Launch (Not Started)

---

## Implementation Plan Hygiene

### Duplicate Tasks — RESOLVED (Merged)

1 feature file = 1 task. Original plan had 41 tasks with duplicates; merged to 35 tasks:

| Feature File | Was (duplicate tasks) | Now | Scenarios |
|--------------|----------------------|-----|-----------|
| `config_management.feature` | TASK-028, TASK-029 | **TASK-028** | Get config, Update config |
| `user_summary.feature` | TASK-031, TASK-032 | **TASK-030** | Load job, Get by user |
| `user_integrity.feature` | TASK-033, TASK-034, TASK-035 | **TASK-031** | Load, Get by user, Postload |
| `user_report.feature` | TASK-036, TASK-037, TASK-038 | **TASK-032** | Get HTML, Get combined, Get forms |

**Note:** TASK-029 was repurposed to `reporting_get_form_data.feature` (different feature, not a duplicate).
