# Execution Guide — Remaining Tasks

All commands run from `/Users/m/ttp-split-experiment`.

---

## Status

| Group | Tasks | Status |
|-------|-------|--------|
| 1 | 1.1, 1.2, 1.3, 4.1, 4.2 | DONE |
| 2 | 2.1 (TTCPortalUser) | DONE |
| 4 | 3.1+3.2 (Admin config) | DONE |

---

## *Batch 2 — Run NOW (4 terminals)*

*Al*l dependencies met. All tasks write to different files. Run all 4 in parallel.

**Terminal 1** — wire form persistence in upload endpoint:

```bash
bash scripts/dev/dev-loop.sh .agent/tasks/task-2-user-routes.md 1
```

**Terminal 2** — create user data routes (get-form-data, get-form-instances, set-config, get-config):

```bash
bash scripts/dev/dev-loop.sh .agent/tasks/task-2-user-routes.md 2
```

**Terminal 3** — port user summary aggregation (~750 lines, evaluation matching):

```bash
bash scripts/dev/dev-loop.sh .agent/tasks/task-4.3-user-summary.md 1
```

**Terminal 4** — port user integrity matching (enrolled people + org course cross-checks):

```bash
bash scripts/dev/dev-loop.sh .agent/tasks/task-4.4-user-integrity.md 1
```

**Wait for all 4 to finish before proceeding.**

---

## *Batch 3 — After Batch 2 (2 terminals)*

Depends on 4.3 and 4.4 being committed. Both tasks write to different files.

**Terminal 1** — replace mock-data imports in 3 admin data API routes:

```bash
bash scripts/dev/dev-loop.sh .agent/tasks/task-4-route-wiring.md 1
```

**Terminal 2** — verify/create legacy parity route aliases:

```bash
bash scripts/dev/dev-loop.sh .agent/tasks/task-4-route-wiring.md 2
```

**Wait for both to finish before proceeding.**

---

## Batch 4 — After Batch 3 (3 terminals, then sequential)

### Parallel start (3 terminals):

**Terminal 1** — wire dynamic TTC list on admin pages (creates admin-helpers.ts):

```bash
bash scripts/dev/dev-loop.sh .agent/tasks/task-5-admin-wiring.md 1
```

**Terminal 2** — add auth + missing user-report routes (different files from Terminal 1):

```bash
bash scripts/dev/dev-loop.sh .agent/tasks/task-5-admin-wiring.md 4
```

**Terminal 3** — fix test fixture endpoint path (1-line fix, independent):

```bash
bash scripts/dev/dev-loop.sh .agent/tasks/task-5-admin-wiring.md 5
```

### *Sequential (after Terminal 1 finishes):*

**Terminal 1** — wire last-updated timestamps (adds to admin-helpers.ts, same route files as 5.1):

```bash
bash scripts/dev/dev-loop.sh .agent/tasks/task-5-admin-wiring.md 2
```

### Sequential (after 5.2 finishes):

**Terminal 1** — add page-specific auth to admin HTML page routes:

```bash
bash scripts/dev/dev-loop.sh .agent/tasks/task-5-admin-wiring.md 3
```

### Final (after ALL above finish):

**Terminal 1** — validate data shape compatibility (verification-only, no code):

```bash
bash scripts/dev/dev-loop.sh .agent/tasks/task-5-admin-wiring.md 6
```

---

## Summary

```
Batch 2:  T1(2-upload) T2(2-routes) T3(4.3-summary) T4(4.4-integrity)  ← 4 parallel
          ↓ wait all
Batch 3:  T1(wire-reporting) T2(parity-aliases)                         ← 2 parallel
          ↓ wait all
Batch 4:  T1(5.1-ttc-list) T2(5.4-user-report) T3(5.5-fixture)        ← 3 parallel
          ↓ wait T1
          T1(5.2-timestamps)                                            ← sequential
          ↓ wait T1
          T1(5.3-admin-auth)                                            ← sequential
          ↓ wait all
          T1(5.6-data-validation)                                       ← final check
```

Total: 13 tasks across 3 batches. Maximum 4 terminals at once.

---

## If GLM Fails on 4.3 (user-summary)

The user-summary port is the most complex task. If GLM produces a typecheck failure or wrong logic after 3 review rounds (exit code 2), escalate to Codex 5.3:

```bash
cat .agent/tasks/task-4.3-user-summary.md | codex exec --dangerously-bypass-approvals-and-sandbox --model gpt-5.3-codex -
```

Then run a manual review:

```bash
echo "Read .agent/tasks/task-4.3-user-summary.md. Check if fully implemented and bug-free. Read app/utils/reporting/user-summary.ts. If bugs or gaps: fix, run npx tsc --noEmit, commit. If correct: reply VERDICT: PASS" | claude -p --dangerously-skip-permissions --no-session-persistence --settings ~/.claude/settings.glm.json
```
