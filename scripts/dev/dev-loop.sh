#!/usr/bin/env bash
set -euo pipefail

# Dev Loop — Implement → Review → Converge
#
# Usage:
#   bash scripts/dev/dev-loop.sh <task-file> <task-number> [max-review-rounds]
#
# Examples:
#   bash scripts/dev/dev-loop.sh .agent/tasks/task-4-reporting-utils.md 1
#   bash scripts/dev/dev-loop.sh .agent/tasks/task-4-reporting-utils.md 2 5

TASK_FILE="${1:?Usage: dev-loop.sh <task-file> <task-number> [max-review-rounds]}"
TASK_NUMBER="${2:?Usage: dev-loop.sh <task-file> <task-number> [max-review-rounds]}"
MAX_REVIEW_ROUNDS="${3:-3}"
MAX_TRANSIENT_RETRIES="${MAX_TRANSIENT_RETRIES:-6}"
RETRY_BASE_SLEEP_SEC="${RETRY_BASE_SLEEP_SEC:-20}"

CLAUDE_BIN="${CLAUDE_BIN:-claude}"
CLAUDE_SETTINGS_FILE="${CLAUDE_SETTINGS_FILE:-$HOME/.claude/settings.glm.json}"
CLAUDE_EFFORT="${CLAUDE_EFFORT:-high}"

if [ ! -f "$TASK_FILE" ]; then
  echo "Error: task file not found: $TASK_FILE" >&2
  exit 1
fi
if [ ! -f "$CLAUDE_SETTINGS_FILE" ]; then
  echo "Error: GLM settings not found: $CLAUDE_SETTINGS_FILE" >&2
  exit 1
fi

# Derive slug from filename for logging
TASK_SLUG="$(basename "$TASK_FILE" .md)"
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
LOG_DIR=".claude-trace/dev-loop"
REVIEW_DIR=".agent/reviews"
mkdir -p "$LOG_DIR" "$REVIEW_DIR"
LOG_FILE="$LOG_DIR/dev-loop_${TASK_SLUG}_task${TASK_NUMBER}_${RUN_ID}.log"
touch "$LOG_FILE"

# --- Logging ---
log_line() {
  printf '[dev-loop][%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" | tee -a "$LOG_FILE"
}

# --- Error detection (from loop_no_active_task.sh) ---
is_rate_limit_error() {
  grep -qE 'API Error: 429|"code":"1302"|Rate limit reached for requests' "$1"
}
is_network_transient_error() {
  grep -qiE 'Unable to connect to API|ConnectionRefused|ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|socket hang up|502 Bad Gateway|503 Service Unavailable|504 Gateway Timeout' "$1"
}
is_provider_transient_error() {
  grep -qiE '"code":"500"|Operation failed' "$1"
}

# --- Dispatch GLM with retry ---
dispatch_glm() {
  local prompt="$1"
  local phase="$2"  # "implement" or "review-N"
  local attempt=0
  local tmp_log

  while true; do
    tmp_log="$(mktemp)"

    log_line "${phase}: dispatching GLM"

    if echo "$prompt" | "$CLAUDE_BIN" -p \
        --dangerously-skip-permissions \
        --no-session-persistence \
        --output-format=stream-json \
        --settings "$CLAUDE_SETTINGS_FILE" \
        --effort "$CLAUDE_EFFORT" \
        --verbose 2>&1 | tee "$tmp_log" | tee -a "$LOG_FILE"; then
      # Success
      log_line "${phase}: GLM completed successfully"
      LAST_OUTPUT_FILE="$tmp_log"
      return 0
    fi

    attempt=$((attempt + 1))

    if [ "$attempt" -le "$MAX_TRANSIENT_RETRIES" ]; then
      if is_rate_limit_error "$tmp_log"; then
        local sleep_sec=$((RETRY_BASE_SLEEP_SEC * attempt))
        log_line "${phase}: rate limit hit, retry $attempt/$MAX_TRANSIENT_RETRIES, sleeping ${sleep_sec}s"
        rm -f "$tmp_log"
        sleep "$sleep_sec"
        continue
      fi
      if is_network_transient_error "$tmp_log"; then
        local sleep_sec=$((RETRY_BASE_SLEEP_SEC * attempt))
        log_line "${phase}: network error, retry $attempt/$MAX_TRANSIENT_RETRIES, sleeping ${sleep_sec}s"
        rm -f "$tmp_log"
        sleep "$sleep_sec"
        continue
      fi
      if is_provider_transient_error "$tmp_log"; then
        local sleep_sec=$((RETRY_BASE_SLEEP_SEC * attempt))
        log_line "${phase}: provider error, retry $attempt/$MAX_TRANSIENT_RETRIES, sleeping ${sleep_sec}s"
        rm -f "$tmp_log"
        sleep "$sleep_sec"
        continue
      fi
    fi

    # Fatal — non-transient or retries exhausted
    log_line "${phase}: FATAL error after $attempt attempts"
    rm -f "$tmp_log"
    return 1
  done
}

# --- Main ---
TASK_FILE_ABS="$(cd "$(dirname "$TASK_FILE")" && pwd)/$(basename "$TASK_FILE")"

log_line "start task_file=$TASK_FILE task_number=$TASK_NUMBER max_review_rounds=$MAX_REVIEW_ROUNDS"

# Step 1: IMPLEMENT
IMPLEMENT_PROMPT="Read and follow ${TASK_FILE_ABS} exactly, do Task ${TASK_NUMBER}. Run the verification command specified in the task file, then commit."

if ! dispatch_glm "$IMPLEMENT_PROMPT" "implement"; then
  log_line "IMPLEMENT FAILED — aborting"
  exit 1
fi
rm -f "$LAST_OUTPUT_FILE"

# Step 2+3: REVIEW → CONVERGE
REVIEW_ROUND=0
while [ "$REVIEW_ROUND" -lt "$MAX_REVIEW_ROUNDS" ]; do
  REVIEW_ROUND=$((REVIEW_ROUND + 1))
  log_line "review round $REVIEW_ROUND/$MAX_REVIEW_ROUNDS"

  REVIEW_PROMPT="Read ${TASK_FILE_ABS}. Check if Task ${TASK_NUMBER} is fully implemented and bug-free.
Read the changed files listed in the task.
If bugs or gaps found: fix them, run the verification command, commit fixes, and report what you fixed.
If everything is correct and complete: your FINAL line must be exactly: VERDICT: PASS"

  if ! dispatch_glm "$REVIEW_PROMPT" "review-${REVIEW_ROUND}"; then
    log_line "REVIEW round $REVIEW_ROUND FAILED — aborting"
    exit 1
  fi

  # Check convergence
  REVIEW_LOG="$REVIEW_DIR/${TASK_SLUG}_task${TASK_NUMBER}_review-${REVIEW_ROUND}.log"
  cp "$LAST_OUTPUT_FILE" "$REVIEW_LOG"

  if grep -q 'VERDICT: PASS' "$LAST_OUTPUT_FILE"; then
    log_line "CONVERGED at review round $REVIEW_ROUND — VERDICT: PASS"
    rm -f "$LAST_OUTPUT_FILE"
    exit 0
  fi

  log_line "review round $REVIEW_ROUND: reviewer made fixes or did not pass"
  rm -f "$LAST_OUTPUT_FILE"
done

# Did not converge
log_line "DID NOT CONVERGE after $MAX_REVIEW_ROUNDS review rounds — needs Opus escalation"
log_line "last review output saved to: $REVIEW_LOG"
exit 2
