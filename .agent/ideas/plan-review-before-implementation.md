# Plan Review Before Implementation

## The idea (from voice notes + GPT trajectory analysis)

Before implementing anything, review the PLAN against the spec/TZ.
This catches architectural mistakes when they cost ~3K tokens (edit the plan)
instead of ~200K tokens (rewrite the code).

## The cycle

```
1. Write plan (Opus, full context from research)
2. Dispatch plan reviewer (different model or fresh context)
   - Reviewer reads plan + spec, lists gaps/ambiguities/wrong choices
   - Reviewer grades each finding P0-P3
3. Author fixes the plan based on findings
4. Re-review until reviewer says "no issues"
5. THEN proceed to decomposition and implementation
```

## Key design choices (from voice notes)

- The AUTHOR fixes the plan, not the reviewer. The author has full context
  of WHY they made each choice. The reviewer only sees the output.
- The reviewer can read MORE files than the author did. This is intentional —
  the reviewer might discover the author missed relevant code.
- If the reviewer reads files the author didn't → that's a DELTA.
  The delta feeds back into the research prompt: "next time, also read these."

## When to use

- Feature has 3+ tasks
- Spec/TZ exists as the truth document
- Task definitions involve judgment (not mechanical)

## When to skip

- Mechanical tasks (migrations, style conversions where the plan is trivial)
- Single-task features
- Plan was already human-reviewed (our TTP case — the golden-forging-marble plan
  was cross-checked by multiple models before we used it)

## Relationship to other patterns

- This is step 0 BEFORE the dev-loop
- The dev-loop (implement → review → converge) handles per-task quality
- Plan review handles per-feature architectural quality
- Different granularity, different purpose

## Evidence from GPT trajectory (Session 52)

The GPT orchestrator's plan review found 5 P1/P2 issues BEFORE any code was written.
Each fix was ~3K tokens (edit the plan markdown). Without plan review, these would
have surfaced during implementation as ~200K token rework cycles.
