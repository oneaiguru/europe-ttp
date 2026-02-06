# TASK-059: upload-form-data-missing-auth-and-validation - Implementation Plan

## Overview
Add authentication, input validation, and safer response handling to the `/users/upload-form-data` POST endpoint following the established pattern in `app/api/upload/signed-url/route.ts`.

---

## Implementation Approach: Minimal Hardening (Option A)

Following the research findings, we'll implement minimal hardening that:
1. Matches the existing auth pattern (`x-user-email` header) used in `signed-url/route.ts`
2. Adds input validation with strict field typing
3. Returns safe responses without echoing payloads
4. Preserves platform-level auth for App Engine compatibility

---

## Step-by-Step Implementation

### Step 1: Define Strict Interfaces for Allowed Fields

**File**: `app/users/upload-form-data/route.ts`
**Lines**: 1-9 (replace existing type)

**Action**: Replace the permissive `UploadFormPayload` type with strict interfaces.

```typescript
// Strict interface for allowed form data fields
interface UploadFormPayload {
  form_type?: string;
  form_instance?: string;
  form_data?: unknown;
  form_instance_page_data?: unknown;
  form_instance_display?: string;
  user_home_country_iso?: string;
}

// Remove [key: string]: unknown index signature to prevent unknown fields
```

**Rationale**: The current `[key: string]: unknown` allows any keys. We'll validate against known fields only.

---

### Step 2: Add Authentication Check

**File**: `app/users/upload-form-data/route.ts`
**Lines**: After line 1 (add new constant and function)

**Action**: Add auth check function matching `signed-url/route.ts` pattern.

```typescript
// Maximum payload size (5MB for form data)
const MAX_PAYLOAD_SIZE = 5 * 1024 * 1024;

async function requireAuth(request: Request): Promise<string | null> {
  // WARNING: Uses x-user-email header for compatibility with legacy App Engine
  // Platform-level auth is REQUIRED in production
  // TODO: Replace with NextAuth.js for standalone deployments
  const user = request.headers.get('x-user-email');
  if (!user) {
    return null;
  }
  // Basic email format validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user)) {
    return null;
  }
  return user;
}
```

**Rationale**: Matches the existing pattern in `signed-url/route.ts:55-58`.

---

### Step 3: Add Payload Size Check

**File**: `app/users/upload-form-data/route.ts`
**Lines**: Modify `readPayload` function (lines 34-62)

**Action**: Add size check before parsing body.

```typescript
async function readPayload(request: Request): Promise<UploadFormPayload> {
  // Security: Check payload size before parsing
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
    throw new Error('Payload too large');
  }

  const contentType = request.headers.get('content-type') ?? '';
  // ... rest of function
}
```

**Rationale**: Prevents DoS via large payloads.

---

### Step 4: Add Field Validation

**File**: `app/users/upload-form-data/route.ts`
**Lines**: Add new function after `normalizePayload`

**Action**: Add validation function for allowed fields.

```typescript
interface ValidationError {
  field: string;
  message: string;
}

function validatePayload(payload: unknown): { valid: boolean; errors: ValidationError[]; data?: UploadFormPayload } {
  const errors: ValidationError[] = [];

  if (typeof payload !== 'object' || payload === null) {
    return { valid: false, errors: [{ field: 'body', message: 'Invalid request body' }] };
  }

  const data = payload as Record<string, unknown>;

  // Check for unknown fields (reject any field not in our whitelist)
  const allowedFields = new Set([
    'form_type',
    'form_instance',
    'form_data',
    'form_instance_page_data',
    'form_instance_display',
    'user_home_country_iso',
  ]);

  for (const key of Object.keys(data)) {
    if (!allowedFields.has(key)) {
      errors.push({ field: key, message: `Unknown field '${key}' is not allowed` });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [], data: data as UploadFormPayload };
}
```

**Rationale**: Whitelist-based validation prevents injection of unexpected data.

---

### Step 5: Update POST Handler with Auth and Validation

**File**: `app/users/upload-form-data/route.ts`
**Lines**: 64-77 (replace existing POST function)

**Action**: Add auth check, validation, and safer response.

```typescript
export async function POST(request: Request): Promise<Response> {
  // 1. Authentication check
  const user = await requireAuth(request);
  if (!user) {
    return Response.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // 2. Parse and validate payload
  let payload: unknown;
  try {
    payload = await readPayload(request);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to parse request';
    return Response.json(
      { error: message },
      { status: 400 }
    );
  }

  // 3. Validate fields
  const validation = validatePayload(payload);
  if (!validation.valid) {
    return Response.json(
      {
        error: 'Validation failed',
        details: validation.errors,
      },
      { status: 400 }
    );
  }

  const normalized = normalizePayload(validation.data!);

  // 4. TODO: Store data (current implementation is a stub)
  // For now, just acknowledge success without echoing payload

  return Response.json(
    {
      ok: true,
      user: user, // Echo user for verification (not full payload)
    },
    { status: 200 }
  );
}
```

