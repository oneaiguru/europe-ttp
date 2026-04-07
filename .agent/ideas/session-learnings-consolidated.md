# Session Learnings — April 7, 2026

## What we built

1. **dev-loop-commits.sh** — tree-based convergence script replacing VERDICT: PASS
2. **GCS emulator infrastructure** — docker-compose with fake-gcs-server sidecar
3. **18 implementation tasks** — all committed, reviewed, gap-closed
4. **6 deep test task files** — B00-B08 parity scenarios
5. **3 dev-loop reference files** — gap-closure, tree-convergence, infrastructure-patterns

## Runtime bugs found during testing (NOT caught by code review)

| Bug | Where | Root cause | Fix |
|-----|-------|-----------|-----|
| Login 500 | auth/login | SESSION_HMAC_SECRET not set | Added to .env.local + docker-compose |
| readJson 404 | gcs.ts | ESM uses XML API, emulator only supports JSON API | REST API fallback for emulator |
| listFiles 404 | gcs.ts | Same ESM/XML issue for all read ops | REST API fallback for all reads |
| KEYRESET undefined | user-summary.ts | [KEY] sub-object doesn't exist on raw data | Guard with `if (!x[KEY]) x[KEY] = {}` |
| Non-object in loop | user-summary.ts | Iterating over properties includes strings | Skip non-object entries |
| TTCPortalUser 404 | ttc-portal-user.ts | Error message pattern not matched in catch | Added emulator error pattern |

**Key insight:** All 6 bugs were invisible to code review (tsc clean, code logic correct).
They only surfaced at runtime with real data flowing through the GCS emulator.
This validates the voice notes principle: "I never trust any code audit. Only running
actual code and looking at the actual app is what I trust."

## Patterns that worked

1. **Fix-while-testing cycle**: GLM finds error → I read server log → fix 2-5 lines → 
   restart → GLM retries. ~15 min per cycle. No task files needed for these fixes.

2. **Parallel test execution**: 5 GLM agents testing different areas simultaneously. 
   Same worktree, disjoint concerns, no conflicts.

3. **Haiku for mechanical fixes**: Model switch to Haiku for whitelist merge, env var 
   unification, dead file deletion. Rewind context after.

4. **Opus stays on orchestration**: Never read source code myself. Fixed bugs by reading
   error messages + knowing the pattern (guard undefined, add fallback). Delegated all
   file exploration to sub-agents.

## What didn't work

1. **Hot reload for deeply nested imports**: Turbopack cached stale compiled routes.
   Required full server restart for changes to take effect.

2. **VERDICT: PASS self-reporting**: Original dev-loop.sh bug. Agent says PASS regardless.
   Fixed with tree-based convergence.

3. **Retroactive reviews**: Wrong approach — reviewing old tasks after later tasks 
   modified the same files would cause conflicts. Skipped in favor of gap closure.

4. **GPT Pro task files from sandbox**: Generated against pre-implementation code state.
   Described gaps that were already fixed. Wasted effort to evaluate.
