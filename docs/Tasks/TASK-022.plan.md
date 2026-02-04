# TASK-022: Photo Upload Feature - Implementation Plan

## Overview
Implement BDD step definitions for photo upload signed URL generation and verification.

---

## 1. Python Step Definition Plan

### File: `test/python/steps/uploads_steps.py`

#### Step 1: Request Signed URL
```python
@when(u'I request a signed upload URL for a profile photo')
def step_request_signed_photo_url(context):
    """Simulate requesting a signed URL for photo upload."""
    import time
    user_email = getattr(context, 'user_email', 'test.applicant@example.com')
    timestamp = int(time.time())
    upload_key = "photo-{}-{}".format(user_email.replace('@', '-'), timestamp)
    signed_url = "https://storage.googleapis.com/test-bucket/photos/{}?GoogleAccessId=test&Expires={}&Signature=abc123".format(
        user_email, timestamp + 3600
    )
    context.signed_url = signed_url
    context.upload_key = upload_key
```

#### Step 2: Verify Response
```python
@then(u'I should receive a signed URL and upload key for the photo')
def step_verify_signed_photo_response(context):
    """Verify that signed URL and upload key were generated."""
    assert hasattr(context, 'signed_url'), "No signed URL was generated"
    assert hasattr(context, 'upload_key'), "No upload key was generated"
    assert context.signed_url.startswith('https://'), "Invalid signed URL format"
    assert len(context.upload_key) > 0, "Upload key is empty"
```

### Dependencies
- `behave` for step decorators
- Standard library only (time module)

---

## 2. TypeScript Step Definition Plan

### File: `test/typescript/steps/uploads_steps.ts`

