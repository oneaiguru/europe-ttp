# PDF Handling Security Policy

## Executive Summary

**Status**: ✅ Secure - PDF generation uses safe npm package, vulnerable code removed

**Last Updated**: 2025-02-08

**Risk Level**: P2 → **Resolved**

---

## Background

### Security Issue (Resolved)

The `experimental/jsPDF-master/` folder contained PDF.js library files with security vulnerabilities:

- **Vulnerability**: `new Function()` calls in `pdf.js:17812` and `pdf.worker.js:70815`
- **Risk**: Code injection when processing untrusted PDFs
- **Attack Vector**: Malicious PDF with crafted JavaScript → arbitrary code execution
- **CSP Violation**: Required `unsafe-eval`, blocked by security policies

### Resolution

**Action Taken**: Removed `experimental/jsPDF-master/` entirely

**Rationale**:
1. ✅ Zero usage - No code references these files
2. ✅ Security best practice - Remove attack surface rather than patch
3. ✅ Clean dependency - Prevents accidental future use
4. ✅ Maintainability - No need to patch minified third-party built files

---

## Current PDF Implementation

### PDF Generation (Safe ✅)

**Library**: `jspdf@4.1.0` (npm package)

**Usage**: `app/utils/pdf.ts`

```typescript
import { jsPDF } from 'jspdf';

export function createDeterministicPDF(options?: DeterministicPDFOptions): jsPDF {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  // Override non-deterministic defaults for test stability
  doc.setCreationDate(dateObj);
  doc.setFileId(fileId);

  return doc;
}
```

**Security Posture**:
- ✅ Generates PDFs from application data (not user input)
- ✅ No client-side PDF rendering or processing
- ✅ Deterministic output for test stability
- ✅ No `eval()` or dynamic code execution

### PDF Storage (Secure ✅)

**Flow**:
```
User → POST /api/upload/signed-url → Google Cloud Storage
       (Authenticated, HMAC-signed, 10MB limit, content-type whitelist)
```

**Security Measures**:
- ✅ Authentication required (AUTH_MODE: platform or session)
- ✅ HMAC-signed upload tokens (unforgeable)
- ✅ Content-type whitelist (pdf, doc, docx, images)
- ✅ Server-controlled filenames (prevents path traversal)
- ✅ 10MB file size limit
- ✅ 15-minute token expiration

### PDF Processing (None ✅)

**Current**: No client-side PDF rendering or processing

**Implication**: No risk from malicious PDF content

---

## Security Controls

### 1. Content-Security-Policy (CSP) Headers

**File**: `middleware.ts`

```typescript
response.headers.set('Content-Security-Policy',
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline'; " +
  "object-src 'none'; " +
  "base-uri 'self'; " +
  "form-action 'self';"
)
```

**Protection**:
- ❌ Blocks `eval()` calls
- ❌ Blocks `new Function()` calls
- ❌ Blocks `setTimeout(string)` and `setInterval(string)`
- ❌ Blocks plugin execution (PDF viewers, Flash, etc.)

**Note**: Intentionally excludes `'unsafe-eval'` from `script-src`.

### 2. Code Review Requirements

**Before Adding Any PDF Processing**:
1. ✅ Use server-side PDF processing libraries (e.g., Python PyPDF2, Node PDF2JSON)
2. ✅ Never use `eval()`, `new Function()`, or similar dynamic code execution
3. ✅ Validate PDF structure before processing
4. ✅ Sanitize extracted data
5. ✅ Run in sandboxed environment (Docker, gVisor)
6. ✅ Update CSP headers to allow required functionality safely

**Prohibited**:
- ❌ Client-side PDF rendering with PDF.js (unless `isEvalSupported: false`)
- ❌ Processing untrusted PDFs on the client side
- ❌ Using `eval()` or `new Function()` for any PDF operations

---

## Future PDF Rendering Requirements

If client-side PDF viewing is needed in the future:

### Option 1: Server-Side Rendering (Recommended ✅)

**Approach**: Convert PDFs to images on the server

