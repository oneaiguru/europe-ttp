# TASK-066: ts-reports-steps-mocked-calls-false-green - Implementation Plan

## Summary
Replace hard-coded success values (always 200) in `test/typescript/steps/reports_steps.ts` with fixture-backed stubs that validate response structure and can fail on malformed data.

## Background
- Current TS reports steps hard-code `status = 200` with fake data
- This creates "false green" tests that always pass regardless of actual implementation
- No Next.js API routes exist for reports (all legacy Python 2.7 only)
- Python steps call legacy endpoints via webapp2 TestApp
- Research recommends **Option B: Fixture-Backed Stubs That Can Fail**

## Implementation Steps

### Step 1: Create Fixtures Directory Structure
Create `test/typescript/fixtures/reports/` directory with JSON fixtures for each report type:
- `user-summary.json` - User summary report response structure
- `user-integrity.json` - User integrity report response structure
- `user-report-html.json` - HTML report fixture (escaped string)
- `combined-report.json` - Combined report fixture
- `forms-report.json` - Forms report fixture
- `print-form.json` - Printable form HTML fixture
- `participant-list.json` - Participant list data fixture
- `certificate-pdf.json` - Certificate PDF fixture (base64 or path)

### Step 2: Create Fixture Loader Utility
Create `test/typescript/fixtures/loader.ts` with:
- `loadFixture(name: string): T` - loads JSON fixture by name
- `validateFixtureStructure(data: unknown, schema: object): void` - validates structure
- Throws descriptive errors if fixtures are missing or malformed

### Step 3: Update `reports_steps.ts` - User Summary Report
Modify `test/typescript/steps/reports_steps.ts`:

**Lines 34-40 (When I run the user summary report load job):**
- Remove hard-coded `world.loadStatus = 200`
- Load from `user-summary.json` fixture
- Set `world.loadStatus` from fixture (can be non-200 for error scenarios)
- Set `world.summaryData` from fixture

**Lines 42-50 (Then a user summary file should be generated):**
- Validate `world.summaryData` has expected structure from fixture
- Assert on meaningful fields (e.g., `user_email`, `status`, `ttc_option`)
- Remove empty dict mock

**Lines 52-59 (When I request the user summary report by user):**
- Load from `user-summary.json` fixture
- Set status and data from fixture

**Lines 61-72 (Then I should receive the user summary data):**
- Validate meaningful fields exist
- Assert data is not just an empty dict

### Step 4: Update `reports_steps.ts` - User Integrity Report
Apply same pattern to integrity report steps (lines 76-114):
- Load from `user-integrity.json` fixture
- Validate fields like `flags`, `missing_uploads`, `incomplete_forms`
- Ensure postload CSV has expected header structure

### Step 5: Update `reports_steps.ts` - User Application Report
Apply same pattern to user report steps (lines 139-200):
- Load from `user-report-html.json` / `combined-report.json` / `forms-report.json`
- Validate HTML contains expected elements (not just generic div check)
- For HTML responses, validate presence of report-specific content

### Step 6: Update `reports_steps.ts` - Print Form
Apply same pattern to print form steps (lines 204-244):
- Load from `print-form.json` fixture
- Validate HTML contains form-specific content (labels, values)
- Not just generic `<div>` check

### Step 7: Update `reports_steps.ts` - Participant List
Apply same pattern to participant list steps (lines 248-286):
- Load from `participant-list.json` fixture
- Validate array of objects with required fields
- Assert each participant has `email`, `name`, `ttc_option`, `application_status`

### Step 8: Update `reports_steps.ts` - Certificate PDF
Apply same pattern to certificate steps (lines 290-314):
- Load from `certificate-pdf.json` fixture
- Validate PDF magic bytes (`%PDF-`)
- Validate content-type is `application/pdf`

### Step 9: Add State Management
Add `reports_steps.ts` state to the common.ts Before hook for proper reset:
- Export a `resetReportsState()` function
- Import and call in `test/typescript/steps/common.ts` Before hook

### Step 10: Update Step Registry
Update `test/bdd/step-registry.ts` if any step patterns change (none expected)

## Files to Modify

| File | Changes |
|------|---------|
| `test/typescript/fixtures/reports/*.json` | CREATE - 8 new fixture files |
| `test/typescript/fixtures/loader.ts` | CREATE - fixture loader utility |
| `test/typescript/steps/reports_steps.ts` | MODIFY - replace hard-coded mocks with fixture loading |
| `test/typescript/steps/common.ts` | MODIFY - add reports state reset |
| `test/bdd/step-registry.ts` | VERIFY - no changes expected |

## Fixtures Specification

### user-summary.json
```json
{
  "status": 200,
  "data": {
    "test.applicant@example.com": {
      "user_email": "test.applicant@example.com",
      "ttc_option": "test_us_future",
      "application_status": "submitted",
      "evaluations_count": 2,
      "last_update": "2024-01-15T10:30:00Z"
    }
  }
}
```

### user-integrity.json
```json
{
  "status": 200,
  "data": {
    "test.applicant@example.com": {
      "user_email": "test.applicant@example.com",
      "flags": ["missing_photo"],
      "missing_uploads": ["photo"],
      "incomplete_forms": []
    }
  }
}
```

### participant-list.json
```json
{
  "status": 200,
  "data": [
    {
      "email": "test.applicant@example.com",
      "name": "Test Applicant",
      "ttc_option": "test_us_future",
      "enrollment_count": 10,
      "enrollment_list_count": 8,
      "application_status": "submitted",
      "last_update": "2024-01-15 10:30:00"
    }
  ]
}
```

## Tests to Run
```bash
# Verify all tests still pass
bun run bdd:typescript specs/features/reports/*.feature
bun run bdd:verify
bun run typecheck
bun run lint

# Specifically test each report feature
bun run bdd:typescript specs/features/reports/user_summary.feature
bun run bdd:typescript specs/features/reports/user_integrity.feature
bun run bdd:typescript specs/features/reports/user_report.feature
bun run bdd:typescript specs/features/reports/participant_list.feature
bun run bdd:typescript specs/features/reports/certificate.feature
```

## Risks and Mitigation

| Risk | Mitigation |
|------|------------|
| Fixture files may not match actual legacy API response structure | Document fixtures as "test-only" structures; add comments referencing legacy endpoints |
| Tests may fail if fixture loader throws on missing files | Graceful degradation with clear error messages |
| State leakage between scenarios | Add state reset to common.ts Before hook |
| Changing fixtures could be mistaken for real implementation | Clear comments that these are fixtures, not real API calls |

## Rollback Plan
If implementation causes issues:
1. Revert `reports_steps.ts` to current hard-coded version
2. Remove `test/typescript/fixtures/` directory
3. Remove `test/typescript/fixtures/loader.ts`
4. Remove reports state reset from `common.ts`

## Success Criteria
1. All report feature tests still pass
2. `Then` steps validate meaningful fields (not just status codes)
3. Missing or malformed fixture files cause test failures (not silent success)
4. Step registry shows no orphan or dead steps
5. Type checking passes with no errors
