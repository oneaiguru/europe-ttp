#!/usr/bin/env bash
# Mixed loop runner (pretty output):
# - build mode uses Claude Code with JSON output filtered to readable text
# - plan/review modes use Codex CLI
# - default MAX_ITERATIONS=1 (safe; no infinite loop by accident)
#
# Usage:
#   ./loop_mix_pretty.sh                 # build mode, 1 iteration
#   ./loop_mix_pretty.sh 12              # build mode, 12 iterations
#   ./loop_mix_pretty.sh plan            # plan mode, 1 iteration (Codex)
#   ./loop_mix_pretty.sh plan 3          # plan mode, 3 iterations (Codex)
#   ./loop_mix_pretty.sh review          # review mode, 1 iteration (Codex)
#   ./loop_mix_pretty.sh review 2        # review mode, 2 iterations (Codex)

set -euo pipefail

# Reduce locale warnings and ensure streaming output flushes.
export LANG=C
export LC_ALL=C
export PYTHONUNBUFFERED=1

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

pretty_filter() {
  if command -v python3 >/dev/null 2>&1; then
    # Use fd 63 for the script so stdin stays connected to the pipe.
    python3 -u /dev/fd/63 63<<'PY'
import json
import sys

def emit(text: str) -> None:
    if not text:
        return
    sys.stdout.write(text)
    if not text.endswith("\n"):
        sys.stdout.write("\n")
    sys.stdout.flush()

printed_any = False

for line in sys.stdin:
    try:
        obj = json.loads(line)
    except Exception:
        # Pass through non-JSON lines as-is.
        sys.stdout.write(line)
        sys.stdout.flush()
        continue

    obj_type = obj.get("type")

    if obj_type == "result":
        if not printed_any:
            emit(obj.get("result", ""))
        continue

    if obj_type != "assistant":
        continue

    msg = obj.get("message") or {}
    content = msg.get("content") or []
    if isinstance(content, str):
        emit(content)
        printed_any = True
        continue

    for part in content:
        if not isinstance(part, dict):
            continue
        if part.get("type") == "text":
            emit(part.get("text", ""))
            printed_any = True
        elif part.get("type") == "tool_use":
            name = part.get("name", "tool")
            emit(f"[tool] {name}")
PY
  elif command -v python >/dev/null 2>&1; then
    # Use fd 63 for the script so stdin stays connected to the pipe.
    python -u /dev/fd/63 63<<'PY'
import json
import sys

def emit(text):
    if not text:
        return
    sys.stdout.write(text)
    if not text.endswith("\n"):
        sys.stdout.write("\n")
    sys.stdout.flush()

printed_any = False

for line in sys.stdin:
    try:
        obj = json.loads(line)
    except Exception:
        sys.stdout.write(line)
        sys.stdout.flush()
        continue

    obj_type = obj.get("type")

    if obj_type == "result":
        if not printed_any:
            emit(obj.get("result", ""))
        continue

    if obj_type != "assistant":
        continue

    msg = obj.get("message") or {}
    content = msg.get("content") or []
    if isinstance(content, str):
        emit(content)
        printed_any = True
        continue

    for part in content:
        if not isinstance(part, dict):
            continue
        if part.get("type") == "text":
            emit(part.get("text", ""))
            printed_any = True
        elif part.get("type") == "tool_use":
            name = part.get("name", "tool")
            emit(f"[tool] {name}")
PY
  else
    cat
  fi
}

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

  echo "[loop] mode=$MODE iteration=$((ITERATION + 1))/$MAX_ITERATIONS prompt=$PROMPT_FILE"

  if [ "$MODE" = "build" ]; then
    # Claude build loop (pretty output)
    CLAUDE_BIN="${CLAUDE_BIN:-claude}"
    CLAUDE_MODEL="${CLAUDE_MODEL:-opus}"

    # Note: Claude permissions are bypassed intentionally for automated loops.
    # Run only in directories you trust.
    if ! command -v "$CLAUDE_BIN" >/dev/null 2>&1; then
      echo "Error: $CLAUDE_BIN not found in PATH"
      exit 1
    fi

    cat "$PROMPT_FILE" | "$CLAUDE_BIN" -p \
      --dangerously-skip-permissions \
      --output-format=stream-json \
      --model "$CLAUDE_MODEL" \
      --verbose \
      2> >(sed 's/^/[stderr] /' >&2) | pretty_filter
  else
    # Codex plan/review loops
    CODEX_BIN="${CODEX_BIN:-codex}"
    CODEX_MODEL="${CODEX_MODEL:-gpt-5.2-codex}"
    CODEX_FLAGS=${CODEX_FLAGS:---dangerously-bypass-approvals-and-sandbox -c mcp_servers.playwright.enabled=false}

    cat "$PROMPT_FILE" | "$CODEX_BIN" exec ${CODEX_FLAGS} --model "$CODEX_MODEL" -
  fi

  ITERATION=$((ITERATION + 1))
done
