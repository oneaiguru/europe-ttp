#!/usr/bin/env bash
set -euo pipefail

# Claude build loop that does NOT use docs/Tasks/ACTIVE_TASK.md.
#
# This script simply runs the repo's PROMPT_build.md (which now contains "no ACTIVE_TASK"
# role/task selection rules). The only automation here is iteration control + GLM settings.
#
# Usage:
#   bash loop_no_active_task.sh        # 1 iteration
#   bash loop_no_active_task.sh 12     # 12 iterations

MODE="build"
PROMPT_FILE="${PROMPT_FILE:-PROMPT_build.md}"
# Root loop targets the current repo backlog by default; project-specific wrappers should override PLAN_FILE.
PLAN_FILE="${PLAN_FILE:-IMPLEMENTATION_PLAN.md}"
TASKS_DIR="${TASKS_DIR:-docs/Tasks}"
REPO_ROOT="${REPO_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
MAX_ITERATIONS="${1:-1}"
MAX_SAME_SLUG="${MAX_SAME_SLUG:-4}"
LOOP_PROGRESS_FILE="${LOOP_PROGRESS_FILE:-}"

if ! [[ "$MAX_ITERATIONS" =~ ^[0-9]+$ ]]; then
  echo "Error: iterations must be an integer (example: 12)" >&2
  exit 1
fi
if [ "$MAX_ITERATIONS" -le 0 ]; then
  echo "Error: MAX_ITERATIONS must be a positive integer." >&2
  exit 1
fi
if ! [[ "$MAX_SAME_SLUG" =~ ^[0-9]+$ ]]; then
  echo "Error: MAX_SAME_SLUG must be an integer (example: 4)" >&2
  exit 1
fi
if [ "$MAX_SAME_SLUG" -le 0 ]; then
  echo "Error: MAX_SAME_SLUG must be a positive integer." >&2
  exit 1
fi

if [ ! -f "$PROMPT_FILE" ]; then
  echo "Error: $PROMPT_FILE not found in $(pwd)" >&2
  exit 1
fi
if [ ! -f "$PLAN_FILE" ]; then
  echo "Error: PLAN_FILE missing: $PLAN_FILE" >&2
  exit 1
fi
if [ ! -d "$TASKS_DIR" ]; then
  echo "Error: TASKS_DIR missing: $TASKS_DIR" >&2
  exit 1
fi

CLAUDE_BIN="${CLAUDE_BIN:-claude}"
CODEX_BIN="${CODEX_BIN:-codex}"
CODEX_FLAGS="${CODEX_FLAGS:---dangerously-bypass-approvals-and-sandbox}"
CODEX_MODEL="${CODEX_MODEL:-gpt-5.3-codex-spark}"
USE_CODEX="${USE_CODEX:-0}"
CLAUDE_SETTINGS_FILE="${CLAUDE_SETTINGS_FILE:-$HOME/.claude/settings.glm.json}"
CLAUDE_EFFORT="${CLAUDE_EFFORT:-high}"
MAX_TRANSIENT_RETRIES="${MAX_TRANSIENT_RETRIES:-6}"
RETRY_BASE_SLEEP_SEC="${RETRY_BASE_SLEEP_SEC:-20}"
LOOP_LOG_DIR="${LOOP_LOG_DIR:-.claude-trace/loop-no-active-task}"
RUN_ID="${RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
RUN_LOG_FILE="${RUN_LOG_FILE:-$LOOP_LOG_DIR/loop_no_active_task_${RUN_ID}.log}"
RUN_STATS_FILE="${RUN_STATS_FILE:-$LOOP_LOG_DIR/loop_no_active_task_${RUN_ID}.stats}"
if [ ! -f "$CLAUDE_SETTINGS_FILE" ]; then
  echo "Error: CLAUDE_SETTINGS_FILE missing: $CLAUDE_SETTINGS_FILE" >&2
  echo "Set CLAUDE_SETTINGS_FILE to your GLM profile JSON (example: ~/.claude/settings.glm.json)." >&2
  exit 1
fi
if ! [[ "$MAX_TRANSIENT_RETRIES" =~ ^[0-9]+$ ]]; then
  echo "Error: MAX_TRANSIENT_RETRIES must be a non-negative integer." >&2
  exit 1
fi
if ! [[ "$RETRY_BASE_SLEEP_SEC" =~ ^[0-9]+$ ]]; then
  echo "Error: RETRY_BASE_SLEEP_SEC must be a non-negative integer." >&2
  exit 1
fi
mkdir -p "$LOOP_LOG_DIR"
touch "$RUN_LOG_FILE"

LOOP_START_UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
ITERATION=0
REQUESTED_TOTAL_ITERATIONS="$MAX_ITERATIONS"
COMPLETED_ITERATIONS_BEFORE_RUN=0
TOTAL_COMPLETED_ITERATIONS=0
ITERATION_TARGET_THIS_PROCESS="$MAX_ITERATIONS"
PROGRESS_RESET_REASON=""
CLAUDE_SUCCESS_COUNT=0
RATE_LIMIT_RETRY_COUNT=0
RATE_LIMIT_FATAL_COUNT=0
NETWORK_RETRY_COUNT=0
NETWORK_FATAL_COUNT=0
PROVIDER_RETRY_COUNT=0
PROVIDER_FATAL_COUNT=0
OTHER_FATAL_COUNT=0
SKIPPED_BY_STUCK_COUNT=0

