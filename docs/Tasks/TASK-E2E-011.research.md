# TASK-E2E-011: Reporting Integrity Checks - Research

## Task Definition

**Task ID**: TASK-E2E-011
**Feature File**: `specs/features/e2e/reporting_integrity_checks.feature`
**Scenarios**:
1. Integrity report flags missing uploads
2. Integrity report flags incomplete forms
3. Integrity report flags mismatched user IDs
4. Download integrity report as CSV

## Feature File Analysis

The feature file tests data quality checks in the integrity reporting system:

### Scenario 1: Missing Uploads
- Given applicant has submitted TTC application
- But applicant has NOT uploaded required photo
- When I run the user integrity report
- Then "test.applicant@example.com" should be flagged for missing photo
- And the integrity report should show the missing upload type

### Scenario 2: Incomplete Forms
- Given applicant has started TTC application but not submitted
- When I run the user integrity report
- Then "test.applicant@example.com" should be flagged for incomplete application
- And the report should show the application status as "incomplete"

### Scenario 3: Mismatched User IDs
- Given evaluation was submitted with email "test.aplicant@example.com" (typo)
- But applicant exists with email "test.applicant@different.com"
- When I run the user integrity report
- Then the evaluation should be flagged as unmatched
- And the report should show the mismatched email

### Scenario 4: CSV Download
- Given I run the user integrity report
- When I download the integrity report as CSV
- Then the CSV should contain columns: email, flags, missing_uploads, incomplete_forms, mismatches
- And the CSV should be downloadable via admin dashboard

## Legacy Python Implementation

### File: `reporting/user_integrity.py`

**Key Handler**: `Integrity` class

**Endpoints**:
- `/integrity/user-integrity/load` - Loads/updates integrity data
- `/integrity/user-integrity/get-by-user` - Retrieves integrity data by user
- `/jobs/integrity/user-integrity/postload` - Generates enrolled list CSV

**Core Logic** (lines 80-357):

1. **Data Collection** (lines 127-223):
   - Scans GCS bucket for user config files
   - Loads `form_data` for each user
   - Filters for `ttc_application` form type
   - Extracts fields: `i_fname`, `i_lname`, `i_enrolled_people`, `i_org_courses`
   - Tracks `is_form_submitted`, `is_form_complete` status
   - Processes `form_instance_page_data` for TTC metadata

2. **Cross-User Matching** (lines 235-337):
   - Compares all users' TTC applications against each other
   - **Enrolled People Matching** (lines 260-283):
     - Matches by email (`i_enrollment_email`)
     - Matches by name + city + state
   - **Organized Courses Matching** (lines 285-337):
     - Matches by date overlap, city, state, teacher name

3. **Integrity Flags Stored**:
   - `enrolled_matches`: Set of matched enrollments from other applicants
   - `org_course_matches`: Set of matched organized courses from other applicants

4. **CSV Export** (lines 359-400):
   - Generates applicant-enrolled list CSV
   - Columns: Applicant Name, Applicant Email, Enrolled Name, Enrolled Email
   - Writes to `constants.APPLICANT_ENROLLED_LIST`

**Current Gaps**:
- ❌ **Missing uploads detection** - Legacy code does NOT check for missing photo uploads
- ❌ **Incomplete forms flagging** - Legacy code processes status but doesn't explicitly flag incomplete forms in integrity output
- ❌ **Email mismatch detection** - Legacy code does matching but doesn't flag unmatched evaluations
- ❌ **CSV with integrity flags** - Legacy CSV only has enrollment data, not integrity flags

## Existing BDD Steps

### Python Steps (`test/python/steps/reports_steps.py`)

Already implemented:
- `I run the user integrity report load job` (line 120)
- `a user integrity file should be generated` (line 139)
- `I request the user integrity report by user` (line 162)
- `I should receive the user integrity data` (line 182)
- `I run the user integrity postload job` (line 201)

**Missing steps for TASK-E2E-011**:
- Step to set up applicant with submitted application but no photo
- Step to set up applicant with started but unsubmitted application
- Step to set up evaluation with mismatched email
- Step to verify user is flagged for missing photo
- Step to verify missing upload type is shown
- Step to verify user is flagged for incomplete application
- Step to verify application status is shown
- Step to verify evaluation is flagged as unmatched
- Step to download integrity report as CSV
- Step to verify CSV columns
- Step to verify CSV is downloadable via admin dashboard

### TypeScript Steps (`test/typescript/steps/reports_steps.ts`)

Already implemented (same as Python):
- `I run the user integrity report load job` (line 77)
- `a user integrity file should be generated` (line 85)
- `I request the user integrity report by user` (line 95)
- `I should receive the user integrity data` (line 104)
- `I run the user integrity postload job` (line 118)

**Missing steps** - Same as Python

## Step Registry Status

Current integrity-related steps in registry:
```typescript
'I run the user integrity report load job': {
  pattern: /^I run the user integrity report load job$/,
  python: 'test/python/steps/reports_steps.py:120',
  typescript: 'test/typescript/steps/reports_steps.ts:77',
  features: ['specs/features/reports/user_integrity.feature:9'],
},
'a user integrity file should be generated': {
  pattern: /^a user integrity file should be generated$/,
  python: 'test/python/steps/reports_steps.py:139',
  typescript: 'test/typescript/steps/reports_steps.ts:85',
  features: ['specs/features/reports/user_integrity.feature:10'],
},
// ... etc
```

**Missing from registry** - All steps for `specs/features/e2e/reporting_integrity_checks.feature`

## Key Findings

### What the Legacy System Does:
1. ✅ Loads user form data from GCS
2. ✅ Cross-references enrolled people and organized courses
3. ✅ Stores match data under `integrity` key
4. ✅ Generates CSV of applicant-enrolled relationships

### What the Legacy System Does NOT Do:
1. ❌ Detect missing photo uploads specifically
2. ❌ Flag incomplete forms explicitly in integrity data
3. ❌ Flag unmatched evaluations due to email typos
4. ❌ Generate CSV with integrity flag columns (email, flags, missing_uploads, incomplete_forms, mismatches)

### Implementation Challenge:
The feature file expects integrity checks that **do not exist in the legacy code**:
- Missing photo detection
- Incomplete form flagging
- Email mismatch flagging for evaluations
- CSV export with specific flag columns

This is an **enhancement/migration gap** - the E2E scenarios are defining NEW behavior that should exist in the migrated system, based on PRD requirements (A8 - "Missing uploads, incomplete forms, mismatched user IDs").

## Data Model Insights

From `reporting/user_integrity.py`:
- User data stored by email: `_user_data_by_email[email]`
- Structure: `_user_data_by_email[email][form_type][form_instance]`
- Each form has: `data`, `is_form_submitted`, `is_form_complete`, `last_update_datetime`
- Match data stored under special `integrity` key

From feature expectations:
- Need to add: `missing_uploads` array
- Need to add: `incomplete_forms` array
- Need to add: `mismatches` array for unmatched evaluations

## Next Steps for Planning

1. **Define data structure** for integrity flags:
   - How to store missing upload flags per user
   - How to store incomplete form flags
   - How to store evaluation mismatch flags

2. **Design step implementations**:
   - Setup steps for test data (applicant no photo, incomplete app, mismatched eval)
   - Assertion steps to verify flags are set correctly
   - CSV download and verification steps

3. **Determine TypeScript implementation approach**:
   - Mock integrity checking logic for BDD tests
   - Or implement real integrity checks in Next.js API routes

4. **Consider test fixtures**:
   - Need test users with various states (missing uploads, incomplete forms)
   - Need test evaluations with mismatched emails
