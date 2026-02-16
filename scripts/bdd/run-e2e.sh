#!/bin/bash
# Run only E2E feature files
#
# Usage:
#   ./scripts/bdd/run-e2e.sh           # Run all E2E tests (Python + TypeScript)
#   ./scripts/bdd/run-e2e.sh python    # Run Python E2E tests only
#   ./scripts/bdd/run-e2e.sh typescript # Run TypeScript E2E tests only

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Check Node version before proceeding
node "$PROJECT_ROOT/scripts/check-node-version.mjs"

export TTC_TEST_MODE=true

TARGET="${1:-all}"

echo "==================================="
echo "E2E Test Runner"
echo "==================================="
echo "Test mode: $TTC_TEST_MODE"
echo "Target: $TARGET"
echo ""

run_python_e2e() {
    echo "Running Python E2E scenarios..."
    node --import tsx "$SCRIPT_DIR/run-python.ts" specs/features/e2e
}

run_typescript_e2e() {
    echo "Running TypeScript E2E scenarios..."
    node --import tsx "$SCRIPT_DIR/run-typescript.ts" specs/features/e2e
}

case "$TARGET" in
    python)
        run_python_e2e
        ;;
    typescript)
        run_typescript_e2e
        ;;
    all)
        run_python_e2e
        echo ""
        run_typescript_e2e
        ;;
    *)
        echo "Unknown target: $TARGET"
        echo "Valid targets: all, python, typescript"
        exit 1
        ;;
esac

echo ""
echo "==================================="
echo "E2E test run complete"
echo "==================================="
