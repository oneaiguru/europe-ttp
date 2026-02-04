# TASK-034: Participant List - Research Findings

## Overview
This task implements a new **participant list report** functionality for admin users to download/view participant lists.

## Step 1: "I request the participant list report"

### Current Status
- **Not implemented** in legacy codebase
- Step registry entry exists but points to line 1 (placeholder)

### Investigation Findings

#### Legacy Codebase
- No dedicated participant list endpoint exists in `/workspace/admin.py`
- Related functionality exists in:
  - `/workspace/reporting/user_summary.py` - User summary report
  - `/workspace/reporting/user_integrity.py` - User integrity report
  - `/workspace/admin/ttc_applicants_reports.html` - Admin reports page showing enrollment data

#### Enrollment Data Context
From `/workspace/admin/ttc_applicants_reports.html`:
- Admin reports already display enrollment data
- Fields shown include:
  - `enrollment_count` - Number of enrolled people mentioned
  - `enrollment_list_count` - Number of enrolled people listed (from enrollment list)
- Data comes from `/reporting/user-summary/get-by-user` endpoint

#### Data Storage
- User form data stored in GCS at `constants.USER_CONFIG_LOCATION`
- User summary aggregated at `constants.USER_SUMMARY_BY_USER`
- Form data includes field `i_enrollment` (enrollment count mentioned)
- Form data may include enrollment list details (structure TBD)

### Implementation Approach
This is a **NEW** report endpoint that needs to be created. It should:
1. Query/aggregate participant data from user forms
2. Return a list of enrolled participants with key information
3. Follow similar patterns to existing `/reporting/user-summary/get-by-user` endpoint

## Step 2: "I should receive the participant list output"

### Current Status
- **Not implemented**
- Step registry entry exists but points to line 1 (placeholder)

### Expected Behavior
- Verify response contains participant list data
- Validate data structure matches expected format
- Ensure proper fields are included (name, email, TTC, enrollment info, etc.)

### Data Fields (Based on similar reports)
Likely fields to include:
- Participant name
- Email
- TTC applied for
- Enrollment count (mentioned)
- Enrollment list count (from list)
- Application status
- Contact information

## Step 3: "I am authenticated as an admin user"

### Current Status
- **Already implemented**
- Python Path: `test/python/steps/admin_steps.py:77`
- TypeScript Path: `test/typescript/steps/admin_steps.ts:59`

### Details
This step sets up admin authentication context and is reused across multiple admin features.

## Implementation Notes

### Python Implementation Location
- **New file needed**: `/workspace/reporting/participant_list.py` OR
- **Add to**: `/workspace/reporting/user_summary.py` as new endpoint

### Python Step Definition Location
- **File**: `test/python/steps/reports_steps.py`
- **Pattern**: Follow existing report step patterns
- **Reference**: Similar to `@when('I run the user summary report load job')` at line 41

### TypeScript Implementation Location
- **API Route**: Create new route at `app/api/reports/participant-list/route.ts`
- **Step Definition**: Add to `test/typescript/steps/reports_steps.ts`
- **Pattern**: Follow existing report step patterns

### Step Registry Updates
- Update entries for:
  - "I request the participant list report" - line 238
  - "I should receive the participant list output" - line 334

## Data Model Considerations

### Source Data
- User config files in GCS
- Form data for `ttc_application` form type
- Enrollment list field structure needs investigation

### Output Format
- JSON array of participant records
- Each record includes:
  - User identifying info (name, email)
  - TTC applied for
  - Enrollment data
  - Status metadata

## Open Questions
1. What is the exact structure of the enrollment list data in form submissions?
2. Should this be a standalone report or integrated into user summary?
3. What filtering/options should be available (e.g., by TTC, by status)?
4. Should it match the user summary endpoint pattern or be simpler?

## Next Steps (Plan Phase)
1. Define exact API contract for participant list endpoint
2. Plan Python implementation (new file vs. add to existing)
3. Plan TypeScript implementation (API route + step definition)
4. Plan step registry updates with correct line numbers
5. Plan test data setup for BDD scenarios