resolve_identity_path() {
  local target="$1"
  if command -v realpath >/dev/null 2>&1; then
    realpath "$target" 2>/dev/null || printf '%s' "$target"
    return
  fi
  printf '%s' "$target"
}

compute_resume_fingerprint() {
  local current_branch="detached"
  if command -v git >/dev/null 2>&1; then
    current_branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || printf 'detached')"
  fi

  printf '%s' \
    "mode=$MODE" \
    "|cwd=$(pwd -P)" \
    "|branch=$current_branch" \
    "|prompt=$(resolve_identity_path "$PROMPT_FILE")" \
    "|plan=$(resolve_identity_path "$PLAN_FILE")" \
    "|tasks=$(resolve_identity_path "$TASKS_DIR")"
}

log_line() {
  local msg="$1"
  printf '[no-active-task][%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$msg" | tee -a "$RUN_LOG_FILE"
}

is_rate_limit_error() {
  local log_file="$1"
  grep -qE 'API Error: 429|"code":"1302"|Rate limit reached for requests' "$log_file"
}

is_network_transient_error() {
  local log_file="$1"
  grep -qiE 'Unable to connect to API|ConnectionRefused|ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|socket hang up|502 Bad Gateway|503 Service Unavailable|504 Gateway Timeout' "$log_file"
}

is_provider_transient_error() {
  local log_file="$1"
  grep -qiE '"code":"500"|Operation failed' "$log_file"
}

persist_progress_state() {
  local status="$1"
  local resume_fingerprint
  [ -n "$LOOP_PROGRESS_FILE" ] || return 0
  mkdir -p "$(dirname "$LOOP_PROGRESS_FILE")"
  resume_fingerprint="$(compute_resume_fingerprint)"
  {
    printf 'requested_total_iterations=%s\n' "$REQUESTED_TOTAL_ITERATIONS"
    printf 'completed_iterations_before_run=%s\n' "$COMPLETED_ITERATIONS_BEFORE_RUN"
    printf 'completed_iterations_this_run=%s\n' "$ITERATION"
    printf 'completed_iterations=%s\n' "$TOTAL_COMPLETED_ITERATIONS"
    printf 'remaining_iterations=%s\n' "$((REQUESTED_TOTAL_ITERATIONS - TOTAL_COMPLETED_ITERATIONS))"
    printf 'status=%s\n' "$status"
    printf 'run_id=%s\n' "$RUN_ID"
    printf 'resume_fingerprint=%s\n' "$resume_fingerprint"
    printf 'updated_utc=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  } > "${LOOP_PROGRESS_FILE}.tmp"
  mv "${LOOP_PROGRESS_FILE}.tmp" "$LOOP_PROGRESS_FILE"
}

load_progress_state() {
  [ -n "$LOOP_PROGRESS_FILE" ] || return 0

  mkdir -p "$(dirname "$LOOP_PROGRESS_FILE")"

  if [ -f "$LOOP_PROGRESS_FILE" ]; then
    local saved_total=""
    local saved_completed=""
    local saved_fingerprint=""
    local current_fingerprint=""
    saved_total="$(awk -F= '$1 == "requested_total_iterations" { print $2 }' "$LOOP_PROGRESS_FILE" | tail -n 1)"
    saved_completed="$(awk -F= '$1 == "completed_iterations" { print $2 }' "$LOOP_PROGRESS_FILE" | tail -n 1)"
    saved_fingerprint="$(awk -F= '$1 == "resume_fingerprint" { print substr($0, index($0, "=") + 1) }' "$LOOP_PROGRESS_FILE" | tail -n 1)"
    current_fingerprint="$(compute_resume_fingerprint)"

    if [[ "$saved_total" =~ ^[0-9]+$ ]] \
      && [ "$saved_total" -eq "$REQUESTED_TOTAL_ITERATIONS" ] \
      && [[ "$saved_completed" =~ ^[0-9]+$ ]] \
      && [ -n "$saved_fingerprint" ] \
      && [ "$saved_fingerprint" = "$current_fingerprint" ]; then
      COMPLETED_ITERATIONS_BEFORE_RUN="$saved_completed"
    else
      COMPLETED_ITERATIONS_BEFORE_RUN=0
      if [ -n "$saved_total" ] || [ -n "$saved_completed" ] || [ -n "$saved_fingerprint" ]; then
        PROGRESS_RESET_REASON="resume_progress_reset saved_total=${saved_total:-unset} saved_completed=${saved_completed:-unset} requested_total=$REQUESTED_TOTAL_ITERATIONS saved_fingerprint=${saved_fingerprint:-unset} current_fingerprint=$current_fingerprint"
      fi
    fi
  fi

  if [ "$COMPLETED_ITERATIONS_BEFORE_RUN" -gt "$REQUESTED_TOTAL_ITERATIONS" ]; then
    COMPLETED_ITERATIONS_BEFORE_RUN="$REQUESTED_TOTAL_ITERATIONS"
  fi

  TOTAL_COMPLETED_ITERATIONS="$COMPLETED_ITERATIONS_BEFORE_RUN"
  ITERATION_TARGET_THIS_PROCESS=$((REQUESTED_TOTAL_ITERATIONS - COMPLETED_ITERATIONS_BEFORE_RUN))
}

finalize_stats() {
  local exit_code=$?
  local loop_end_utc
  loop_end_utc="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  set +e
  if [ "$exit_code" -eq 0 ]; then
    persist_progress_state "finished"
  else
    persist_progress_state "interrupted"
  fi
  {
    printf 'run_id=%s\n' "$RUN_ID"
    printf 'start_utc=%s\n' "$LOOP_START_UTC"
    printf 'end_utc=%s\n' "$loop_end_utc"
    printf 'exit_code=%s\n' "$exit_code"
    printf 'iterations_completed=%s\n' "$ITERATION"
    printf 'iterations_completed_total=%s\n' "$TOTAL_COMPLETED_ITERATIONS"
    printf 'iterations_completed_before_run=%s\n' "$COMPLETED_ITERATIONS_BEFORE_RUN"
    printf 'max_iterations=%s\n' "$REQUESTED_TOTAL_ITERATIONS"
    printf 'claude_success_count=%s\n' "$CLAUDE_SUCCESS_COUNT"
    printf 'rate_limit_retry_count=%s\n' "$RATE_LIMIT_RETRY_COUNT"
    printf 'rate_limit_fatal_count=%s\n' "$RATE_LIMIT_FATAL_COUNT"
    printf 'network_retry_count=%s\n' "$NETWORK_RETRY_COUNT"
    printf 'network_fatal_count=%s\n' "$NETWORK_FATAL_COUNT"
    printf 'provider_retry_count=%s\n' "$PROVIDER_RETRY_COUNT"
    printf 'provider_fatal_count=%s\n' "$PROVIDER_FATAL_COUNT"
    printf 'other_fatal_count=%s\n' "$OTHER_FATAL_COUNT"
    printf 'skipped_by_stuck_count=%s\n' "$SKIPPED_BY_STUCK_COUNT"
    printf 'skipped_by_escalation_count=%s\n' "$PERMANENT_SKIP_COUNT"
    printf 'loop_progress_file=%s\n' "${LOOP_PROGRESS_FILE:-}"
    printf 'run_log_file=%s\n' "$RUN_LOG_FILE"
  } > "$RUN_STATS_FILE"
  log_line "exit_code=$exit_code stats_file=$RUN_STATS_FILE"
}
trap finalize_stats EXIT

SKIPPED_SLUGS=$'\n'
SKIPPED_SLUG_COUNT=0
PERMANENT_SKIP_SLUGS=$'\n'
PERMANENT_SKIP_COUNT=0

is_permanent_skip_slug() {
  local slug="$1"
  case "$PERMANENT_SKIP_SLUGS" in
    *$'\n'"$slug"$'\n'*)
      return 0
      ;;
  esac
  return 1
}

