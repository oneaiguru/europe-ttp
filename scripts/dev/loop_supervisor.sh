#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/dev/loop_supervisor.sh [options] -- <loop_command> [args...]
  scripts/dev/loop_supervisor.sh --status [session_state_file]

Run a loop script with supervisor-level stall and failure recovery.

Required:
  -- <loop_command> [args...]     Command that starts the loop.

Optional environment variables:
  SUPERVISOR_MAX_RESTARTS            Maximum restart attempts after a failed run (default: 10)
  SUPERVISOR_STALL_TIMEOUT_SECONDS    No-progress timeout before restart, seconds (default: 600)
                                    Maximum practical value capped at 1800 (30 minutes)
  SUPERVISOR_BACKOFF_SECONDS          Delay before restart after failure, seconds (default: 60)
  SUPERVISOR_MAX_RUNTIME_SECONDS      Optional hard stop per run; 0 disables (default: 0)
  SUPERVISOR_POLL_SECONDS             Supervisor polling interval (default: 15)
  SUPERVISOR_NO_DONE_ITERATION_THRESHOLD
                                     Alert when this many new iterations appear with no new done files
                                     (default: 40)
  SUPERVISOR_TASKS_DIR                Tasks directory to scan for *.done.md (default: ${TASKS_DIR:-docs/Tasks})
  SUPERVISOR_STATE_DIR                Supervisor state/log directory (default: .claude-trace/loop-supervisor)
  SUPERVISOR_SESSION_ID               Optional stable session id for log grouping
  SUPERVISOR_NAME                     Optional run label (default: basename of loop command)
  SUPERVISOR_NAME_SUFFIX              Optional suffix for default session id
  SUPERVISOR_RUN_LOG                  Optional path for supervisor event log
  SUPERVISOR_STATE_FILE               Optional path for supervisor state file

Optional companion:
  scripts/dev/loop_supervisor_status.sh to inspect the latest session state.
USAGE
}

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  usage
  exit 0
fi

if [ "${1:-}" = "--status" ]; then
  status_file="${2:-${SUPERVISOR_STATE_FILE:-}}"
  if [ -z "$status_file" ]; then
    status_file="${SUPERVISOR_STATE_DIR:-.claude-trace/loop-supervisor}/latest.state"
  fi
  if [ ! -f "$status_file" ]; then
    echo "No supervisor state file found at: $status_file" >&2
    exit 1
  fi

  echo "Loop supervisor status:"
  echo "----------------------"
  sed -n '1,200p' "$status_file"
  exit 0
fi

if [ "${1:-}" != "--" ]; then
  echo "Error: expected -- before loop command." >&2
  usage
  exit 2
fi
shift

if [ "$#" -eq 0 ]; then
  echo "Error: missing loop command after --." >&2
  usage
  exit 2
fi

LOOP_CMD=("$@")
if [ ! -x "${LOOP_CMD[0]}" ]; then
  if ! command -v "${LOOP_CMD[0]}" >/dev/null 2>&1; then
    echo "Error: loop command not found or not executable: ${LOOP_CMD[0]}" >&2
    exit 2
  fi
fi

SUPERVISOR_MAX_RESTARTS="${SUPERVISOR_MAX_RESTARTS:-10}"
SUPERVISOR_STALL_TIMEOUT_SECONDS="${SUPERVISOR_STALL_TIMEOUT_SECONDS:-600}"
SUPERVISOR_BACKOFF_SECONDS="${SUPERVISOR_BACKOFF_SECONDS:-60}"
SUPERVISOR_MAX_RUNTIME_SECONDS="${SUPERVISOR_MAX_RUNTIME_SECONDS:-0}"
SUPERVISOR_POLL_SECONDS="${SUPERVISOR_POLL_SECONDS:-15}"
SUPERVISOR_NO_DONE_ITERATION_THRESHOLD="${SUPERVISOR_NO_DONE_ITERATION_THRESHOLD:-40}"
SUPERVISOR_TASKS_DIR="${SUPERVISOR_TASKS_DIR:-${TASKS_DIR:-docs/Tasks}}"
SUPERVISOR_STATE_DIR="${SUPERVISOR_STATE_DIR:-.claude-trace/loop-supervisor}"
SUPERVISOR_NAME="${SUPERVISOR_NAME:-$(basename "${LOOP_CMD[0]}")}"
SUPERVISOR_NAME="$(printf '%s' "$SUPERVISOR_NAME" | tr '[:space:]' '_' | tr -s '_')"
SUPERVISOR_NAME_SUFFIX="${SUPERVISOR_NAME_SUFFIX:-$(date -u +%Y%m%dT%H%M%SZ)}"

