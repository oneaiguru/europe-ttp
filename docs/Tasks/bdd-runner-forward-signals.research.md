# TASK-084: bdd-runner-forward-signals - Research

## Current State

### `scripts/bdd/run-typescript.ts`
- **Lines 27-53**: Spawns cucumber-js child process using `spawn()`
- **Lines 55-67**: Has `exit` event handler that logs and exits based on child's exit code/signal
- **Lines 69-73**: Has `error` event handler
- **Missing**: No signal handlers (`SIGTERM`, `SIGINT`) to forward signals to child

### `scripts/bdd/run-python.ts`
- **Lines 60-75**: Spawns behave child process using `spawn()`
- **Lines 77-88**: Has `exit` event handler that logs and exits based on child's exit code/signal
- **Lines 90-93**: Has `error` event handler
- **Missing**: No signal handlers (`SIGTERM`, `SIGINT`) to forward signals to child

## Key Findings

### Signal Forwarding Gap
Neither runner registers handlers for termination signals. When the parent process receives SIGTERM or SIGINT:
1. The parent may exit immediately without notifying the child
2. The child (cucumber-js/behave) continues running orphaned
3. Resources aren't cleaned up properly

### Existing Exit Handling
Both runners already handle child `exit` events correctly:
- They check for `signal` termination
- They exit with the child's exit code
- This existing pattern should be preserved

### Node.js Signal Forwarding Pattern
The standard pattern from Node.js docs:
```javascript
['SIGTERM', 'SIGINT'].forEach(signal => {
  process.on(signal, () => {
    console.log(`Received ${signal}, forwarding to child...`);
    proc.kill(signal);
  });
});
```

### Grace Period Consideration
For robust handling, if child doesn't exit gracefully within a timeout, parent should force-kill:
```javascript
let forcedKillTimeout: NodeJS.Timeout | null = null;
process.on('SIGTERM', () => {
  proc.kill('SIGTERM');
  forcedKillTimeout = setTimeout(() => proc.kill('SIGKILL'), 5000);
});
proc.on('exit', () => {
  if (forcedKillTimeout) clearTimeout(forcedKillTimeout);
});
```

## Implementation Constraints

1. **Preserve existing behavior**: The `exit` and `error` handlers work correctly and should not be modified
2. **Add signal forwarding**: Register handlers BEFORE spawning the child (to avoid race conditions)
3. **Cleanup on exit**: Clear any timeouts when child exits naturally
4. **Exit code propagation**: Ensure parent exits with child's exit code even after signal forwarding

## Files to Modify

1. `scripts/bdd/run-typescript.ts:26-67` - Add signal handlers before spawn, preserve exit handler
2. `scripts/bdd/run-python.ts:59-88` - Add signal handlers before spawn, preserve exit handler

## Test Strategy

Manual testing required (signals cannot be easily tested automatically):
```bash
# Start runner in background, send SIGTERM, verify exit
bun scripts/bdd/run-typescript.ts &
PID=$!
sleep 1
kill -TERM $PID
wait $PID
echo "Exit code: $?"
```

## Risks

- **Low**: Signal forwarding is a well-documented Node.js pattern
- **Low**: Existing exit handlers already cover the exit path correctly
- **Medium**: Manual testing required - cannot easily automate signal handling tests

## Rollback Strategy

Revert changes to both runner files if:
- Tests fail to run normally
- Exit codes are incorrectly propagated
- Signal forwarding causes unexpected behavior
