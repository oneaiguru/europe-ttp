# TASK-076: enforce-upload-form-body-size - Research

## Summary
The `/users/upload-form-data` POST endpoint has incomplete body size enforcement. The current `content-length` check is conditional and bypassed when the header is missing or for chunked transfer encoding. This allows unbounded payload consumption, creating a DoS vulnerability.

---

## Current Implementation

### File: `app/users/upload-form-data/route.ts`

**Lines 8-9** (MAX_PAYLOAD_SIZE constant):
```typescript
// Maximum payload size (5MB for form data)
const MAX_PAYLOAD_SIZE = 5 * 1024 * 1024;
```

**Lines 96-101** (readPayload size check):
```typescript
async function readPayload(request: Request): Promise<UploadFormPayload> {
  // Security: Check payload size before parsing
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
    throw new Error('Payload too large');
  }
  // ...
}
```

**Issues identified**:
1. **Conditional check** - `if (contentLength && ...)` bypasses check when header is missing
2. **No enforcement during read** - Entire body is consumed even if `content-length` is absent
3. **Wrong status code** - Returns 400 instead of 413 (Payload Too Large)
4. **Chunked encoding bypass** - `Transfer-Encoding: chunked` requests don't have `content-length`

---

## Technical Constraints

### Bun Request API Limitations

**Finding**: Bun's Web API `Request` object (used in Next.js App Router) does **not** provide a built-in body size limit during reading.