add_permanent_skip_slug() {
  local slug="$1"
  if ! is_permanent_skip_slug "$slug"; then
    PERMANENT_SKIP_SLUGS="${PERMANENT_SKIP_SLUGS}${slug}"$'\n'
    PERMANENT_SKIP_COUNT=$((PERMANENT_SKIP_COUNT + 1))
  fi
}

is_skipped_slug() {
  local slug="$1"
  case "$SKIPPED_SLUGS" in
    *$'\n'"$slug"$'\n'*)
      return 0
      ;;
  esac
  return 1
}

add_skipped_slug() {
  local slug="$1"
  if ! is_skipped_slug "$slug"; then
    SKIPPED_SLUGS="${SKIPPED_SLUGS}${slug}"$'\n'
    SKIPPED_SLUG_COUNT=$((SKIPPED_SLUG_COUNT + 1))
  fi
}

detect_current_slug() {
  local include_skipped="${1:-0}"
  local rows
  rows="$(
    awk '
      function trim(s) { sub(/^[ \t]+/, "", s); sub(/[ \t]+$/, "", s); return s }
      BEGIN { FS="|" }
      /^\|[[:space:]]*[A-Z]+-[0-9]+[[:space:]]*\|/ {
        name=trim($3);
        pri=trim($4);
        st=trim($5);
        if (name != "" && pri != "" && (st == "TODO" || st == "IN_PROGRESS")) print st "\t" pri "\t" name;
      }
    ' "$PLAN_FILE"
  )"

  local in_progress_slug=""
  local best_todo_slug=""
  local best_todo_priority=999

  while IFS=$'\t' read -r st pri slug; do
    [ -n "$slug" ] || continue
    if is_permanent_skip_slug "$slug"; then
      continue
    fi
    if [ "$include_skipped" -ne 1 ] && is_skipped_slug "$slug"; then
      continue
    fi

    if [ -f "$TASKS_DIR/${slug}.done.md" ]; then
      continue
    fi

    case "$st" in
      IN_PROGRESS)
        if [ -z "$in_progress_slug" ]; then
          in_progress_slug="$slug"
        fi
        ;;
      TODO)
        local priority_num="${pri#P}"
        if ! [[ "$priority_num" =~ ^[0-9]+$ ]]; then
          priority_num=999
        fi
        if [ -z "$best_todo_slug" ] || [ "$priority_num" -lt "$best_todo_priority" ]; then
          best_todo_slug="$slug"
          best_todo_priority="$priority_num"
        fi
        ;;
    esac
  done <<< "$rows"

  if [ -n "$in_progress_slug" ]; then
    printf "%s" "$in_progress_slug"
    return 0
  fi
  if [ -n "$best_todo_slug" ]; then
    printf "%s" "$best_todo_slug"
    return 0
  fi
  return 1
}

