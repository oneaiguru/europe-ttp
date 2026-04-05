# Admin Reports UAT Playbook

## Prerequisites
- Dev server running: `npx next dev`
- User logged in as admin
- Server accessible at http://localhost:3000

## Steps

### 1. Navigate to Admin Reports
```
browser_navigate: http://localhost:3000/api/admin/reports_list
```

### 2. Capture Snapshot
```
browser_snapshot
```

### 3. Verify Reports Page
Assert: Heading "Reports" present
Assert: Reports list renders correctly
Assert: Report links are functional

### 4. Verify Report Links
Assert: At least 1 report link present
Assert: Links use safe href schemes (no javascript:)

### 5. Capture Evidence
```
browser_take_screenshot: filename='admin-reports.png'
```

## Checklist
- [ ] Page loads at /api/admin/reports_list
- [ ] Reports heading visible
- [ ] Reports list renders
- [ ] All links are safe
- [ ] No console errors
- [ ] Screenshot captured
