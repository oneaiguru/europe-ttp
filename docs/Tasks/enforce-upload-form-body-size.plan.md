# TASK-076: enforce-upload-form-body-size - Implementation Plan

## Summary
Implement stream-based body size enforcement for the `/users/upload-form-data` POST endpoint to prevent DoS attacks via large payloads, missing content-length headers, or chunked transfer encoding.

## Implementation Steps

### Step 1: Create stream-based body reader utility
**File**: `app/utils/request.ts` (new file)

Create a utility function `readBodyWithLimit()` that:
- Reads the request body as a stream
- Counts bytes as they are read
- Aborts and throws when limit exceeded
- Returns the decoded string for JSON parsing
- Uses error code `'413'` that the route handler can convert to proper HTTP status

**Key implementation details**:
```typescript
export async function readBodyWithLimit(
  request: Request,
  maxSize: number
): Promise<string>;
```

### Step 2: Update `readPayload()` function
**File**: `app/users/upload-form-data/route.ts:96-130`

Changes:
1. Import `readBodyWithLimit` from `app/utils/request`
2. For `application/json` content type:
   - Replace `request.json()` with `readBodyWithLimit(request, MAX_PAYLOAD_SIZE)`
   - Parse the returned string with `JSON.parse()`
3. For `multipart/form-data` and `application/x-www-form-urlencoded`:
   - Keep using `request.formData()` (cannot stream multipart)
   - Add a note that content-length check is best-effort for these types
4. Update error handling to detect `'413'` error code
5. Return status 413 (not 400) for oversized payloads

### Step 3: Update error handling in POST handler
**File**: `app/users/upload-form-data/route.ts:142-152`

Changes:
- Detect `Error` with message `'413'` or `'Payload too large'`
- Return HTTP 413 status code with standard message
- Use `Response.json({ error: 'Payload too large' }, { status: 413 })`

### Step 4: Add BDD test scenarios
**File**: `specs/features/api/upload_form_body_size.feature` (new file)

Add test scenarios for:
- Normal payload under 5MB (should succeed)
- Payload exceeding 5MB (should return 413)
- Missing content-length header with small body (should succeed)
- Missing content-length header with large body (should return 413)

### Step 5: Implement TypeScript BDD steps
**File**: `test/typescript/steps/api_steps.ts`

Add step definitions:
- `Given I have a form payload of {int} bytes`
- `When I submit the payload to the upload form API`
- `When I submit the payload without content-length header`
- `Then the API should return status 413`
- `Then the API should accept the form submission`

## Files to Change

| File | Type | Change |
|------|------|--------|
| `app/utils/request.ts` | Create | New utility for stream-based body reading |
| `app/users/upload-form-data/route.ts` | Modify | Use `readBodyWithLimit()`, return 413 for oversized payloads |
| `specs/features/api/upload_form_body_size.feature` | Create | BDD feature for body size enforcement |
| `test/typescript/steps/api_steps.ts` | Modify | Add step definitions for body size tests |
| `test/bdd/step-registry.ts` | Modify | Register new steps (if needed) |

## Tests to Run

```bash
# Verify step registry alignment
bun run bdd:verify

# Run TypeScript BDD tests
bun run bdd:typescript specs/features/api/upload_form_body_size.feature

# Type checking
bun run typecheck

# Linting
bun run lint
```

## Risks & Rollback

| Risk | Mitigation | Rollback |
|------|------------|----------|
| Breaking large legitimate payloads | 5MB is generous for text form data | Increase MAX_PAYLOAD_SIZE constant |
| Performance impact from streaming | Stream reading is efficient for small payloads | Revert to `request.json()` for simple cases |
| Multipart form complexity | Keep existing `formData()` logic; note limitation | Remove multipart enforcement if problematic |

## Acceptance Criteria

- [ ] Requests without content-length are limited to 5MB
- [ ] Chunked transfer encoding requests are limited to 5MB
- [ ] Oversized payloads return 413 (not 400)
- [ ] Normal payloads under 5MB continue to work
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] `bun run bdd:verify` passes

## References

- Research: `docs/Tasks/enforce-upload-form-body-size.research.md`
- Task: `docs/Tasks/enforce-upload-form-body-size.task.md`
- Target file: `app/users/upload-form-data/route.ts`
- Related: TASK-059 (upload-form-data-missing-auth-and-validation)