detect_context_pack() {
  local slug="$1"
  local registry="docs/context-packs/registry.md"
  # Uses global $TASKS_DIR

  # Try slug prefix match first
  local prefix=$(echo "$slug" | cut -d'-' -f1)
  local pack=""
  if [ -f "$registry" ]; then
    pack=$(awk -F'|' -v pfx="$prefix" '
      /^\|/ && !/domain/ && !/^#/ {
        gsub(/^ +| +$/, "", $3)
        patterns = tolower($3)
        if (patterns ~ tolower(pfx)) {
          gsub(/^ +| +$/, "", $5)
          print $5
          exit
        }
      }
    ' "$registry")
  fi

  if [ -z "$pack" ]; then
    # Fallback: keyword match from task.md Goal section
    if [ -f "$TASKS_DIR/${slug}.task.md" ]; then
      local goal=$(sed -n '/^## Goal/,/^## /p' "$TASKS_DIR/${slug}.task.md" 2>/dev/null || true)
      while IFS='|' read -r _ _ _ keywords packfile _; do
        keywords=$(echo "$keywords" | tr ',' ' ')
        for kw in $keywords; do
          kw=$(echo "$kw" | tr -d ' ')
          if [ -n "$kw" ] && echo "$goal" | grep -qi "$kw"; then
            pack=$(echo "$packfile" | tr -d ' ')
            break 2
          fi
        done
      done < <(grep '|' "$registry" | grep -v 'domain' | grep -v '^#')
    fi
  fi

  # Always include core pack + domain pack if found
  echo "docs/context-packs/packs/core.md ${pack:+docs/context-packs/${pack}}"
}

detect_current_role() {
  local slug="$1"
  # Uses global $TASKS_DIR (set at line 17, default: docs/Tasks)

  # Check for feedback files FIRST (feedback overrides normal progression)

  # I-phase feedback
  if [ -f "$TASKS_DIR/${slug}.i-feedback.md" ]; then
    local verdict=$(grep -m1 'Verdict' "$TASKS_DIR/${slug}.i-feedback.md" | grep -oE 'BOUNCE|REVISE|ESCALATE')
    local cycle=$(grep -m1 'Cycle' "$TASKS_DIR/${slug}.i-feedback.md" | grep -oE '[0-9]+' | head -1)
    local cycle=$(grep -m1 'Cycle' "$TASKS_DIR/${slug}.i-feedback.md" | grep -oE '[0-9]+')
    if [ "${cycle:-0}" -ge 2 ] || [ "$verdict" = "ESCALATE" ]; then
      printf "SKIP"
      return 0
    fi
    case "$verdict" in
      BOUNCE) printf "P" ;;  # re-plan
      REVISE) printf "I" ;;  # re-implement
      *) printf "I" ;;
    esac
    return 0
  fi

  # P-phase feedback
  if [ -f "$TASKS_DIR/${slug}.p-feedback.md" ]; then
    local verdict=$(grep -m1 'Verdict' "$TASKS_DIR/${slug}.p-feedback.md" | grep -oE 'BOUNCE|REVISE|ESCALATE')
    local cycle=$(grep -m1 'Cycle' "$TASKS_DIR/${slug}.p-feedback.md" | grep -oE '[0-9]+' | head -1)
    local cycle=$(grep -m1 'Cycle' "$TASKS_DIR/${slug}.p-feedback.md" | grep -oE '[0-9]+')
    if [ "${cycle:-0}" -ge 2 ] || [ "$verdict" = "ESCALATE" ]; then
      printf "SKIP"
      return 0
    fi
    case "$verdict" in
      BOUNCE) printf "R" ;;  # re-research
      REVISE) printf "P" ;;  # re-plan
      *) printf "P" ;;
    esac
    return 0
  fi

  # R-phase feedback
  if [ -f "$TASKS_DIR/${slug}.r-feedback.md" ]; then
    local verdict=$(grep -m1 'Verdict' "$TASKS_DIR/${slug}.r-feedback.md" | grep -oE 'BOUNCE|REVISE|ESCALATE')
    local cycle=$(grep -m1 'Cycle' "$TASKS_DIR/${slug}.r-feedback.md" | grep -oE '[0-9]+')
    if [ "${cycle:-0}" -ge 2 ] || [ "$verdict" = "ESCALATE" ]; then
      printf "SKIP"
      return 0
    fi
    # R has no prior phase to bounce to; only REVISE or ESCALATE
    printf "R"
    return 0
  fi

  # Normal progression (existing logic)
  if [ ! -f "$TASKS_DIR/${slug}.task.md" ]; then printf "T"; return 0; fi
  if [ ! -f "$TASKS_DIR/${slug}.research.md" ]; then printf "R"; return 0; fi
  if [ ! -f "$TASKS_DIR/${slug}.plan.md" ]; then printf "P"; return 0; fi
  if [ ! -f "$TASKS_DIR/${slug}.done.md" ]; then printf "I"; return 0; fi
  printf "DONE"
}