validate_non_negative_int() {
  local var_name="$1"
  local value="$2"
  if ! [[ "$value" =~ ^[0-9]+$ ]]; then
    echo "Error: ${var_name} must be a non-negative integer, got: ${value}" >&2
    exit 2
  fi
}

validate_non_negative_int SUPERVISOR_MAX_RESTARTS "$SUPERVISOR_MAX_RESTARTS"
validate_non_negative_int SUPERVISOR_STALL_TIMEOUT_SECONDS "$SUPERVISOR_STALL_TIMEOUT_SECONDS"
validate_non_negative_int SUPERVISOR_BACKOFF_SECONDS "$SUPERVISOR_BACKOFF_SECONDS"
validate_non_negative_int SUPERVISOR_MAX_RUNTIME_SECONDS "$SUPERVISOR_MAX_RUNTIME_SECONDS"
validate_non_negative_int SUPERVISOR_POLL_SECONDS "$SUPERVISOR_POLL_SECONDS"
validate_non_negative_int SUPERVISOR_NO_DONE_ITERATION_THRESHOLD "$SUPERVISOR_NO_DONE_ITERATION_THRESHOLD"

if [ "$SUPERVISOR_STALL_TIMEOUT_SECONDS" -eq 0 ]; then
  echo "Error: SUPERVISOR_STALL_TIMEOUT_SECONDS must be at least 1 second." >&2
  exit 2
fi

if [ "$SUPERVISOR_STALL_TIMEOUT_SECONDS" -gt 1800 ]; then
  echo "Info: SUPERVISOR_STALL_TIMEOUT_SECONDS capped from ${SUPERVISOR_STALL_TIMEOUT_SECONDS}s to 1800s (practical upper bound)." >&2
  SUPERVISOR_STALL_TIMEOUT_SECONDS=1800
fi

if [ "$SUPERVISOR_POLL_SECONDS" -lt 1 ]; then
  echo "Error: SUPERVISOR_POLL_SECONDS must be >= 1." >&2
  exit 2
fi

SUPERVISOR_SESSION_ID="${SUPERVISOR_SESSION_ID:-${SUPERVISOR_NAME}-${SUPERVISOR_NAME_SUFFIX}}"
SUPERVISOR_SESSION_DIR="${SUPERVISOR_STATE_DIR}/${SUPERVISOR_SESSION_ID}"
SUPERVISOR_RUN_DIR="${SUPERVISOR_SESSION_DIR}/runs"
mkdir -p "$SUPERVISOR_RUN_DIR"

SUPERVISOR_LOG_FILE="${SUPERVISOR_RUN_LOG:-${SUPERVISOR_SESSION_DIR}/supervisor.log}"
SUPERVISOR_STATE_FILE="${SUPERVISOR_STATE_FILE:-${SUPERVISOR_SESSION_DIR}/state}"
SUPERVISOR_SESSION_STATE="${SUPERVISOR_SESSION_DIR}/latest.state"
SUPERVISOR_GLOBAL_LATEST_STATE="${SUPERVISOR_STATE_DIR%/}/latest.state"

SUPER_SESSION_STARTED_UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
LOOP_COMMAND_DESC="$(printf '%q ' "${LOOP_CMD[@]}" )"
LOOP_COMMAND_DESC="${LOOP_COMMAND_DESC% }"

