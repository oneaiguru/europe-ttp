# HumanLayer RPI Evolution — Reference Notes (March 2026 Talk)

Source: /Users/m/Desktop/humanlayer2026mar.md (Dex's talk transcript)

## Key evolution: RPI → 8-step pipeline

Old: Research → Plan → Implement (one mega-prompt, 85 instructions)
New: Questions → Research → Design → Structure → Plan → Work → Implement → PR

Each step is a separate context window with <40 instructions.

## Why the split happened

1. **Instruction budget**: frontier LLMs follow ~150-200 instructions consistently.
   Beyond that, adherence degrades. 85 instructions + CLAUDE.md + tools + MCP = over budget.

2. **Magic words problem**: 50%+ of users didn't say "work back and forth with me" 
   so the agent skipped the design discussion and wrote plans directly.
   Fix: make the interaction mandatory via code control flow, not prompt instructions.

3. **Plans ≠ code**: 1000-line plan → 1000 lines of code (±10%). But code diverges 
   from plan. So reviewing the plan is wasted effort — review the code instead.

## What maps to our approach

| Dex concept | Our equivalent | Difference |
|---|---|---|
| Questions (separate context, no opinions) | TZ interview | We make it human-facing, not code-facing |
| Research (objective facts only) | Context collection (Opus/Haiku) | Same principle |
| Design (where are we going, 200 lines) | Implementation plan (human-facing summary) | We split into human + agent versions |
| Structure (how do we get there) | Task decomposition | Same |
| Plan (detailed implementation) | Task reference files | We keep them small (one per task) |
| Work + Implement | dev-loop (GLM executes) | Same |
| Human reviews code | Automated loops (gap closure, code review) | Our key difference |

## Insights we should adopt

1. **Don't use prompts for control flow — use control flow for control flow.**
   Our scripts (dev-loop-commits.sh, test-loop.sh) are code control flow.
   The prompt only describes ONE step. The script decides what happens next.

2. **Instruction budget matters.** Keep task files under 40 focused instructions.
   Our task files are already small — validate this stays true.

3. **Separate context windows for research vs planning.**
   Research should be objective (no opinions). Planning uses research output.
   We do this: the decomposition agent reads files, Opus reviews without reading them.

## Insights we deliberately diverge from

1. **"Read the code"** — Dex says humans must read code. We say automated loops 
   catch what human review would catch, with less effort. Runtime testing (Playwright,
   emulator) catches what code review can't (the 6 bugs from this session).

2. **"No agent swarms"** — Dex is cautious about parallel agents. We run 5+ parallel 
   GLMs in the same worktree successfully. The key: disjoint file sets.

3. **Human stays in the loop throughout** — Dex's design doc is human-reviewed.
   Our TZ interview front-loads all human input. After that, dark factory.
