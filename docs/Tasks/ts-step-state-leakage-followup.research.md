# TASK-072: TypeScript Step State Leakage Followup - Research

## Executive Summary
The `E2ETestContext` interface (lines 906-914 in `e2e_api_steps.ts`) defines extended properties that are used in the evaluator workflow but are NOT reset in the Before hook (lines 111-139). Additionally, `field_errors` is defined but not reset.

## State Reset Analysis

### 1. Before Hook Coverage (`e2e_api_steps.ts:111-139`)

The Before hook currently resets:
- `whitelist`, `whitelistGraceExpired`
- `evaluations`, `evaluationsCount`
- `applicantSubmissions` (in global testContext, line 67)
- `applicants`, `graduates`
- `testModeEnabled`
- `userSummary`, `evaluationsList`
- Optional properties deleted: `currentEmail`, `currentRole`, `currentUser`, `currentTtcOption`, `lastSubmission`, `response`, `homeCountry`, `whitelistTargetEmail`, `currentPage`, `numEvaluators`, `requestedReportEmail`, `lastNotification`, `postTtcSubmissions`, `flaggedMissingFeedback`

### 2. Missing Reset Properties

The following `E2ETestContext` extended properties are NOT being reset:

| Property | Type | Used In | Lines |
|----------|------|---------|-------|
| `applicantSubmissions` | `Record<string, ApplicantSubmission>` | E2ETestContext interface | 907 |
| `applicantUploads` | `Record<string, ApplicantUploads>` | Steps: 943-966, 1008-1050 | 908 |
| `currentApplicantEmail` | `string` | Steps: 971, 989, 973, 1060 | 910 |
| `currentApplicantSubmission` | `ApplicantSubmission` | Steps: 974, 986-1006 | 911 |
| `currentView` | `string` | Steps: 1147 | 912 |
| `field_errors` | `Record<string, string>` | Defined at line 83, used in `validation_steps.ts` | 83 |

**Note on `applicantSubmissions`**: The base `testContext.applicantSubmissions` (line 67, type `Record<string, unknown>`) IS reset at line 118, but the typed `E2ETestContext.applicantSubmissions` (line 907, type `Record<string, ApplicantSubmission>`) is the same property and may have typed values assigned that could leak.

**Note on `flaggedMissingFeedback`**: Defined in E2ETestContext at line 913, IS deleted in Before hook at line 137.

### 3. Source of State

#### `applicantUploads` (lines 943-966)
- Initialized in `Given('applicant has uploaded photo and required documents')`
- Lazy-initialized via `if (!ctx.applicantUploads) { ctx.applicantUploads = {}; }`

#### `currentApplicantEmail` (lines 971, 989, 973, 1060)
- Set in `When('I open the TTC evaluation form for {string}')` (line 971)
- Used in multiple Then steps

#### `currentApplicantSubmission` (line 974)
- Set in `When('I open the TTC evaluation form for {string}')` (line 974)
- Used in `Then('I should see the applicant's submitted application data')`

#### `currentView` (line 1147)
- Set in `When('I view the applicant's evaluation summary')` (line 1147)

#### `field_errors` (line 83)
- Defined in global testContext
- Set in `validation_steps.ts` lines 63, 96, 174
- NOT reset in e2e_api_steps.ts Before hook

## Cross-File Dependencies

### `common.ts`
- Contains a Before hook that resets module-level contexts from other step files
- Does NOT reset `e2e_api_steps.ts` extended properties (those are file-local to `e2e_api_steps.ts`)

### `validation_steps.ts`
- Uses `field_errors` property
- No Before hook in that file (relies on common.ts or e2e_api_steps.ts)

## Conclusion

Five properties in `E2ETestContext` are not being reset between scenarios:
1. `applicantUploads` - Record<string, ApplicantUploads>
2. `currentApplicantEmail` - string
3. `currentApplicantSubmission` - ApplicantSubmission
4. `currentView` - string
5. `field_errors` - Record<string, string>

The fix requires adding resets for these properties to the Before hook in `e2e_api_steps.ts:111-139`.
