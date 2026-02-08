# TASK-060: signed-upload-key-forgeable-and-leaky

## Goal
Make upload keys opaque and non-forgeable by replacing the base64-encoded `user:timestamp:fullFilename` token with an HMAC-signed token or server-generated opaque ID.

## Security Context
The current implementation embeds user email and path data in a client-visible base64 token, which allows:
1. Token forgery (clients can encode arbitrary user:timestamp:filename values)
2. Information leakage (user emails and file paths are visible in base64)

## Refs
- `app/api/upload/signed-url/route.ts:107-108`
- `docs/review/REVIEW_DRAFTS.md:169-176`

## Acceptance Criteria
1. Replace base64 of `user:timestamp:fullFilename` with an HMAC-signed token or server-generated opaque ID
2. Do not embed user email or path data in client-visible tokens
3. Add verification logic wherever the token is consumed

## Implementation Notes
- Current token format (line 107-108): `Buffer.from(`${userEmail}:${timestamp}:${fullFilename}`).toString('base64')`
- Need to use crypto HMAC or a server-side token store
- Token verification must happen when the signed URL is actually used for upload

## Files to Create/Modify
- `app/api/upload/signed-url/route.ts` - Replace token generation with HMAC
- Potentially add a token verification utility or store

## Test Commands
```bash
bun run bdd:typescript specs/features/uploads/photo_upload.feature
bun run bdd:typescript specs/features/uploads/document_upload.feature
bun run bdd:verify
bun run typecheck
bun run lint
```
