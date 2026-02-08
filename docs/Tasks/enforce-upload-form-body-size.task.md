# TASK-076: enforce-upload-form-body-size

## Goal
Enforce body size limits on the upload form data endpoint to prevent denial-of-service attacks.

## Feature File
N/A - Security hardening task

## Reference
- File: `app/users/upload-form-data/route.ts`
- Related: TASK-059 (upload-form-data-missing-auth-and-validation)

## Context
The upload-form-data route currently validates individual fields but does not enforce a maximum request body size. This could allow:
- Large payload submissions that exhaust memory
- DoS attacks through large multipart/form-data uploads
- Unbounded file uploads

## Acceptance Criteria
- [ ] Request body size is limited to a reasonable maximum (e.g., 10MB for form data)
- [ ] Requests exceeding the limit return 413 Payload Too Large
- [ ] Body size limit is enforced before parsing the multipart form
- [ ] `bun run bdd:verify` passes
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes

## Files to Modify
- [ ] `app/users/upload-form-data/route.ts`

## Test Commands
```bash
bun run bdd:verify
bun run typecheck
bun run lint
```
