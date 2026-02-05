#!/bin/bash
# Usage: scripts/dev/review_plan_loop.sh [max_iterations]
# Default: run once.
set -euo pipefail

PROMPT_FILE="${PROMPT_FILE:-PROMPT_review_plan.md}"
MAX_ITERATIONS=${1:-1}

ITERATION=0
while true; do
  if [ "$MAX_ITERATIONS" -ne 0 ] && [ "$ITERATION" -ge "$MAX_ITERATIONS" ]; then
    break
  fi

  CODEX_FLAGS=${CODEX_FLAGS:---dangerously-bypass-approvals-and-sandbox -c mcp_servers.playwright.enabled=false}
  CODEX_BIN="${CODEX_BIN:-codex}"
  cat "$PROMPT_FILE" | "$CODEX_BIN" exec ${CODEX_FLAGS} --model "${CODEX_MODEL:-gpt-5.2-codex}" -

  ITERATION=$((ITERATION + 1))
done
