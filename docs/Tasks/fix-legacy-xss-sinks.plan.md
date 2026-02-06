# TASK-054: Fix Legacy XSS Sinks - Implementation Plan

## Overview
Fix XSS vulnerabilities in legacy JavaScript utilities by replacing unsafe HTML insertion with escaped text.

## Implementation Steps

### Step 1: Fix `postFSMessage` (Line 636)
**File**: `javascript/utils.js`

**Change**: Replace `.html(msg)` with `.text(msg)`

```javascript
// Before:
$("#txtHintFS").html(msg);

// After:
$("#txtHintFS").text(msg);
```

**Rationale**: jQuery's `.text()` method automatically escapes HTML entities, preventing XSS while preserving the text display functionality.

**Risk**: Low - Function appears unused in current codebase (no external callers found)

### Step 2: Create HTML Escaping Utility
**File**: `javascript/utils.js` (add near top of file, after existing helper functions)

**Add**:
```javascript
/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str - The string to escape
 * @return {string} Escaped string safe for HTML attribute context
 */
function escapeHTMLAttr(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
```

**Rationale**: Provides a reusable utility for escaping strings inserted into HTML attributes.

### Step 3: Fix `getShowHideHTML` Inline Handlers (Lines 1272-1274, 1294)
**File**: `javascript/utils.js`

**Change**: Escape the button text parameters before interpolating into onclick attribute

```javascript
// Before (line ~1272):
'<span id="shShowButton' + _id_suffix + '" onclick="showHide(\'' + _id_suffix + '\', \'' + show_button_text + '\', \'' + hide_button_text + '\', true)" ...>'

// After:
'<span id="shShowButton' + _id_suffix + '" onclick="showHide(\'' + _id_suffix + '\', \'' + escapeHTMLAttr(show_button_text) + '\', \'' + escapeHTMLAttr(hide_button_text) + '\', true)" ...>'
```

**Apply to both occurrences**:
- Line ~1272: `shShowButton` element
- Line ~1273: `shHideButton` element
- Line ~1294: `shButton` element (in non-single-line branch)

**Rationale**: While button texts are currently hardcoded literals (`'[+]'`, `'[-]'`, etc.), escaping defends against future misuse if the function is called with dynamic data.

**Risk**: Low - Escaping already-safe literal strings has no functional impact

## Files to Change
1. `javascript/utils.js`
   - Line ~636: Change `.html(msg)` to `.text(msg)`
   - Add `escapeHTMLAttr()` helper function
   - Lines ~1272-1274, ~1294: Apply `escapeHTMLAttr()` to button text parameters

## Testing Strategy
1. **Manual Verification**: Load admin reports page (`/admin/ttc_applicants_reports`)
2. **Verify Show/Hide**: Click show/hide buttons in DataTables columns to ensure toggle functionality works
3. **Verify Status Messages**: If any code paths use `postFSMessage`, verify messages display correctly
4. **No BDD Tests**: Legacy JS utilities have no automated test coverage

## Acceptance Criteria Verification
- [ ] `.html(msg)` replaced with `.text(msg)` in `postFSMessage`
- [ ] `escapeHTMLAttr()` function added
- [ ] All `getShowHideHTML` onclick handlers use escaped button text parameters
- [ ] Admin reports show/hide functionality still works correctly

## Risks & Rollback
**Risk Level**: Low
- Changes are minimal and defensive
- Button text parameters are already hardcoded literals
- `postFSMessage` appears unused

**Rollback**: If issues arise, revert `javascript/utils.js` to previous version. File is not in active development, so rollback is straightforward.

## Notes
- Legacy code (Python 2.7 era) - minimal changes preferred
- Primary users are internal admins - risk is reduced but not eliminated
- No automated tests - manual verification required
