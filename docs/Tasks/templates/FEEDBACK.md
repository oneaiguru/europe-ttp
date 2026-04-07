# Feedback: <slug>

## Metadata
- **Phase reviewed**: R / P / I
- **Artifact**: <slug>.<phase>.md
- **Reviewer**: human / automated
- **Verdict**: APPROVE / REVISE / BOUNCE / ESCALATE
- **Cycle**: <N> of 2 max

## Feedback Items

### Item 1
- **Line(s)**: <artifact>:<line-range>
- **Issue**: <what's wrong>
- **Expected**: <what should be there instead>
- **Severity**: blocking / suggestion

## Routing

Based on verdict:
- **APPROVE** -> proceed to next phase
- **REVISE** -> re-run current phase with this feedback prepended
- **BOUNCE** -> re-run prior phase (e.g., P feedback bounces to R)
- **ESCALATE** -> human takes over (after 2 cycles or if blocking)

## Context for Revision

<Free-form guidance for the agent on what to focus on in revision>
