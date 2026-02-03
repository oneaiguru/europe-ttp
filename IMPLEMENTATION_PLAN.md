# Europe TTP Migration - Implementation Plan

## Status
🟢 **Phase 0 Complete** - All planning artifacts generated, build tools ready
🟢 **Phase 2E Complete** - Complex E2E scenarios added (6 feature files with API steps)

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

| Task | Status | Details |
|------|--------|---------|
| 0I-1 - Python BDD path | ✅ DONE | Symlink approach, run from test/python |
| 0I-1B - Python deps | ✅ DONE | Added webtest, behave to requirements.txt |
| 0I-2 - TS BDD path | ✅ DONE | run-typescript.ts uses `test/reports/` |
| 0I-3 - TS BDD deps | ✅ DONE | Uses root `node_modules/.bin/cucumber-js` |
| 0I-4 - Reports dir | ✅ DONE | `test/reports/` exists |
| 0I-5 - typecheck/lint | ✅ DONE | tsconfig.json + eslint.config.js |
| 0I-6 - Queue payload | ✅ DONE | queue-from-graph.sh uses coordinator schema |
| 0I-7 - Weaver image | ✅ DONE | Python 2.7 + Behave verified |
| 0I-8 - Test mode plumbing | ✅ DONE | pyutils/test_mode.py, fixtures |
| 0I-9 - Playwright installed | ✅ DONE | @playwright/test@1.58.1 |

---

## Phase 1: Foundation - Basic Feature Implementation

> **Goal**: Implement basic "I open X → I see Y" scenarios for each feature file.

| Task | Priority | Feature File | Status | Notes |
|------|----------|--------------|--------|-------|
| TASK-001 | p1 | specs/features/auth/login.feature | ✅ DONE | Python + TypeScript steps implemented |
| TASK-002 | p1 | specs/features/auth/logout.feature | ✅ DONE | |
| TASK-003 | p3 | specs/features/auth/password_reset.feature | ✅ DONE | |
| TASK-004 | p1 | specs/features/portal/home.feature | ✅ DONE | |
| TASK-005 | p2 | specs/features/portal/disabled.feature | ✅ DONE | |
| TASK-006 | p3 | specs/features/portal/tabs.feature | ✅ DONE | |
| TASK-007 | p2 | specs/features/admin/access.feature | ✅ DONE | |
| TASK-008 | p1 | specs/features/admin/permissions.feature | ✅ DONE | |
| TASK-009 | p2 | specs/features/admin/reports_pages.feature | ✅ DONE | |
| TASK-010 | p3 | specs/features/admin/settings.feature | ✅ DONE | |
| TASK-011 | p1 | specs/features/forms/ttc_application_us.feature | 🔴 TODO | |
| TASK-012 | p2 | specs/features/forms/ttc_application_non_us.feature | 🔴 TODO | |
| TASK-013 | p2 | specs/features/forms/ttc_evaluation.feature | 🔴 TODO | |
| TASK-014 | p2 | specs/features/forms/ttc_applicant_profile.feature | 🔴 TODO | |
| TASK-015 | p2 | specs/features/forms/ttc_evaluator_profile.feature | 🔴 TODO | |
| TASK-016 | p2 | specs/features/forms/post_ttc_self_eval.feature | 🔴 TODO | |
| TASK-017 | p2 | specs/features/forms/post_ttc_feedback.feature | 🔴 TODO | |
| TASK-018 | p2 | specs/features/forms/post_sahaj_ttc_self_eval.feature | 🔴 TODO | |
| TASK-019 | p2 | specs/features/forms/post_sahaj_ttc_feedback.feature | 🔴 TODO | |
| TASK-020 | p3 | specs/features/forms/ttc_portal_settings.feature | 🔴 TODO | |
| TASK-021 | p3 | specs/features/forms/dsn_application.feature | 🔴 TODO | |
| TASK-022 | p1 | specs/features/uploads/photo_upload.feature | 🔴 TODO | |
| TASK-023 | p2 | specs/features/uploads/document_upload.feature | 🔴 TODO | |
| TASK-024 | p1 | specs/features/api/upload_form.feature | ✅ DONE | |
| TASK-025 | p1 | specs/features/user/form_data_upload.feature | 🔴 TODO | |
| TASK-026 | p2 | specs/features/user/get_form_data.feature | 🔴 TODO | |
| TASK-027 | p2 | specs/features/user/get_form_instances.feature | 🔴 TODO | |
| TASK-028 | p2 | specs/features/user/config_management.feature | 🔴 TODO | |
| TASK-029 | p2 | specs/features/user/reporting_get_form_data.feature | 🔴 TODO | |
| TASK-030 | p1 | specs/features/reports/user_summary.feature | 🔴 TODO | |
| TASK-031 | p1 | specs/features/reports/user_integrity.feature | 🔴 TODO | |
| TASK-032 | p2 | specs/features/reports/user_report.feature | 🔴 TODO | |
| TASK-033 | p3 | specs/features/reports/print_form.feature | 🔴 TODO | |
| TASK-034 | p2 | specs/features/reports/participant_list.feature | 🔴 TODO | |
| TASK-035 | p3 | specs/features/reports/certificate.feature | 🔴 TODO | |

