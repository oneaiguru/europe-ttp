# P2-PR97-NULL-BODY-VERIFY: Implementation

## Issue
The `/api/upload/verify` endpoint did not validate that the JSON-parsed body is a non-null object before destructuring. This could cause runtime errors if a client sends `null` or a primitive value as the request body.

## Fix Applied

### File: `app/api/upload/verify/route.ts`

**Before:**
```typescript
  // 2. Parse request body with size limit
  let body: VerifyRequest;
  try {
    const bodyText = await readBodyWithLimit(request, MAX_BODY_SIZE);
    body = JSON.parse(bodyText) as VerifyRequest;
  } catch (e) {
    if (isPayloadTooLargeError(e)) {
      return Response.json({ error: 'Payload too large' }, { status: 413 });
    }
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { key } = body;
```

**After:**
```typescript
  // 2. Parse request body with size limit
  let body: VerifyRequest;
  try {
    const bodyText = await readBodyWithLimit(request, MAX_BODY_SIZE);
    const parsed = JSON.parse(bodyText);
    if (typeof parsed !== 'object' || parsed === null) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }
    body = parsed as VerifyRequest;
  } catch (e) {
    if (isPayloadTooLargeError(e)) {
      return Response.json({ error: 'Payload too large' }, { status: 413 });
    }
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { key } = body;
```

## Verification

- [x] TypeScript typecheck passes
- [x] BDD step registry alignment verified (375 steps, 0 issues)

## Notes

- No BDD tests added per task instructions (minimal code fix only)
- The fix ensures `JSON.parse` results are validated as objects before use
- Prevents runtime errors from `null`, string, number, or boolean body values
