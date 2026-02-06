# TASK: Remove PII in Experimental Fixtures

**Task ID**: remove-pii-experimental-fixtures
**Feature File**: N/A (fix/hardening task)
**Priority**: p1 (privacy/security)

## Goal
Remove or fully anonymize PII in `experimental/` fixtures and prune unsafe vendored/binary artifacts.

## Acceptance Criteria
1. `experimental/test*.html` contain only synthetic data (no real names/emails/phones/addresses/DOB/sensitive answers).
2. Remove `.DS_Store` and `*.zip` artifacts from the repo, or move them behind an explicit policy (and ensure they are never deployed).
3. Replace `http://` links with `https://` and add `rel="noopener noreferrer"` for `target="_blank"` if kept.

## Evidence Locations
- `experimental/test-v1.html:70` - Already removed
- `experimental/test.html:118` - Already removed
- `experimental/test-v0.html:118` - Already removed
- `experimental/jsPDF-master.zip:1` - Now removed from git
- `experimental/.DS_Store:1` - In .gitignore

## Status
✅ **COMPLETE** (2026-02-06)

### Changes Made

#### Acceptance Criteria 1: Experimental HTML PII
✅ **Already Clean** - Experimental test HTML files were previously removed

#### Acceptance Criteria 2: Remove .DS_Store and .zip artifacts
✅ **Done**
- 5 .zip files removed from git tracking:
  - `backup/lib-20201219.zip`
  - `experimental/jsPDF-master.zip`
  - `images/font-awesome-4.7.0.zip`
  - `javascript/footable-standalone.latest.zip`
  - `javascript/select2-4.0.13.zip`
- `.gitignore` updated to exclude:
  - `*.zip` (all zip files)
  - `backup/` directory
  - Python cache files (`*.pyc`, `__pycache__/`, `*.pyo`)

#### Acceptance Criteria 3: Fix http:// links
✅ **Done** - Changed all `http://` to `https://` and added `rel="noopener noreferrer"`:

| File | Lines | Changes |
|------|-------|---------|
| `constants.py` | 8 | `SUPPORT_WEBSITE_URL` → https |
| `disabled.html` | 136-137 | Privacy/Terms links → https + rel |
| `ttc_portal.html` | 773-774 | Privacy/Terms links → https + rel |
| `form/ttc_application.html` | 370 | Support link → https + rel |
| `tabs/form_page.html` | 370 | Support link → https + rel |
| `tabs/ttc_application_manual-20180126.html` | 370 | Support link → https + rel |
| `tabs/ttc_application_manual.html` | 397 | Support link → https + rel |

### Verification
- ✅ `bun run bdd:verify` - 243 steps, 0 orphan, 0 dead
- ✅ `bun run typecheck` - Passed
- ✅ `bun run lint` - Passed (warnings only in vendored jsPDF)
