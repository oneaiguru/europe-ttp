# TASK-054: Fix Legacy XSS Sinks

## Goal
Reduce XSS risk in legacy JS utilities by replacing unsafe HTML insertion with escaped text.

## Legacy Reference
- File: `javascript/utils.js`
- Lines: 636 (`postFSMessage`), 1272-1274 (`getShowHideHTML`)

## Acceptance Criteria
1. Replace `.html(msg)` in `postFSMessage` with escaped text insertion or sanitization
2. Avoid inline `onclick` string concatenation for dynamic content in `getShowHideHTML`
3. Changes are minimal and preserve existing functionality
4. No regressions in the admin reports that use these functions

## Files to Modify
- `javascript/utils.js`

## Context
The legacy JavaScript utilities contain XSS vulnerabilities:
1. **Line 636**: `$("#txtHintFS").html(msg)` - directly sets HTML from `msg` parameter without escaping
2. **Lines 1272-1274**: Inline `onclick="showHide(...)"` handlers with string concatenation of `show_button_text` and `hide_button_text` parameters

### Data Flow
- `getShowHideHTML` is called from `admin/ttc_applicants_reports.html:507-509`
- Data source: `reporting/user-summary/get-by-user` endpoint → JSON.parse → DataTables render function
- The `data` parameter contains user-supplied content (names, emails, course info, etc.)
- Button text parameters `show_button_text` and `hide_button_text` are hardcoded in the HTML (`'[+]'`, `'[-]'`, `'(show more)'`, `'(hide)'`)

### Security Impact
- **Line 636**: If `msg` contains user data (e.g., error messages with user input), XSS is possible
- **Lines 1272-1274**: While button texts are currently hardcoded literals, the pattern is unsafe if function is called with dynamic data in future

## Test Commands
```bash
# Manual verification in browser (admin reports page)
# No automated BDD tests exist for legacy JS utilities
```

## Notes
- This is legacy (Python 2.7 era) JavaScript code
- The primary users are internal admins (reduces but doesn't eliminate risk)
- Changes should be conservative to avoid breaking existing admin functionality
