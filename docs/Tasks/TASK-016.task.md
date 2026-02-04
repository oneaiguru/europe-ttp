# TASK-016: Post-TTC Self Evaluation

## Task ID
TASK-016

## Feature File
`specs/features/forms/post_ttc_self_eval.feature`

## Scenario
**Scenario: Open post-TTC self evaluation**
```gherkin
Given I am authenticated as a TTC graduate
When I open the post-TTC self evaluation form
Then I should see the post-TTC self evaluation questions
```

## Steps Needing Implementation

### Step 1: Given I am authenticated as a TTC graduate
- **Status**: In registry, no Python implementation
- **Step Registry Entry**: Line 20 in `test/bdd/step-registry.ts`
- **Expected behavior**: Authenticate a user who is a TTC graduate (has completed TTC)

### Step 2: When I open the post-TTC self evaluation form
- **Status**: In registry, no Python implementation
- **Step Registry Entry**: Line 164 in `test/bdd/step-registry.ts`
- **Expected behavior**: Navigate to and render the post-TTC self evaluation form

### Step 3: Then I should see the post-TTC self evaluation questions
- **Status**: In registry, no Python implementation
- **Step Registry Entry**: Line 470 in `test/bdd/step-registry.ts`
- **Expected behavior**: Verify the form displays the self evaluation questions

## Acceptance Criteria
- [ ] All three steps have Python implementation in `test/python/steps/`
- [ ] All three steps have TypeScript implementation in `test/typescript/steps/`
- [ ] Scenario passes in Python BDD tests
- [ ] Scenario passes in TypeScript BDD tests
- [ ] Step registry updated with implementation paths

## Priority
p2 (Important - completes a feature area)

## Notes
- This is a basic "I open X → I see Y" scenario
- Part of Phase 1: Foundation - Basic Feature Implementation
- Similar to other form opening scenarios (TASK-011, TASK-013)
