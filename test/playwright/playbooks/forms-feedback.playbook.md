# Forms Feedback UAT Playbook

## Prerequisites
- Dev server running: `npx next dev`
- User logged in
- Server accessible at http://localhost:3000

## Steps

### 1. Navigate to Post-TTC Feedback Form
```
browser_navigate: http://localhost:3000/api/forms/post_ttc_feedback
```

### 2. Capture Snapshot
```
browser_snapshot
```

### 3. Verify Form Rendering
Assert: Form heading "Post-TTC Feedback" present
Assert: Form structure loads without errors

### 4. Note on Completion
This is a stub form render. Full form fields and feedback submission logic are pending.

### 5. Capture Evidence
```
browser_take_screenshot: filename='forms-feedback.png'
```

## Checklist
- [ ] Page loads at /api/forms/post_ttc_feedback
- [ ] Form heading visible
- [ ] Layout renders correctly
- [ ] No console errors
- [ ] Screenshot captured
- [ ] NOTE: Full feedback submission testing pending
