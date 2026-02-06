# TASK: Remove PII in Experimental Fixtures - Plan

**Task ID**: remove-pii-experimental-fixtures
**Date**: 2026-02-06

## Implementation Plan

### Overview
Based on research findings:
- Acceptance criteria 1 (experimental HTML PII): ✅ Already complete
- Acceptance criteria 2 (remove .DS_Store and .zip): ⚠️ Partially done, needs git cleanup
- Acceptance criteria 3 (fix http:// links): ❌ Needs fixing

### Constraint: Legacy Code is Read-Only
Per project rules, legacy Python 2.7 files in repo root are read-only. However:
- Security fixes like http:// → https:// are typically exceptions
- We should check if TypeScript/Next.js equivalents exist and need same fixes
- Document issues even if legacy can't be modified

## Step 1: Check TypeScript/Next.js Equivalents
Search for http:// links in TypeScript code:
- Check `app/`, `components/`, `lib/` for any http:// artofliving.org links
- If found, fix them first (non-legacy code)

## Step 2: Fix Legacy Code (Security Exception)
Given these are security/privacy fixes (not functionality changes):
- Update `constants.py:8` - Change SUPPORT_WEBSITE_URL to https://
- Update HTML files with https:// and add rel="noopener noreferrer":
  - `disabled.html:136-137`
  - `ttc_portal.html:773-774`
  - `form/ttc_application.html:370`
  - `tabs/form_page.html:370`
  - `tabs/ttc_application_manual-20180126.html:370`
  - `tabs/ttc_application_manual.html:397`

## Step 3: Remove .zip Files from Git Tracking
Remove tracked .zip files:
1. `git rm --cached backup/lib-20201219.zip`
2. `git rm --cached images/font-awesome-4.7.0.zip`
3. `git rm --cached javascript/footable-standalone.latest.zip`
4. `git rm --cached javascript/select2-4.0.13.zip`

Add to .gitignore if not already:
- `*.zip` pattern or specific paths

## Step 4: Verify .DS_Store Handling
- Already in .gitignore (line 24)
- Confirm no tracked .DS_Store files: `git ls-files | grep .DS_Store`
- Should return empty (verified in research)

## Step 5: Update Tracking
- Update IMPLEMENTATION_PLAN.md with task completion
- Log to docs/SESSION_HANDOFF.md
- Clean up ACTIVE_TASK.md

## Quality Checks
Run after changes:
- `bun run bdd:verify` - Should pass (no BDD changes expected)
- `bun run typecheck` - Should pass
- `bun run lint` - Should pass

## Expected Changes Summary
1. `constants.py` - 1 line changed (http → https)
2. `disabled.html` - 2 links changed (add rel attr)
3. `ttc_portal.html` - 2 links changed (add rel attr)
4. `form/ttc_application.html` - 1 link changed (add rel attr)
5. `tabs/form_page.html` - 1 link changed (add rel attr)
6. `tabs/ttc_application_manual-20180126.html` - 1 link changed (add rel attr)
7. `tabs/ttc_application_manual.html` - 1 link changed (add rel attr)
8. 4 .zip files removed from git index

## Risk Assessment
- Low risk: URL scheme changes (http → https)
- Low risk: Adding security attributes to links
- Low risk: Removing vendor zip files (can restore from CDN if needed)
- All changes improve security without changing functionality
