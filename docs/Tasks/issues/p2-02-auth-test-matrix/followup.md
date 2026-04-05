# P2-02: Auth Test Matrix Alignment - Followup

## Status: COMPLETE

---

## Summary

The platform-mode test matrix has been aligned with the fail-closed authentication logic. Six test cases in `test/utils/auth.test.ts` were updated to correctly expect `'reject'` instead of `'allow_header'` for non-development environments when `AUTH_MODE_PLATFORM_STRICT` is not set to `'true'`.

This ensures the test suite accurately validates the security-hardened authentication behavior introduced in the codebase, where requests are rejected by default outside of development mode unless strict mode is explicitly enabled.

---

## Files Changed

| File | Description |
|------|-------------|
| `test/utils/auth.test.ts` | Updated 6 test case expectations from `'allow_header'` to `'reject'` |

### Test Cases Updated

| # | NODE_ENV | AUTH_MODE_PLATFORM_STRICT | Old Expected | New Expected |
|---|----------|---------------------------|--------------|--------------|
| 1 | `staging` | undefined | `allow_header` | `reject` |
| 2 | `staging` | `'false'` | `allow_header` | `reject` |
| 3 | undefined | undefined | `allow_header` | `reject` |
| 4 | undefined | `'false'` | `allow_header` | `reject` |
| 5 | `Production` | undefined | `allow_header` | `reject` |
| 6 | `PRODUCTION` | undefined | `allow_header` | `reject` |

---

## Validation Results

- TypeScript type check: PASS
- Auth unit tests: 76/76 PASS
- Full utils tests: 160/160 PASS (no regressions)

---

## Follow-up Work

**None required.**

The issue has been fully resolved:
- All test cases now correctly expect the fail-closed behavior
- All tests pass
- No additional changes or investigations needed
