# TASK-030: User Summary Report - Research

## Date
2026-02-04

## Overview
Research findings for implementing user summary report functionality in both Python and TypeScript.

---

## Legacy Python Implementation

### Primary File: `reporting/user_summary.py`

**Key Routes:**
- `/reporting/user-summary/get-by-user` (GET) - Retrieves summary for a specific user
- `/reporting/user-summary/load` (GET/POST) - Runs the report generation job
- `/jobs/reporting/user-summary/load` (GET/POST) - Cron job endpoint

**Key Functions:**

#### 1. `get_user_summary_by_user()` (lines 70-74)
```python
def get_user_summary_by_user(self):
    _f = gcs.open(constants.USER_SUMMARY_BY_USER)
    _contents = _f.read()
    _f.close()
    return _contents
```
- Opens and returns the cached user summary JSON file from GCS
- File path: `constants.USER_SUMMARY_BY_USER` = `/BUCKET_NAME/user_data/summary/user_summary_by_user.json`

#### 2. `load_user_summary()` (lines 76-745)
This is the **main report generation job** that:

**a) Initializes incremental processing (lines 119-147):**
- Fetches `user_summary_last_update_datetime` from ControlParameters
- Loads existing summary file if exists for incremental updates
- Otherwise starts with empty dictionary

**b) Scans for modified user files (lines 148-152):**
```python
_user_files = Utils.list_files(
    prefix=constants.USER_CONFIG_LOCATION,
    min_updated_datetime=min_updated_datetime,
)
```
- Lists user JSON files from `/user_data/` that were modified since last run
- Filters out files ending with `/summary/` or `/integrity/`

**c) Processes each user config file (lines 157-252):**
For each user file, extracts:
- Email address
- Form data by form type (`form_data` dict)
- For each form instance:
  - Adds `last_update_datetime_est` (Eastern timezone)
  - Filters out data older than `DATA_RETENTION_DAYS`
  - Computes `reporting_status` and `evaluations_reporting_status`
  - Extracts TTC metadata from `i_ttc_country_and_dates`
  - Stores only whitelisted fields (lines 203-210)
  - Counts prerequisites answered "no" (`prereq_no_count`)
  - Counts list field items

**d) Resets evaluation counters (lines 253-294):**
- Clears past evaluation assignments
- Initializes counters for each form type

**e) Matches evaluations to applications (lines 299-527):**
- Compares evaluator emails against applicant emails
- Performs fuzzy name matching (Levenshtein distance)
- Handles various name/email formats (first+last, AOL email, etc.)
- Updates both current and lifetime evaluation counts
- Tracks:
  - `evaluations_submitted_count`
  - `latest_evaluation_datetime_est`
  - `eval_teaching_readiness` (ready_now, not_ready_now, etc.)
  - `evaluator_ratings_below_3`

**f) Processes post-TTC feedback (lines 528-633):**
- Matches co-teacher feedback to self-evaluations
- Uses course start date matching
- Fuzzy name matching with tolerance of 2

**g) Processes post-Sahaj TTC feedback (lines 635-728):**
- Similar to post-TTC feedback
- Matches feedback to self-evaluations

**h) Writes results (lines 729-745):**
```python
_f = gcs.open(constants.USER_SUMMARY_BY_USER, 'w', ...)
_f.write(json.dumps(_user_data_by_email, default=utils.json_dumps_set_default))
_f.close()

ControlParameters.create({
    'user_summary_last_update_datetime': current_datetime,
})
```

---

## Supporting Files

### `reporting/reporting_utils.py`

**Key Functions:**

1. **`get_reporting_status()`** (lines 25-54)
   - Returns `(app_status, eval_status)` tuple
   - Status values: SUBMITTED, FILLED, IN_PROGRESS, COMPLETE, COMPLETE_LIFETIME, INCOMPLETE
   - For TTC application: requires 3 submitted evals for COMPLETE
   - For post-TTC self-eval: requires 1 submitted eval for COMPLETE

2. **`get_ttc_list()`** (lines 57-68)
   - Loads `ttc_country_and_dates.json` from GCS
   - Returns dict indexed by TTC option value

### `constants.py`

