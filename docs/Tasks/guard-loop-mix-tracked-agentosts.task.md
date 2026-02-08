# TASK-098: guard-loop-mix-tracked-agentosts

## Goal
Add graceful error handling to `loop_mix_tracked.sh` when the `apps/agentosts` tracker is not available.

## Feature File
N/A (infrastructure/script task)

## Legacy Reference
N/A (new infrastructure)

## Step Definitions Required
N/A (not a BDD task)

## Acceptance Criteria
- [ ] Script exits cleanly with informative error when `apps/agentosts` directory doesn't exist
- [ ] Script exits cleanly when `pnpm --dir apps/agentosts` fails (pnpm not available or project not set up)
- [ ] Script can optionally run without tracking (fallback to untracked mode) or exit with clear error
- [ ] `bun run bdd:verify` passes (if applicable)
- [ ] `bun run typecheck` passes (if applicable)

## Files to Create/Modify
- [ ] `scripts/loop_mix_tracked.sh` - Add guard clauses for agentosts availability

## Test Commands
```bash
# Test that script fails gracefully when agentosts missing
rm -rf apps/agentosts 2>/dev/null || true
./scripts/loop_mix_tracked.sh plan 1 2>&1 | head -20

# Test with directory present but pnpm unavailable (if applicable)
```

## Notes
The script currently references `apps/agentosts` which may not exist in all environments.
Consider adding a `--skip-tracking` flag or automatic fallback to `loop_mix.sh` when tracking unavailable.