detect_context_pack() {
  local slug="$1"
  local registry="docs/context-packs/registry.md"
  local packs="docs/context-packs/packs/core.md"  # always include core

  if [ ! -f "$registry" ]; then
    echo "$packs"
    return 0
  fi

  # Slug prefix match
  local prefix=$(echo "$slug" | cut -d'-' -f1)
  local match=$(grep -i "$prefix" "$registry" | grep -v '^#' | grep '|' | head -1)
  if [ -n "$match" ]; then
    local pack_file=$(echo "$match" | awk -F'|' '{gsub(/^ +| +$/,"",$5); print $5}')
    # Registry paths are relative to docs/context-packs/
    local full_path="docs/context-packs/${pack_file}"
    if [ -n "$pack_file" ] && [ -f "$full_path" ]; then
      packs="$packs $full_path"
    fi
  fi

  # Keyword fallback from task.md
  if [ "$packs" = "docs/context-packs/packs/core.md" ] && [ -f "$TASKS_DIR/${slug}.task.md" ]; then
    local goal=$(sed -n '/## Goal/,/^## /{//!p}' "$TASKS_DIR/${slug}.task.md" 2>/dev/null)
    if [ -n "$goal" ]; then
      while IFS='|' read -r _ _ _ keywords packfile _; do
        keywords=$(echo "$keywords" | tr ',' ' ')
        for kw in $keywords; do
          kw=$(echo "$kw" | tr -d ' ')
          if [ -n "$kw" ] && echo "$goal" | grep -qi "$kw"; then
            packfile=$(echo "$packfile" | tr -d ' ')
            # Registry paths are relative to docs/context-packs/
            local kw_full_path="docs/context-packs/${packfile}"
            if [ -n "$packfile" ] && [ -f "$kw_full_path" ]; then
              packs="$packs $kw_full_path"
              break 2
            fi
          fi
        done
      done < <(sed -n '/^|/,/^$/p' "$registry" | grep '^|' | grep -v 'domain')
    fi
  fi

  echo "$packs"
}

LAST_SLUG=""
SAME_SLUG_COUNT=0
load_progress_state
log_line "run_id=$RUN_ID mode=$MODE max_iterations=$REQUESTED_TOTAL_ITERATIONS max_same_slug=$MAX_SAME_SLUG max_transient_retries=$MAX_TRANSIENT_RETRIES base_sleep_sec=$RETRY_BASE_SLEEP_SEC"
if [ -n "$PROGRESS_RESET_REASON" ]; then
  log_line "$PROGRESS_RESET_REASON progress_file=$LOOP_PROGRESS_FILE"
fi
if [ -n "$LOOP_PROGRESS_FILE" ] && [ "$COMPLETED_ITERATIONS_BEFORE_RUN" -gt 0 ]; then
  log_line "resume_progress completed=$COMPLETED_ITERATIONS_BEFORE_RUN remaining=$ITERATION_TARGET_THIS_PROCESS progress_file=$LOOP_PROGRESS_FILE"
fi
if [ -n "$LOOP_PROGRESS_FILE" ] && [ "$ITERATION_TARGET_THIS_PROCESS" -le 0 ]; then
  log_line "resume_progress complete requested_total=$REQUESTED_TOTAL_ITERATIONS progress_file=$LOOP_PROGRESS_FILE"
  exit 0
fi
persist_progress_state "running"
while [ "$ITERATION" -lt "$ITERATION_TARGET_THIS_PROCESS" ]; do
  CURRENT_SLUG="$(detect_current_slug 0 || true)"
  if [ -z "$CURRENT_SLUG" ] && [ "$SKIPPED_SLUG_COUNT" -gt 0 ]; then
    log_line "all_unskipped_tasks_exhausted retrying_skipped_tasks"
    SKIPPED_SLUGS=$'\n'
    SKIPPED_SLUG_COUNT=0
    CURRENT_SLUG="$(detect_current_slug 1 || true)"
  fi
  if [ -z "$CURRENT_SLUG" ]; then
    log_line "no_eligible_task_left stopping"
    exit 0
  fi

  CURRENT_ROLE="$(detect_current_role "$CURRENT_SLUG")"
  if [ "$CURRENT_ROLE" = "SKIP" ]; then
    log_line "feedback_escalated slug=${CURRENT_SLUG} action=permanent_skip"
    add_permanent_skip_slug "$CURRENT_SLUG"
    add_skipped_slug "$CURRENT_SLUG"
    SKIPPED_BY_STUCK_COUNT=$((SKIPPED_BY_STUCK_COUNT + 1))
    log_line "feedback_skip slug=$CURRENT_SLUG role=SKIP cycle_exceeded_or_escalate"
    SAME_SLUG_COUNT=0
    LAST_SLUG=""
    continue
  fi
  if [ "$CURRENT_ROLE" = "I" ]; then
    if [ "$CURRENT_SLUG" = "$LAST_SLUG" ]; then
      SAME_SLUG_COUNT=$((SAME_SLUG_COUNT + 1))
    else
      SAME_SLUG_COUNT=1
      LAST_SLUG="$CURRENT_SLUG"
    fi

    # NOTE: only skip after MAX_SAME_SLUG consecutive I-role attempts.
    if [ "$SAME_SLUG_COUNT" -gt "$MAX_SAME_SLUG" ]; then
      add_skipped_slug "$CURRENT_SLUG"
      SKIPPED_BY_STUCK_COUNT=$((SKIPPED_BY_STUCK_COUNT + 1))
      log_line "stuck_skip slug=$CURRENT_SLUG role=I repeats=$SAME_SLUG_COUNT"
      SAME_SLUG_COUNT=0
      LAST_SLUG=""
      continue
    fi
  else
    # Deterministic progress (T/R/P): do not count toward "stuck".
    SAME_SLUG_COUNT=0
    LAST_SLUG=""
  fi

  # Drift detection: validate artifact guards before P or I dispatch
  if [ "$CURRENT_ROLE" = "P" ] && [ -f "$TASKS_DIR/${CURRENT_SLUG}.research.md" ]; then
    drift_exit=0
    drift_output=$(bash "$(dirname "$0")/check_drift_guards.sh" "${TASKS_DIR}/${CURRENT_SLUG}.research.md" "$REPO_ROOT" 2>&1) || drift_exit=$?
    if [ "$drift_exit" -ne 0 ]; then
      echo "[drift] Research stale for ${CURRENT_SLUG}: ${drift_output}"
      # Create feedback artifact bouncing to R
      cat > "${TASKS_DIR}/${CURRENT_SLUG}.p-feedback.md" <<DRIFTEOF
