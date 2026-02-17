# P2-PR97-FILEPATH-TYPE-CHECK

## Summary
Fix type validation gap in `app/api/upload/signed-url/route.ts` where `filepath` is deserialized from JSON but never validated to be a string before calling string methods.

## Problem Statement

### Current Behavior
In `app/api/upload/signed-url/route.ts` around line 136, the code checks if `filepath` is truthy then immediately calls string methods on it:

```typescript
if (filepath) {
    // Reject directory traversal attempts
    if (filepath.includes('..') || filepath.startsWith('/')) {
```

### Vulnerability
If a client sends a malformed request like:
```json
{ "filepath": 123, "content_type": "image/jpeg" }
```

- `if (filepath)` passes (123 is truthy)
- `filepath.includes('..')` throws TypeError (numbers don't have .includes)
- Server returns 500 Internal Server Error instead of 400 Bad Request

### Impact
- **Severity**: P2 (Low)
- **CWE**: CWE-704 (Incorrect Type Conversion or Cast)
- Information leakage through stack trace in development mode
- Allows attacker to distinguish error types for reconnaissance

## Proposed Fix

Add type validation before calling string methods:

```typescript
if (filepath) {
    // Security: Validate filepath is a string before calling string methods
    // Prevents TypeError if client sends non-string (e.g., { "filepath": 123 })
    if (typeof filepath !== 'string') {
      return Response.json({ error: 'Invalid filepath type' }, { status: 400 });
    }
    // Reject directory traversal attempts
    if (filepath.includes('..') || filepath.startsWith('/')) {
```

## Implementation Steps

1. Add type check `typeof filepath !== 'string'` at the beginning of the `if (filepath)` block
2. Return 400 with error message "Invalid filepath type"
3. Run typecheck to verify no TypeScript errors
4. Run bdd:verify to ensure step registry alignment

## Testing Strategy

### Unit Test Scenarios
1. Send `{ "filepath": 123, "content_type": "image/jpeg" }` → expect 400
2. Send `{ "filepath": null, "content_type": "image/jpeg" }` → should work (null is falsy)
3. Send `{ "filepath": [], "content_type": "image/jpeg" }` → expect 400
4. Send `{ "filepath": {}, "content_type": "image/jpeg" }` → expect 400
5. Send valid string filepath → should work as before

### Regression Testing
- Existing BDD tests should continue to pass
- No changes to valid request handling

## Acceptance Criteria
- [ ] Type check added for filepath parameter
- [ ] Returns 400 (not 500) for non-string filepath values
- [ ] typecheck passes
- [ ] bdd:verify passes
- [ ] Existing tests continue to pass
