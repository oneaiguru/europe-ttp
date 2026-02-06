# TASK: Remove PII in Experimental Fixtures - Research

**Task ID**: remove-pii-experimental-fixtures
**Date**: 2026-02-06

## Research Findings

### 1. Experimental HTML Test Files
**Status**: ✅ ALREADY CLEANED
- `experimental/test-v1.html` - Does not exist
- `experimental/test.html` - Does not exist
- `experimental/test-v0.html` - Does not exist
- These files were referenced in REVIEW_DRAFTS.md but have already been removed

### 2. Binary/Zip Artifacts
**Status**: ⚠️ PARTIALLY CLEANED - 4 .zip files still tracked

Tracked `.zip` files:
1. `backup/lib-20201219.zip` (12.7 MB) - Backup of lib directory
2. `images/font-awesome-4.7.0.zip` (97 KB) - Font Awesome vendor library
3. `javascript/footable-standalone.latest.zip` (97 KB) - FooTable vendor library  
4. `javascript/select2-4.0.13.zip` (2.6 MB) - Select2 vendor library

**Already removed**:
- `experimental/jsPDF-master.zip` - Marked as deleted (D) in git status

**Recommendation**:
- The 3 vendor library zips in `javascript/` and `images/` appear to be vendored dependencies that could be restored from official sources
- The `backup/lib-20201219.zip` is a backup file that should likely be removed (backups should not be in repo)

### 3. .DS_Store Files
**Status**: ⚠️ IN .GITIGNORE BUT SOME MAY BE TRACKED

`.gitignore` line 24: `.DS_Store` ✅

However, .DS_Store files exist locally:
- `experimental/.DS_Store`
- `experimental/jsPDF-master/.DS_Store`
- Plus others in node_modules (not tracked)

These are ignored by git now but may exist in git history.

### 4. http:// Links (Security/Privacy Issue)
**Status**: ❌ NEEDS FIXING

Files with `http://` links to artofliving.org:

| File | Line | Issue |
|------|------|-------|
| `constants.py` | 8 | `SUPPORT_WEBSITE_URL = "http://support-us.artofliving.org"` |
| `disabled.html` | 136 | `href="http://www.artofliving.org/us-en/privacy-policy"` |
| `disabled.html` | 137 | `href="http://www.artofliving.org/us-en/terms-use"` |
| `ttc_portal.html` | 773 | `href="http://www.artofliving.org/us-en/privacy-policy"` |
| `ttc_portal.html` | 774 | `href="http://www.artofliving.org/us-en/terms-use"` |
| `form/ttc_application.html` | 370 | `href="http://support-us.artofliving.org/#email_support"` (with `target="_blank"`) |
| `tabs/form_page.html` | 370 | `href="http://support-us.artofliving.org/#email_support"` (with `target="_blank"`) |
| `tabs/ttc_application_manual-20180126.html` | 370 | `href="http://support-us.artofliving.org/#email_support"` (with `target="_blank"`) |
| `tabs/ttc_application_manual.html` | 397 | `href="http://support-us.artofliving.org/#email_support"` (with `target="_blank"`) |

**Issues**:
1. All should use `https://` instead of `http://`
2. Links with `target="_blank"` should have `rel="noopener noreferrer"` for security

## Implementation Notes

### Priority Actions:
1. **Fix http:// links in Python/HTML files** (legacy read-only, but needs documentation or next.js equivalent check)
2. **Remove .zip files from git tracking** (vendor libs can be restored from CDN if needed)
3. **Ensure .DS_Store not tracked** (already in .gitignore)

### Legacy Code Note:
Most affected files are legacy Python 2.7 code which is read-only per project rules. Should:
1. Document the issues in IMPLEMENTATION_PLAN.md
2. Check if Next.js equivalents have same issues
3. Consider if legacy code can be patched despite "read-only" status (security fix exception)

## Code Locations Summary

### http:// links (need fixing):
- `constants.py:8`
- `disabled.html:136-137`
- `ttc_portal.html:773-774`
- `form/ttc_application.html:370`
- `tabs/form_page.html:370`
- `tabs/ttc_application_manual-20180126.html:370`
- `tabs/ttc_application_manual.html:397`

### .zip files to consider removing:
- `backup/lib-20201219.zip`
- `images/font-awesome-4.7.0.zip`
- `javascript/footable-standalone.latest.zip`
- `javascript/select2-4.0.13.zip`
