#!/usr/bin/env bash
# Queue all tasks from task_graph.json to Weaver coordinator
#
# Usage:
#   ./scripts/ops/queue-from-graph.sh [count]
#
# Options:
#   count  Number of tasks to queue (default: all)
#
# Env vars:
#   COORDINATOR_URL  Weaver coordinator URL (default: http://192.168.1.80:8787)
#   WEAVER_REPO_PATH  Repository path (default: auto-detect)

set -euo pipefail

# Default configuration
COORDINATOR_URL="${COORDINATOR_URL:-http://192.168.1.80:8787}"
WEAVER_REPO_PATH="${WEAVER_REPO_PATH:-$(pwd)}"
TASK_GRAPH="tasks/task_graph.json"
LIMIT="${1:-}"  # Empty = all tasks
MODEL="${MODEL:-gpt-5.2-codex}"
PROMPT_PATH="${PROMPT_PATH:-PROMPT_build.md}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# Check if task_graph exists
if [[ ! -f "$TASK_GRAPH" ]]; then
    echo "Error: $TASK_GRAPH not found"
    echo "Run plan loop first: ./loop_mix.sh plan"
    exit 1
fi

# Get task count
TOTAL_TASKS=$(jq '.tasks | length' "$TASK_GRAPH")
log_info "Found $TOTAL_TASKS tasks in $TASK_GRAPH"

# Determine how many to queue
if [[ -n "$LIMIT" ]]; then
    COUNT="$LIMIT"
    log_info "Queueing first $COUNT tasks"
else
    COUNT="$TOTAL_TASKS"
    log_info "Queueing all $COUNT tasks"
fi

# Queue each task
QUEUED=0
for ((i=0; i<COUNT; i++)); do
    TASK_ID=$(jq -r ".tasks[$i].id" "$TASK_GRAPH")
    TASK_NAME=$(jq -r ".tasks[$i].name" "$TASK_GRAPH")

    log_info "Queueing $TASK_ID: $TASK_NAME"

    RESPONSE=$(curl -s -X POST "$COORDINATOR_URL/tasks" \
        -H 'Content-Type: application/json' \
        -d "$(jq -n \
          --arg model \"$MODEL\" \
          --arg prompt \"$PROMPT_PATH\" \
          '{
            provider: \"codex\",
            mode: \"build\",
            continue_session: false,
            export_teleport_bundle: false,
            model: $model,
            prompt_path: $prompt
          }')") 

    if echo "$RESPONSE" | jq -e '.task_id' >/dev/null 2>&1; then
        ((QUEUED++))
        log_info "  ✓ Task queued successfully"
    else
        log_warn "  ✗ Failed to queue task"
        echo "  Response: $RESPONSE"
    fi
done

log_info "Queued $QUEUED/$COUNT tasks"
echo ""
echo "Monitor progress at your coordinator dashboard or check output in:"
echo "  $WEAVER_REPO_PATH/docs/SESSION_HANDOFF.md"
