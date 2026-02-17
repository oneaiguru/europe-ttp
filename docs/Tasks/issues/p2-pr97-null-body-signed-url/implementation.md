# P2-PR97-NULL-BODY-SIGNED-URL: Implementation

## Summary
Added null/object check after JSON.parse in signed-url route to handle edge case where `JSON.parse("null")` returns `null` instead of throwing an error.

## Changes Made

### File: `/Users/m/git/clients/aol/europe-ttp/app/api/upload/signed-url/route.ts`

**Change:** Added type validation after JSON.parse to ensure parsed body is a non-null object.

```typescript
// Before (lines 116-128):
let body: SignedUrlRequest;
try {
  const bodyText = await readBodyWithLimit(request, MAX_BODY_SIZE);
  body = JSON.parse(bodyText) as SignedUrlRequest;
} catch (e) {
  if (isPayloadTooLargeError(e)) {
    return Response.json({ error: 'Payload too large' }, { status: 413 });
  }
  return Response.json({ error: 'Invalid request body' }, { status: 400 });
}
const { filepath, content_type } = body;

// After:
let body: SignedUrlRequest;
try {
  const bodyText = await readBodyWithLimit(request, MAX_BODY_SIZE);
  const parsed = JSON.parse(bodyText);
  // Security: Ensure parsed body is a non-null object (not "null", primitives, etc.)
  if (typeof parsed !== 'object' || parsed === null) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }
  body = parsed as SignedUrlRequest;
} catch (e) {
  if (isPayloadTooLargeError(e)) {
    return Response.json({ error: 'Payload too large' }, { status: 413 });
  }
  return Response.json({ error: 'Invalid request body' }, { status: 400 });
}
const { filepath, content_type } = body;
```

## Verification

### TypeCheck
```
$ npm run typecheck
> europe-ttp-migration@0.1.0 typecheck
> tsc --noEmit
(No errors)
```

### BDD Verify
```
$ npm run bdd:verify
✓ 375 steps defined, 0 orphan, 0 dead, 0 ambiguous, 0 overlapping
```

## Security Impact

This fix prevents a potential issue where:
1. Attacker sends request body `"null"` (literal JSON null)
2. `JSON.parse("null")` returns JavaScript `null` (does NOT throw)
3. Without the fix, destructuring `const { filepath, content_type } = null` would cause a runtime error or unexpected behavior
4. With the fix, we return a proper 400 error response

## Testing Notes

No BDD tests were added per task instructions. The fix is minimal and defensive - it handles an edge case in input validation that would have resulted in a runtime error or undefined behavior.
