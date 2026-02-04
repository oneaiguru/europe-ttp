# TASK-035: Research Findings

## Task ID
TASK-035: Certificate PDF Generation

## Date
2026-02-04

---

## 1. Python Implementation Analysis

### 1.1 Legacy PDF Generation Code

**Location**: `pyutils/createpdf.py`

The legacy codebase has a PDF generation module using:
- **xhtml2pdf.pisa** - Convert HTML to PDF
- **PyPDF2** (PdfFileWriter, PdfFileReader) - PDF manipulation
- **reportlab.pdfgen** - PDF generation from scratch
- **reportlab.lib.pagesizes** - Page size definitions (A4)
- **Google Cloud Storage** (`cloudstorage` as gcs) - For storing/retrieving HTML templates

### 1.2 Key Implementation Details

**Class**: `CreatePDF(webapp2.RequestHandler)`

**Endpoint**: `/createpdf/*`

**Flow**:
1. Opens HTML template from GCS: `gcs.open(constants.TEMP_FILES_LOCATION + 'test.html')`
2. Reads HTML content as unicode
3. Uses `pisa.CreatePDF()` to convert HTML to PDF in memory (StringIO)
4. Reads the generated PDF with `PdfFileReader`
5. Creates `PdfFileWriter` for output
6. Copies pages from source to output
7. Writes to StringIO
8. Sets response headers:
   - `Content-Type: application/pdf`
   - `Content-Disposition: attachment; filename=test.pdf`
9. Returns PDF content

**Dependencies**:
```
xhtml2pdf.pisa
PyPDF2
reportlab.pdfgen
reportlab.lib.pagesizes
google.appengine.api
cloudstorage
```

### 1.3 Certificate-Specific Implementation

**Status**: NO certificate-specific PDF endpoint found in legacy code

The `createpdf.py` file provides a generic PDF generation framework, but there is no specific certificate generation endpoint in the legacy codebase. This suggests that:

1. Certificate generation may be a NEW feature being added in the migration
2. Or the certificate endpoint may be named differently (not found in searches)

**Search Results**:
- No `def.*certificate` patterns found in Python files (outside of library certificate handling)
- No dedicated certificate PDF handler located

### 1.4 Current Test File Status

**Location**: `test/python/steps/reports_steps.py`

**Status**: Steps are NOT implemented for certificate generation

The file exists and contains other report steps (user summary, user integrity, user application, print form, participant list) but does NOT have:
- `@when('I request a certificate PDF')`
- `@then('a certificate PDF should be generated')`

---

## 2. TypeScript Implementation Analysis

### 2.1 Current TypeScript Codebase Structure

**Framework**: Next.js 14 with App Router

**Reports API Pattern**:
- Location: `app/api/reports/[report-type]/route.ts`
- Example: `app/api/reports/participant-list/route.ts`

### 2.2 Existing Report API Example

**File**: `app/api/reports/participant-list/route.ts`

**Pattern**:
```typescript
export async function GET(request: NextRequest) {
  // 1. Verify admin authorization
  // 2. Generate report data
  // 3. Return NextResponse.json(data, { status: 200 })
}
```

### 2.3 Certificate PDF API Location

**Status**: NEW file needed

**Target**: `app/api/reports/certificate/route.ts` (or similar)

### 2.4 TypeScript Test File Status

**Location**: `test/typescript/steps/reports_steps.ts`

**Status**: Certificate steps are NOT implemented

The file contains mock implementations for other report types but does NOT have:
- `When('I request a certificate PDF')`
- `Then('a certificate PDF should be generated')`

---

## 3. Step Registry Verification

**Location**: `test/bdd/step-registry.ts`

### 3.1 Current Entries

```typescript
'I request a certificate PDF': {
  pattern: /^I\ request\ a\ certificate\ PDF$/,
  python: 'test/python/steps/reports_steps.py:1',  // Placeholder
  typescript: 'test/typescript/steps/reports_steps.ts:1',  // Placeholder
  features: ['specs/features/reports/certificate.feature:9'],
},
'a certificate PDF should be generated': {
  pattern: /^a\ certificate\ PDF\ should\ be\ generated$/,
  python: 'test/python/steps/reports_steps.py:1',  // Placeholder
  typescript: 'test/typescript/steps/reports_steps.ts:1',  // Placeholder
  features: ['specs/features/reports/certificate.feature:10'],
},
```