# Feedback: ${CURRENT_SLUG}

## Metadata
- **Phase reviewed**: P
- **Reviewer**: automated/drift-detection
- **Verdict**: BOUNCE
- **Cycle**: 1 of 2 max

## Feedback Items

### Drift Detected
- **Issue**: Drift guards failed -- artifact built on stale code state
- **Details**:
${drift_output}

## Routing
BOUNCE to prior phase. Re-run with current code state.
DRIFTEOF
      continue
    fi
  fi

  if [ "$CURRENT_ROLE" = "I" ] && [ -f "$TASKS_DIR/${CURRENT_SLUG}.plan.md" ]; then
    drift_exit=0
    drift_output=$(bash "$(dirname "$0")/check_drift_guards.sh" "${TASKS_DIR}/${CURRENT_SLUG}.plan.md" "$REPO_ROOT" 2>&1) || drift_exit=$?
    if [ "$drift_exit" -ne 0 ]; then
      echo "[drift] Plan stale for ${CURRENT_SLUG}: ${drift_output}"
      cat > "${TASKS_DIR}/${CURRENT_SLUG}.i-feedback.md" <<DRIFTEOF
# Feedback: ${CURRENT_SLUG}

## Metadata
- **Phase reviewed**: I
- **Reviewer**: automated/drift-detection
- **Verdict**: BOUNCE
- **Cycle**: 1 of 2 max

## Feedback Items

### Drift Detected
- **Issue**: Drift guards failed -- artifact built on stale code state
- **Details**:
${drift_output}

## Routing
BOUNCE to prior phase. Re-run with current code state.
DRIFTEOF
      continue
    fi
  fi

  log_line "iteration=$((TOTAL_COMPLETED_ITERATIONS + 1))/$REQUESTED_TOTAL_ITERATIONS mode=$MODE slug=$CURRENT_SLUG role=$CURRENT_ROLE i_repeat=$SAME_SLUG_COUNT/$MAX_SAME_SLUG"

  # CE-09: Pre-phase drift detection
  if [ "$CURRENT_ROLE" = "P" ] && [ -f "${TASKS_DIR}/${CURRENT_SLUG}.research.md" ]; then
    if [ -f "${REPO_ROOT:-.}/check_drift_guards.sh" ]; then
      drift_output=$(bash "${REPO_ROOT:-.}/check_drift_guards.sh" "${TASKS_DIR}/${CURRENT_SLUG}.research.md" "${REPO_ROOT:-.}" 2>&1) || {
        log_line "drift_detected phase=P slug=${CURRENT_SLUG} details='${drift_output}'"
        # Compute drift cycle: increment if a resolved archive exists
        drift_cycle=1
        if [ -f "${TASKS_DIR}/${CURRENT_SLUG}.p-feedback.resolved" ]; then
          prev_cycle=""
          prev_cycle=$(grep -m1 'Cycle' "${TASKS_DIR}/${CURRENT_SLUG}.p-feedback.resolved" | grep -oE '[0-9]+' | head -1 || echo 0)
          drift_cycle=$(( ${prev_cycle:-0} + 1 ))
        fi
        # Create feedback artifact bouncing to R
        cat > "${TASKS_DIR}/${CURRENT_SLUG}.p-feedback.md" <<DRIFT_EOF
# Feedback: ${CURRENT_SLUG}

## Metadata
- **Phase reviewed**: P
- **Artifact**: ${CURRENT_SLUG}.research.md
- **Reviewer**: automated/drift-detection
- **Verdict**: BOUNCE
- **Cycle**: ${drift_cycle} of 2 max

## Feedback Items

### Drift Detected
- **Issue**: Drift guards failed - research built on stale code state
- **Details**:
${drift_output}

## Routing
BOUNCE to R-role. Re-run research with current code state.
DRIFT_EOF
        continue
      }
    fi
  fi

  if [ "$CURRENT_ROLE" = "I" ] && [ -f "${TASKS_DIR}/${CURRENT_SLUG}.plan.md" ]; then
    if [ -f "${REPO_ROOT:-.}/check_drift_guards.sh" ]; then
      drift_output=$(bash "${REPO_ROOT:-.}/check_drift_guards.sh" "${TASKS_DIR}/${CURRENT_SLUG}.plan.md" "${REPO_ROOT:-.}" 2>&1) || {
        log_line "drift_detected phase=I slug=${CURRENT_SLUG} details='${drift_output}'"
        # Compute drift cycle: increment if a resolved archive exists
        drift_cycle=1
        if [ -f "${TASKS_DIR}/${CURRENT_SLUG}.i-feedback.resolved" ]; then
          prev_cycle=""
          prev_cycle=$(grep -m1 'Cycle' "${TASKS_DIR}/${CURRENT_SLUG}.i-feedback.resolved" | grep -oE '[0-9]+' | head -1 || echo 0)
          drift_cycle=$(( ${prev_cycle:-0} + 1 ))
        fi
        cat > "${TASKS_DIR}/${CURRENT_SLUG}.i-feedback.md" <<DRIFT_EOF
# Feedback: ${CURRENT_SLUG}

## Metadata
- **Phase reviewed**: I
- **Artifact**: ${CURRENT_SLUG}.plan.md
- **Reviewer**: automated/drift-detection
- **Verdict**: BOUNCE
- **Cycle**: ${drift_cycle} of 2 max

## Feedback Items

### Drift Detected
- **Issue**: Drift guards failed - plan built on stale code state
- **Details**:
${drift_output}

## Routing
BOUNCE to P-role. Re-run plan with current code state.
DRIFT_EOF
        continue
      }
    fi
  fi
  # Compute feedback state for prompt injection
  FEEDBACK_FILE=""
  FEEDBACK_CYCLE=0
  for fb in "$TASKS_DIR/${CURRENT_SLUG}".*-feedback.md; do
    if [ -f "$fb" ]; then
      FEEDBACK_FILE="$fb"
      FEEDBACK_CYCLE=$(grep -m1 'Cycle' "$fb" | grep -oE '[0-9]+')
      break
    fi
  done

  ATTEMPT=0
  # CE-08: Detect feedback cycle
  FEEDBACK_CYCLE=0
  FEEDBACK_FILE="none"
  if [ -f "$TASKS_DIR/${CURRENT_SLUG}.p-feedback.md" ]; then
    FEEDBACK_FILE="$TASKS_DIR/${CURRENT_SLUG}.p-feedback.md"
    FEEDBACK_CYCLE=$(grep -m1 'Cycle' "$FEEDBACK_FILE" | grep -oE '[0-9]+' | head -1 || echo 1)
  elif [ -f "$TASKS_DIR/${CURRENT_SLUG}.i-feedback.md" ]; then
    FEEDBACK_FILE="$TASKS_DIR/${CURRENT_SLUG}.i-feedback.md"
    FEEDBACK_CYCLE=$(grep -m1 'Cycle' "$FEEDBACK_FILE" | grep -oE '[0-9]+' | head -1 || echo 1)
  fi
  # CE-10: Load context pack content
  CONTEXT_PACKS=$(detect_context_pack "$CURRENT_SLUG")
  PACK_CONTENT=""
  for pack in $CONTEXT_PACKS; do
    if [ -f "$pack" ]; then
      PACK_CONTENT="${PACK_CONTENT}
