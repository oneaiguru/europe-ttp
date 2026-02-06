# Task: REVIEW-001 - Scrub Secrets from Repo Text

**ID:** REVIEW-001
**Slug:** scrub-secrets-in-repo-text
**Priority:** p1 (security)
**Feature File:** N/A (fix/hardening task)

## Goal
Remove committed secret values from comments and documentation so secret scans and external publication are safe.

## Acceptance Criteria
1. No SendGrid (`SG.`), Harmony, or Google API keys are present anywhere in tracked text files (including docs and comments).
2. Replace any historical values with placeholders (e.g., `SG.REDACTED`, `AIza...REDACTED`).
3. Add a simple secrets-scan check (script or documented grep) that can be run before publishing.

## Evidence Locations
- `constants.py:14-20`
- `docs/Tasks/TASK-FIX-002.md:20-26`
- `docs/Tasks/TASK-FIX-002.research.md:17-18`
- `docs/Tasks/TASK-FIX-002.research.md:50-52`

## Verification Steps
1. Run `grep -r "SG\." --include="*.py" --include="*.md" .` to find SendGrid keys
2. Run `grep -r "AIza" --include="*.py" --include="*.md" .` to find Google API keys
3. Run `grep -r "artofliving" --include="*.py" --include="*.md" .` to find service account references
4. Create `scripts/security/scan-secrets.sh` for automated checking

## Status
✅ COMPLETE
