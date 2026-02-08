# TASK-077: enforce-signed-upload-constraints

## Goal
Enforce server-side constraints on signed upload URLs to prevent file type bypass and directory traversal attacks.

## Feature File
N/A - This is a security hardening task based on findings in review backlog.

## References
- `app/api/upload/signed-url/route.ts` - Current signed upload implementation
- `specs/features/test/placeholder_matching.feature` - Related test patterns

## Context
From `docs/review/REVIEW_DRAFTS.md`:
> TASK-077 (P1): **enforce-signed-upload-constraints** - The signed upload route (app/api/upload/signed-url/route.ts) currently returns signed URLs without enforcing file type constraints or validating the upload path. This allows bypassing client-side validation and potential directory traversal.

## Legacy Reference
- File: `pyutils/upload.py`
- Relevant patterns: File extension validation, path sanitization

## Acceptance Criteria
- [ ] Signed upload route validates file extension against allowed types
- [ ] Signed upload route prevents directory traversal (no ".." in paths)
- [ ] Signed upload route normalizes object keys to prevent path manipulation
- [ ] `bun run bdd:verify` passes
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes

## Files to Modify
- `app/api/upload/signed-url/route.ts` - Add validation logic
- `app/utils/crypto.ts` - May need helper functions for path validation
- `specs/features/api/upload_form_body_size.feature` - May need new scenarios

## Test Commands
```bash
bun run bdd:verify
bun run typecheck
bun run lint
bun run bdd:typescript specs/features/api/
```

## Security Considerations
1. File type validation must be server-side (client-side can be bypassed)
2. Path normalization should prevent "../" and absolute paths
3. Object key validation should prevent null bytes and special characters
4. Consider using a whitelist approach for allowed extensions

## Implementation Notes
- Follow existing patterns from `app/utils/crypto.ts` for validation
- Use Web API standards (Bun-compatible) rather than Node.js-specific APIs
- Return appropriate HTTP error codes (400, 403) for invalid inputs
