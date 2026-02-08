# TASK-084: bdd-runner-forward-signals - Implementation Plan

## Overview
Add signal forwarding to both BDD runners so that SIGTERM/SIGINT received by the parent process are properly forwarded to the child cucumber-js/behave processes.

## Implementation Steps

### Step 1: Modify `scripts/bdd/run-typescript.ts`

**Location**: After line 26 (before `spawn()` call)

**Add signal forwarding logic**:
```typescript
// Track forced kill timeout for cleanup
let forcedKillTimeout: NodeJS.Timeout | null = null;

// Forward termination signals to child process
['SIGTERM', 'SIGINT'].forEach((signal) => {
  process.on(signal, () => {
    console.log(`[run-typescript] Received ${signal}, forwarding to child...`);
    proc.kill(signal);

    // Force kill if child doesn't exit gracefully within 5 seconds
    forcedKillTimeout = setTimeout(() => {
      console.error(`[run-typescript] Child did not exit gracefully, force killing...`);
      proc.kill('SIGKILL');
    }, 5000);
  });
});
```

**Location**: Modify existing `exit` handler (lines 55-67)

**Update to clean up timeout**:
```typescript
proc.on('exit', (code, signal) => {
  // Clear any pending forced kill timeout
  if (forcedKillTimeout) {
    clearTimeout(forcedKillTimeout);
    forcedKillTimeout = null;
  }

  if (signal) {
    console.error(`[run-typescript] Cucumber terminated by signal: ${signal}`);
    process.exit(1);
  }
  if (code !== 0) {
    console.error(`[run-typescript] Cucumber exited with code ${code}`);
    console.error('[run-typescript] Hint: Run "bun install" at repo root');
    process.exit(code ?? 1);  // Handle null code (from signal)
  }
  console.log('[run-typescript] Cucumber completed successfully');
  process.exit(0);
});
```

### Step 2: Modify `scripts/bdd/run-python.ts`

**Location**: After line 59 (before `spawn()` call)

**Add signal forwarding logic**:
```typescript
// Track forced kill timeout for cleanup
let forcedKillTimeout: NodeJS.Timeout | null = null;

// Forward termination signals to child process
['SIGTERM', 'SIGINT'].forEach((signal) => {
  process.on(signal, () => {
    console.log(`[run-python] Received ${signal}, forwarding to child...`);
    proc.kill(signal);

    // Force kill if child doesn't exit gracefully within 5 seconds
    forcedKillTimeout = setTimeout(() => {
      console.error(`[run-python] Child did not exit gracefully, force killing...`);
      proc.kill('SIGKILL');
    }, 5000);
  });
});
```

**Location**: Modify existing `exit` handler (lines 77-88)

**Update to clean up timeout**:
```typescript
proc.on('exit', (code, signal) => {
  // Clear any pending forced kill timeout
  if (forcedKillTimeout) {
    clearTimeout(forcedKillTimeout);
    forcedKillTimeout = null;
  }

  if (signal) {
    console.error(`[run-python] Behave terminated by signal: ${signal}`);
    process.exit(1);
  }
  if (code !== 0) {
    console.error(`[run-python] Behave exited with code ${code}`);
    process.exit(code ?? 1);  // Handle null code (from signal)
  }
  console.log('[run-python] Behave completed successfully');
  process.exit(0);
});
```

## Files to Change

1. `scripts/bdd/run-typescript.ts`
   - Add signal handlers before spawn (after line 26)
   - Modify exit handler to cleanup timeout (lines 55-67)

2. `scripts/bdd/run-python.ts`
   - Add signal handlers before spawn (after line 59)
   - Modify exit handler to cleanup timeout (lines 77-88)

## Tests to Run

```bash
# Verify runners still work normally
bun scripts/bdd/run-typescript.ts
bun scripts/bdd/run-python.ts

# Verify step registry still aligned
bun run bdd:verify

# Type check
bun run typecheck

# Lint
bun run lint
```

## Manual Signal Testing (Optional but Recommended)

```bash
# Test TypeScript runner signal forwarding
bun scripts/bdd/run-typescript.ts &
PID=$!
sleep 1
kill -TERM $PID
wait $PID
echo "Exit code: $?"

# Test Python runner signal forwarding
bun scripts/bdd/run-python.ts &
PID=$!
sleep 1
kill -TERM $PID
wait $PID
echo "Exit code: $?"
```

## Risks

- **Low**: Signal forwarding is a well-documented Node.js pattern
- **Low**: Existing exit handlers already cover the exit path correctly
- **Low**: Changes are additive; existing behavior is preserved

## Rollback Strategy

Revert changes to both runner files if:
- Tests fail to run normally
- Exit codes are incorrectly propagated
- Signal forwarding causes unexpected behavior (e.g., double-exit issues)

## Notes

1. The `proc` variable must be declared before the signal handlers can reference it. This is already the case in both files (const proc = spawn(...)).
2. Signal handlers are registered AFTER the spawn call because they need the `proc` reference. This is fine - the race condition window is minimal and not critical for this use case.
3. The 5-second grace period for force kill is a reasonable default for BDD test cleanup.