normalize_timestamp_utc() {
  local value="$1"
  if [[ "$value" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]]; then
    echo "$value"
  else
    date -u +%Y-%m-%dT%H:%M:%SZ
  fi
}

log_event() {
  local msg="$1"
  printf '[loop-supervisor][%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$msg" | tee -a "$SUPERVISOR_LOG_FILE" >&2
}

write_state() {
  local status="$1"
  local run_seq="$2"
  local run_id="$3"
  local child_pid="$4"
  local child_started="$5"
  local child_exit="$6"
  local run_reason="$7"
  local iterations="$8"
  local done_count="$9"
  local done_delta="${10}"
  local anomaly="${11}"
  local last_progress="$(normalize_timestamp_utc "$12")"
  local state_tmp="${SUPERVISOR_STATE_FILE}.tmp"

  cat > "$state_tmp" <<EOF_STATE
SUPERVISOR_SESSION_ID=${SUPERVISOR_SESSION_ID}
SUPERVISOR_NAME=${SUPERVISOR_NAME}
SUPERVISOR_STATE_DIR=${SUPERVISOR_STATE_DIR}
SUPERVISOR_SESSION_STARTED_UTC=${SUPER_SESSION_STARTED_UTC}
LOOP_COMMAND=${LOOP_COMMAND_DESC}
SUPERVISOR_STATUS=${status}
SUPERVISOR_MAX_RESTARTS=${SUPERVISOR_MAX_RESTARTS}
SUPERVISOR_MAX_RUNTIME_SECONDS=${SUPERVISOR_MAX_RUNTIME_SECONDS}
SUPERVISOR_STALL_TIMEOUT_SECONDS=${SUPERVISOR_STALL_TIMEOUT_SECONDS}
SUPERVISOR_NO_DONE_ITERATION_THRESHOLD=${SUPERVISOR_NO_DONE_ITERATION_THRESHOLD}
SUPERVISOR_POLL_SECONDS=${SUPERVISOR_POLL_SECONDS}
SUPERVISOR_TASKS_DIR=${SUPERVISOR_TASKS_DIR}
SUPERVISOR_RESTART_COUNT=${SUPERVISOR_RESTART_COUNT}
SUPERVISOR_CURRENT_RUN_SEQ=${run_seq}
SUPERVISOR_CURRENT_RUN_ID=${run_id}
SUPERVISOR_CURRENT_CHILD_PID=${child_pid}
SUPERVISOR_CURRENT_CHILD_STARTED_UTC=${child_started}
SUPERVISOR_CURRENT_CHILD_EXIT_CODE=${child_exit}
SUPERVISOR_CURRENT_CHILD_REASON=${run_reason}
SUPERVISOR_LAST_ITERATION=${iterations}
SUPERVISOR_LAST_DONE_COUNT=${done_count}
SUPERVISOR_LAST_DONE_DELTA=${done_delta}
SUPERVISOR_NO_DONE_ANOMALY_ACTIVE=${anomaly}
SUPERVISOR_LAST_MEANINGFUL_PROGRESS_UTC=${last_progress}
SUPERVISOR_UPDATED_UTC=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF_STATE
  mv "$state_tmp" "$SUPERVISOR_STATE_FILE"
  cp "$SUPERVISOR_STATE_FILE" "$SUPERVISOR_SESSION_STATE"
  mkdir -p "$SUPERVISOR_STATE_DIR"
  ln -sfn "$(pwd -P)/${SUPERVISOR_SESSION_STATE}" "$SUPERVISOR_GLOBAL_LATEST_STATE"
}

extract_iteration() {
  local log_file="$1"
  if [ ! -r "$log_file" ]; then
    echo 0
    return
  fi
  awk '
    /iteration=/ {
      line = $0
      sub(/.*iteration=/, "", line)
      if (match(line, /^[0-9]+/)) {
        iter = substr(line, RSTART, RLENGTH) + 0
        if (iter > max_iter) {
          max_iter = iter
        }
      }
    }
    END { print (max_iter + 0) }
  ' "$log_file" 2>/dev/null
}

