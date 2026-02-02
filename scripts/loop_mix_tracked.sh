#!/usr/bin/env bash
# Mixed loop with agentosts tracking (usage snapshots)
# Usage: ./loop_mix_tracked.sh [plan|review] [iterations]
#
# This wrapper:
# 1. Generates a window ID
# 2. Takes before/after usage snapshots
# 3. Calls loop_mix.sh unchanged for actual work
# 4. Finalizes the window in agentosts tracker

set -euo pipefail

# Configuration
AGENTOSTS_DIR="apps/agentosts"
DATA_DIR="$AGENTOSTS_DIR/data/week0/live"

# Determine mode (same logic as loop_mix.sh)
MODE="build"
MAX_ITERATIONS=1

if [ "${1:-}" = "plan" ]; then
  MODE="plan"
  MAX_ITERATIONS=${2:-1}
elif [ "${1:-}" = "review" ]; then
  MODE="review"
  MAX_ITERATIONS=${2:-1}
elif [[ "${1:-}" =~ ^[0-9]+$ ]]; then
  MAX_ITERATIONS="$1"
fi

# Generate window ID for this session
WINDOW_ID="W-$(date +%Y%m%d-%H%M%S)-mix-$MODE"

echo "[tracked-loop] window=$WINDOW_ID mode=$MODE iterations=$MAX_ITERATIONS"
echo "[tracked-loop] data-dir=$DATA_DIR"
echo ""

# Function: run tracker command safely
tracker() {
  pnpm --dir "$AGENTOSTS_DIR" run tracker -- --data-dir "$DATA_DIR" "$@"
}

# Function: collect and ingest codex snapshot
snapshot_codex() {
  local phase=$1
  echo "[snapshot] codex $phase"

  local codex_bin="${CODEX_BIN:-codex}"
  if ! command -v "$codex_bin" >/dev/null 2>&1; then
    echo "[warning] codex binary not found, skipping snapshot"
    return 0
  fi

  # Run codex /status and capture output
  local status_output
  status_output=$("$codex_bin" /status 2>&1 || true)

  if [ -n "$status_output" ]; then
    echo "$status_output" | tracker ingest codex \
      --window "$WINDOW_ID" \
      --phase "$phase" \
      --stdin || echo "[warning] codex ingest failed"
  fi
}

# Function: collect and ingest claude snapshot
snapshot_claude() {
  local phase=$1
  echo "[snapshot] claude $phase"

  local claude_bin="${CLAUDE_BIN:-claude}"
  if ! command -v "$claude_bin" >/dev/null 2>&1; then
    echo "[warning] claude binary not found, checking usage file"
  fi

  # Try to get claude usage via environment or claude-monitor
  # Option 1: Check if CLAUDE_HOME has usage file
  local claude_home="${CLAUDE_HOME:-$HOME/.claude}"
  local usage_file="$claude_home/usage.json"

  if [ -f "$usage_file" ]; then
    # Extract usage info
    cat "$usage_file" | tracker ingest claude \
      --window "$WINDOW_ID" \
      --phase "$phase" \
      --stdin || echo "[warning] claude ingest failed"
  else
    echo "[warning] claude usage file not found at $usage_file"
  fi
}

# Phase 1: Before snapshots
echo "[tracked-loop] collecting before snapshots..."
if [ "$MODE" = "build" ]; then
  snapshot_claude "before"
else
  snapshot_codex "before"
fi
echo ""

# Phase 2: Run the actual loop (unchanged)
echo "[tracked-loop] running loop_mix.sh..."
./loop_mix.sh "$@"
LOOP_EXIT=$?
echo ""

# Phase 3: After snapshots
echo "[tracked-loop] collecting after snapshots..."
if [ "$MODE" = "build" ]; then
  snapshot_claude "after"
else
  snapshot_codex "after"
fi
echo ""

# Phase 4: Complete the window
echo "[tracked-loop] completing window=$WINDOW_ID"
tracker complete --window "$WINDOW_ID" || echo "[warning] complete failed"

# Summary
echo ""
echo "[tracked-loop] summary:"
echo "  window=$WINDOW_ID"
echo "  mode=$MODE"
echo "  iterations=$MAX_ITERATIONS"
echo "  loop_exit=$LOOP_EXIT"
echo ""
echo "[tracked-loop] view with: cd $AGENTOSTS_DIR && pnpm run tracker -- --data-dir $DATA_DIR preview --window $WINDOW_ID"

exit $LOOP_EXIT