**Key Constants:**
```python
USER_SUMMARY_FOLDER = 'user_data/summary/'
USER_SUMMARY_BY_USER_FILENAME = 'user_summary_by_user.json'
USER_SUMMARY_BY_USER = '/BUCKET_NAME/user_data/summary/user_summary_by_user.json'
DATA_RETENTION_DAYS = 365  # Used for filtering old data
```

---

## Data Structure

The generated `user_summary_by_user.json` has this structure:
```json
{
  "user@example.com": {
    "ttc_application": {
      "test_us_future": {
        "reporting": {
          "evaluations": { "evaluator@example.com": { "eval2@example.com": "Teacher Name" } },
          "evaluations_submitted_count": 2,
          "latest_evaluation_datetime_est": "2024-01-15 10:30:00",
          "reporting_status": "submitted",
          "evaluations_reporting_status": "incomplete",
          "prereq_no_count": 0
        },
        "data": {
          "i_fname": "John",
          "i_lname": "Doe",
          "i_email": "john@example.com"
          // ... only whitelisted fields
        }
      },
      "__reporting__": {
        "lifetime_evaluations": {},
        "lifetime_evaluations_submitted_count": 5,
        "lifetime_latest_evaluation_datetime_est": "2024-01-20 15:45:00"
      }
    }
  }
}
```

---

## TypeScript Context

### Existing Code
- **Step file**: `test/typescript/steps/reports_steps.ts` - Empty (only TODO comments)
- **App structure**: No existing API routes for reports
- **Storage**: Need to determine storage strategy (Prisma, file system, etc.)

### Recommended Implementation Path
1. Create API route: `app/api/reporting/user-summary/route.ts`
2. Create API route: `app/api/reporting/user-summary/load/route.ts`
3. Implement step definitions in TypeScript
4. Use Prisma for data access (user configurations, form submissions)

---

## Step Registry Status

Current entries in `test/bdd/step-registry.ts`:
```typescript
'I run the user summary report load job': {
  pattern: /^I\ run\ the\ user\ summary\ report\ load\ job$/,
  python: null,  // TODO: needs Python impl
  typescript: 'test/typescript/steps/reports_steps.ts:1',  // Empty
  features: ['specs/features/reports/user_summary.feature:9'],
},
'I request the user summary report by user': {
  pattern: /^I\ request\ the\ user\ summary\ report\ by\ user$/,
  python: null,  // TODO: needs Python impl
  typescript: 'test/typescript/steps/reports_steps.ts:1',  // Empty
  features: ['specs/features/reports/user_summary.feature:15'],
},
'a user summary file should be generated': {
  pattern: /^a\ user\ summary\ file\ should\ be\ generated$/,
  python: null,  // TODO: needs Python impl
  typescript: 'test/typescript/steps/reports_steps.ts:1',  // Empty
  features: ['specs/features/reports/user_summary.feature:10'],
},
'I should receive the user summary data': {
  pattern: /^I\ should\ receive\ the\ user\ summary\ data$/,
  python: null,  // TODO: needs Python impl
  typescript: 'test/typescript/steps/reports_steps.ts:1',  // Empty
  features: ['specs/features/reports/user_summary.feature:16'],
},
```

**Note**: The `Given I am authenticated as an admin user` step is already implemented in `test/python/steps/admin_steps.py:77`.

---

## Implementation Notes

### Python Implementation
1. **Step 1**: Create `test/python/steps/reports_steps.py` with step definitions
2. **Step 2**: Implement load job step that calls legacy `load_user_summary()` via webtest
3. **Step 3**: Implement get-by-user step that calls legacy `get_user_summary_by_user()` via webtest
4. **Step 4**: Verify file generation in GCS (or mock for test)

### TypeScript Implementation
1. **Step 1**: Design data model (Prisma schema)
2. **Step 2**: Create API routes matching legacy behavior
3. **Step 3**: Implement step definitions using API calls
4. **Step 4**: Implement incremental processing logic
5. **Step 5**: Implement evaluation matching with fuzzy search

### Key Challenges
1. **Fuzzy matching**: Complex name/email matching logic (Levenshtein distance)
2. **Incremental updates**: Need to track last update datetime
3. **Large data processing**: May need batching for many users
4. **Time zone handling**: Eastern timezone conversion

---

## Related Tasks
- TASK-031: User Integrity Report (similar pattern)
- TASK-E2E-001: TTC Application to Admin Review (uses user summary data)
