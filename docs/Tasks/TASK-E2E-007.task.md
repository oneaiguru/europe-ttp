# TASK-E2E-007: Draft Save and Resume

## Task Information
- **Task ID**: TASK-E2E-007
- **Name**: Draft Save and Resume
- **Priority**: p2
- **Feature File**: `specs/features/e2e/draft_save_and_resume.feature`
- **Maps to**: PRD Appendix A, A2 - Applicant saves draft + resumes later

## Scenario Summary

### Scenario 1: Save partial application and resume after logout
**Given**: I am authenticated as a TTC applicant
**When**: I fill in the TTC application form partially with:
  - field: i_fname, value: John
  - field: i_lname, value: Doe
  - field: i_email, value: john.doe@example.com
**And**: I save the application as draft
**And**: I sign out of the TTC portal
**And**: I sign in with a valid Google account
**When**: I open the TTC application form
**Then**: I should see my draft data persisted
**When**: I complete the remaining required fields and submit
**Then**: the application should be marked as submitted

### Scenario 2: Multiple drafts for different forms
**Given**: I am authenticated as a TTC applicant
**When**: I save a partial TTC application as draft
**And**: I save a partial evaluator profile as draft
**And**: I navigate to the TTC application form
**Then**: I should see the TTC application draft data
**When**: I navigate to the evaluator profile form
**Then**: I should see the evaluator profile draft data

## Acceptance Criteria
- [ ] Feature file `specs/features/e2e/draft_save_and_resume.feature` created
- [ ] All steps defined in step registry
- [ ] Python step definitions implemented and passing
- [ ] TypeScript step definitions implemented and passing
- [ ] `verify-alignment.ts` passes (0 orphan, 0 dead)
- [ ] `typecheck` passes
- [ ] `lint` passes

## Notes
- This task requires implementing draft save/submit endpoints
- Must handle multiple draft instances per user
- Draft data must persist across sessions
- Final submission must transition draft to submitted state
