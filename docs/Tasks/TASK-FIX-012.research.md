# TASK-FIX-012: Research Findings

## Current State

### experimental/ Directory Contents
- `.DS_Store` - macOS metadata file (should not be tracked)
- `jsPDF-master.zip` - 11MB vendored library zip archive
- `jsPDF-master/` - Full jsPDF library source code
- `test-v0.html`, `test-v1.html`, `test.html` - Test fixtures with real PII

### PII Found in Experimental Fixtures

The test HTML files contain real personally identifiable information:

| Data Type | Examples Found |
|-----------|----------------|
| Names | Vikas Gajjar, Naresh Parmar, Ashutosh Sanhgvi, Mitesh Sharma, Kiran Gajjar |
| Emails | vikasgajjar@gmail.com, anurita621@gmail.com |
| Phone | 6478334285, 9054177637 |
| Address | 60 Manordale Cres, Vaughan, ON, L4H 0T7, Canada |
| DOB | 12/31/1968 |

### Binary Artifacts
- `jsPDF-master.zip` (11MB) - Should use npm instead
- `.DS_Store` files - macOS metadata

### Links Analysis
The HTML files contain `http://` links that should be `https://` if kept.

## Key Findings

1. **These are legacy test fixtures** - Not part of the current BDD test suite which uses synthetic data in `test/fixtures/`

2. **Legacy code is read-only** per project instructions, but these are experimental/development artifacts that can be safely removed

3. **jsPDF is now available via npm** - The vendored copy is unnecessary

4. **No production code references experimental/** - This directory is isolated

## Recommendation

**Delete the entire experimental/ directory** because:
1. Contains real PII (privacy/security risk)
2. Contains binary artifacts (.zip, .DS_Store)
3. jsPDF is available via npm (`@jsPDF/pdfkit` or similar)
4. Not referenced by any production code
5. Current BDD tests use proper fixtures in `test/fixtures/`

## Alternative (if deletion is not desired)

If files must be kept:
1. Add `experimental/` to `.gitignore`
2. Anonymize all PII in test HTML files
3. Remove .DS_Store and .zip files
4. Convert http:// links to https://

## Files Affected
- `experimental/.DS_Store`
- `experimental/jsPDF-master.zip`
- `experimental/jsPDF-master/` (entire directory)
- `experimental/test-v0.html`
- `experimental/test-v1.html`
- `experimental/test.html`
- `experimental/test.py`
