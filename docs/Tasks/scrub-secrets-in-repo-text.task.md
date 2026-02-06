# TASK-043: scrub-secrets-in-repo-text

## Goal
Remove committed secret values from comments and documentation so secret scans and external publication are safe.

## Type
Fix/Hardening - No BDD scenarios required

## References
- `docs/review/REVIEW_DRAFTS.md`
- `docs/Tasks/scrub-secrets-in-repo-text.plan.md`
- `constants.py:14-20`
- `docs/Tasks/TASK-FIX-002.md:20-26`
- `docs/Tasks/TASK-FIX-002.research.md:17-18`
- `docs/Tasks/TASK-FIX-002.research.md:50-52`

## Acceptance Criteria
1. No SendGrid (`SG.`), Harmony, or Google API keys are present anywhere in tracked text files (including docs and comments).
2. Replace any historical values with placeholders (e.g., `SG.REDACTED`, `AIza...REDACTED`).
3. Add a simple secrets-scan check (script or documented grep) that can be run before publishing.

## Implementation Plan
See `docs/Tasks/scrub-secrets-in-repo-text.plan.md` for detailed steps.

## Files to Create/Modify
1. `scripts/security/scan-secrets.sh` - CREATE
2. `app-dev.yaml` - redact lines 86-88
3. `app-20190828.yaml` - redact lines 114-115
4. `form/ttc_application.html` - redact line 804
5. `tabs/settings.html` - redact line 322
6. `tabs/form_page.html` - redact line 804
7. `tabs/ttc_application_manual.html` - redact line 831
8. `tabs/ttc_application_manual-20180126.html` - redact line 804
9. `constants.py` - redact lines 14-16, 20
10. `docs/Tasks/TASK-FIX-002.md` - redact lines 22, 25
11. `docs/Tasks/TASK-FIX-002.research.md` - redact lines 17-18, 28, 50-51
12. `docs/Tasks/TASK-FIX-002.plan.md` - redact lines 15-16

## Test Commands
This task has no BDD scenarios (security hardening). Verify with:
```bash
bash scripts/security/scan-secrets.sh
bun run bdd:verify  # Should still pass
```
