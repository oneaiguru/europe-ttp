# TASK-031: Research Findings

## Overview
Research for implementing User Integrity Report BDD scenarios. The legacy implementation exists in `reporting/user_integrity.py` with three main endpoints.

## Legacy Python Implementation

### Location
`reporting/user_integrity.py` (lines 34-402)

### Key Components

#### 1. Handler Class
- **Class**: `Integrity` (line 34)
- **Routes**:
  - `/integrity/user-integrity/load` - GET/POST
  - `/integrity/user-integrity/get-by-user` - GET
  - `/jobs/integrity/user-integrity/load` - GET/POST (cron)
  - `/jobs/integrity/user-integrity/postload` - GET/POST (cron)

#### 2. Authentication
- Uses `users.get_current_user()` from Google App Engine API
- Checks if user email is in `constants.LIST_OF_ADMINS`
- Checks for `X-Appengine-Cron` header for cron jobs

#### 3. Endpoints

**A. Load User Integrity** (`load_user_integrity()` - line 80)
- Reads all user config files from GCS (`constants.USER_CONFIG_LOCATION`)
- Filters for `ttc_application` form type only
- Filters by `min_updated_datetime` from ControlParameters
- Processes user data with complex matching logic:
  - Matches enrolled people across applicants
  - Matches organized courses across applicants
  - Generates `enrolled_matches` and `org_course_matches` integrity data
- Writes result to `constants.USER_INTEGRITY_BY_USER` (GCS)
- Updates `user_integrity_last_update_datetime` in ControlParameters

**B. Get User Integrity by User** (`get_user_integrity_by_user()` - line 74)
- Reads from `constants.USER_INTEGRITY_BY_USER` (GCS)
- Returns JSON content directly

**C. Post Load User Integrity** (`post_load_user_integrity()` - line 359)
- Reads from `constants.USER_INTEGRITY_BY_USER` (GCS)
- Generates CSV: "Applicant Name,Applicant Email,Enrolled Name,Enrolled Email"
- Writes to `constants.APPLICANT_ENROLLED_LIST` (GCS)

#### 4. Data Processing Details

**Reporting Fields** (lines 81-93):
```python
reporting_fields = {
    'i_fname': '',
    'i_lname': '',
    'i_enrolled_people': '',
    'i_org_courses': [
        'i_org_course_from_date',
        'i_org_course_to_date',
        'i_org_course_leadteacher',
        'i_org_course_city',
        'i_org_course_state',
    ],
}
```

**Matching Logic** (lines 234-337):
- Cross-references all TTC applications against each other
- Matches by enrolled people email/name/city/state
- Matches by organized courses dates/teacher/city/state with fuzzy name matching
- Stores matches under `integrity` key for each application

## Existing Test Infrastructure

### Python Steps
- **File**: `test/python/steps/reports_steps.py`
- **Existing**: User Summary report steps (lines 40-114)
- **Pattern**: Uses `_get_reporting_client(context)` which requires Google App Engine dependencies
- **Note**: File currently only implements user summary steps, NOT user integrity steps

### TypeScript Steps
- **File**: `test/typescript/steps/reports_steps.ts`
- **Existing**: User Summary report steps only (lines 16-55)
- **Missing**: All 6 user integrity step definitions

### Step Registry Status
Current entries point to line 1 in both files, which is incorrect placeholder:
```typescript
'I run the user integrity report load job': {
  pattern: /^I\ run\ the\ user\ integrity\ report\ load\ job$/,
  python: 'test/python/steps/reports_steps.py:1',  // INCORRECT
  typescript: 'test/typescript/steps/reports_steps.ts:1',  // INCORRECT
  features: ['specs/features/reports/user_integrity.feature:9'],
}
```

## BDD Scenarios to Implement

### Scenario 1: Load user integrity (p1)
```
Given I am authenticated as an admin user
When I run the user integrity report load job
Then a user integrity file should be generated
```

### Scenario 2: Get user integrity by user (p2)
```
Given I am authenticated as an admin user
When I request the user integrity report by user
Then I should receive the user integrity data
```

### Scenario 3: Run user integrity postload (p2)
```
Given I am authenticated as an admin user
When I run the user integrity postload job
Then an applicant enrolled list should be generated
```

## Implementation Notes

### Python Implementation Strategy
1. Follow pattern from user summary steps (lines 40-114)
2. Create new step functions in `test/python/steps/reports_steps.py`
3. Use `_get_reporting_client(context)` for API calls
4. Endpoints to call:
   - Load: `/integrity/user-integrity/load`
   - Get by user: `/integrity/user-integrity/get-by-user`
   - Postload: `/integrity/user-integrity/postload`

### TypeScript Implementation Strategy
1. Add new step definitions to `test/typescript/steps/reports_steps.ts`
2. Mock API calls for now (similar to user summary steps)
3. Define proper types for integrity data structure
4. Pattern should match existing user summary steps

### Key Dependencies
- Google App Engine: `google.appengine.api.users`, `google.appengine.ext.ndb`, `cloudstorage`
- Internal: `constants`, `reporting_utils`, `db.ControlParameters`
- Test mode: Should respect `pyutils/test_mode.py` for deadline bypass

### Data Structures
**User Integrity Response**:
```json
{
  "user@example.com": {
    "ttc_application": {
      "default": { "integrity": {...} },
      "form-instance-email": { ...form data... }
    }
  }
}
```

**Applicant Enrolled CSV**:
```csv
Applicant Name,Applicant Email,Enrolled Name,Enrolled Email
John Doe,john@example.com,,
,Jane Smith,jane@example.com
```

## Verification Commands
```bash
# Python tests
bun scripts/bdd/run-python.ts specs/features/reports/user_integrity.feature

# TypeScript tests
bun scripts/bdd/run-typescript.ts specs/features/reports/user_integrity.feature

# Alignment check
bun scripts/bdd/verify-alignment.ts
```

## References
- Legacy: `reporting/user_integrity.py:34-402`
- Feature: `specs/features/reports/user_integrity.feature`
- Pattern: `test/python/steps/reports_steps.py:40-114` (user summary)
- TS Pattern: `test/typescript/steps/reports_steps.ts:16-55`
