/**
 * Test configuration for deterministic PDF generation.
 *
 * These constants ensure PDF generation is deterministic across test runs,
 * enabling stable golden file comparisons and reproducible builds.
 */

/**
 * Fixed creation date for test PDFs.
 * Format: PDF date string (D:YYYYMMDDHHmmSSZ)
 */
export const TEST_PDF_CREATION_DATE = 'D:20250101120000Z' as const;

/**
 * Fixed file ID for test PDFs.
 * Format: 32-character hexadecimal string
 */
export const TEST_PDF_FILE_ID = '00000000000000000000000000000001' as const;

/**
 * Standard test PDF configuration.
 */
export const TEST_PDF_CONFIG = {
  creationDate: TEST_PDF_CREATION_DATE,
  fileId: TEST_PDF_FILE_ID,
  deterministic: true,
} as const;
