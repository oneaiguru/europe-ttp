# Admin Settings UAT Playbook

## Prerequisites
- Dev server running: `npx next dev`
- User logged in as admin
- Server accessible at http://localhost:3000

## Steps

### 1. Navigate to Admin Settings
```
browser_navigate: http://localhost:3000/api/admin/settings
```

### 2. Capture Snapshot
```
browser_snapshot
```

### 3. Verify Settings Page
Assert: Heading "Admin Settings" present
Assert: Element with ID "settings_page" exists
Assert: Settings content renders correctly

### 4. Verify Layout
Assert: Admin navigation present
Assert: No rendering errors in console

### 5. Capture Evidence
```
browser_take_screenshot: filename='admin-settings.png'
```

## Checklist
- [ ] Page loads at /api/admin/settings
- [ ] Settings heading visible
- [ ] settings_page element present
- [ ] Admin navigation works
- [ ] No console errors
- [ ] Screenshot captured
