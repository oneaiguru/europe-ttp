# TASK-FIX-009: Research Findings

## Current Implementation Analysis

### run-python.ts (lines 77-88)
```typescript
proc.on('exit', (code, signal) => {
  if (signal) {
    console.error(`[run-python] Behave terminated by signal: ${signal}`);
    process.exit(1);
  }
  if (code !== 0) {
    console.error(`[run-python] Behave exited with code ${code}`);
    process.exit(code);
  }
  console.log('[run-python] Behave completed successfully');
  process.exit(0);
});
```

**Status:** ✅ ALREADY HANDLES SIGNAL CORRECTLY

The Python runner already checks for `signal` and exits with code 1 when the child is terminated by a signal.

### run-typescript.ts (lines 67-79)
```typescript
proc.on('exit', (code, signal) => {
  if (signal) {
    console.error(`[run-typescript] Cucumber terminated by signal: ${signal}`);
    process.exit(1);
  }
  if (code !== 0) {
    console.error(`[run-typescript] Cucumber exited with code ${code}`);
    console.error('[run-typescript] Hint: Run "bun install" at repo root');
    process.exit(code);
  }
  console.log('[run-typescript] Cucumber completed successfully');
  process.exit(0);
});
```

**Status:** ✅ ALREADY HANDLES SIGNAL CORRECTLY

The TypeScript runner already checks for `signal` and exits with code 1 when the child is terminated by a signal.

## Key Findings

1. **Both runners already implement signal handling correctly** - they check `if (signal)` and call `process.exit(1)`.

2. **The review draft evidence may be outdated** - The code at the cited line numbers already handles signal termination.

3. **Potential edge case:** The `exit` event handler receives `code` and `signal` as parameters. According to Node.js documentation:
   - If the child process exited normally, `code` is the exit code and `signal` is `null`.
   - If the child process was terminated by a signal, `code` is `null` and `signal` is the signal name.
   - The current implementation correctly handles this with `if (signal)` check.

4. **No changes needed** - Both runners already meet the acceptance criteria:
   - ✅ `run-python.ts` exits non-zero when child exits with `code=null` (signal termination)
   - ✅ `run-typescript.ts` exits non-zero when child exits with `code=null` (signal termination)

## Recommendation

**Task is already complete.** The review draft should be updated to mark this item as processed/verified.

If a test is desired to prevent regression, a simple integration test could simulate signal termination, but the current implementation is already correct.

## Files Analyzed
- `/Users/m/git/clients/aol/europe-ttp/scripts/bdd/run-python.ts:77-88`
- `/Users/m/git/clients/aol/europe-ttp/scripts/bdd/run-typescript.ts:67-79`
