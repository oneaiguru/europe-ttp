# Review Pass — All Phase 1 Tasks

Each task was reviewed only once during implementation (VERDICT: PASS bug).
Run review-only passes with the improved script to catch real defects.

Script: `scripts/dev/dev-loop-commits.sh` (tree-based convergence + tightened review prompt)

All commands run from `/Users/m/ttp-split-experiment`.

---

## Before starting

Apply the BDD parity report patch (legitimate fix from GPT Pro audit):

```bash
git apply /Users/m/Downloads/0001-correct-bdd-parity-report-claims.patch
git add docs/migration-parity/PARITY_REPORT.md && git commit -m "fix: correct BDD parity report overclaims"
```

---

## Batch 1 — Independent tasks (5 terminals)

All write to different files. Safe to run in parallel.

**Terminal 1** — GCS utility:

```bash
REVIEW_ONLY=1 bash scripts/dev/dev-loop-commits.sh .agent/tasks/task-1-foundation.md 1
```

**Terminal 2** — Login endpoint:

```bash
REVIEW_ONLY=1 bash scripts/dev/dev-loop-commits.sh .agent/tasks/task-1-foundation.md 2
```

**Terminal 3** — Auth middleware:

```bash
REVIEW_ONLY=1 bash scripts/dev/dev-loop-commits.sh .agent/tasks/task-1-foundation.md 3
```

**Terminal 4** — Reporting status state machine:

```bash
REVIEW_ONLY=1 bash scripts/dev/dev-loop-commits.sh .agent/tasks/task-4-reporting-utils.md 1
```

**Terminal 5** — Levenshtein matching:

```bash
REVIEW_ONLY=1 bash scripts/dev/dev-loop-commits.sh .agent/tasks/task-4-reporting-utils.md 2
```

**Wait for all 5 to finish.**

---

## Batch 2 — TTCPortalUser + Admin config (2 terminals)

**Terminal 1:**

```bash
REVIEW_ONLY=1 bash scripts/dev/dev-loop-commits.sh .agent/tasks/task-2.1-ttc-portal-user.md 1
```

**Terminal 2:**

```bash
REVIEW_ONLY=1 bash scripts/dev/dev-loop-commits.sh .agent/tasks/task-3-admin-config.md 1
```

**Wait for both to finish.**

---

## Batch 3 — User routes + reporting (4 terminals)

**Terminal 1:**

```bash
REVIEW_ONLY=1 bash scripts/dev/dev-loop-commits.sh .agent/tasks/task-2-user-routes.md 1
```

**Terminal 2:**

```bash
REVIEW_ONLY=1 bash scripts/dev/dev-loop-commits.sh .agent/tasks/task-2-user-routes.md 2
```

**Terminal 3:**

```bash
REVIEW_ONLY=1 bash scripts/dev/dev-loop-commits.sh .agent/tasks/task-4.3-user-summary.md 1
```

**Terminal 4:**

```bash
REVIEW_ONLY=1 bash scripts/dev/dev-loop-commits.sh .agent/tasks/task-4.4-user-integrity.md 1
```

**Wait for all 4 to finish.**

---

## Batch 4 — Route wiring (2 terminals)

**Terminal 1:**

```bash
REVIEW_ONLY=1 bash scripts/dev/dev-loop-commits.sh .agent/tasks/task-4-route-wiring.md 1
```

**Terminal 2:**

```bash
REVIEW_ONLY=1 bash scripts/dev/dev-loop-commits.sh .agent/tasks/task-4-route-wiring.md 2
```

**Wait for both to finish.**

---

## Batch 5 — Admin wiring (3 terminals, then sequential)

### Parallel start:

**Terminal 1:**

```bash
REVIEW_ONLY=1 bash scripts/dev/dev-loop-commits.sh .agent/tasks/task-5-admin-wiring.md 1
```

**Terminal 2:**

```bash
REVIEW_ONLY=1 bash scripts/dev/dev-loop-commits.sh .agent/tasks/task-5-admin-wiring.md 4
```

**Terminal 3:**

```bash
REVIEW_ONLY=1 bash scripts/dev/dev-loop-commits.sh .agent/tasks/task-5-admin-wiring.md 5
```

### After Terminal 1 finishes:

```bash
REVIEW_ONLY=1 bash scripts/dev/dev-loop-commits.sh .agent/tasks/task-5-admin-wiring.md 2
```

### After 5.2 finishes:

```bash
REVIEW_ONLY=1 bash scripts/dev/dev-loop-commits.sh .agent/tasks/task-5-admin-wiring.md 3
```

---

## After all reviews

Check for any non-zero exits:

```bash
grep -r 'DID NOT CONVERGE\|FATAL' .git/dev-loop/logs/ 2>/dev/null
```

If any task exited 2 (non-convergence), check the review log and decide if escalation is needed.

Then run the data-shape validation (task 5.6) — this requires a running dev server:

```bash
bash scripts/dev/dev-loop-commits.sh .agent/tasks/task-5-admin-wiring.md 6
```

---

## About the GPT Pro task files in ~/Downloads/

**Do not use them.** They were generated against a stale code snapshot (ChatGPT sandbox, pre-implementation). Our 18 commits already address the gaps they describe. If the review pass above finds real issues, those will be caught by the existing task files.
