# Parity Audit UAT Playbook

## Prerequisites
- Dev server running: `npx next dev`
- User logged in as admin
- Server accessible at http://localhost:3000
- Legacy system running on parallel port (or documented)

## Steps

### 1. Navigate to New Settings Page
```
browser_navigate: http://localhost:3000/api/admin/settings
```

### 2. Capture New System Snapshot
```
browser_snapshot
```

### 3. Count Elements
Record: Number of headings, buttons, links, form fields
Note: Layout and styling

### 4. Navigate to Legacy Settings
```
browser_navigate: [legacy system URL or document legacy version]
```

### 5. Capture Legacy Snapshot
```
browser_snapshot
```

### 6. Count Elements
Record: Number of headings, buttons, links, form fields in legacy
Compare: Element counts and layout

### 7. Document Differences
Assert: Core functionality matches between versions
Note: Any intentional design improvements in new version

### 8. Capture Evidence
```
browser_take_screenshot: filename='parity-new.png'
browser_take_screenshot: filename='parity-legacy.png'
```

## Checklist
- [ ] New settings page loads
- [ ] Legacy settings page accessible
- [ ] Element counts recorded
- [ ] Layout comparison documented
- [ ] Functional parity verified
- [ ] Screenshots captured for both
- [ ] Differences documented