snapshot_done_files() {
  local file="$1"
  if [ ! -d "$SUPERVISOR_TASKS_DIR" ]; then
    : > "$file"
    return
  fi
  find "$SUPERVISOR_TASKS_DIR" -maxdepth 1 -type f -name '*.done.md' -print | sort > "$file"
}

count_lines() {
  local file="$1"
  if [ ! -f "$file" ]; then
    echo 0
    return
  fi
  local count
  count="$(wc -l < "$file" | tr -d '[:space:]')"
  echo "${count:-0}"
}

kill_tree() {
  local sig="$1" pid="$2"
  pkill "-${sig}" -P "$pid" 2>/dev/null || true
  kill "-${sig}" "$pid" 2>/dev/null || true
}

terminate_child() {
  local pid="$1"
  local reason="$2"

  if ! kill -0 "$pid" 2>/dev/null; then
    return
  fi

  log_event "run_control terminate pid=${pid} reason=${reason}"
  kill_tree INT "$pid"

  local waited=0
  while kill -0 "$pid" 2>/dev/null && [ "$waited" -lt 6 ]; do
    sleep 1
    waited=$((waited + 1))
  done

  if kill -0 "$pid" 2>/dev/null; then
    kill_tree TERM "$pid"
    waited=0
    while kill -0 "$pid" 2>/dev/null && [ "$waited" -lt 6 ]; do
      sleep 1
      waited=$((waited + 1))
    done
  fi

  if kill -0 "$pid" 2>/dev/null; then
    kill_tree KILL "$pid"
  fi
}

SUPERVISOR_RESTART_COUNT=0
RUN_SEQUENCE=0
ACTIVE_CHILD_PID=""
STOP_REQUESTED=0
STOP_REASON=""

handle_stop_signal() {
  STOP_REQUESTED=1
  STOP_REASON="$1"
  if [ -n "$ACTIVE_CHILD_PID" ]; then
    terminate_child "$ACTIVE_CHILD_PID" "${STOP_REASON}"
  fi
}

trap 'handle_stop_signal INT' INT
trap 'handle_stop_signal TERM' TERM

