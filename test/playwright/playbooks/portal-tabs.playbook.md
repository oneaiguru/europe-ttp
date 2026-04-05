# Portal Tabs UAT Playbook

## Prerequisites
- Dev server running: `npx next dev`
- User logged in as test.applicant@example.com
- Server accessible at http://localhost:3000

## Steps

### 1. Navigate to Portal Tabs
```
browser_navigate: http://localhost:3000/api/portal/tabs
```

### 2. Capture Snapshot
```
browser_snapshot
```

### 3. Verify Tab Content
Assert: Heading "TTC Desk" present
Assert: Contact email "ttc@example.com" visible
Assert: Tab structure renders correctly

### 4. Verify Navigation
Assert: Links back to portal home available
Assert: Tab state persists on reload

### 5. Capture Evidence
```
browser_take_screenshot: filename='portal-tabs.png'
```

## Checklist
- [ ] Page loads at /api/portal/tabs
- [ ] TTC Desk heading visible
- [ ] Contact email displayed
- [ ] Tab navigation works
- [ ] Security: No XSS vectors
- [ ] Screenshot captured