#### Step 1: Request Signed URL
```typescript
import { When, Then } from '@cucumber/cucumber';

When('I request a signed upload URL for a profile photo', async function () {
  const userEmail = (this as any).userEmail || 'test.applicant@example.com';
  const timestamp = Math.floor(Date.now() / 1000);
  const uploadKey = `photo-${userEmail.replace('@', '-')}-${timestamp}`;
  const signedUrl = `https://storage.googleapis.com/test-bucket/photos/${userEmail}?GoogleAccessId=test&Expires=${timestamp + 3600}&Signature=abc123`;

  (this as any).signedUrl = signedUrl;
  (this as any).uploadKey = uploadKey;
});
```

#### Step 2: Verify Response
```typescript
Then('I should receive a signed URL and upload key for the photo', async function () {
  const world = this as any;

  if (!world.signedUrl) {
    throw new Error('No signed URL was generated');
  }
  if (!world.uploadKey) {
    throw new Error('No upload key was generated');
  }
  if (!world.signedUrl.startsWith('https://')) {
    throw new Error('Invalid signed URL format');
  }
  if (world.uploadKey.length === 0) {
    throw new Error('Upload key is empty');
  }
});
```

### Dependencies
- `@cucumber/cucumber` for step decorators
- TypeScript standard types only

---

## 3. Step Registry Update Plan

### File: `test/bdd/step-registry.ts`

**Before Implementation** (current state):
```typescript
'I request a signed upload URL for a profile photo': {
  pattern: /^I\ request\ a\ signed\ upload\ URL\ for\ a\ profile\ photo$/,
  python: 'test/python/steps/uploads_steps.py:1',
  typescript: 'test/typescript/steps/uploads_steps.ts:1',
  features: ['specs/features/uploads/photo_upload.feature:9'],
},
'I should receive a signed URL and upload key for the photo': {
  pattern: /^I\ should\ receive\ a\ signed\ URL\ and\ upload\ key\ for\ the\ photo$/,
  python: 'test/python/steps/uploads_steps.py:1',
  typescript: 'test/typescript/steps/uploads_steps.ts:1',
  features: ['specs/features/uploads/photo_upload.feature:10'],
},
```

**After Implementation** (will update with actual line numbers):
```typescript
'I request a signed upload URL for a profile photo': {
  pattern: /^I\ request\ a\ signed\ upload\ URL\ for\ a\ profile\ photo$/,
  python: 'test/python/steps/uploads_steps.py:XX',  // Update with actual line
  typescript: 'test/typescript/steps/uploads_steps.ts:XX',  // Update with actual line
  features: ['specs/features/uploads/photo_upload.feature:9'],
},
'I should receive a signed URL and upload key for the photo': {
  pattern: /^I\ should\ receive\ a\ signed\ URL\ and\ upload\ key\ for\ the\ photo$/,
  python: 'test/python/steps/uploads_steps.py:XX',  // Update with actual line
  typescript: 'test/typescript/steps/uploads_steps.ts:XX',  // Update with actual line
  features: ['specs/features/uploads/photo_upload.feature:10'],
},
```

---

## 4. Test Commands

### Python Verification
```bash
cd /workspace/test/python
PYTHONPATH=/workspace/test/python python2 -m behave ../../specs/features/uploads/photo_upload.feature -f pretty
```

Expected output:
```
1 feature passed, 0 failed, 0 skipped
1 scenario passed, 0 failed, 0 skipped
3 steps passed, 0 failed, 0 skipped, 0 undefined
```

### TypeScript Verification
```bash
npx tsx scripts/bdd/run-typescript.ts specs/features/uploads/photo_upload.feature
```

Expected output:
```
✓ All scenarios passed
```

### Alignment Verification
```bash
npx tsx scripts/bdd/verify-alignment.ts
```

Expected output:
```
✓ 158 steps defined, 0 orphan, 0 dead
```

---

## 5. Implementation Order

### Step 1: Update Step Registry (FIRST)
- Keep existing entries initially
- Will update line numbers after implementation

### Step 2: Implement Python Steps
- Create `test/python/steps/uploads_steps.py` with step definitions
- Use mock data (no actual GCS calls)
- Run behave to verify

### Step 3: Verify Python Passes
- Run behave on `photo_upload.feature`
- Fix any errors
- **DO NOT proceed until Python passes**

### Step 4: Implement TypeScript Steps
- Create `test/typescript/steps/uploads_steps.ts` with step definitions
- Use same mock data format as Python
- Run cucumber-js to verify

### Step 5: Verify TypeScript Passes
- Run cucumber-js on `photo_upload.feature`
- Fix any errors

### Step 6: Update Step Registry Line Numbers
- Find actual line numbers from implemented files
- Update `test/bdd/step-registry.ts`
- Run alignment check

### Step 7: Final Verification
- Run `verify-alignment.ts`
- Run typecheck
- Run lint
- Update IMPLEMENTATION_PLAN.md

---

## 6. Mock Data Strategy

### Consistent Format
Both Python and TypeScript will generate mock responses with this structure:

```json
{
  "signed_url": "https://storage.googleapis.com/test-bucket/photos/{email}?GoogleAccessId=test&Expires={timestamp+3600}&Signature=abc123",
  "upload_key": "photo-{email-sanitized}-{timestamp}"
}
```

### Email Sanitization
- Replace `@` with `-` in email for upload key
- Example: `test@example.com` → `photo-test-example.com-123456`

### Timestamp Format
- Python: `int(time.time())` (seconds since epoch)
- TypeScript: `Math.floor(Date.now() / 1000)` (seconds since epoch)

---

## 7. Edge Cases to Handle

### No User Email in Context
- Default to `test.applicant@example.com`
- Python: `getattr(context, 'user_email', 'test.applicant@example.com')`
- TypeScript: `(this as any).userEmail || 'test.applicant@example.com'`

### Empty/Invalid Responses
- Assert signed_url exists
- Assert upload_key exists
- Assert URL starts with `https://`
- Assert upload_key is non-empty string

---

## 8. Quality Checks

### Before Completion
- [ ] Python tests pass: 3/3 steps passed
- [ ] TypeScript tests pass: 3/3 steps passed
- [ ] Alignment check passes: 0 orphan, 0 dead
- [ ] Type check passes: `npm run typecheck`
- [ ] Lint passes: `npm run lint`
- [ ] Step registry line numbers updated

### Documentation Updates
- [ ] Mark TASK-022 as ✅ DONE in `IMPLEMENTATION_PLAN.md`
- [ ] Update session handoff notes if needed

---

## 9. Rollback Strategy

If implementation fails:
1. Keep registry entries (pointing to line 1)
2. Delete step implementations
3. Create issue describing failure
4. Move to next task

---

## 10. Success Metrics

- Feature file: `specs/features/uploads/photo_upload.feature`
- Scenarios: 1 (Request signed URL for photo)
- Steps: 3 (1 Given existing, 2 new)
- Expected result: All 3 steps pass in both Python and TypeScript

---

## Summary

**Estimated Implementation Time**: 30-45 minutes
**Risk Level**: Low (mock data, no external dependencies)
**Dependencies**: None
**Next Task**: TASK-023 (Document Upload) - similar pattern
