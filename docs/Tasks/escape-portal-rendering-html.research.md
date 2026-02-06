# TASK-058: escape-portal-rendering-html - Research

## Summary
Research XSS vulnerability in portal HTML render helpers (`app/portal/home/render.ts`, `app/portal/tabs/render.ts`). User-controlled values are interpolated into HTML without escaping, enabling HTML/attribute injection.

## Evidence

### 1. XSS Sink: `app/portal/home/render.ts`

**Lines 16-25** - `renderPortalHome` interpolates user input directly:
```typescript
const reportsHtml = reportLinks.length
  ? `<ul>${reportLinks
      .map((link) => `<li><a rel="admin" href="${link.href}">${link.label}</a></li>`)
      .join('')}</ul>`
  : '';
return [
  '<div id="profile">',
  `<div id="logged_in_as">Logged in as ${options.userEmail}</div>`,
  '<div id="logout">LOGOUT',
  `<div id="user_home_country">${options.homeCountryName}</div>`,
  `<div id="user_home_country_iso">${options.homeCountryIso}</div>`,
  '</div>',
  reportsHtml,
].join('');
```

**Vulnerable values:**
- `options.userEmail` (line 22) - text content injection
- `options.homeCountryName` (line 24) - text content injection
- `options.homeCountryIso` (line 25) - text content injection
- `link.href` (line 17) - attribute injection (href)
- `link.label` (line 17) - text content injection

### 2. XSS Sink: `app/portal/tabs/render.ts`

**Lines 15-29** - `renderPortalTab` interpolates user input:
```typescript
if (templateName === 'contact.html') {
  const email = resolveContactEmail(options.userHomeCountryIso);
  return [
    '<div class="tab-contact">',
    `<div>${homeCountryName} TTC Desk</div>`,
    `<a href="mailto:${email}">${email}</a>`,
    '</div>',
  ].join('');
}

return `<div>${homeCountryName} TTC Desk</div>`;
```

**Vulnerable values:**
- `homeCountryName` (lines 23, 29) - text content injection
- `email` (lines 24, 24) - attribute injection (href), text content injection

### 3. Existing Escape Pattern in Codebase

**`javascript/utils.js:207-214`** - Legacy escapeHTMLAttr function:
```javascript
function escapeHTMLAttr(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
```

**`reporting/user_report.py:56`** - Python uses `cgi.escape(value)` for user input.

### 4. Current Test Coverage

**`test/typescript/steps/portal_steps.ts:95-110`** - Test only checks for inclusion, not escaping:
```typescript
Then('I should see my profile details and available reports', function () {
  const html = world.responseHtml || '';
  const email = world.currentUser?.email || 'test.applicant@example.com';
  assert.ok(html.includes('Logged in as'));
  assert.ok(html.includes(email));  // No check that email is escaped
  // ...
});
```

## Data Flow

```
User → Auth → userEmail
Database → homeCountryName, homeCountryIso
Config/Admin → reportLinks.href, reportLinks.label
       ↓
renderPortalHome / renderPortalTab
       ↓
HTML string → Response
```

All five values are ultimately user/admin-controlled and reach HTML output without escaping.

## Attack Examples

### Text Content Injection (`userEmail`, `homeCountryName`, `homeCountryIso`)
```typescript
// Input
userEmail = '<img src=x onerror=alert(1)>'

// Output (vulnerable)
<div id="logged_in_as">Logged in as <img src=x onerror=alert(1)></div>
```

### Attribute Injection (`reportLinks.href`)
```typescript
// Input
reportLinks = [{ href: '" onmouseover="alert(1)', label: 'Report' }]

// Output (vulnerable)
<li><a rel="admin" href="" onmouseover="alert(1)">Report</a></li>
```

## Constraints

1. **Legacy is read-only** - Only modify TypeScript files under `app/`
2. **No native escape utilities** - Must create or adapt escape function
3. **Test pattern** - Tests use `world.responseHtml` and assert inclusion with `html.includes()`
4. **Python parallel** - Python portal steps at `test/python/steps/portal_steps.py:95-134` also build raw HTML (no escape) - this is legacy and not in scope

## Implementation Notes

### Escape Function Options

1. **Create new utility in `app/`** - `app/utils/html.ts` with `escapeHtml()` and `escapeHtmlAttr()`
2. **Inline in render files** - Define escape functions at module scope
3. **Use browser API** - `new DOMParser().parseFromString()` then `textContent` (not ideal for server rendering)

### Test Extension Required

Current test at `test/typescript/steps/portal_steps.ts:95-110` needs new scenario or assertion to verify escaping works. Options:
- Add new Then step: "Then the HTML output should be escaped"
- Extend existing assertion to check for literal `&lt;` not `<`

## Files Referenced

| File | Lines | Relevance |
|------|-------|-----------|
| `app/portal/home/render.ts` | 16-25 | XSS sink: userEmail, homeCountryName, homeCountryIso, reportLinks |
| `app/portal/tabs/render.ts` | 23-29 | XSS sink: homeCountryName, email |
| `javascript/utils.js` | 207-214 | Existing escapeHTMLAttr pattern (legacy JS) |
| `reporting/user_report.py` | 56 | Python uses `cgi.escape()` for user values |
| `test/typescript/steps/portal_steps.ts` | 95-110 | Current test (no escape verification) |
| `test/python/steps/portal_steps.py` | 95-134 | Python test (legacy, no escape) |

## Next Step (Plan Phase)

Create implementation plan specifying:
1. Escape utility location and signature
2. Exact changes to `render.ts` files (where to call escape)
3. Test addition to verify `<` becomes `&lt;` in output
4. Verify `bun run typecheck`, `bun run lint` pass after changes
