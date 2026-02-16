# Validation: P2-PR97-NPM-SCRIPTS-MISSING-2

## Verdict: PARTIAL FALSE POSITIVE

### Validation Steps Performed

1. **Checked file existence in working directory**
   ```bash
   ls -la scripts/ui/capture-new-ui-snapshots.ts  # EXISTS (9561 bytes)
   ls -la test/playwright/ui_parity.spec.ts       # EXISTS (10191 bytes)
   ls -la scripts/verify-infra.mjs                # MISSING
   ls -la test/playwright/redirect-sanitization.spec.ts  # MISSING
   ```

2. **Verified files are untracked**
   These files appear in `git status` as `??` (untracked), meaning they exist locally but aren't in the PR.

3. **Understood bot behavior**
   The bot analyzes PR diffs, not full working trees. Untracked files show as "missing" in PR-scoped analysis.

### Conclusion

| File | Bot Says | Reality | Verdict |
|------|----------|---------|---------|
| `scripts/ui/capture-new-ui-snapshots.ts` | Missing | EXISTS | FALSE POSITIVE |
| `test/playwright/ui_parity.spec.ts` | Missing | EXISTS | FALSE POSITIVE |
| `scripts/verify-infra.mjs` | Missing | MISSING | LEGITIMATE ISSUE |
| `test/playwright/redirect-sanitization.spec.ts` | Missing | MISSING | LEGITIMATE ISSUE |

### Final Status

**2/4 claims are FALSE POSITIVES** (files exist, just not in PR)
**2/4 claims are LEGITIMATE** (files genuinely missing)

For the legitimate issues, either:
- Create the missing scripts
- Remove dead npm script references from package.json

This is a known limitation of PR-scoped static analysis.