---

## Phase 2E: Complex E2E Scenarios (API-Centric)

> **Goal**: Multi-user workflows, deadline enforcement, cross-user reporting aggregation.
> Uses API calls for reliability (not browser automation). Playwright installed for future UI-critical tests.

| Task | Priority | Feature File | Status | Maps to PRD Appendix A |
|------|----------|--------------|--------|------------------------|
| TASK-E2E-001 | p1 | specs/features/e2e/ttc_application_to_admin_review.feature | 🟢 DONE | A1 - Applicant → TTC application (happy path) |
| TASK-E2E-002 | p1 | specs/features/e2e/evaluation_matching_tolerates_messy_inputs.feature | 🟢 DONE | A4 - Evaluator fuzzy matching |
| TASK-E2E-003 | p2 | specs/features/e2e/post_ttc_coteaching_cycle.feature | 🟢 DONE | A5 - Post-TTC self-eval + feedback |
| TASK-E2E-004 | p2 | specs/features/e2e/dependent_fields_do_not_break_completeness.feature | 🟢 DONE | A7 - Conditional fields logic |
| TASK-E2E-005 | p2 | specs/features/e2e/home_country_changes_available_ttcs.feature | 🟢 DONE | A7 - Country-based filtering |
| TASK-E2E-006 | p2 | specs/features/e2e/deadline_and_whitelist_override.feature | 🟢 DONE | Deadline control, whitelist |
| TASK-E2E-007 | p2 | specs/features/e2e/draft_save_and_resume.feature | 🔴 TODO | A2 - Save draft + resume later |
| TASK-E2E-008 | p1 | specs/features/e2e/validation_errors.feature | 🔴 TODO | A3 - Field-level validation errors |
| TASK-E2E-009 | p2 | specs/features/e2e/full_evaluator_workflow.feature | 🔴 TODO | A4 - See uploads, role-based visibility |
| TASK-E2E-010 | p1 | specs/features/e2e/certificate_gating.feature | 🔴 TODO | A6 - Certificate by completion |
| TASK-E2E-011 | p2 | specs/features/e2e/reporting_integrity_checks.feature | 🔴 TODO | A8 - Missing uploads, incomplete forms |
| TASK-E2E-012 | p2 | specs/features/e2e/form_prerequisites_conditional.feature | 🔴 TODO | A7 - DSN/Silence/Happiness/Part1/Part2 availability |
| TASK-E2E-013 | p2 | specs/features/e2e/course_eligibility_by_profile.feature | 🔴 TODO | A7 - Form availability based on profile |

### Phase 2E: Completed Work Summary

