# TASK-098: guard-loop-mix-tracked-agentosts - Plan

## Implementation Strategy

### Approach: Early Detection with Clear Error + Fallback Option

Add upfront availability checks for agentosts tracker, with helpful error messages directing users to `loop_mix.sh` for untracked execution.

### Implementation Steps

1. **Add availability check function** (after line 16, before MODE determination)
   - Check if `apps/agentosts` directory exists
   - Check if `pnpm` command is available
   - Check if `pnpm run tracker` works in agentosts directory
   - Return 0 if all checks pass, 1 if tracking unavailable

2. **Add `--skip-tracking` flag handling** (before MODE determination)
   - Parse `--skip-tracking` or `--untracked` flag
   - If flag present, exec `loop_mix.sh` directly with remaining args
   - Skip all tracking setup

3. **Call availability check at script start** (after configuration, before any tracking)
   - If tracking unavailable:
     - Print informative error explaining what's missing
     - Suggest using `loop_mix.sh` or `--skip-tracking` flag
     - Exit with code 1

4. **Preserve existing behavior** when tracking available
   - No changes to snapshot functions
   - No changes to loop_mix.sh invocation
   - No changes to exit code handling

### Files to Change

| File | Changes |
|------|---------|
| `scripts/loop_mix_tracked.sh` | Add availability check function, flag parsing, early exit |

### Detailed Changes to `scripts/loop_mix_tracked.sh`

#### After line 16 (add availability check)
```bash
# Function: check if agentosts tracking is available
check_tracking_available() {
  # Check directory exists
  if [ ! -d "$AGENTOSTS_DIR" ]; then
    return 1
  fi

  # Check pnpm available
  if ! command -v pnpm >/dev/null 2>&1; then
    return 1
  fi

  # Check tracker can run (dry run)
  if ! pnpm --dir "$AGENTOSTS_DIR" run tracker -- --help >/dev/null 2>&1; then
    return 1
  fi

  return 0
}
```

#### After line 16 (add flag parsing and check)
```bash
# Handle --skip-tracking flag
if [ "${1:-}" = "--skip-tracking" ] || [ "${1:-}" = "--untracked" ]; then
  echo "[tracked-loop] skipping tracking, delegating to loop_mix.sh"
  exec ./loop_mix.sh "$@"
fi

# Verify tracking is available
if ! check_tracking_available; then
  echo "Error: agentosts tracker not available"
  echo ""
  echo "The tracker requires:"
  echo "  1. Directory: $AGENTOSTS_DIR"
  echo "  2. pnpm command available in PATH"
  echo "  3. agentosts project set up (pnpm install run)"
  echo ""
  echo "Options:"
  echo "  - Use loop_mix.sh for untracked execution"
  echo "  - Pass --skip-tracking to this script"
  exit 1
fi
```

### Tests to Run

```bash
# 1. Test missing directory case
rm -rf apps/agentosts 2>/dev/null || true
./scripts/loop_mix_tracked.sh plan 1 2>&1 | head -10
# Expected: Error message with suggestions

# 2. Test --skip-tracking flag with missing directory
./scripts/loop_mix_tracked.sh --skip-tracking plan 1 2>&1 | head -5
# Expected: Delegates to loop_mix.sh

# 3. Verify normal mode still works (if agentosts available)
# (Only if agentosts is actually set up in environment)
```

### Verification Commands

```bash
# Script syntax check
bash -n scripts/loop_mix_tracked.sh

# Verify no BDD issues (this is infra only, no BDD changes)
bun run bdd:verify  # Should pass (no changes to step registry)

# Verify typecheck (no TS changes)
bun run typecheck   # Should pass
```

### Risks / Rollback

| Risk | Mitigation |
|------|------------|
| Breaking existing tracked workflows | Check only adds early exit; existing paths unchanged when agentosts available |
| Flag parsing conflicts with existing args | `--skip-tracking` is new; existing args are `plan`, `review`, or numeric |
| Exit code changes | Script preserves `$LOOP_EXIT` from loop_mix.sh |

### Rollback Plan

If issues arise, revert changes to `scripts/loop_mix_tracked.sh`:
```bash
git checkout HEAD -- scripts/loop_mix_tracked.sh
```

### Acceptance Criteria Verification

- [ ] Script exits cleanly with informative error when `apps/agentosts` directory doesn't exist
- [ ] Script exits cleanly when `pnpm --dir apps/agentosts` fails (pnpm not available or project not set up)
- [ ] Script can optionally run without tracking via `--skip-tracking` flag
- [ ] `bun run bdd:verify` passes (no BDD changes, so should pass)
- [ ] `bun run typecheck` passes (no TS changes, so should pass)
