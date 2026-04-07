# Handoff: <slug> — <from_phase> to <to_phase>

## Metadata
- **Task**: <slug>
- **From**: <phase or session>
- **To**: <phase or session>
- **Timestamp**: <ISO-8601>
- **Branch**: <git branch>
- **HEAD**: <commit hash>

## Verified State

What has been CONFIRMED (not assumed) via test, query, build, or direct observation:

- [ ] <verification performed> — result: <outcome>

## Unverified Assumptions

What the prior phase ASSUMED but did not confirm:

- <assumption> — risk if false: <consequence>

## Artifacts Produced

| artifact | path | token_estimate | status |
|----------|------|---------------|--------|
| research | docs/Tasks/<slug>.research.md | ~<N> | complete / partial |
| plan | docs/Tasks/<slug>.plan.md | ~<N> | complete / partial |
| feedback | docs/Tasks/<slug>.<x>-feedback.md | ~<N> | if exists |

## Context Budget

- Tokens consumed this session: ~<N>
- Tokens available for next phase: ~<N> (target: 40% of 168k = 67k)

## Next Phase Preconditions

Before starting the next phase, verify:

- [ ] <precondition checkable via command or file read>

## Open Questions

Decisions the next phase needs to make:

- <question> — options: <A or B> — impact: <what changes>

## Continuation Prompt

<2-5 sentence summary sufficient to orient a fresh agent without re-reading conversation history. Include: what was being worked on, where it left off, what the immediate next step is. Maximum 5 sentences.>
# Handoff: <slug> -- <from_phase> to <to_phase>

## Metadata
- **Task**: docs/Tasks/<slug>.task.md
- **From**: <from_phase>
- **To**: <to_phase>
- **Timestamp**: <ISO-8601>
- **Branch**: <branch-name>
- **HEAD**: <short SHA>

## Verified State

What was CONFIRMED via test, query, or build. Only check items that were actually verified — do not check assumptions.

- [ ] `<verification>` — source: `<command or file path>`

## Unverified Assumptions

What was ASSUMED but not confirmed. Each item must include the risk if the assumption is wrong.

- **<assumption>** — risk: <what breaks if this is wrong>

## Artifacts Produced

| Artifact | Path | Token Estimate | Status |
|----------|------|---------------|--------|
| <name> | <path> | ~<N> tokens | draft / final / partial |

## Context Budget

- Tokens consumed this phase: ~<N>
- Tokens available for next phase: ~<N> (target <40% of 168k = ~67,200)
- Budget zone: green (0-30%) / yellow (30-40%) / orange (40-65%) / red (65%+)
- Compaction recommended: yes / no

## Next Phase Preconditions

Checkbox items that MUST be true before the next phase can begin. Uncheck any that are not yet met.

- [ ] <precondition checkable via command or file read>

## Continuation Prompt

<2-5 sentence summary a fresh agent can read to resume work without any prior context. Must include: what was being done, where it stopped, and what the immediate next action is. Do not include background or history — only the actionable present state.>