**Files Created:**
- `pyutils/test_mode.py` - Test mode flag, deadline bypass
- `test/python/support/fixtures.py` - Fixture loader
- `storage/forms/ttc_country_and_dates_test.json` - Test TTC with future dates
- `test/fixtures/test-users.json` - 9 test users (applicant, evaluator, admin, graduate)
- `test/fixtures/test-config.json` - Test configuration
- `test/fixtures/form-submissions.json` - Sample form data
- `test/python/steps/e2e_api_steps.py` - 400+ lines of API step definitions
- `test/typescript/steps/e2e_api_steps.ts` - 350+ lines of TS API step definitions
- `specs/features/e2e/*.feature` - 6 feature files with multi-user scenarios
- `test/bdd/step-registry.ts` - Updated with 50+ E2E steps
- `scripts/bdd/verify-alignment.ts` - Enhanced with pattern matching
- `scripts/bdd/run-e2e.sh` - E2E test runner

**Verification:**
```
✓ 146 steps defined, 0 orphan, 0 dead
```

---

## Phase 2E: Remaining Work (from PRD Appendix A)

### TASK-E2E-007: Draft Save and Resume (A2)
**Feature:** `specs/features/e2e/draft_save_and_resume.feature`

```gherkin
Feature: Draft Save and Resume
  As a TTC applicant
  I want to save my application as a draft and resume later
  So that I don't lose progress if I can't complete it in one session

  Scenario: Save partial application and resume after logout
    Given I am authenticated as a TTC applicant
    When I fill in the TTC application form partially with:
      | field | value |
      | i_fname | John |
      | i_lname | Doe |
      | i_email | john.doe@example.com |
    And I save the application as draft
    And I sign out of the TTC portal
    And I sign in with a valid Google account
    When I open the TTC application form
    Then I should see my draft data persisted
    When I complete the remaining required fields and submit
    Then the application should be marked as submitted

  Scenario: Multiple drafts for different forms
    Given I am authenticated as a TTC applicant
    When I save a partial TTC application as draft
    And I save a partial evaluator profile as draft
    And I navigate to the TTC application form
    Then I should see the TTC application draft data
    When I navigate to the evaluator profile form
    Then I should see the evaluator profile draft data
```

### TASK-E2E-008: Validation Errors (A3)
**Feature:** `specs/features/e2e/validation_errors.feature`

```gherkin
Feature: Validation Errors
  As a TTC applicant
  I want to see clear field-level errors when I submit incomplete forms
  So that I know exactly what needs to be fixed

  Scenario: Submit with missing required fields
    Given I am authenticated as a TTC applicant
    When I submit the TTC application form with missing required fields:
      | missing_field | error_message |
      | i_fname | First name is required |
      | i_lname | Last name is required |
      | i_email | Email is required |
    Then I should see field-level errors
    And the submission should be blocked
    And my draft data should remain intact

  Scenario: Submit with invalid email format
    Given I am authenticated as a TTC applicant
    When I submit the TTC application with an invalid email format
    Then I should see an email format validation error
    And the submission should be blocked

  Scenario: Submit past deadline shows deadline error
    Given test mode is disabled (real deadline enforcement)
    And TTC option has display_until in the past
    And I am authenticated as a TTC applicant
    When I attempt to submit the TTC application
    Then I should see "deadline expired" error message
    And the form should not be marked as submitted
```

### TASK-E2E-009: Full Evaluator Workflow (A4 - rest)
**Feature:** `specs/features/e2e/full_evaluator_workflow.feature`

```gherkin
Feature: Full Evaluator Workflow
  As an evaluator
  I want to view assigned applicant applications and submit evaluations
  So that applicants can progress through the TTC process

  Scenario: Evaluator views and evaluates applicant
    Given applicant "Test Applicant" has submitted TTC application for "test_us_future"
    And applicant has uploaded photo and required documents
    And I am authenticated as evaluator with email "test.evaluator1@example.com"
    When I open the TTC evaluation form for "test.applicant@example.com"
    Then I should see the applicant's submitted application data
    And I should see the applicant's uploaded photo
    And I should see the applicant's uploaded documents
    When I submit the evaluation with:
      | field | value |
      | i_evaluator_recommendation | Strongly Recommend |
      | i_readiness_level | Ready |
    Then the evaluation status should update to "submitted"
    And the applicant should see the evaluation in their portal

  Scenario: Role-based visibility - evaluator cannot see other evaluators' submissions
    Given evaluator A has submitted an evaluation for applicant
    And I am authenticated as evaluator B
    When I view the applicant's evaluation summary
    Then I should NOT see evaluator A's private evaluation notes
    But I should see that an evaluation was submitted

  Scenario: Evaluator can only evaluate assigned applicants
    Given I am authenticated as evaluator with email "test.evaluator1@example.com"
    When I attempt to access evaluation for unassigned applicant
    Then I should see "not authorized" or "not assigned" error
```

