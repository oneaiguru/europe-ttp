# TASK: Harden Signed Upload URL

## Task ID
harden-signed-upload-url

## Task Name
harden signed upload url

## Priority
p2 (Security)

## Status
IN PROGRESS

## Goal
Security hardening for the signed upload URL endpoint to prevent unauthorized access and potential abuse.

## Description
Review and harden the signed upload URL generation endpoint to ensure:
1. Proper authentication/authorization checks
2. Short-lived signed URLs with expiration
3. Input validation and sanitization
4. Protection against abuse (rate limiting, etc.)

## Files to Review
- API routes handling upload URL generation (search for "upload", "signed", "url")
- Upload endpoint implementations
- Authentication/authorization middleware

## Acceptance Criteria
1. Signed URLs have proper expiration (e.g., 15 minutes or less)
2. Authentication is required before generating signed URLs
3. Proper validation of upload parameters (file type, size)
4. Rate limiting or abuse prevention measures in place
5. Protection against directory traversal attacks
6. No hardcoded credentials or signing keys

## Security Considerations
- Signed URLs should be short-lived
- Should only be accessible to authenticated users with proper permissions
- Should validate file type and size limits before generating URL
- Should prevent directory traversal attacks in file paths
- Should use proper crypto for signing (not predictable patterns)