--- Context Pack: ${pack} ---
$(cat "$pack")
"
    fi
  done
  while true; do
    TMP_LOG="$(mktemp)"

    # Load context pack content
    CONTEXT_PACKS=$(detect_context_pack "$CURRENT_SLUG")
    PACK_CONTENT=""
    for pack in $CONTEXT_PACKS; do
      if [ -f "$pack" ]; then
        PACK_CONTENT="${PACK_CONTENT}

--- Context Pack: ${pack} ---
$(cat "$pack")
"
      fi
    done

    if {
      cat <<EOF
The shell loop has already selected the task for this run. Treat this selection as authoritative.
ROLE=$CURRENT_ROLE SLUG=$CURRENT_SLUG
PLAN_FILE=$PLAN_FILE
TASKS_DIR=$TASKS_DIR
FEEDBACK_CYCLE=${FEEDBACK_CYCLE}
FEEDBACK_FILE=${FEEDBACK_FILE:-none}
PROMPT_FILE=$PROMPT_FILE
FEEDBACK_CYCLE=${FEEDBACK_CYCLE:-0}
FEEDBACK_FILE=${FEEDBACK_FILE:-none}
CONTEXT_PACK_CONTENT:
${PACK_CONTENT}
CONTEXT_PACKS=${CONTEXT_PACKS}
Do not re-derive or override ROLE/SLUG from the injected PLAN_FILE. Read the plan only for source material about slug "$CURRENT_SLUG".
Path mapping rules for this run are authoritative:
- If PROMPT_FILE mentions IMPLEMENTATION_PLAN.md, use PLAN_FILE above.
- If PROMPT_FILE mentions docs/Tasks/<slug>.task.md|.research.md|.plan.md|.done.md, use TASKS_DIR/<slug>.* above.
- Never read or write per-task state files outside TASKS_DIR unless TASKS_DIR itself points there.

EOF
      # Append context pack content after heredoc
      if [ -n "$PACK_CONTENT" ]; then
        echo "$PACK_CONTENT"
      fi
      cat "$PROMPT_FILE"
    } | if [ "${USE_CODEX:-0}" = "1" ]; then
        "$CODEX_BIN" exec ${CODEX_FLAGS} --model "${CODEX_MODEL:-gpt-5.3-codex-spark}" -
      else
        "$CLAUDE_BIN" -p \
          --dangerously-skip-permissions \
          --no-session-persistence \
          --output-format=stream-json \
          --settings "$CLAUDE_SETTINGS_FILE" \
          --effort "$CLAUDE_EFFORT" \
          --verbose
      fi 2>&1 | tee "$TMP_LOG" | tee -a "$RUN_LOG_FILE"; then
      CLAUDE_SUCCESS_COUNT=$((CLAUDE_SUCCESS_COUNT + 1))
      rm -f "$TMP_LOG"
      # Archive consumed feedback files after successful phase
      for fb in "$TASKS_DIR/${CURRENT_SLUG}".*-feedback.md; do
        if [ -f "$fb" ]; then
          mv "$fb" "${fb%.md}.resolved"
        fi
      done
      break
    fi

    ATTEMPT=$((ATTEMPT + 1))
    if [ "$ATTEMPT" -le "$MAX_TRANSIENT_RETRIES" ]; then
      if is_rate_limit_error "$TMP_LOG"; then
        RATE_LIMIT_RETRY_COUNT=$((RATE_LIMIT_RETRY_COUNT + 1))
        SLEEP_SEC=$((RETRY_BASE_SLEEP_SEC * ATTEMPT))
        log_line "transient_rate_limit slug=$CURRENT_SLUG attempt=$ATTEMPT/$MAX_TRANSIENT_RETRIES sleep_sec=$SLEEP_SEC"
        rm -f "$TMP_LOG"
        sleep "$SLEEP_SEC"
        continue
      fi
      if is_network_transient_error "$TMP_LOG"; then
        NETWORK_RETRY_COUNT=$((NETWORK_RETRY_COUNT + 1))
        SLEEP_SEC=$((RETRY_BASE_SLEEP_SEC * ATTEMPT))
        log_line "transient_network_error slug=$CURRENT_SLUG attempt=$ATTEMPT/$MAX_TRANSIENT_RETRIES sleep_sec=$SLEEP_SEC"
        rm -f "$TMP_LOG"
        sleep "$SLEEP_SEC"
        continue
      fi
      if is_provider_transient_error "$TMP_LOG"; then
        PROVIDER_RETRY_COUNT=$((PROVIDER_RETRY_COUNT + 1))
        SLEEP_SEC=$((RETRY_BASE_SLEEP_SEC * ATTEMPT))
        log_line "transient_provider_error slug=$CURRENT_SLUG attempt=$ATTEMPT/$MAX_TRANSIENT_RETRIES sleep_sec=$SLEEP_SEC"
        rm -f "$TMP_LOG"
        sleep "$SLEEP_SEC"
        continue
      fi
    fi

    if is_rate_limit_error "$TMP_LOG"; then
      RATE_LIMIT_FATAL_COUNT=$((RATE_LIMIT_FATAL_COUNT + 1))
      log_line "fatal_rate_limit slug=$CURRENT_SLUG attempts_exhausted=$ATTEMPT"
    elif is_network_transient_error "$TMP_LOG"; then
      NETWORK_FATAL_COUNT=$((NETWORK_FATAL_COUNT + 1))
      log_line "fatal_network_error slug=$CURRENT_SLUG attempts_exhausted=$ATTEMPT"
    elif is_provider_transient_error "$TMP_LOG"; then
      PROVIDER_FATAL_COUNT=$((PROVIDER_FATAL_COUNT + 1))
      log_line "fatal_provider_error slug=$CURRENT_SLUG attempts_exhausted=$ATTEMPT"
    else
      OTHER_FATAL_COUNT=$((OTHER_FATAL_COUNT + 1))
      log_line "fatal_non_transient slug=$CURRENT_SLUG attempt=$ATTEMPT"
    fi
    rm -f "$TMP_LOG"
    log_line "claude_run_failed stopping"
    exit 1
  done
  # CE-08: Archive consumed feedback after successful phase
  case "$CURRENT_ROLE" in
    P)
      if [ -f "$TASKS_DIR/${CURRENT_SLUG}.p-feedback.md" ]; then
        mv "$TASKS_DIR/${CURRENT_SLUG}.p-feedback.md" "$TASKS_DIR/${CURRENT_SLUG}.p-feedback.resolved"
        log_line "feedback_archived slug=${CURRENT_SLUG} type=p"
      fi
      ;;
    I)
      if [ -f "$TASKS_DIR/${CURRENT_SLUG}.i-feedback.md" ]; then
        mv "$TASKS_DIR/${CURRENT_SLUG}.i-feedback.md" "$TASKS_DIR/${CURRENT_SLUG}.i-feedback.resolved"
        log_line "feedback_archived slug=${CURRENT_SLUG} type=i"
      fi
      ;;
    R)
      # R-role feedback comes via P-role bounce; archive on R completion
      if [ -f "$TASKS_DIR/${CURRENT_SLUG}.p-feedback.md" ]; then
        mv "$TASKS_DIR/${CURRENT_SLUG}.p-feedback.md" "$TASKS_DIR/${CURRENT_SLUG}.p-feedback.resolved"
        log_line "feedback_archived slug=${CURRENT_SLUG} type=p-on-r-complete"
      fi
      # Invalidate stale plan.md from bounce re-run
      rm -f "$TASKS_DIR/${CURRENT_SLUG}.plan.md"
      ;;
  esac
  ITERATION=$((ITERATION + 1))
  TOTAL_COMPLETED_ITERATIONS=$((COMPLETED_ITERATIONS_BEFORE_RUN + ITERATION))
  persist_progress_state "running"
done