### TASK-E2E-010: Certificate Gating (A6)
**Feature:** `specs/features/e2e/certificate_gating.feature`

```gherkin
Feature: Certificate Generation Gated by Completion
  As a TTC administrator
  I want certificate generation to require completion of all prerequisites
  So that certificates are only issued to qualified graduates

  Scenario: Generate certificate when all requirements complete
    Given applicant has completed all TTC requirements:
      | requirement | status |
      | ttc_application | submitted |
      | ttc_evaluation_count | 2 |
      | post_ttc_self_eval | submitted |
      | post_ttc_feedback | submitted |
    And I am authenticated as admin
    When I request a certificate PDF for "test.applicant@example.com"
    Then a certificate PDF should be generated
    And the certificate should include the applicant's name
    And the certificate should include the TTC completion date

  Scenario: Certificate blocked when evaluations missing
    Given applicant has submitted TTC application
    But applicant has only 1 evaluation (requires 2)
    And I am authenticated as admin
    When I request a certificate PDF for "test.applicant@example.com"
    Then certificate generation should be blocked
    And I should see the reason: "Missing evaluations (1/2 required)"

  Scenario: Certificate blocked when post-TTC feedback missing
    Given applicant has completed TTC and evaluations
    But post-TTC co-teacher feedback is missing
    When I request a certificate PDF for "test.applicant@example.com"
    Then certificate generation should be blocked
    And I should see the reason: "Missing co-teacher feedback"
```

### TASK-E2E-011: Reporting Integrity Checks (A8)
**Feature:** `specs/features/e2e/reporting_integrity_checks.feature`

```gherkin
Feature: Reporting Integrity Checks
  As a TTC administrator
  I want integrity reports to flag missing uploads, incomplete forms, and mismatched user IDs
  So that I can identify and fix data quality issues

  Scenario: Integrity report flags missing uploads
    Given applicant has submitted TTC application
    But applicant has NOT uploaded required photo
    And I run the user integrity report
    Then "test.applicant@example.com" should be flagged for missing photo
    And the integrity report should show the missing upload type

  Scenario: Integrity report flags incomplete forms
    Given applicant has started TTC application but not submitted
    And I run the user integrity report
    Then "test.applicant@example.com" should be flagged for incomplete application
    And the report should show the application status as "incomplete"

  Scenario: Integrity report flags mismatched user IDs
    Given evaluation was submitted with email "test.aplicant@example.com"
    But applicant exists with email "test.applicant@different.com"
    And I run the user integrity report
    Then the evaluation should be flagged as unmatched
    And the report should show the mismatched email

  Scenario: Download integrity report as CSV
    Given I run the user integrity report
    When I download the integrity report as CSV
    Then the CSV should contain columns: email, flags, missing_uploads, incomplete_forms, mismatches
    And the CSV should be downloadable via admin dashboard
```

### TASK-E2E-012: Form Prerequisites Conditional (A7 - DSN/Silence/Happiness/Part1/Part2)
**Feature:** `specs/features/e2e/form_prerequisites_conditional.feature`

