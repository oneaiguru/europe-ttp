# TASK-098: guard-loop-mix-tracked-agentosts - Research

## Current State

### Target Script
`scripts/loop_mix_tracked.sh` (131 lines)

### Purpose of Script
The script is a wrapper around `loop_mix.sh` that adds usage tracking via an external tool called "agentosts":
1. Generates a window ID for each session
2. Takes before/after usage snapshots (codex or claude)
3. Runs the actual `loop_mix.sh` unchanged
4. Finalizes the window in agentosts tracker

### Key Error Points

#### 1. Missing Directory (lines 14-15)
```bash
AGENTOSTS_DIR="apps/agentosts"
DATA_DIR="$AGENTOSTS_DIR/data/week0/live"
```
- **Status**: Directory `apps/agentosts` does NOT exist in current environment
- **Effect**: Any operation depending on this directory will fail

#### 2. `pnpm --dir` command (line 40)
```bash
tracker() {
  pnpm --dir "$AGENTOSTS_DIR" run tracker -- --data-dir "$DATA_DIR" "$@"
}
```
- **Status**: Will fail with `pnpm ERR_PNPM_WORKSPACE_DIR_NOT_FOUND` when `apps/agentosts` missing
- **Called from**:
  - Line 59-62: `tracker ingest codex`
  - Line 83-86: `tracker ingest claude`
  - Line 118: `tracker complete`

#### 3. No Error Handling
Script uses `set -euo pipefail` (line 11), meaning:
- `set -e`: Exit on any command failure
- `set -u`: Exit on undefined variable
- `set -o pipefail`: Exit on pipe failure

Current `tracker()` function calls use `|| echo "[warning]"` for some failures but NOT for the `pnpm` invocation itself.

### Related Scripts

| Script | Lines | Purpose | Tracking? |
|--------|-------|---------|-----------|
| `scripts/loop_mix.sh` | 73 | Core loop runner (Claude/Codex) | No |
| `scripts/loop_mix_pretty.sh` | 194 | Pretty output variant | No |
| `scripts/loop_mix_tracked.sh` | 131 | Wrapper with tracking | Yes (calls loop_mix.sh) |

### Error Conditions to Handle

1. **Directory missing**: `apps/agentosts` doesn't exist
   - Current: Script fails immediately when `tracker()` called
   - Should: Exit gracefully with informative message

2. **pnpm unavailable**: `pnpm` not in PATH
   - Current: Script fails with "command not found"
   - Should: Detect and exit cleanly

3. **agentosts not set up**: Directory exists but `pnpm run tracker` fails
   - Current: Partial failure handling with `|| echo "[warning]"`
   - Should: Full detection upfront

### Current Partial Error Handling

Lines 59-62, 83-86, 118:
```bash
tracker ingest ... || echo "[warning] codex ingest failed"
```
- **Issue**: Only guards against `tracker` subcommand failures
- **Missing**: Guard against `pnpm` itself failing

## Options for Solution

### Option A: Early Exit with Clear Error
Check at script start, exit if tracking unavailable:
```bash
if [ ! -d "$AGENTOSTS_DIR" ]; then
  echo "Error: agentosts tracker not found at $AGENTOSTS_DIR"
  echo "Use loop_mix.sh instead for untracked execution"
  exit 1
fi
```

### Option B: Fallback to Untracked Mode
Automatically fall back to `loop_mix.sh` without tracking:
```bash
if [ ! -d "$AGENTOSTS_DIR" ]; then
  echo "[warning] agentosts tracker unavailable, running untracked"
  exec ./loop_mix.sh "$@"
fi
```

### Option C: `--skip-tracking` Flag
Allow explicit opt-out:
```bash
SKIP_TRACKING=0
if [ "${1:-}" = "--skip-tracking" ]; then
  SKIP_TRACKING=1
  shift
  ./loop_mix.sh "$@"
  exit $?
fi
```

## File References

- `scripts/loop_mix_tracked.sh:14-15` - AGENTOSTS_DIR, DATA_DIR definitions
- `scripts/loop_mix_tracked.sh:39-41` - tracker() function with pnpm invocation
- `scripts/loop_mix_tracked.sh:59-62` - codex ingest call
- `scripts/loop_mix_tracked.sh:83-86` - claude ingest call
- `scripts/loop_mix_tracked.sh:103` - loop_mix.sh invocation
- `scripts/loop_mix_tracked.sh:118` - complete window call
- `scripts/loop_mix.sh:1-73` - Base script for fallback
- `scripts/loop_mix_pretty.sh:1-194` - Pretty variant (alternative fallback)

## Constraints

1. Script uses `set -euo pipefail` - must maintain or explicitly disable for specific commands
2. `tracker()` is called 3+ times - guard once vs guard each call
3. Exit code from `loop_mix.sh` must be preserved (currently captured in `LOOP_EXIT`)
4. Integration with agentosts is optional/external - should not hard-fail in all environments
