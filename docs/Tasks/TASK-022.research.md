# TASK-022: Photo Upload Feature - Research Findings

## Overview
Research into implementing photo upload signed URL generation and verification.

---

## 1. Legacy Behavior Analysis

### Python 2.7 / App Engine Implementation

**File**: `/workspace/form.py`
- Line 19: Imports `cloudstorage as gcs`
- Line 206: Opens GCS files with `_f = gcs.open(source_file)`
- Lines 505-512: Frontend code for photo upload input field:
  ```python
  <input type="file" ... onchange="uploadPhotos(this,this.files)" accept=".jpg,.jpeg,.png,.gif,image/*">
  ```

**File**: `/workspace/api.py`
- Line 330: Route `('/api/upload-form', UploadForm)` defined
- Lines 43-92: `UploadForm` class handles POST requests for form data uploads

### Key Findings from Legacy Code:

1. **Cloud Storage Library**: Uses `cloudstorage` library (App Engine legacy)
2. **Upload Endpoint**: `/api/upload-form` exists in `api.py`
3. **File Upload Logic**: Form data and file uploads are handled together
4. **No Signed URL Generation**: Legacy code appears to use direct file uploads through webapp2 handlers

---

## 2. TypeScript Context

**Current Implementation Status**:
- `test/typescript/steps/uploads_steps.ts` - Empty skeleton (only comments)
- No existing upload URL generation in TypeScript codebase
- No Next.js API routes for uploads yet

**Parallel Structure Needed**:
- Python: `test/python/steps/uploads_steps.py`
- TypeScript: `test/typescript/steps/uploads_steps.ts`
- Future App Router: `app/api/upload/route.ts` (for actual implementation)

---

## 3. Step Registry Status

**Current Entries** (from `test/bdd/step-registry.ts`):

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

**Status**:
- ✅ Registry entries exist
- ❌ Python paths point to line 1 (placeholder)
- ❌ TypeScript paths point to line 1 (placeholder)
- ❌ Need to update with actual implementation line numbers after coding

---

## 4. Implementation Notes

### Signed URL Generation (for BDD Testing)

**For Python Step Implementation**:
- Mock the signed URL generation (we're testing the flow, not actual GCS)
- Generate a fake signed URL and upload key
- Store them in context for verification
- Example: `context.signed_url = "https://storage.googleapis.com/..."`
- Example: `context.upload_key = "test-upload-key-123"`

**For TypeScript Step Implementation**:
- Similar mocking approach
- Use context.world to store URL and key
- Verify response contains expected fields

### What the Steps Should Do:

**Step 1: "I request a signed upload URL for a profile photo"**
- Simulate API call to generate signed URL
- Create mock response with:
  - `signed_url`: A fake GCS signed URL string
  - `upload_key`: A unique key for tracking the upload
- Store these in context for the next step

**Step 2: "I should receive a signed URL and upload key for the photo"**
- Verify the previous step stored the URL and key
- Check URL format (starts with https://)
- Check upload key exists and is non-empty
- Return pass/fail based on assertions

---

## 5. Google Cloud Storage Libraries Available

**Python 2.7 Libraries**:
- `/workspace/lib/google/cloud/storage/` - Full GCS client library
- `/workspace/lib/google/cloud/storage/_signing.py` - URL signing utilities
- Functions: `get_signed_query_params_v2()`, `get_expiration_seconds_v2()`

**TypeScript/Node.js**:
- Will need `@google-cloud/storage` package for actual implementation
- For BDD tests: Mock responses sufficient

---

## 6. Test Data and Fixtures

**No existing fixtures for uploads**:
- Will need to create mock upload responses
- Test email: `test.applicant@example.com` (from `test/fixtures/test-users.json`)
- Expected response format:
  ```json
  {
    "signed_url": "https://storage.googleapis.com/bucket/object?signature=...",
    "upload_key": "user-photo-test@example.com-123456"
  }
  ```

---

## 7. Related Files

**Step Definition Files** (to be implemented):
- `/workspace/test/python/steps/uploads_steps.py` - Currently empty skeleton
- `/workspace/test/typescript/steps/uploads_steps.ts` - Currently empty skeleton

**Feature File**:
- `/workspace/specs/features/uploads/photo_upload.feature`

**Test Fixtures** (existing):
- `/workspace/test/fixtures/test-users.json` - Test users
- `/workspace/test/fixtures/test-config.json` - Test configuration

---

## 8. Implementation Strategy

### Phase 1: Update Step Registry (FIRST)
1. Keep registry entries as-is initially (line 1 is fine for now)
2. Will update line numbers after implementation

### Phase 2: Python Implementation
1. Import behave and necessary modules
2. Create `@when` step for requesting signed URL
3. Create `@then` step for verifying response
4. Use mock data (no actual GCS calls in tests)
5. Store URL and key in context

### Phase 3: Verify Python Passes
1. Run `behave` on `photo_upload.feature`
2. Ensure both steps pass
3. Fix any assertion errors

### Phase 4: TypeScript Implementation
1. Import cucumber functions
2. Create `When` step for requesting signed URL
3. Create `Then` step for verifying response
4. Use mock data matching Python implementation
5. Store URL and key in this.world

### Phase 5: Verify TypeScript Passes
1. Run cucumber-js on `photo_upload.feature`
2. Ensure both steps pass
3. Fix any assertion errors

### Phase 6: Update Registry
1. Update line numbers in `test/bdd/step-registry.ts`
2. Run `verify-alignment.ts` to confirm no orphans/dead steps

---

## 9. Mock Response Format

**For Consistency Between Python and TypeScript**:

```javascript
{
  signed_url: "https://storage.googleapis.com/test-bucket/photos/test@example.com.jpg?GoogleAccessId=test&Expires=123456&Signature=abc",
  upload_key: "photo-test@example.com-" + timestamp
}
```

---

## 10. Success Criteria

- [ ] Python steps pass in behave
- [ ] TypeScript steps pass in cucumber-js
- [ ] Step registry line numbers updated
- [ ] `verify-alignment.ts` shows 0 orphan, 0 dead
- [ ] Both implementations use same mock data format

---

## Summary

**Complexity**: Low - This is a straightforward API mocking task

**Dependencies**: None (uses mock data)

**Implementation Time**: Short - Simple step definitions with no external API calls needed

**Key Insight**: The legacy code doesn't have explicit signed URL generation (it uses direct upload handlers). For the BDD migration, we need to mock this API endpoint behavior rather than extract from legacy code.
