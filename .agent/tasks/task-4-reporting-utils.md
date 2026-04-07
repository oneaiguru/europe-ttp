# Phase 4 Reporting Utilities — Task Reference

## Global Rules
- Working directory: `/Users/m/ttp-split-experiment`
- All files created are NEW — do not modify any existing files
- These two tasks have NO dependencies on each other — can run in parallel
- Port Python logic exactly — do not "improve" or change the algorithms

## Loop
- Implement: read this file, do Task N. Run `npx tsc --noEmit`. Commit.
- Review: read this file, check Task N. Fix or say "all clean."
- Max 3 review rounds per task.

---

## Task 1: Port Status State Machine

- Slug: `reporting-status`
- Goal: Port `ReportingStatus` enum and `getReportingStatus()` function from Python to TypeScript.

### Read These Files First
1. `/Users/m/Downloads/europe-ttp-master@44c225683f8/reporting/reporting_utils.py` (full file, 69 lines) — the source to port

### Changes Required

**Create `app/utils/reporting/reporting-utils.ts`:**

```typescript
export const ReportingStatus = {
  SUBMITTED: 'submitted',
  FILLED: 'filled',
  IN_PROGRESS: 'in progress',
  PENDING: 'pending',
  COMPLETE: 'complete',
  COMPLETE_LIFETIME: 'complete (lifetime)',
  INCOMPLETE: 'incomplete',
} as const;

export type ReportingStatusValue = typeof ReportingStatus[keyof typeof ReportingStatus];

/**
 * Port of reporting_utils.get_reporting_status (lines 25-54)
 * Returns [appStatus, evalStatus]
 */
export function getReportingStatus(
  formType: string,
  isFormSubmitted: boolean,
  isFormComplete: boolean,
  noOfSubmittedEvals: number = 0,
  noOfLifetimeSubmittedEvals: number = 0,
): [string, string] {
  // Port the EXACT logic from Python lines 26-54. Read the Python file — do not implement from this summary.
  ...
}
```

Port the logic EXACTLY as written in the Python source file `reporting_utils.py` lines 25-54. Read the Python, not this summary. For reference, the branching structure is:
1. App status: `is_form_submitted` → SUBMITTED, `is_form_complete` → FILLED, else → IN_PROGRESS
2. Eval status starts as INCOMPLETE
3. For `ttc_application`: 3+ submitted evals → eval=COMPLETE (+ app→COMPLETE if submitted), 3+ lifetime submitted evals → eval=COMPLETE_LIFETIME (+ app→COMPLETE_LIFETIME if submitted)
4. For `post_ttc_self_evaluation_form`: 1+ submitted eval → eval=SUBMITTED (+ app→COMPLETE if submitted)
5. For `post_sahaj_ttc_self_evaluation_form`: same as post_ttc

**When in doubt, the Python file is authoritative, not this summary.**

Also port `getTtcList()`:
```typescript
import { readJson, GCS_PATHS } from '../gcs';

export async function getTtcList(): Promise<Record<string, Record<string, unknown>>> {
  const raw = await readJson(GCS_PATHS.TTC_COUNTRY_AND_DATES) as Array<Record<string, unknown>>;
  const ttcList: Record<string, Record<string, unknown>> = {};
  for (const ttc of raw) {
    ttcList[ttc.value as string] = ttc;
  }
  return ttcList;
}
```

### Verification
- `npx tsc --noEmit` must pass
- Commit message: `feat: port reporting status state machine from Python`

---

## Task 2: Port Levenshtein Matching

- Slug: `levenshtein`
- Goal: Port the bounded Levenshtein distance function used for evaluation matching.

### Read These Files First
1. `/Users/m/Downloads/europe-ttp-master@44c225683f8/reporting/user_summary.py` (lines 378-424) — shows HOW levenshteinB is used in matching: `utils.levenshteinB(_an, _vn, 1, True)` with max distance 1 or 2
2. Search for `levenshteinB` in `/Users/m/Downloads/europe-ttp-master@44c225683f8/pyutils/` — find the actual implementation

### Changes Required

**Create `app/utils/reporting/matching.ts`:**

```typescript
/**
 * Bounded Levenshtein distance check.
 * Returns true if the edit distance between str1 and str2 is <= maxDistance.
 *
 * Port of pyutils.utils.levenshteinB
 *
 * @param str1 - First string
 * @param str2 - Second string  
 * @param maxDistance - Maximum allowed edit distance (1 for TTC evals, 2 for post-TTC)
 * @param caseInsensitive - If true, compare lowercase versions
 */
export function levenshteinB(
  str1: string,
  str2: string,
  maxDistance: number,
  caseInsensitive: boolean = false,
): boolean {
  // Implementation: standard dynamic programming Levenshtein
  // with early termination when distance exceeds maxDistance
  // If caseInsensitive, convert both to lowercase first
  ...
}
```

If you cannot find the Python source for `levenshteinB`, implement the standard bounded Levenshtein algorithm:
- Use a 2-row DP approach for memory efficiency
- Early terminate if minimum possible distance exceeds maxDistance
- When `caseInsensitive`, lowercase both strings before comparison

### Constraints
- Do NOT add npm dependencies — implement the algorithm directly
- Keep the function pure (no side effects, no I/O)

### Verification
- `npx tsc --noEmit` must pass
- Commit message: `feat: port bounded Levenshtein distance for evaluation matching`
