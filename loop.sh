#!/bin/bash
# Usage: ./loop.sh [plan|review] [max_iterations]
# Defaults to 1 iteration in all modes unless explicitly overridden.
# Examples:
#   ./loop.sh            # Build mode, 1 iteration
#   ./loop.sh 20         # Build mode, max 20 iterations
#   ./loop.sh plan       # Plan mode, 1 iteration
#   ./loop.sh plan 5     # Plan mode, max 5 iterations
#   ./loop.sh review     # Review mode, 1 iteration
#   ./loop.sh review 1   # Review mode, max 1 iteration

MODE="build"
PROMPT_FILE="PROMPT_build.md"
MAX_ITERATIONS=1

if [ "$1" = "plan" ]; then
  MODE="plan"
  PROMPT_FILE="PROMPT_plan.md"
  MAX_ITERATIONS=${2:-1}
elif [ "$1" = "review" ]; then
  MODE="review"
  PROMPT_FILE="docs/review/REVIEW_PROMPT.md"
  MAX_ITERATIONS=${2:-1}
elif [[ "$1" =~ ^[0-9]+$ ]]; then
  MAX_ITERATIONS=$1
fi

if [ "$MAX_ITERATIONS" -le 0 ]; then
  echo "Error: MAX_ITERATIONS must be a positive integer."
  exit 1
fi

ITERATION=0
while true; do
  if [ "$ITERATION" -ge "$MAX_ITERATIONS" ]; then
    break
  fi

  CODEX_FLAGS=${CODEX_FLAGS:---dangerously-bypass-approvals-and-sandbox}
  CODEX_BIN="${CODEX_BIN:-codex}"
  cat "$PROMPT_FILE" | "$CODEX_BIN" exec ${CODEX_FLAGS} --model "${CODEX_MODEL:-gpt-5.2-codex}" -

  ITERATION=$((ITERATION + 1))
done
