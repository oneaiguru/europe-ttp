# TASK-059: upload-form-data-missing-auth-and-validation - Research

## Summary
The `/users/upload-form-data` POST endpoint lacks authentication, authorization, input validation, and has unsafe response behavior. This research documents the current implementation, existing patterns, and constraints.

---

## Current Implementation

### File: `app/users/upload-form-data/route.ts`

**Lines 64-76** (POST handler):
```typescript
export async function POST(request: Request): Promise<Response> {
  const payload = await readPayload(request);
  const normalized = normalizePayload(payload);

  return Response.json(
    {
      ok: true,
      received: normalized,  // ← Echoes entire payload
    },
    {
      status: 200,
    },
  );
}
```

**Issues identified**:
1. **No authentication check** - Anyone can POST without auth
2. **No authorization check** - No verification that user owns the data
3. **Echoes raw input** - Returns entire payload in response (`received: normalized`)
4. **Permissive type** - Uses `[key: string]: unknown` allowing any keys
5. **Silent failures** - Returns `{}` on parse errors (lines 40, 53, 60)
6. **No size limits** - No max payload enforcement

---

## Existing Auth Patterns in Codebase

### Pattern 1: `x-user-email` Header (platform-level auth)

**File: `app/api/upload/signed-url/route.ts:48-58`**
```typescript
export async function POST(request: NextRequest): Promise<NextResponse<SignedUrlResponse>> {
  // WARNING: Uses x-user-email header for compatibility with legacy App Engine
  // Platform-level auth is REQUIRED in production
  const user = request.headers.get('x-user-email');
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  // ... rest of handler
}
```

**Notes**:
- This pattern relies on Google App Engine's `users.get_current_user()` at platform level
- In standalone Next.js deployment, this header can be forged
- Code includes warning comments about this limitation

### Pattern 2: Legacy Python auth

**Files**:
- `ttc_portal_user.py:36-89` - `set_form_data()` method (no explicit auth check, relies on platform)
- `form.py` - Uses `@login_required` decorator pattern

**Search results** show 17 files use `users.get_current_user()` for auth:
- `reporting/user_report.py`
- `ttc_portal_user.py`
- `ttc_portal.py`
- `admin.py`
- etc.

### Pattern 3: No Next.js middleware or session implementation

**Finding**: `middleware.ts` does not exist in the codebase.
**Finding**: No `NextAuth` or `getServerSession` imports found.

---

## Test Data Context

### BDD Feature: `specs/features/user/form_data_upload.feature`

```gherkin
Feature: User Form Data Upload
  As a authenticated user
  I want to upload form data
  So that save my application progress

  @p1 @needs-verification
  Scenario: Upload form data
    Given I am authenticated on the TTC portal
    When I upload form data for a specific form instance
    Then my form data should be stored for that instance
```

### Test Steps: `test/typescript/steps/user_steps.ts:195-220`

The test steps use a **MockTTCPortalUser** class that:
- Stores form data in memory (`formData` property)
- Does NOT actually call the `/users/upload-form-data` route
- Works with local objects only

**Important**: The BDD tests do NOT cover the actual API route. They test a mock implementation.

---

## Data Model Reference

### Legacy Python: `ttc_portal_user.py:36-89`

```python
def set_form_data(self, f_type, f_instance, f_data, f_instance_page_data, f_instance_display):
    # Stores form data per user
    self.form_data[f_type][_instance] = {
        'data': f_data,
        'form_instance_page_data': f_instance_page_data,
        'form_instance_display': f_instance_display,
        'is_agreement_accepted': utils.str2bool(f_data.get('i_agreement_accepted')),
        'is_form_submitted': utils.str2bool(f_data.get('i_form_submitted')),
        'send_confirmation_to_candidate': utils.str2bool(f_data.get('i_send_confirmation_to_candidate')),
        'is_form_complete': _is_form_complete,
        'last_update_datetime': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
```

### Expected Payload Fields (from current implementation)

```typescript
type UploadFormPayload = {
  form_type?: string;
  form_instance?: string;
  form_data?: unknown;
  form_instance_page_data?: unknown;
  form_instance_display?: string;
  user_home_country_iso?: string;
  [key: string]: unknown;  // ← Permits unknown fields
};
```

---

## Related/Referenced Files

| File | Relevance | Notes |
|------|-----------|-------|
| `app/api/upload/signed-url/route.ts` | Auth pattern | Uses x-user-email header with 401 response |
| `app/utils/html.ts` | Utility | Escape functions exist for XSS prevention |
| `ttc_portal_user.py` | Legacy model | `set_form_data()` method reference |
| `test/typescript/steps/user_steps.ts` | Tests | Mock implementation, not testing actual route |
| `test/typescript/steps/auth_steps.ts` | Tests | Auth context for BDD scenarios |

---

## Constraints & Considerations

1. **Platform-dependent auth**: Current pattern assumes App Engine handles auth
2. **Standalone deployment**: In pure Next.js, x-user-email header is forgeable
3. **BDD tests are mocks**: Adding auth won't break existing tests (they use mocks)
4. **No session middleware**: Would need to be added for real auth
5. **Legacy data model**: Must match `ttc_portal_user.py` structure for compatibility

---

## Implementation Options

### Option A: Minimal Hardening (P2 - Recommended for now)
- Add x-user-email header check (matching `signed-url/route.ts` pattern)
- Add warning comment about platform-level auth requirement
- Define strict allowed fields interface
- Add max payload size check
- Return minimal response (don't echo payload)

### Option B: Full Session Auth (Future P0/P1)
- Implement NextAuth.js or similar
- Add `middleware.ts` for route protection
- Replace x-user-email header with real session verification
- Requires additional infrastructure

---

## Security Implications (Current State)

| Issue | Severity | Impact |
|-------|----------|--------|
| No authentication | **HIGH** | Anyone can submit data for any user |
| No authorization | **HIGH** | Cross-user data submission possible |
| Echoes payload | **MEDIUM** | Potential XSS/data leakage in responses |
| No field whitelist | **MEDIUM** | Injection of unexpected data |
| Silent failures | **LOW** | Poor debugging, possible data loss |

---

## References

- `docs/review/REVIEW_DRAFTS.md:160-168` - Task definition
- `app/users/upload-form-data/route.ts:64-76` - Target code
- `app/api/upload/signed-url/route.ts:48-58` - Auth pattern reference
- `ttc_portal_user.py:36-89` - Legacy data model
