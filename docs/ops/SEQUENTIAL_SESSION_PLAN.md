# Sequential Weaver Runs Plan (Single Session Branch)

## Objective
Run long sequences of tasks so each task sees previous changes without any merges during the run.

Target behavior:
- All runs use the same `orchestrator_session_id`.
- All commits accumulate linearly on `session/<id>`.
- Coordinator enforces one active task per session id, so queueing must be serial.

## Constraints (From Specs)
- Entrypoint always checks out `session/<orchestrator_session_id>` and pushes it.
- Coordinator enforces one active task per `orchestrator_session_id`.
- Each run is one role (T, R, P, or I) and always commits at run end.

## Required Code Changes

1. Update queue payload to support fixed session id
File: `scripts/ops/queue-from-graph.sh`

Changes:
- Add `ORCHESTRATOR_SESSION_ID` env var.
- If set, include `orchestrator_session_id` in the JSON payload.
- Warn if empty when running in sequential mode.
- Add to usage help.

2. Add a serial queue runner
File: `scripts/ops/queue-sequential.sh` (new)

Behavior:
- Read tasks from `tasks/task_graph.json` in order (same logic as queue-from-graph).
- For each task:
  - POST `/tasks` with the same `orchestrator_session_id`.
  - Poll `/tasks/:id/status` until status is `completed` or `failed`.
  - Only then queue the next task.

Inputs:
- `ORCHESTRATOR_SESSION_ID` (required)
- `COORDINATOR_URL` (default `http://192.168.1.80:8787`)
- `MODEL` (default `gpt-5.2-codex`)
- `PROVIDER` (default `codex` or `claude`)
- `PROMPT_PATH` (default `PROMPT_build.md`)
- `POLL_INTERVAL` seconds (default 5)

3. Add a persistent session id file (optional but recommended)
File: `.weaver/session_id` (new, ignored)

Behavior:
- `queue-sequential.sh` uses `ORCHESTRATOR_SESSION_ID` if set.
- Otherwise read `.weaver/session_id`.
- Add `.weaver/` to `.gitignore`.

4. Document the new workflow
Files:
- `HANDOFF.md` or `docs/SESSION_HANDOFF.md`

Content:
- One session id per project.
- Use `queue-sequential.sh` to enforce serial queueing.
- Example commands to set session id and run the worker.

## Validation Steps

1. Queue two tasks in sequence with the same session id.
2. Confirm both commits land on the same branch:
   - `git log --oneline --decorate session/<id>`
3. Confirm second task saw changes from the first (via diff or step-registry updates).
4. Verify run artifacts are under the same session id:
   - `~/aa-output/europe-ttp/runs/<session-id>/...`

## Rollback Plan
- Use `queue-from-graph.sh` without a session id to return to isolated per-task branches.
- Or set a new session id to start a fresh linear stream.
