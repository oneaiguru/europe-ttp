# Task: <slug>

## Source
- IMPLEMENTATION_PLAN.md: TASK-XXX
- Related PRD: (section reference)

## Goal
One sentence: what changes and why.

## Acceptance Criteria (BDD-Inspired)

### External State Verification (≥1 required)
**Scenario:** <descriptive name>
**Given:** Initial state (specify DB records, API state, filesystem)
**When:** Action via real interface (CLI command, HTTP request, bot command, file operation)
**Then:** Verify external state changed (SQL query result, API response, file content)
**Test command:** `bun run test -- -t "scenario name"`
**Anti-gaming:** This test MUST query real SQLite/call real API/check real file. No mocks for the "Then" step.

### Mutation-Aware Test
**Critical line:** `path/to/file.ts:123` (describe what line does)
**Test must fail if:** This line is removed or commented out
**Why:** (explain what breaks in real behavior, not just test failure)

### Fail-Open Verification (if applicable)
**Dependency to kill:** (e.g., FAQ_EMBEDDING_API_URL, INFERENCE_API_URL)
**Expected fallback:** (e.g., message reaches organizer topic)
**Test:** Set dependency to invalid value → verify fallback fires → verify user not blocked

## Required Reading
- file.ts:123-145 (current implementation)
- specs/<area>.md (relevant section, if applicable)
- API reference / vendor docs (relevant section, if applicable)

## Constraints
- Type file changes must be traceable to PRD/schema requirements; document before/after in plan.
- Maintain fail-open design for all external dependencies.
- Keep core domain logic framework-agnostic when the project has an adapter boundary.

## Success Criteria
- [ ] All acceptance scenarios pass
- [ ] bun run typecheck passes
- [ ] External state verification confirmed (not mocked)
- [ ] Mutation test: removing critical line fails test
- [ ] Fail-open test: killing dependency triggers correct fallback
