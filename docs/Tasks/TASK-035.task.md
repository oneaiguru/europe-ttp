# TASK-035: Certificate PDF Generation

## Task ID
TASK-035

## Feature File
`specs/features/reports/certificate.feature`

## Scenario
**Scenario: Generate certificate PDF**

```
Scenario: Generate certificate PDF
  Given I am authenticated on the TTC portal
  When I request a certificate PDF
  Then a certificate PDF should be generated
```

## Steps Needing Implementation

### Python Steps (Undefined)
1. **When** `I request a certificate PDF`
   - File: `test/python/steps/reports_steps.py`
   - Line: 1 (currently placeholder)
   - Status: Undefined - needs implementation

2. **Then** `a certificate PDF should be generated`
   - File: `test/python/steps/reports_steps.py`
   - Line: 1 (currently placeholder)
   - Status: Undefined - needs implementation

### TypeScript Steps (Undefined)
1. **When** `I request a certificate PDF`
   - File: `test/typescript/steps/reports_steps.ts`
   - Line: 1 (currently placeholder)
   - Status: Undefined - needs implementation

2. **Then** `a certificate PDF should be generated`
   - File: `test/typescript/steps/reports_steps.ts`
   - Line: 1 (currently placeholder)
   - Status: Undefined - needs implementation

## Current Step Registry Status
```typescript
'I request a certificate PDF': {
  pattern: /^I\ request\ a\ certificate\ PDF$/,
  python: 'test/python/steps/reports_steps.py:1',  // Placeholder
  typescript: 'test/typescript/steps/reports_steps.ts:1',  // Placeholder
  features: ['specs/features/reports/certificate.feature:9'],
},
'a certificate PDF should be generated': {
  pattern: /^a\ certificate\ PDF\ should\ be\ generated$/,
  python: 'test/python/steps/reports_steps.py:1',  // Placeholder
  typescript: 'test/typescript/steps/reports_steps.ts:1',  // Placeholder
  features: ['specs/features/reports/certificate.feature:10'],
},
```

## Acceptance Criteria
- [ ] Python step `I request a certificate PDF` is implemented and passes
- [ ] Python step `a certificate PDF should be generated` is implemented and passes
- [ ] TypeScript step `I request a certificate PDF` is implemented and passes
- [ ] TypeScript step `a certificate PDF should be generated` is implemented and passes
- [ ] Scenario `Generate certificate PDF` passes in Python BDD
- [ ] Scenario `Generate certificate PDF` passes in TypeScript BDD
- [ ] Step registry updated with correct line numbers
- [ ] No orphan steps or dead steps (verify-alignment.ts passes)

## Related Tasks
- TASK-E2E-010: Certificate Gating (A6) - More comprehensive certificate scenarios with prerequisite checking

## Priority
p3 (Nice to have - can defer)

## Notes
- This is a basic certificate generation scenario
- The more complex certificate gating scenarios (with prerequisite checking) are in TASK-E2E-010
- Both Python and TypeScript implementations are needed
