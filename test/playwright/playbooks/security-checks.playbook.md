# Security Checks UAT Playbook

## Prerequisites
- Dev server running: `npx next dev`
- User logged in as test.applicant@example.com
- Server accessible at http://localhost:3000

## Steps

### 1. Navigate to Portal Home
```
browser_navigate: http://localhost:3000/api/portal/home
```

### 2. Capture Snapshot
```
browser_snapshot
```

### 3. XSS Verification
Assert: User email "test.applicant@example.com" is escaped in HTML
Assert: No unescaped HTML tags in user data
Assert: No <script> tags in body

### 4. Link Scheme Verification
Assert: No links with "javascript:" href
Assert: No links with "data:" href
Assert: All hrefs are valid URL schemes (http, https, relative)

### 5. Content Security Policy
Note: Check browser console for CSP violations
Assert: No CSP warnings or errors

### 6. Sanitization Verification
Assert: All redirect links are sanitized
Assert: All user-supplied data in forms is escaped

### 7. Capture Evidence
```
browser_take_screenshot: filename='security-checks.png'
browser_console_messages: level='warning'
```

## Checklist
- [ ] Page loads without security errors
- [ ] User data is properly escaped
- [ ] No unescaped script tags present
- [ ] All link schemes are safe
- [ ] No javascript: hrefs found
- [ ] No data: hrefs found
- [ ] CSP headers compliant
- [ ] Redirect URLs sanitized
- [ ] Evidence screenshots captured