run_supervised_once() {
  local run_id="$1"
  RUN_SEQUENCE=$((RUN_SEQUENCE + 1))

  local run_log_file="${SUPERVISOR_RUN_DIR}/run_${RUN_SEQUENCE}_${run_id}.log"
  local run_stats_file="${SUPERVISOR_RUN_DIR}/run_${RUN_SEQUENCE}_${run_id}.stats"
  local done_seen="${SUPERVISOR_RUN_DIR}/run_${RUN_SEQUENCE}.done.seen"
  local done_current="${SUPERVISOR_RUN_DIR}/run_${RUN_SEQUENCE}.done.current"
  local run_started_utc
  local run_started_epoch
  local last_progress_utc
  local last_progress_epoch
  local last_measured_iter=0
  local done_count_before=0
  local done_count_after=0
  local iter_before=0
  local iter_after=0
  local last_done_iter=0
  local no_done_anomaly_reported=0
  local child_exit_code=0
  local run_reason="running"

  : > "$run_log_file"
  snapshot_done_files "$done_seen"
  done_count_before="$(count_lines "$done_seen")"
  last_done_iter=0
  done_count_after="$done_count_before"

  run_started_utc="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  run_started_epoch="$(date -u +%s)"
  last_progress_utc="$run_started_utc"
  last_progress_epoch="$run_started_epoch"

  write_state "running" "$RUN_SEQUENCE" "$run_id" "-" "$run_started_utc" "-" "$run_reason" "$last_measured_iter" "$done_count_after" "0" "0" "$last_progress_utc"

  log_event "run_start seq=${RUN_SEQUENCE} run_id=${run_id} command=${LOOP_COMMAND_DESC} log=${run_log_file}"

  export RUN_ID="$run_id"
  export RUN_LOG_FILE="$run_log_file"
  export RUN_STATS_FILE="$run_stats_file"

  ("${LOOP_CMD[@]}") >"$run_log_file" 2>&1 &
  ACTIVE_CHILD_PID=$!
  write_state "running" "$RUN_SEQUENCE" "$run_id" "$ACTIVE_CHILD_PID" "$run_started_utc" "-" "$run_reason" "$last_measured_iter" "$done_count_after" "0" "0" "$last_progress_utc"

  while :; do
    if ! kill -0 "$ACTIVE_CHILD_PID" 2>/dev/null; then
      break
    fi

    if [ "$STOP_REQUESTED" -eq 1 ]; then
      run_reason="operator_${STOP_REASON}"
      terminate_child "$ACTIVE_CHILD_PID" "$run_reason"
      break
    fi

    sleep "$SUPERVISOR_POLL_SECONDS"

    local now_epoch
    local now_utc
    local current_iter
    local current_done_count
    local done_delta
    local iterations_since_done

    now_epoch="$(date -u +%s)"
    now_utc="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    current_iter="$(extract_iteration "$run_log_file")"
    snapshot_done_files "$done_current"
    current_done_count="$(count_lines "$done_current")"

    if [ "$current_iter" -gt "$last_measured_iter" ]; then
      last_measured_iter="$current_iter"
      last_progress_epoch="$now_epoch"
      last_progress_utc="$now_utc"
      write_state "running" "$RUN_SEQUENCE" "$run_id" "$ACTIVE_CHILD_PID" "$run_started_utc" "-" "$run_reason" "$last_measured_iter" "$current_done_count" "0" "$no_done_anomaly_reported" "$last_progress_utc"
    fi

    if [ "$current_done_count" -gt "$done_count_after" ]; then
      done_delta=$((current_done_count - done_count_after))
      cp "$done_current" "$done_seen"
      last_done_iter="$current_iter"
      no_done_anomaly_reported=0
      last_progress_epoch="$now_epoch"
      last_progress_utc="$now_utc"
      log_event "run_progress seq=${RUN_SEQUENCE} run_id=${run_id} new_done=${done_delta} total_done=${current_done_count} iter=${current_iter}"
      write_state "running" "$RUN_SEQUENCE" "$run_id" "$ACTIVE_CHILD_PID" "$run_started_utc" "-" "$run_reason" "$current_iter" "$current_done_count" "$done_delta" "0" "$last_progress_utc"
      done_count_after="$current_done_count"
    fi

    iterations_since_done=$((current_iter - last_done_iter))
    if [ "$iterations_since_done" -ge "$SUPERVISOR_NO_DONE_ITERATION_THRESHOLD" ] && [ "$no_done_anomaly_reported" -eq 0 ]; then
      log_event "anomaly seq=${RUN_SEQUENCE} run_id=${run_id} no_done_iters=${iterations_since_done} threshold=${SUPERVISOR_NO_DONE_ITERATION_THRESHOLD} iter=${current_iter} done=${current_done_count}"
      no_done_anomaly_reported=1
      write_state "running" "$RUN_SEQUENCE" "$run_id" "$ACTIVE_CHILD_PID" "$run_started_utc" "-" "$run_reason" "$current_iter" "$current_done_count" "0" "1" "$last_progress_utc"
    fi

    if [ "$SUPERVISOR_MAX_RUNTIME_SECONDS" -gt 0 ]; then
      if [ $((now_epoch - run_started_epoch)) -ge "$SUPERVISOR_MAX_RUNTIME_SECONDS" ]; then
        run_reason="runtime_limit"
        terminate_child "$ACTIVE_CHILD_PID" "$run_reason"
        break
      fi
    fi

    if [ $((now_epoch - last_progress_epoch)) -ge "$SUPERVISOR_STALL_TIMEOUT_SECONDS" ]; then
      run_reason="stall"
      terminate_child "$ACTIVE_CHILD_PID" "$run_reason"
      break
    fi
  done

  if wait "$ACTIVE_CHILD_PID"; then
    child_exit_code=0
  else
    child_exit_code="$?"
  fi

  snapshot_done_files "$done_current"
  current_done_count="$(count_lines "$done_current")"
  iter_after="$(extract_iteration "$run_log_file")"
  local iter_delta done_delta_total
  iter_delta=$((iter_after - iter_before))
  done_delta_total=$((current_done_count - done_count_after))
  local run_duration
  run_duration=$(( $(date -u +%s) - run_started_epoch ))

  if [ "$run_reason" = "running" ]; then
    if [ "$child_exit_code" -eq 0 ]; then
      run_reason="exit"
    else
      run_reason="exit_code_${child_exit_code}"
    fi
  fi

  write_state "finished" "$RUN_SEQUENCE" "$run_id" "$ACTIVE_CHILD_PID" "$run_started_utc" "$child_exit_code" "$run_reason" "$iter_after" "$current_done_count" "$done_delta_total" "$no_done_anomaly_reported" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  log_event "run_end seq=${RUN_SEQUENCE} run_id=${run_id} reason=${run_reason} exit_code=${child_exit_code} duration_seconds=${run_duration} iter_delta=${iter_delta} done_delta=${done_delta_total}"

  if [ "$STOP_REQUESTED" -eq 1 ]; then
    return 130
  fi

  return "$child_exit_code"
}

