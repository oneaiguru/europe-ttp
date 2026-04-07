# Moltwork Platform — How TTP Fits in the Larger System

## The platform

Moltwork is an AI-first freelancing operation on Russian marketplaces (kwork.ru, fl.ru, etc.).

**The flow:**
1. AI agents crawl marketplaces, find viable projects, generate bids
2. Human moderators review bid drafts via Telegram bot (approve/reject/escalate)
3. If bid wins → human expert does Zoom call with client (the ONLY human-client touchpoint)
4. AI implements the project (dev-loop, gap closure, testing — what we did today)
5. Human moderator reviews delivery artifacts
6. Client receives the work

**Three roles, three actions:**
- **Moderator (operator)**: reviews AI drafts. Approve / Reject with feedback / Escalate
- **Expert**: handles escalations (scope disputes, technical decisions, relationship risks)
- **Architect (owner)**: sets direction, manages subscriptions, reviews system health

## How TTP is an instance of this

TTP (Europe TTP migration) is a **Phase A revenue project** that came through the freelancing pipeline:
- Client needs Python→TypeScript migration
- AI bid was approved, expert did the discovery call
- AI implemented everything (18 tasks via dev-loop)
- AI ran parity testing (emulator + Playwright)
- Human (Alexei) does final acceptance test
- Client receives the repo

## The self-improvement loop in Moltwork context

Every moderator action is a training signal:

| Action | What it means | Registry entry |
|---|---|---|
| Approve | AI draft was correct | No change needed |
| Reject "too confident about deadline" | Drafting prompt too aggressive | +1 to "deadline confidence" pattern |
| Reject "missed client's budget concern" | Context parsing incomplete | +1 to "budget sensitivity" pattern |
| Escalate "scope dispute" | Beyond AI capability | Track for future skill development |

When a pattern reaches 2+ rejects → update the drafting prompt.
This is the waste-less self-improvement: data from NORMAL work, no extra eval runs.

## How the dev-loop maps to Moltwork

The dev-loop (implement → review → converge) IS the project delivery step:
- GLM implements from task files = AI writes the code
- GLM reviews for defects = AI self-checks
- Tree-based convergence = objective quality gate
- Gap closure = verify nothing was missed
- Runtime testing = prove it works

The moderator role for code delivery is lighter — they review the test results
and screenshots, not the code itself. The expert role is only triggered on
escalation (convergence failure after 3 rounds).

## The scaling model

```
Current:  1 architect, 1-2 experts, 2-3 moderators, unlimited GLM agents
Target:   1 architect, 10 experts, 100 moderators, unlimited GLM agents
```

Each expert manages a portfolio of client relationships.
Each moderator handles a queue of AI drafts across multiple projects.
GLM agents are the workforce — rate-limited but free.

## What's built and working (from handbooks)

- Telegram bot for moderator workflow (cards with drafts, approve/reject/escalate buttons)
- Automated card assignment (round-robin, capacity-aware)
- SLA tracking (30-min default, auto-reassignment on timeout)
- Auto-escalation after 3 reject cycles
- Moderator commands: /start, /pause, /resume, /mystats, /queue
- Expert escalation queue with categorization (technical/relationship/scope/other)
- Shift handoff protocol
- Operator and Expert handbooks (in Russian, production-ready)

## NOT YET BUILT

- Automated bid generation from marketplace crawling
- Project delivery workflow (dev-loop integrated with Moltwork pipeline)
- Skill library sync (Dolt-based, forkable)
- Things Bridge (ambient phone widget for architect oversight)
- Say.camp viral loop for acquisition