**What exists**:
- `Bun.serve()` has `maxRequestBodySize` option (default: 128MB) [Source: Bun Docs](https://bun.com/reference/bun/Serve)
- This is NOT available on standard Web API `Request` objects used in route handlers

**What doesn't exist**:
- No `request.bodySizeLimit` property
- No `request.json({ maxSize })` option
- No streaming size limit utility in the Web API

### Related Files and Patterns

**File**: `app/api/upload/signed-url/route.ts:32`
- Has `MAX_FILE_SIZE = 10 * 1024 * 1024` constant
- Used for **metadata validation**, not actual body reading
- Actual file upload goes to GCS, not through this route

**File**: `app/utils/auth.ts`
- Environment-gated authentication (platform/session modes)
- No body size enforcement utilities

---

## Attack Vectors

### Vector 1: Missing Content-Length Header

```bash
# Client omits content-length header
curl -X POST http://localhost:3000/users/upload-form-data \
  -H "Content-Type: application/json" \
  -H "x-user-email: attacker@example.com" \
  -d @100mb-file.json

# Result: Entire 100MB read into memory, DoS potential
```

**Why this works**: The check `if (contentLength && ...)` evaluates to false when `contentLength` is `null`.

### Vector 2: Chunked Transfer Encoding

```bash
# Client uses chunked encoding (no content-length)
curl -X POST http://localhost:3000/users/upload-form-data \
  -H "Content-Type: application/json" \
  -H "Transfer-Encoding: chunked" \
  -H "x-user-email: attacker@example.com" \
  --data-binary @100mb-file.json

# Result: Bypasses content-length check entirely
```

**Why this works**: Chunked requests don't send `content-length` header.

### Vector 3: Spoofed Small Content-Length

```bash
# Client sends small content-length but large body
curl -X POST http://localhost:3000/users/upload-form-data \
  -H "Content-Type: application/json" \
  -H "Content-Length: 100" \
  -H "x-user-email: attacker@example.com" \
  --data-binary @100mb-file.json

# Result: Check passes but 100MB is still read
```

**Why this works**: The header check only validates the header value, not the actual body size.

---

## Implementation Options

### Option A: Manual Stream Counting (Recommended)

**Approach**: Read the body as a stream, count bytes, abort when limit exceeded.

```typescript
async function readPayloadWithLimit(request: Request, maxSize: number): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) {
    throw new Error('No readable stream');
  }

  const chunks: Uint8Array[] = let totalSize = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalSize += value.length;
    if (totalSize > maxSize) {
      reader.cancel();
      throw new Error('413'); // Use code for 413 status
    }
    chunks.push(value);
  }

  // Decode and return
  const decoder = new TextDecoder();
  let result = '';
  for (const chunk of chunks) {
    result += decoder.decode(chunk, { stream: true });
  }
  return result;
}
```

**Pros**:
- Enforces limit regardless of content-length header
- Works with chunked encoding
- Memory bounded by maxSize
- Pure Web API, no Bun-specific code

**Cons**:
- More complex than current implementation
- Slightly slower (need to decode manually)

**Complexity**: Medium (new utility function needed)

---

### Option B: Request.clone() + Double Read (Not Recommended)

**Approach**: Clone request to read body twice.

**Why this fails**:
- `request.clone()` creates a copy but BOTH must read the full body
- Does NOT solve the problem
- May actually double memory usage

**Verdict**: Do not use.

---

### Option C: Server-Level Limit (Infrastructure)

**Approach**: Configure `Bun.serve({ maxRequestBodySize })` at server start.

**Why this doesn't work for Next.js**:
- Next.js App Router uses Web API `Request` objects
- The `Bun.serve()` option applies to the server, not individual routes
- Next.js manages its own server lifecycle
- Configuring this requires custom server setup

**Verdict**: Not viable for standard Next.js App Router deployment.

---

### Option D: Accept Current Risk (Not Recommended)

**Approach**: Document the limitation and rely on infrastructure (App Engine, nginx, etc.) for body size limits.

**Why this is risky**:
- Infrastructure limits may be much higher (e.g., 32MB default in App Engine)
- No defense-in-depth at application level
- Relies on external configuration that may change

**Verdict**: Not acceptable for P0 security task.

---

## Recommended Solution: Option A (Manual Stream Counting)

### Implementation Plan

1. **Add stream-based body reader utility**
   - File: `app/utils/request.ts` (new file)
   - Function: `readBodyWithLimit(request: Request, maxSize: number)`

2. **Update `readPayload` function**
   - Replace direct `request.json()` calls with `readBodyWithLimit()`
   - Handle JSON, form-urlencoded, and multipart cases

3. **Fix status code**
   - Change from 400 to 413 for oversized payloads
   - Use standard error message

4. **Add tests**
   - Test with missing content-length
   - Test with chunked encoding
   - Test with spoofed content-length

---

## Related/Referenced Files

| File | Relevance | Notes |
|------|-----------|-------|
| `app/users/upload-form-data/route.ts` | Target | Main file to modify |
| `app/api/upload/signed-url/route.ts` | Reference | Has MAX_FILE_SIZE constant |
| `app/utils/auth.ts` | Related | Auth utilities, no body size code |
| `app/utils/crypto.ts` | Related | Crypto utilities, not relevant |
| `test/typescript/steps/api_steps.ts` | Tests | Tests for upload-form-data endpoint |

---

## Existing Tests Coverage

**File**: `test/typescript/steps/api_steps.ts:117-142`

Current test:
```typescript
When('I submit form data to the upload form API', async () => {
  // ... creates Request with JSON.stringify(payload)
  const response = await POST(
    new Request(url.toString(), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-email': authContext.currentUser?.email,
      },
      body: JSON.stringify(payload), // Small test payload
    }),
  );
  // ...
});
```

**Gap**: No tests for:
- Oversized payloads
- Missing content-length
- Chunked encoding
- 413 response code

---

## Security Implications

| Issue | Severity | Current Mitigation |
|-------|----------|-------------------|
| Missing content-length bypass | **HIGH** | None - full body read |
| Chunked encoding bypass | **HIGH** | None - full body read |
| Wrong status code (400 vs 413) | **MEDIUM** | Client retry logic may not trigger |
| No application-level defense | **HIGH** | Relies on infrastructure limits |

---

## HTTP Status Code Reference

From [MDN 413 Content Too Large](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/413):

> The 413 (Content Too Large) status code indicates that the entity is larger than limits defined by the server. The server might close the connection or return a `Retry-After` header.

**Current behavior**: Returns 400 Bad Request
**Required behavior**: Returns 413 Content Too Large

---

## Risks & Rollback

### Implementation Risks

1. **Breaking change for large payloads**
   - Legitimate payloads >5MB will be rejected
   - **Mitigation**: 5MB is generous for form data (text-based)
   - **Rollback**: Increase limit or make configurable

2. **Performance impact**
   - Stream reading may be slightly slower than `request.json()`
   - **Mitigation**: 5MB limit is small; performance impact negligible
   - **Rollback**: Can revert to `request.json()` for small payloads

3. **Multipart form complexity**
   - `request.formData()` doesn't support streaming
   - **Mitigation**: Keep current `formData()` logic; add size check via content-length
   - **Rollback**: Remove multipart size enforcement if problematic

---

## Success Criteria

- [ ] Requests without content-length are limited to 5MB
- [ ] Chunked transfer encoding requests are limited to 5MB
- [ ] Oversized payloads return 413 (not 400)
- [ ] Normal payloads under 5MB continue to work
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] `bun run bdd:verify` passes

---

## References

- [Bun.serve maxRequestBodySize issue](https://github.com/oven-sh/bun/issues/6031)
- [Bun.serve maxRequestBodySize not working properly](https://github.com/oven-sh/bun/issues/6504)
- [MDN 413 Content Too Large](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/413)
- `app/users/upload-form-data/route.ts:8-9` - Current MAX_PAYLOAD_SIZE constant
- `app/users/upload-form-data/route.ts:96-101` - Current conditional check
- `docs/Tasks/upload-form-data-missing-auth-and-validation.plan.md` - Related TASK-059