```gherkin
Feature: Form Prerequisites and Conditional Availability
  As a TTC applicant
  I want forms to appear based on my profile completion and prior course completion
  So that I only see forms I'm eligible for

  Scenario: DSN form available after Happiness Program completion
    Given I am authenticated as applicant with email "test.applicant@example.com"
    When I have NOT completed the Happiness Program
    Then the DSN application form should NOT be available
    When I complete the Happiness Program
    Then the DSN application form should become available

  Scenario: YES++ form requires Part 1 and Part 2 completion
    Given I am authenticated as applicant with email "test.applicant@example.com"
    When I have completed Part 1 but NOT Part 2
    Then the YES+ application form should NOT be available
    When I complete Part 2
    Then the YES+ application form should become available

  Scenario: Part 1 availability requires Happiness Program
    Given I am authenticated as applicant with email "test.applicant@example.com"
    When I have NOT completed the Happiness Program
    Then the Part 1 course application should NOT be available
    When I complete the Happiness Program
    Then the Part 1 course application should become available

  Scenario: Part 2 availability requires Part 1 completion
    Given I am authenticated as applicant with email "test.applicant@example.com"
    When I have NOT completed Part 1
    Then the Part 2 course application should NOT be available
    When I complete Part 1
    Then the Part 2 course application should become available

  Scenario: Form eligibility changes based on home country
    Given I am authenticated as applicant with email "test.applicant@example.com"
    When my home country is "US"
    Then US-specific TTC options should be available
    And India-specific TTC options should NOT be available
    When I update my home country to "IN"
    Then India-specific TTC options should become available
```

### TASK-E2E-013: Course Eligibility by Profile (A7 - eligibility flow)
**Feature:** `specs/features/e2e/course_eligibility_by_profile.feature`

```gherkin
Feature: Course Eligibility by User Profile
  As a TTC applicant
  I want to see which courses I'm eligible for based on my profile
  So that I don't waste time on applications I can't complete

  Scenario: Eligibility shows required prerequisites
    Given I am authenticated as a TTC applicant
    When I view my course eligibility dashboard
    Then I should see a list of available courses with prerequisites:
      | course | prerequisite | status |
      | TTC Application | None | Eligible |
      | TTC Evaluation | TTC Application submitted | Not Eligible |
      | DSN Application | Happiness Program completed | Not Eligible |
      | Part 1 | Happiness Program completed | Not Eligible |
      | Part 2 | Part 1 completed | Not Eligible |

  Scenario: Ineligible user gets "not available" message
    Given I am authenticated as applicant with email "test.applicant@example.com"
    And I have NOT completed the Happiness Program
    When I attempt to access the DSN application form
    Then I should see "not available" message
    And the message should explain the prerequisite: "Complete Happiness Program first"

  Scenario: Eligibility updates after completing prerequisite
    Given I have NOT completed the Happiness Program
    And the DSN form shows as "not available"
    When I complete the Happiness Program
    And I refresh the eligibility dashboard
    Then the DSN form should show as "available"
```

---

## Phase 2: Core Features (Not Started)

---

## Phase 3: Advanced Features (Not Started)

---

## Phase 4: Polish & Launch (Not Started)

---

## Task Legend

| Priority | Meaning |
|----------|---------|
| p1 | Critical path - blocks basic functionality |
| p2 | Important - completes a feature area |
| p3 | Nice to have - can defer |

| Status | Meaning |
|--------|---------|
| 🟢 DONE | Complete and verified |
| 🟡 IN PROGRESS | Work started, not yet verified |
| 🔴 TODO | Not started |
| ⚫ SKIPPED | Deferred or cancelled |

---

## Duplicate Tasks — RESOLVED (Merged)

1 feature file = 1 task. Original plan had 41 tasks with duplicates; merged to 35 tasks:

| Feature File | Was (duplicate tasks) | Now | Scenarios |
|--------------|----------------------|-----|-----------|
| `config_management.feature` | TASK-028, TASK-029 | **TASK-028** | Get config, Update config |
| `user_summary.feature` | TASK-031, TASK-032 | **TASK-030** | Load job, Get by user |
| `user_integrity.feature` | TASK-033, TASK-034, TASK-035 | **TASK-031** | Load, Get by user, Postload |
| `user_report.feature` | TASK-036, TASK-037, TASK-038 | **TASK-032** | Get HTML, Get combined, Get forms |
---

---

## Appendix A: Complete E2E Scenario Specifications (from PRD)

This section contains the **full detailed scenario specifications** from the PRD. All scenario content is preserved here so nothing is lost when the implementation plan is loaded by an agent.

