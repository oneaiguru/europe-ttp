# Composable Migration Service — Draft

## The idea (from voice notes + this session)

Legacy app migration is a composable service with independent stages:

```
Stage 1: BDD specs from legacy code
  → Feature files + step definitions that describe WHAT the legacy does
  → Output: machine-verifiable acceptance criteria

Stage 2: Backend port
  → Port business logic to new stack (Python → TypeScript in TTP case)
  → Dev-loop executes from task reference files
  → Gap closure verifies against specs
  → Output: working backend, all BDD steps green

Stage 3: Frontend port
  → Port UI to new stack (HTML strings → Tailwind/shadcn in TTP case)
  → Same dev-loop, visual verification via Playwright
  → Output: working UI connected to backend

Stage 4: Polishing / UAT
  → Runtime testing with emulator/real infra
  → AI agents run E2E scenarios from parity plan
  → Human tester (Alexei) runs final acceptance
  → Output: client-ready repo
```

## Why composable

Each stage is independently valuable:
- Client needs just backend? Stop after Stage 2.
- Client needs just frontend restyling? Skip Stage 2, do Stage 3.
- Client has a working prototype with bugs? Stages 2-4 = "prototype to production."

## What we proved in TTP

- Stage 2: 18 tasks, 5 parallel, GLM-executed, Opus-planned. ~1 day.
- Stage 4: GCS emulator + Playwright smoke test. ~3 hours including debugging.
- Stage 1 was pre-existing (61 BDD feature files).
- Stage 3 was done in prior sessions (Tailwind conversion).

## What the migration service looks like as a product

Input: legacy repo + brief human TZ ("migrate this Python app to TypeScript")
Output: working repo with tests passing + test plan for human verification

The automation chain: TZ interview → code audit → implementation plan → 
dev-loop execution → gap closure → runtime testing → human UAT handoff.

Each step is a skill. Each skill has a self-improving prompt.

## NOT YET CLEAR (need discussion)
- Pricing model (per-stage? per-file? fixed?)
- How to estimate effort before starting (quick audit → scope estimate)
- Whether Stage 1 (BDD extraction) can be fully automated from legacy code
