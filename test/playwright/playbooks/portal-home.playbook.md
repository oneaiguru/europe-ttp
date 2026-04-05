# Portal Home UAT Playbook

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

### 3. Verify Profile Section
Assert: Element with ID "logged_in_as" exists
Assert: Text contains "Logged in as test.applicant@example.com"
Assert: Element with ID "logout" exists with text "LOGOUT"
Assert: Element with ID "user_home_country" contains "United States"

### 4. Verify Report Links
Assert: Unordered list with 2 links
Assert: Link text "TTC Reports" present
Assert: Link text "Applicants Summary" present

### 5. Verify Security
Assert: No unescaped script tags in page
Assert: All links use safe href schemes

### 6. Capture Evidence
```
browser_take_screenshot: filename='portal-home.png'
```

## Checklist
- [ ] Page loads at /api/portal/home
- [ ] Profile section visible with email
- [ ] Logout button present
- [ ] Country dropdown shows "United States"
- [ ] Report links render with correct text
- [ ] No XSS vectors in HTML
- [ ] All hrefs are safe (no javascript:)
- [ ] Screenshot captured
