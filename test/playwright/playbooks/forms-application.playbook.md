# Forms Application UAT Playbook

## Prerequisites
- Dev server running: `npx next dev`
- User logged in
- Server accessible at http://localhost:3000

## Steps

### 1. Navigate to TTC Application Form
```
browser_navigate: http://localhost:3000/api/forms/ttc_application_us
```

### 2. Capture Snapshot
```
browser_snapshot
```

### 3. Verify Form Rendering
Assert: Form heading "TTC Application (US)" present
Assert: Form structure loads without errors

### 4. Note on Completion
This is a stub form render. Full form fields and validation are pending implementation.

### 5. Capture Evidence
```
browser_take_screenshot: filename='forms-application.png'
```

## Checklist
- [ ] Page loads at /api/forms/ttc_application_us
- [ ] Form heading visible
- [ ] Layout renders correctly
- [ ] No console errors
- [ ] Screenshot captured
- [ ] NOTE: Full form validation testing pending
