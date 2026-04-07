# Context Checkpoint and Rewind Pattern

## The idea (from voice notes)

After a planning phase converges, the context is full of research traces,
reviewer exchanges, and intermediate drafts. Most of this is noise for
the NEXT phase (decomposition). 

Pattern: erase the trace back to a checkpoint, insert only the final
artifact, proceed fresh.

## How it works

```
1. RESEARCH phase fills context with file reads, sub-agent results
2. PLANNING phase uses that context, converges on a plan
3. CHECKPOINT: save the final plan to a file
4. REWIND: erase the conversation back to before research started
5. INSERT: load only the final plan + any additional context the
   delta analysis identified
6. DECOMPOSITION phase starts with clean context + verified plan
```

## Why this matters

- Context budget is finite (~200K for GLM, ~1M for Opus)
- Research traces are input-heavy (file reads, 50K+ tokens)
- Once the plan is converged, the research evidence served its purpose
- Decomposition needs the PLAN, not the evidence trail

## The delta analysis step

Before erasing, compare:
- What files did the planner read? (from research phase)
- What files did the plan reviewer read? (from review phase)
- Delta = files the reviewer needed that weren't in the original research

This delta improves the research prompt for next time:
"In addition to the standard research, also check these file patterns."

## How we used it this session

- Switched to Haiku for mechanical fixes (small context cost)
- Planned to rewind the Haiku tool calls after review
- The Haiku work was disposable — only the result (fixed files) mattered
- This is a lighter version: model-switch instead of full trace erasure

## Practical implementation in Claude Code

- `/compact` command compresses earlier conversation
- Model switch (`/model haiku` → work → `/model opus`) naturally segments context
- For full rewind: start a new session, pass only the checkpoint file
- The handoff file pattern (TESTING_HANDOFF.md) is a checkpoint artifact

## NOT YET FORMALIZED

- No automated "erase and reinsert" mechanism exists
- Currently manual: human switches models, or starts new session with file
- Could be scripted: save checkpoint → start new `c -p` → load checkpoint