SUPERVISOR_RESTART_COUNT=0
RUN_SEQUENCE=0
mkdir -p "$(dirname "$SUPERVISOR_LOG_FILE")"
: > "$SUPERVISOR_LOG_FILE"
write_state "starting" "$RUN_SEQUENCE" "-" "-" "-" "-" "bootstrap" "0" "0" "0" "0" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
log_event "supervisor_start session=${SUPERVISOR_SESSION_ID} command=${LOOP_COMMAND_DESC} max_restarts=${SUPERVISOR_MAX_RESTARTS} stall_timeout_seconds=${SUPERVISOR_STALL_TIMEOUT_SECONDS}"

while :; do
  run_id="$(date -u +%Y%m%dT%H%M%SZ)-$(printf 'r%04d' "$RUN_SEQUENCE")"
  set +e
  run_supervised_once "$run_id"
  run_exit_code="$?"
  set -e

  if [ "$run_exit_code" -eq 0 ]; then
    log_event "supervisor_success run_id=${run_id}"
    exit 0
  fi

  if [ "$STOP_REQUESTED" -eq 1 ]; then
    log_event "supervisor_stop requested run_id=${run_id} reason=${STOP_REASON}"
    exit 130
  fi

  if [ "$SUPERVISOR_MAX_RESTARTS" -eq 0 ]; then
    log_event "supervisor_norestart run_id=${run_id} exit_code=${run_exit_code}"
    exit "$run_exit_code"
  fi

  SUPERVISOR_RESTART_COUNT=$((SUPERVISOR_RESTART_COUNT + 1))

  if [ "$SUPERVISOR_RESTART_COUNT" -gt "$SUPERVISOR_MAX_RESTARTS" ]; then
    log_event "supervisor_exhausted_restarts run_id=${run_id} total_restarts=${SUPERVISOR_RESTART_COUNT} exit_code=${run_exit_code}"
    exit "$run_exit_code"
  fi

  log_event "supervisor_restart run_id=${run_id} restart_count=${SUPERVISOR_RESTART_COUNT}/${SUPERVISOR_MAX_RESTARTS} backoff_seconds=${SUPERVISOR_BACKOFF_SECONDS}"
  write_state "restarting" "$RUN_SEQUENCE" "$run_id" "-" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$run_exit_code" "restart" "0" "0" "0" "0" "$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  if [ "$SUPERVISOR_BACKOFF_SECONDS" -gt 0 ]; then
    sleep "$SUPERVISOR_BACKOFF_SECONDS"
  fi

done
