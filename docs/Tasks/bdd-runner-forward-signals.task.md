# TASK-084: bdd-runner-forward-signals

## Goal
Ensure BDD test runners forward termination signals (SIGTERM, SIGINT) to child processes for graceful shutdown.

## Context
The current runners (`run-python.ts` and `run-typescript.ts`) spawn child processes (behave/cucumber-js) but do not forward signals received by the parent process to the child. This means:
- Sending SIGTERM to the runner doesn't properly terminate the child
- The child may continue running after the parent dies
- Resources may not be cleaned up properly

## References
- `scripts/bdd/run-typescript.ts` - TypeScript BDD runner
- `scripts/bdd/run-python.ts` - Python BDD runner

## Acceptance Criteria
1. Both runners forward SIGTERM and SIGINT signals to the child process
2. After forwarding, the parent waits for child to exit gracefully
3. If child doesn't exit within a timeout, parent forcefully kills it
4. Runners exit with the child's exit code after signal handling

## Files to Modify
- [ ] `scripts/bdd/run-typescript.ts`
- [ ] `scripts/bdd/run-python.ts`

## Implementation Notes
The standard pattern in Node.js for forwarding signals:
```typescript
// Forward signals to child
['SIGTERM', 'SIGINT'].forEach(signal => {
  process.on(signal, () => {
    console.log(`[runner] Received ${signal}, forwarding to child...`);
    proc.kill(signal);
    // Optionally set timeout to force kill if child doesn't exit
  });
});
```

## Test Commands
```bash
# Manual testing: send SIGignal to runner process and verify child terminates
bun scripts/bdd/run-typescript.ts &
PID=$!
sleep 1
kill -TERM $PID
wait $PID
# Exit code should reflect child termination
```

## Verification
- [ ] Runners start cucumber/behave successfully
- [ ] Sending SIGINT (Ctrl+C) terminates child process cleanly
- [ ] Sending SIGTERM to runner forwards to child and exits with appropriate code
