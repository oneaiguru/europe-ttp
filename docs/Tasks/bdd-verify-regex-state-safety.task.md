# TASK-082: bdd-verify-regex-state-safety

## Goal
Ensure regex compilation in `verify-alignment.ts` is state-safe and does not leak state between iterations or cause ReDoS vulnerabilities.

## Feature File
N/A - This is a tooling/task infrastructure improvement

## Legacy Reference
N/A - This is a build tool improvement

## Context
The `scripts/bdd/verify-alignment.ts` file compiles regex patterns dynamically for step matching. Current concerns:

1. **State Safety**: The `compiledPatterns` Map is built outside the main loop but is used within ambiguity detection
2. **ReDoS Potential**: Dynamic regex building from user-controlled strings (registry keys) could cause catastrophic backtracking
3. **Caching Correctness**: The `getCompiledPattern()` function returns RegExp objects that may be cached incorrectly

## References
- `scripts/bdd/verify-alignment.ts:110-129` - `getCompiledPattern()` function
- `scripts/bdd/verify-alignment.ts:184-188` - Pattern caching loop
- `test/bdd/step-registry.ts` - Step registry with pattern sources

## Acceptance Criteria
- [ ] Regex compilation does not leak state between iterations
- [ ] No ReDoS vulnerabilities in dynamic pattern construction
- [ ] All cached patterns are correctly scoped and reused
- [ ] `bun run bdd:verify` passes with all checks
- [ ] Code is well-documented with safety considerations

## Files to Create/Modify
- [ ] `scripts/bdd/verify-alignment.ts` - Review and fix if needed
- [ ] `specs/features/test/regex_state_safety.feature` - Test fixture to verify behavior (optional)

## Test Commands
```bash
bun run bdd:verify
bun run typecheck scripts/bdd/verify-alignment.ts
```
