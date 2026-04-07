# Plan: <slug>

## Metadata
- Task: docs/Tasks/<slug>.task.md
- Research: docs/Tasks/<slug>.research.md
- ADR: docs/ADR.md
- Related docs: <paths>

## Desired End State
- <behavior + verification>

## Key Discoveries
- <slug>.research.md:<line-range> — <insight> (REQUIRED: each discovery must cite research.md with line ranges)

## What We're NOT Doing
- <scope exclusions>

## Implementation Approach
- <strategy>

## Source Citations

Every change in this plan must trace to research evidence.

| change | evidence | research_line |
|--------|----------|---------------|
| <what changes> | <why, from research> | research.md:<L-L> |

## Phase 1
### Overview
### Changes Required

#### Step 1.1: <description>
**File**: `<path>`
**Evidence**: research.md:<line-range> — <what the research found>
**Change**:
```<lang>
// exact code — not pseudocode, not hints
#### Step 1.1: <description>
**File**: `<path>`
**Evidence**: research.md:<line-range> — <what research found>
**Change**:
```
<exact code or commands>
```
**Verify**: `<command>` -> expected: `<output>`
**Failure**: If <condition>, this step is wrong because <reason>

## Validation Matrix

## Source Citations
| change | evidence | research_line |
|--------|----------|---------------|
| <what changes> | <why> | research.md:<L-L> |

## Validation Matrix
| step | verify_command | expected_output | failure_means |
|------|---------------|-----------------|---------------|
| 1.1 | `<cmd>` | `<output>` | <what's wrong> |

## Drift Guards

If ANY of these are false, this plan is INVALID. Do not proceed to I-role.
Re-run P-role or bounce to R-role.

If ANY of these are false, this plan is INVALID.
- [ ] <assertion checkable against current code>

## Guardrails (from docs/guardrails.md)
- Which guardrails apply to this task and how the implementation addresses them

## Context Budget
- Research artifact: ~<N> tokens
- This plan: ~<N> tokens
- Context pack: ~<N> tokens
- Estimated I-role working context: ~<N> tokens
- Target: total < 40% of 168k = 67k tokens

## Tests & Validation
- <commands + expected outputs>

## Context Budget

- Research artifact: ~<N> tokens
- This plan: ~<N> tokens
- Context pack: ~<N> tokens
- Estimated I-role working context: ~<N> tokens
- Target: total < 40% of 168k = 67k tokens

## Rollback

If implementation fails or produces unexpected results:
```bash
<commands>
```
Or inverse changes:
- <file>: revert <specific change>

**Git revert strategy**: If any step fails after partial completion:
  1. `git stash` uncommitted changes
  2. `git log --oneline -5` to identify the last known-good commit
  3. `git revert <commit-sha>` or `git reset --soft <commit-sha>` depending on whether changes are pushed
  4. Verify rollback with: `<verify_command>` -> expected: `<output>`
If implementation fails or produces unexpected results:
```bash
git revert <strategy>
```
Or inverse changes:
- <file>: revert <specific change>

## Handoff
- No post-plan actions required.
