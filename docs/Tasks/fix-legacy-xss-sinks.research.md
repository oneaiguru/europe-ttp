# TASK-054: Fix Legacy XSS Sinks - Research

## Evidence

### Issue 1: `postFSMessage` - Direct HTML Insertion
**Location**: `javascript/utils.js:636`

```javascript
function postFSMessage(msg,delay,persist)
{
  $("#txtHintFS").html(msg);  // XSS: unescaped HTML
  $('#txtHintFSBG').show();
  $('#txtHintFS').show();
  if (!persist) {
    setTimeout(function() {
      $("#txtHintFS").fadeOut(250);
      $("#txtHintFSBG").hide();
    }, (delay-0.25)*1000);
  }
}
```

**Analysis**:
- Uses jQuery's `.html()` which parses and renders HTML
- `msg` parameter is directly inserted without escaping
- Called only from within `utils.js` (no external callers found via grep)

**Callers**: None found outside `utils.js` (function appears unused in current codebase)

### Issue 2: `getShowHideHTML` - Inline onclick with String Concatenation
**Location**: `javascript/utils.js:1272-1274`

```javascript
'<span id="shShowButton' + _id_suffix + '" onclick="showHide(\'' + _id_suffix + '\', \'' + show_button_text + '\', \'' + hide_button_text + '\', true)" style="color:blue;cursor:pointer;display:none; font-family:\'Ubuntu Mono\',monospace;">' + show_button_text + '</span>&nbsp;' +
'<span id="shHideButton' + _id_suffix + '" onclick="showHide(\'' + _id_suffix + '\', \'' + show_button_text + '\', \'' + hide_button_text + '\', true)" style="color:blue;cursor:pointer;display:none; font-family:\'Ubuntu Mono\',monospace;">' + hide_button_text + '</span>&nbsp;' +
```

**Analysis**:
- Inline `onclick` handler constructed with string concatenation
- `show_button_text` and `hide_button_text` parameters are interpolated into the `onclick` attribute
- Current usage uses hardcoded literal strings, so immediate risk is low
- Pattern is fragile and unsafe for future use

**Caller**: `admin/ttc_applicants_reports.html:507-509`

```html
{
  render: function (data, type, row, meta) {
    let idx = '-' + meta.row.toString() + '-' + meta.col.toString();
    let _view_mode = $('input[name=view_mode]:checked');
    let _content;
    if (_view_mode.val() == 'c') {
      _content = getShowHideHTML(data, idx, 19, '[+]', '[-]', true);
    } else {
      _content = getShowHideHTML(data, idx);
    }
    return "<div style='white-space:normal;max-width:200px;'>" + _content + "</div>";
  },
  targets: '_all'
}
```

**Data Source**: `reporting/user-summary/get-by-user` endpoint (JSON from Python backend)

### Similar Issue: Line 1294
**Location**: `javascript/utils.js:1294`

Similar pattern exists in the non-single-line branch:
```javascript
'<span id="shButton' + _id_suffix + '" onclick="showHide(\'' + _id_suffix + '\', \'' + show_button_text + '\', \'' + hide_button_text + '\', false)" style="color:blue;cursor:pointer;display:inline-block; font-family:\'Ubuntu Mono\',monospace;">' +
show_button_text +
'</span>';
```

## Existing Escaping Utilities

### JavaScript Side
No escaping utilities found in `javascript/utils.js` (grep for `escapeHtml|escape_html|escapeHTML` returned no results)

jQuery's `.text()` method is available for HTML-escaping text content.

### Python Side
Python backend has access to `cgi.escape()` (Python 2.7 stdlib), but data is passed as JSON which jQuery then processes.

## Recommended Approach

### For `postFSMessage` (Line 636)
Change `.html(msg)` to `.text(msg)` if `msg` should be displayed as plain text (most common case).
If HTML formatting is needed, implement an escaping function for the dynamic portions.

### For `getShowHideHTML` (Lines 1272-1274, 1294)
Two options:
1. **Replace inline onclick with addEventListener** - Requires refactoring to store references, more complex
2. **HTML-escape the button text parameters** - Simpler, preserves current structure

Since button texts are currently hardcoded literals, escaping them is defensive and maintains compatibility.

## Risks
- The admin reports page (`admin/ttc_applicants_reports.html`) may be affected by changes
- No automated tests exist for legacy JS utilities
- Manual testing required after changes

## Files Requiring Changes
1. `javascript/utils.js` - Primary fix location

## Testing Strategy
1. Manual browser testing of admin reports page
2. Verify show/hide functionality still works
3. Verify status bar messages display correctly (if any)