### A1) Applicant → submit TTC application (happy path)

* Given applicant authenticated
* When they fill required fields across sections (personal, seva, experience, medical)
* And upload required docs (photo + ID)
* And submit
* Then application status becomes "Submitted"
* And confirmation email is sent
* And admin can see them in participant list

**Implementation Status:** 🟢 DONE (TASK-E2E-001)
- Feature: `specs/features/e2e/ttc_application_to_admin_review.feature`
- Covers: Application submission, multiple evaluations, admin reporting

---

### A2) Applicant saves draft + resumes later

* Fill partial form
* Save draft
* Logout/login
* Resume and see draft data persisted
* Submit successfully

**Implementation Status:** 🔴 TODO (TASK-E2E-007)
- Feature: `specs/features/e2e/draft_save_and_resume.feature` (spec written in plan)

---

### A3) Validation errors (P1)

* Submit with missing required fields
* Then see field-level errors
* And submission is blocked
* And draft remains intact

**Implementation Status:** 🔴 TODO (TASK-E2E-008)
- Feature: `specs/features/e2e/validation_errors.feature` (spec written in plan)

---

### A4) Evaluator workflow (teacher review)

* Given evaluator authenticated
* When they open assigned applicant
* Then they can see submitted application + uploads
* When they fill evaluation and submit
* Then evaluation status updates
* And applicant/admin sees evaluation recorded (role-based visibility)

**Implementation Status:** 🟡 PARTIAL
- TASK-E2E-002: Fuzzy matching for messy emails ✅ DONE
- TASK-E2E-009: Full evaluator workflow 🔴 TODO (spec written in plan)

---

### A5) Post-TTC self evaluation + feedback flow

* Graduate opens post-TTC self-eval
* Submits
* Opens post-TTC feedback
* Submits
* Admin report reflects both submissions

**Implementation Status:** 🟢 DONE (TASK-E2E-003)
- Feature: `specs/features/e2e/post_ttc_coteaching_cycle.feature`
- Covers: Self-eval submission, co-teacher feedback, admin reporting

---

### A6) Certificate generation gated by completion

* When admin generates certificate
* Then certificate exists only if required forms complete + pass criteria met
* Else show reason (missing evaluation, missing self-eval, etc)

**Implementation Status:** 🔴 TODO (TASK-E2E-010)
- Feature: `specs/features/e2e/certificate_gating.feature` (spec written in plan)

---

### A7) DSN + Silence / Happiness / Part 1 / Part 2 conditional logic (domain-based)

Even if the exact programs differ, model these as:

* A form's availability depends on user profile / completion of prior forms / country

* Scenarios:
    * eligible user sees DSN form
    * ineligible user gets "not available" message
    * eligibility changes after completing prerequisite and the form appears

**Implementation Status:** 🟡 PARTIAL
- TASK-E2E-004: Conditional fields (evaluator count) 🟢 DONE
- TASK-E2E-005: Country filtering 🟢 DONE
- TASK-E2E-012: Form prerequisites (DSN/Silence/Happiness/Part1/Part2) 🔴 TODO
- TASK-E2E-013: Eligibility dashboard 🔴 TODO

---

### A8) Reporting integrity checks (P2)

* Admin runs "user integrity" report
* It flags missing uploads, incomplete forms, mismatched user IDs
* And downloadable report matches expected columns/rows

**Implementation Status:** 🔴 TODO (TASK-E2E-011)
- Feature: `specs/features/e2e/reporting_integrity_checks.feature` (spec written in plan)

---

## What These Scenarios Force You to Implement

These E2E scenarios require implementing:

* **form save/submit endpoints** - Draft save and final submission
* **validation rules** - Field-level validation, error messages
* **role-based permissions** - Who can see what, evaluator/applicant visibility
* **upload flows** - Photo, document upload workflows
* **report correctness** - Integrity checks, data validation
* **conditional form availability** - Forms appear based on prerequisites
* **prerequisite tracking** - Course completion status, program eligibility

This is exactly what a "real equivalence migration" needs — proving the new system handles the same multi-user, multi-form workflows as the legacy PHP application.
