/**
 * Deterministic jsPDF wrapper for test stability and reproducible builds.
 *
 * @internal
 * @deprecated NOT FOR PRODUCTION USE - This utility is intended for tests and
 * reproducible builds only. Production PDF generation should use jsPDF directly
 * with real timestamps to ensure correct document metadata.
 *
 * jsPDF defaults to random creationDate and fileId, breaking deterministic output.
 * This wrapper injects fixed values to ensure reproducible PDF generation.
 *
 * This enables:
 * - Stable test assertions (golden file comparisons)
 * - Cache invalidation by hash
 * - Reproducible builds
 * - Diffing and debugging
 */

import { jsPDF } from 'jspdf';

// Fixed deterministic values for PDF generation
const DETERMINISTIC_CREATION_DATE = new Date('2025-01-01T00:00:00Z');
const DETERMINISTIC_FILE_ID = 'ABCDEF0123456789ABCDEF0123456789';

/**
 * Configuration options for deterministic PDF generation.
 * @internal Test utility - not intended for production use.
 */
export interface DeterministicPDFOptions {
  /**
   * Override the default deterministic creation date.
   * Can be a Date object or an ISO 8601 string.
   */
  creationDate?: Date | string;

  /**
   * Override the default deterministic file ID.
   * Format: 32-character hexadecimal string
   */
  fileId?: string;

  /**
   * Whether to use deterministic values (default: true).
   * Set to false to allow random values (not recommended for tests).
   */
  deterministic?: boolean;
}

/**
 * Creates a jsPDF instance with deterministic creationDate and fileId.
 *
 * @internal Test utility - not intended for production use.
 * @param options - PDF generation options
 * @returns Configured jsPDF instance
 *
 * @example
 * ```ts
 * // Default deterministic PDF
 * const doc = createDeterministicPDF();
 *
 * // Custom deterministic values
 * const doc = createDeterministicPDF({
 *   creationDate: '2024-12-25T12:00:00Z',
 *   fileId: '00000000000000000000000000000000'
 * });
 * ```
 */
export function createDeterministicPDF(
  options: DeterministicPDFOptions = {}
): jsPDF {
  const {
    creationDate = DETERMINISTIC_CREATION_DATE,
    fileId = DETERMINISTIC_FILE_ID,
    deterministic = true,
  } = options;

  // Create jsPDF instance with default orientation, unit, format
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  if (deterministic) {
    // Override non-deterministic defaults with fixed values
    // These are public methods in jsPDF v4.x
    // Convert string to Date if needed
    const dateObj = typeof creationDate === 'string'
      ? new Date(creationDate)
      : creationDate;
    doc.setCreationDate(dateObj);
    doc.setFileId(fileId);
  }

  return doc;
}

/**
 * Factory for creating deterministic jsPDF instances with predefined configs.
 *
 * @internal Test utility - not intended for production use.
 * Use this class to create multiple PDFs with consistent deterministic settings
 * in test scenarios.
 */
export class DeterministicPDFFactory {
  private defaultOptions: DeterministicPDFOptions;

  constructor(options: DeterministicPDFOptions = {}) {
    this.defaultOptions = options;
  }

  /**
   * Create a PDF instance with factory defaults.
   */
  create(overrideOptions: DeterministicPDFOptions = {}): jsPDF {
    return createDeterministicPDF({
      ...this.defaultOptions,
      ...overrideOptions,
    });
  }
}
