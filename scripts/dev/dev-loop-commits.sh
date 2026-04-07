#!/usr/bin/env bash
set -euo pipefail

# Dev Loop — Implement → Review → Converge
#
# Convergence rule:
#   A review round converges only when it leaves the committed repository tree unchanged.
#   Agent self-reporting is ignored.
#
# Usage:
#   bash scripts/dev/dev-loop-commits.sh <task-file> <task-number> [max-review-rounds]
#
# Examples:
#   bash scripts/dev/dev-loop-commits.sh .agent/tasks/task-4-reporting-utils.md 1
#   bash scripts/dev/dev-loop-commits.sh .agent/tasks/task-4-reporting-utils.md 2 5

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

if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "Error: dev-loop.sh must be run inside a git repository." >&2
  exit 1
fi

validate_non_negative_int() {
  local var_name="$1"
  local value="$2"
  if ! [[ "$value" =~ ^[0-9]+$ ]]; then
    echo "Error: ${var_name} must be a non-negative integer, got: ${value}" >&2
    exit 2
  fi
}

validate_non_negative_int MAX_REVIEW_ROUNDS "$MAX_REVIEW_ROUNDS"
validate_non_negative_int MAX_TRANSIENT_RETRIES "$MAX_TRANSIENT_RETRIES"
validate_non_negative_int RETRY_BASE_SLEEP_SEC "$RETRY_BASE_SLEEP_SEC"

TASK_FILE_ABS="$(cd "$(dirname "$TASK_FILE")" && pwd)/$(basename "$TASK_FILE")"
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

TASK_SLUG="$(basename "$TASK_FILE" .md)"
RUN_ID="${RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
TRACE_ROOT="${DEV_LOOP_TRACE_DIR:-$(git rev-parse --git-path dev-loop)}"
LOG_DIR="${TRACE_ROOT}/logs"
REVIEW_DIR="${TRACE_ROOT}/reviews"
mkdir -p "$LOG_DIR" "$REVIEW_DIR"
LOG_FILE="$LOG_DIR/dev-loop_${TASK_SLUG}_task${TASK_NUMBER}_${RUN_ID}.log"
touch "$LOG_FILE"

# --- Logging ---
log_line() {
  printf '[dev-loop][%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" | tee -a "$LOG_FILE"
}

# --- Git helpers ---
git_status_porcelain() {
  git status --porcelain=1 --untracked-files=no
}

warn_if_dirty() {
  local context="$1"
  local status_output
  status_output="$(git_status_porcelain)"
  if [ -n "$status_output" ]; then
    log_line "${context}: warning — tracked files have uncommitted changes (tree comparison still valid)"
  fi
}

current_head() {
  if git rev-parse --verify HEAD >/dev/null 2>&1; then
    git rev-parse HEAD
  else
    echo "EMPTY"
  fi
}

current_tree() {
  if git rev-parse --verify HEAD >/dev/null 2>&1; then
    git rev-parse HEAD^{tree}
  else
    echo "EMPTY"
  fi
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

    log_line "${phase}: FATAL error after $attempt attempts"
    rm -f "$tmp_log"
    return 1
  done
}

log_line "start task_file=$TASK_FILE_ABS task_number=$TASK_NUMBER max_review_rounds=$MAX_REVIEW_ROUNDS"
warn_if_dirty "startup precondition"

IMPLEMENT_PROMPT="Read and follow ${TASK_FILE_ABS} exactly, do Task ${TASK_NUMBER}. Run the verification command specified in the task file, then commit any required implementation changes. If the task is already fully satisfied, do not make unnecessary changes or empty commits."

log_line "iteration=0 phase=implement"
if ! dispatch_glm "$IMPLEMENT_PROMPT" "implement"; then
  log_line "IMPLEMENT FAILED — aborting"
  exit 1
fi

IMPLEMENT_LOG="$REVIEW_DIR/${TASK_SLUG}_task${TASK_NUMBER}_implement.log"
cp "$LAST_OUTPUT_FILE" "$IMPLEMENT_LOG"
rm -f "$LAST_OUTPUT_FILE"

warn_if_dirty "post-implement"
IMPLEMENT_HEAD="$(current_head)"
IMPLEMENT_TREE="$(current_tree)"
log_line "implement complete head=${IMPLEMENT_HEAD} tree=${IMPLEMENT_TREE}"

REVIEW_ROUND=0
while [ "$REVIEW_ROUND" -lt "$MAX_REVIEW_ROUNDS" ]; do
  REVIEW_ROUND=$((REVIEW_ROUND + 1))
  log_line "iteration=${REVIEW_ROUND} phase=review round=${REVIEW_ROUND}/${MAX_REVIEW_ROUNDS}"

  BEFORE_HEAD="$(current_head)"
  BEFORE_TREE="$(current_tree)"

  REVIEW_PROMPT="Read ${TASK_FILE_ABS}. Review Task ${TASK_NUMBER} for real defects only.
Read the changed files listed in the task and inspect any other files needed to verify correctness.
Change the repository only if you find one of these:
- incorrect behavior (wrong output, wrong logic, crash)
- a missing task requirement (something the task file asks for that is not implemented)
- failing verification (the verification command fails)
- a clear robustness bug (null dereference, unhandled error on a reachable path)
Do NOT change the repository for: style preferences, wording tweaks, refactors, renames, formatting, equivalent implementations, or minor subjective improvements.
If you make a fix, run the verification command and commit.
If no real fix is needed, make no repository changes and create no commit."

  if ! dispatch_glm "$REVIEW_PROMPT" "review-${REVIEW_ROUND}"; then
    log_line "REVIEW round $REVIEW_ROUND FAILED — aborting"
    exit 1
  fi

  REVIEW_LOG="$REVIEW_DIR/${TASK_SLUG}_task${TASK_NUMBER}_review-${REVIEW_ROUND}.log"
  cp "$LAST_OUTPUT_FILE" "$REVIEW_LOG"
  rm -f "$LAST_OUTPUT_FILE"

  warn_if_dirty "post-review-${REVIEW_ROUND}"

  AFTER_HEAD="$(current_head)"
  AFTER_TREE="$(current_tree)"

  if [ "$AFTER_TREE" != "$BEFORE_TREE" ]; then
    log_line "review round $REVIEW_ROUND: repository tree changed before_tree=${BEFORE_TREE} after_tree=${AFTER_TREE}; continuing"
    continue
  fi

  if [ "$AFTER_HEAD" != "$BEFORE_HEAD" ]; then
    log_line "review round $REVIEW_ROUND: HEAD changed without tree change before_head=${BEFORE_HEAD} after_head=${AFTER_HEAD}; aborting"
    exit 1
  fi

  log_line "CONVERGED at review round $REVIEW_ROUND — repository tree unchanged"
  exit 0
done

log_line "DID NOT CONVERGE after $MAX_REVIEW_ROUNDS review rounds — needs escalation"
log_line "last review output saved to: $REVIEW_LOG"
exit 2