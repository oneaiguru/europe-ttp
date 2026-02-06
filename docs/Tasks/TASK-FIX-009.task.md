# TASK-FIX-009: BDD Runner Signal Exit

## Task Definition

**Task ID:** TASK-FIX-009
**Slug:** bdd-runner-signal-exit
**Priority:** p2
**Type:** Fix/Hardening

## Goal
Ensure BDD runners return non-zero when the child is terminated by signal.

## Context
The BDD test runners (`scripts/bdd/run-python.ts` and `scripts/bdd/run-typescript.ts`) spawn child processes to run behave and cucumber. If the child process is terminated by a signal (e.g., SIGTERM, SIGINT), the exit code is `null` but the runner currently exits with 0. This masks failure conditions and can cause CI/CD pipelines to incorrectly report success.

## Acceptance Criteria
1. `run-python.ts` exits non-zero when Python child exits with `code=null` (signal termination).
2. `run-typescript.ts` exits non-zero when Cucumber child exits with `code=null` (signal termination).
3. Add a small unit test or doc note to prevent regression.

## Evidence Locations
- `scripts/bdd/run-python.ts:77-84` - Current Python runner exit handling
- `scripts/bdd/run-typescript.ts:70-75` - Current TypeScript runner exit handling

## Feature File
N/A - This is an infrastructural fix for test tooling

## Status
- **Task Definition:** Complete
- **Research:** In Progress
- **Plan:** Pending
- **Implementation:** Pending