**Rationale**: Removes unsafe `received: normalized` echo, adds proper error responses.

---

### Step 6: Update readPayload Error Handling

**File**: `app/users/upload-form-data/route.ts`
**Lines**: 34-62

**Action**: Change silent failures (returning `{}`) to throw errors that POST handler can catch.

```typescript
async function readPayload(request: Request): Promise<UploadFormPayload> {
  // Security: Check payload size before parsing
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
    throw new Error('Payload too large');
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      return (await request.json()) as UploadFormPayload;
    } catch (e) {
      throw new Error('Invalid JSON body');
    }
  }

  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData();
      const data: Record<string, unknown> = {};
      formData.forEach((value, key) => {
        data[key] = typeof value === 'string' ? value : value.name;
      });
      return data as UploadFormPayload;
    } catch (e) {
      throw new Error('Invalid form data');
    }
  }

  try {
    return (await request.json()) as UploadFormPayload;
  } catch (e) {
    throw new Error('Invalid request body');
  }
}
```

**Rationale**: Silent failures make debugging difficult; throwing allows proper error responses.

---

## Files to Change

| File | Change | Lines |
|------|--------|-------|
| `app/users/upload-form-data/route.ts` | Replace `UploadFormPayload` type | 1-9 |
| `app/users/upload-form-data/route.ts` | Add auth function | After 9 |
| `app/users/upload-form-data/route.ts` | Add validation function | After 32 |
| `app/users/upload-form-data/route.ts` | Update `readPayload` with size check and error throws | 34-62 |
| `app/users/upload-form-data/route.ts` | Replace POST handler | 64-77 |
| `app/users/upload-form-data/route.ts` | Add security header comments | Top of file |

---

## Tests to Run

```bash
# 1. Type checking
bun run typecheck

# 2. Linting
bun run lint

# 3. BDD verification (should pass - tests use mocks)
bun run bdd:verify

# 4. Manual testing (recommended)
# Test 1: No auth header -> 401
curl -X POST http://localhost:3000/users/upload-form-data \
  -H "Content-Type: application/json" \
  -d '{"form_type": "test"}'

# Test 2: Valid request with auth -> 200
curl -X POST http://localhost:3000/users/upload-form-data \
  -H "Content-Type: application/json" \
  -H "x-user-email: test@example.com" \
  -d '{"form_type": "test", "form_instance": "123"}'

# Test 3: Unknown field -> 400
curl -X POST http://localhost:3000/users/upload-form-data \
  -H "Content-Type: application/json" \
  -H "x-user-email: test@example.com" \
  -d '{"form_type": "test", "malicious_field": "payload"}'
```

---

## Error Response Formats

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 400 Bad Request (Validation Error)
```json
{
  "error": "Validation failed",
  "details": [
    { "field": "malicious_field", "message": "Unknown field 'malicious_field' is not allowed" }
  ]
}
```

### 400 Bad Request (Parse Error)
```json
{
  "error": "Invalid JSON body"
}
```

### 200 OK (Success)
```json
{
  "ok": true,
  "user": "user@example.com"
}
```

---

## Risks

1. **Breaking Change**: Clients that expect `received` field in response will break
   - **Mitigation**: Document the new response format
   - **Rollback**: Can temporarily add `received` back with warning if needed

2. **Field Rejection**: Existing clients sending unknown fields will get 400 errors
   - **Mitigation**: Review what fields are currently being sent
   - **Rollback**: Can add a "strict mode" flag if needed

3. **Auth Header Dependency**: Still relies on platform-level auth
   - **Mitigation**: This is documented with warning comments
   - **Future**: Implement NextAuth.js (separate P0 task)

---

## Rollback Plan

If implementation breaks existing functionality:

1. **Quick Fix**: Revert to echoing `received` but keep auth check
2. **Medium Fix**: Add `STRICT_VALIDATION` environment variable to disable field validation
3. **Full Rollback**: Revert entire file to previous implementation

---

## Success Criteria

- [ ] Route returns 401 when `x-user-email` header is missing
- [ ] Route returns 400 when unknown fields are submitted
- [ ] Route returns 400 for malformed JSON
- [ ] Route returns 200 with minimal response (no payload echo)
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] `bun run bdd:verify` passes (tests use mocks, should not be affected)