```typescript
// Example: Server-side PDF to image conversion
import * as pdf from 'pdf-poppler';

async function convertPDFToImage(pdfBuffer: Buffer): Promise<Buffer> {
  // Convert first page to PNG
  const images = await await pdf.convert(pdfBuffer, {
    format: 'png',
    out_dir: '/tmp',
  });
  return images[0];
}
```

**Pros**:
- ✅ No vulnerable code on client
- ✅ CSP-compliant
- ✅ Better control over rendering

**Cons**:
- ⚠️ Server-side processing overhead
- ⚠️ Storage for converted images

### Option 2: PDF.js with Safe Configuration

If client-side PDF.js is required:

```typescript
import * as pdfjsLib from 'pdfjs-dist';

// CRITICAL: Disable eval support
const loadingTask = pdfjsLib.getDocument({
  url: pdfUrl,
  isEvalSupported: false, // ✅ Prevents new Function() calls
  cMapUrl: '/cmaps/',
  cMapPacked: true,
});
```

**CSP Requirements**:
```typescript
// Add 'unsafe-eval' ONLY if absolutely necessary
// WARNING: This reduces security!
response.headers.set('Content-Security-Policy',
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // ⚠️ Security risk
  "worker-src 'self' blob:;" + // Required for PDF.js web worker
  "object-src 'none';"
)
```

**Approval Required**: Security review before adding `'unsafe-eval'`.

---

## Threat Model

### Before Fix

| Threat | Mitigation | Status |
|--------|------------|--------|
| Malicious PDF upload | Auth + HMAC + Content-type whitelist | ✅ Protected |
| Code injection from PDF.js eval | None | ❌ Vulnerable |
| CSP violation | No CSP headers | ❌ Vulnerable |
| Accidental use of vulnerable code | Code review | ⚠️ Partial |

### After Fix

| Threat | Mitigation | Status |
|--------|------------|--------|
| Malicious PDF upload | Auth + HMAC + Content-type whitelist | ✅ Protected |
| Code injection from PDF.js eval | Code removed + CSP blocks eval | ✅ Protected |
| CSP violation | CSP middleware enforced | ✅ Protected |
| Accidental use of vulnerable code | Folder removed | ✅ Protected |

---

## Compliance

### OWASP Top 10 (2021)

- ✅ **A03: Injection** - CSP blocks eval-based injection
- ✅ **A05: Security Misconfiguration** - Removed unused vulnerable code
- ✅ **A06: Vulnerable Components** - Removed PDF.js with known eval issues

### Security Principles

- ✅ **Defense in Depth** - Auth + HMAC + CSP + code removal
- ✅ **Least Privilege** - No eval, minimal CSP permissions
- ✅ **Secure by Default** - Blocks unsafe-eval globally

---

## Monitoring and Maintenance

### Regular Tasks

1. **Monthly**: Review `npm audit` for jsPDF vulnerabilities
2. **Quarterly**: Review CSP headers for needed adjustments
3. **On Change**: Security review before adding PDF processing features

### Incident Response

If PDF-related vulnerabilities are discovered:

1. **Immediate**: Disable PDF-related endpoints if critical
2. **Investigation**: Check logs for exploit attempts
3. **Remediation**: Patch or remove vulnerable code
4. **Post-Mortem**: Update this document

---

## References

- **Original Issue**: PDF.js `new Function()` vulnerability in `experimental/jsPDF-master/`
- **CSP Specification**: [Content-Security-Policy Level 3](https://w3c.github.io/webappsec-csp/)
- **OWASP eval() Risks**: [Unrestricted Code Execution](https://owasp.org/www-community/attacks/Unrestricted_Code_Evaluation)
- **jsPDF Documentation**: [jsPDF GitHub](https://github.com/parallax/jsPDF)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-02-08 | Initial policy - Removed experimental/jsPDF-master, added CSP middleware | Claude Code |
| 2025-02-08 | Added deterministic PDF generation implementation note | User |

---

**Document Owner**: Development Team

**Review Date**: 2025-05-08 (quarterly)
