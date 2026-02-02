#!/usr/bin/env bash
# Mixed loop runner:
# - build mode uses Claude Code (default)
# - plan/review modes use Codex CLI
# - default MAX_ITERATIONS=1 (safe; no infinite loop by accident)
#
# Usage:
#   ./loop_mix.sh                 # build mode, 1 iteration
#   ./loop_mix.sh 12              # build mode, 12 iterations
#   ./loop_mix.sh plan            # plan mode, 1 iteration (Codex)
#   ./loop_mix.sh plan 3          # plan mode, 3 iterations (Codex)
#   ./loop_mix.sh review          # review mode, 1 iteration (Codex)
#   ./loop_mix.sh review 2        # review mode, 2 iterations (Codex)

set -euo pipefail

MODE="build"
PROMPT_FILE="PROMPT_build.md"
MAX_ITERATIONS=1

if [ "${1:-}" = "plan" ]; then
  MODE="plan"
  PROMPT_FILE="PROMPT_plan.md"
  MAX_ITERATIONS=${2:-1}
elif [ "${1:-}" = "review" ]; then
  MODE="review"
  PROMPT_FILE="docs/review/REVIEW_PROMPT.md"
  MAX_ITERATIONS=${2:-1}
elif [[ "${1:-}" =~ ^[0-9]+$ ]]; then
  MAX_ITERATIONS="$1"
fi

# Disallow infinite loops: require MAX_ITERATIONS to be a positive integer.
if [ "$MAX_ITERATIONS" -le 0 ]; then
  echo "Error: MAX_ITERATIONS must be a positive integer."
  exit 1
fi

ITERATION=0
while true; do
  if [ "$ITERATION" -ge "$MAX_ITERATIONS" ]; then
    break
  fi

  if [ ! -f "$PROMPT_FILE" ]; then
    echo "Error: $PROMPT_FILE not found in $(pwd)"
    exit 1
  fi

  if [ "$MODE" = "build" ]; then
    # Claude build loop
    CLAUDE_BIN="${CLAUDE_BIN:-claude}"
    CLAUDE_MODEL="${CLAUDE_MODEL:-opus}"

    # Note: Claude permissions are bypassed intentionally for automated loops.
    # Run only in directories you trust.
    cat "$PROMPT_FILE" | "$CLAUDE_BIN" -p \
      --dangerously-skip-permissions \
      --output-format=stream-json \
      --model "$CLAUDE_MODEL" \
      --verbose
  else
    # Codex plan/review loops
    CODEX_BIN="${CODEX_BIN:-codex}"
    CODEX_MODEL="${CODEX_MODEL:-gpt-5.2-codex}"
    CODEX_FLAGS=${CODEX_FLAGS:---dangerously-bypass-approvals-and-sandbox -c mcp_servers.playwright.enabled=false}

    cat "$PROMPT_FILE" | "$CODEX_BIN" exec ${CODEX_FLAGS} --model "$CODEX_MODEL" -
  fi

  ITERATION=$((ITERATION + 1))
done