### 3.2 Status

- ✓ Registry entries exist (lines 170-174, 518-522)
- ✗ Python path is placeholder (`:1`)
- ✗ TypeScript path is placeholder (`:1`)
- ✗ No actual step implementations in either language

---

## 4. Implementation Notes

### 4.1 Python Implementation Strategy

Since no legacy certificate endpoint exists, this appears to be a NEW feature. Options:

**Option A**: Mock the implementation (simple, for testing infrastructure)
- Create a simple PDF response
- Use reportlab to generate a basic certificate
- Return as downloadable PDF

**Option B**: Full implementation
- Create HTML template for certificate
- Use xhtml2pdf.pisa for conversion
- Add proper certificate data (name, date, course, etc.)

### 4.2 TypeScript Implementation Strategy

**PDF Generation Libraries for Node.js/Next.js**:
- `jsPDF` - Client-side PDF generation (already in `javascript/jsPDF/`)
- `pdfkit` - Server-side PDF generation
- `@react-pdf/renderer` - React-based PDF generation

**Recommended Approach**:
1. Create API route: `app/api/reports/certificate/route.ts`
2. Use `jsPDF` or `pdfkit` for PDF generation
3. Return PDF with appropriate headers:
   - `Content-Type: application/pdf`
   - `Content-Disposition: attachment; filename=certificate.pdf`

### 4.3 Authentication

The scenario requires: "Given I am authenticated on the TTC portal"

Both implementations should:
- Check for authenticated user
- Verify user has permission to generate certificate
- May use mock auth for testing purposes

### 4.4 Test Data

For testing purposes, the certificate should include:
- User name (from authentication context)
- Course/program name
- Completion date
- Certificate ID/number

---

## 5. Dependencies

### 5.1 Python Dependencies (Already in Legacy)
- `xhtml2pdf` - for HTML to PDF conversion
- `reportlab` - for PDF generation
- `PyPDF2` - for PDF manipulation
- `cloudstorage` - for template storage

### 5.2 TypeScript Dependencies (May Need Installation)
- `jspdf` - Already exists in `javascript/jsPDF/`
- OR `pdfkit` - May need npm install
- OR `@react-pdf/renderer` - May need npm install

---

## 6. Key Code Locations

### 6.1 Python
- **Legacy PDF framework**: `pyutils/createpdf.py:42-58`
- **Test file**: `test/python/steps/reports_steps.py` (add steps here)
- **No existing certificate handler found**

### 6.2 TypeScript
- **API pattern**: `app/api/reports/participant-list/route.ts`
- **Test file**: `test/typescript/steps/reports_steps.ts` (add steps here)
- **jsPDF library**: `javascript/jsPDF/jspdf.umd.js` (available)

### 6.3 Step Registry
- **Registry file**: `test/bdd/step-registry.ts:170-174, 518-522`

---

## 7. Recommendations

1. **Start with mock/simple implementation** - Don't over-engineer
2. **Use reportlab for Python** - Already available, straightforward
3. **Use jsPDF for TypeScript** - Already exists in codebase
4. **Return basic PDF** with:
   - Title "Certificate of Completion"
   - User name
   - Date
   - Simple border/formatting
5. **Update step registry with actual line numbers** after implementation

---

## 8. Unknowns / Questions

1. **What data should be on the certificate?**
   - Name (from auth context)
   - Course name?
   - Completion date?
   - Certificate number?

2. **What are the prerequisites for certificate generation?**
   - Must complete TTC application?
   - Must complete evaluation?
   - Any specific course requirements?

3. **Should this be a simple PDF or complex certificate design?**
   - Simple = Basic text and borders
   - Complex = Logo, watermark, signatures, decorative elements

4. **Should we implement full certificate logic or just the PDF generation?**
   - This task is marked P3 (nice to have)
   - Related task TASK-E2E-010 has "Certificate Gating (A6) - More comprehensive certificate scenarios with prerequisite checking"
