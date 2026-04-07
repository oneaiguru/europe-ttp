# Agent Career Ladder — Model Escalation Thresholds

## The idea (from voice notes)

Models have a "career ladder" analogous to human roles:
- **Moderator** (GLM) — fast, cheap, handles routine tasks
- **Expert** (Opus) — judgment calls, complex reasoning, escalations  
- **Architect** (Human) — sets direction, reviews escalations only

## Promotion criteria

A model "promotes" from moderator to expert role for a task when:
- It fails the same task type twice (not "struggled" — genuinely wrong output)
- The error requires cross-file reasoning that the cheaper model can't do
- The decision has architectural implications beyond the current task

A model "promotes" from expert to architect role when:
- Automated loops don't converge after max rounds
- The fix requires understanding business intent, not just code behavior
- Multiple experts disagree (different models produce conflicting fixes)

## Demotion criteria

Expert work can be "demoted" back to moderator when:
- The fix pattern becomes deterministic (appears in error pattern library)
- A skill/prompt improvement eliminates the class of error
- The task is proven reproducible by the cheaper model

## How this maps to our system

| Role | Model | When | Evidence |
|---|---|---|---|
| Moderator | GLM | Deterministic tasks, implementation from task files | 18/18 tasks succeeded in dev-loop |
| Expert | Opus | Planning, gap closure, architectural decisions | Plan writing, parity audit |
| Expert | GPT 5.4 | Cross-file reasoning, merge conflicts | Per opus-workflow |
| Architect | Human | TZ interview, escalation review | This session: only did TZ + monitored |

## The scaling model (from voice notes)

```
Start:     100 moderators, 10 experts, 1 architect
Scale to:  100 moderators, 100 experts, 10 architects
```

In agent terms:
- 100 GLM agents running dev-loop tasks in parallel
- 10 Opus agents handling escalations and plan reviews
- 1 human setting direction via TZ interviews

## KPIs per role

- **Moderator KPI**: SLA (speed of task completion), convergence rate
- **Expert KPI**: LTV of the work stream (quality of output over time)
- **Architect KPI**: none directly — business outcome is the measure

## Competitive dispatch (from voice notes)

Multiple moderators can compete for the same task:
- First to complete with correct output wins
- Others' work is discarded
- This ensures SLA but increases cost — only when speed is critical

In practice: run 2 GLM agents on the same task with different prompts.
Take the one that converges faster. The delta between them feeds the
prompt improvement registry.

## NOT YET IMPLEMENTED

- No automated escalation threshold (currently manual judgment)
- No tracking of per-model success rates by task type
- No competitive dispatch infrastructure
- The career ladder concept is valid but needs data to set thresholds
