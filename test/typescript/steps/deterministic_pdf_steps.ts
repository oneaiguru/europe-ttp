/**
 * BDD test steps for deterministic PDF generation.
 *
 * These steps verify that the jsPDF wrapper generates deterministic output
 * by ensuring creationDate and fileId are fixed rather than random.
 *
 * This enables:
 * - Stable test assertions (golden file comparisons)
 * - Cache invalidation by hash
 * - Reproducible builds
 * - Diffing and debugging
 */

import { When, Then } from '@cucumber/cucumber';
import { createHash } from 'crypto';
import { jsPDF } from 'jspdf';
import { createDeterministicPDF } from '../../../app/utils/pdf';

// Context for storing PDFs between steps
const pdfContext = {
  pdfs: [] as Array<{ doc: jsPDF; hash: string; creationDate: string; fileId: string }>,
};

/**
 * Reset PDF context between scenarios.
 */
export function resetPDFContext() {
  pdfContext.pdfs = [];
}

/**
 * Extract creation date from jsPDF instance.
 */
function getCreationDate(doc: jsPDF): string {
  return doc.getCreationDate();
}

/**
 * Extract file ID from jsPDF instance.
 */
function getFileId(doc: jsPDF): string {
  return doc.getFileId();
}

/**
 * Compute SHA-256 hash of PDF output.
 */
function computePDFHash(doc: jsPDF): string {
  const pdfBytes = doc.output('arraybuffer');
  const hash = createHash('sha256');
  hash.update(new Uint8Array(pdfBytes));
  return hash.digest('hex');
}

When('I create a deterministic PDF with default config', function () {
  const doc = createDeterministicPDF();
  const hash = computePDFHash(doc);
  const creationDate = getCreationDate(doc);
  const fileId = getFileId(doc);

  pdfContext.pdfs.push({ doc, hash, creationDate, fileId });
});

When('I create another deterministic PDF with default config', function () {
  const doc = createDeterministicPDF();
  const hash = computePDFHash(doc);
  const creationDate = getCreationDate(doc);
  const fileId = getFileId(doc);

  pdfContext.pdfs.push({ doc, hash, creationDate, fileId });
});

When('I create a deterministic PDF with custom creation date {string}', function (creationDate: string) {
  const doc = createDeterministicPDF({ creationDate });
  const hash = computePDFHash(doc);
  const pdfCreationDate = getCreationDate(doc);
  const fileId = getFileId(doc);

  pdfContext.pdfs.push({ doc, hash, creationDate: pdfCreationDate, fileId });
});

When('I create a deterministic PDF with custom file ID {string}', function (fileId: string) {
  const doc = createDeterministicPDF({ fileId });
  const hash = computePDFHash(doc);
  const creationDate = getCreationDate(doc);
  const pdfFileId = getFileId(doc);

  pdfContext.pdfs.push({ doc, hash, creationDate, fileId: pdfFileId });
});

When('I create a PDF with file ID {string}', function (fileId: string) {
  const doc = createDeterministicPDF({ fileId });
  const hash = computePDFHash(doc);
  const creationDate = getCreationDate(doc);
  const pdfFileId = getFileId(doc);

  pdfContext.pdfs.push({ doc, hash, creationDate, fileId: pdfFileId });
});

Then('the PDFs should have identical content hashes', function () {
  if (pdfContext.pdfs.length < 2) {
    throw new Error('Need at least 2 PDFs to compare hashes');
  }

  const firstHash = pdfContext.pdfs[0].hash;
  for (let i = 1; i < pdfContext.pdfs.length; i++) {
    if (pdfContext.pdfs[i].hash !== firstHash) {
      throw new Error(
        `PDF hash mismatch:\n  PDF 0: ${firstHash}\n  PDF ${i}: ${pdfContext.pdfs[i].hash}`
      );
    }
  }
});

Then('the PDFs should have identical creation dates', function () {
  if (pdfContext.pdfs.length < 2) {
    throw new Error('Need at least 2 PDFs to compare creation dates');
  }

  const firstDate = pdfContext.pdfs[0].creationDate;
  for (let i = 1; i < pdfContext.pdfs.length; i++) {
    if (pdfContext.pdfs[i].creationDate !== firstDate) {
      throw new Error(
        `Creation date mismatch:\n  PDF 0: ${firstDate}\n  PDF ${i}: ${pdfContext.pdfs[i].creationDate}`
      );
    }
  }
});

Then('the PDFs should have identical file IDs', function () {
  if (pdfContext.pdfs.length < 2) {
    throw new Error('Need at least 2 PDFs to compare file IDs');
  }

  const firstId = pdfContext.pdfs[0].fileId;
  for (let i = 1; i < pdfContext.pdfs.length; i++) {
    if (pdfContext.pdfs[i].fileId !== firstId) {
      throw new Error(
        `File ID mismatch:\n  PDF 0: ${firstId}\n  PDF ${i}: ${pdfContext.pdfs[i].fileId}`
      );
    }
  }
});

Then('the PDF creation date should contain {string}', function (expectedDate: string) {
  if (pdfContext.pdfs.length === 0) {
    throw new Error('No PDF created yet');
  }

  // Check the first PDF (created with custom creation date)
  const firstPdf = pdfContext.pdfs[0];
  if (!firstPdf.creationDate.includes(expectedDate)) {
    throw new Error(
      `Creation date mismatch:\n  Expected to contain: ${expectedDate}\n  Actual: ${firstPdf.creationDate}`
    );
  }
});

Then('the PDF file ID should be {string}', function (expectedFileId: string) {
  if (pdfContext.pdfs.length === 0) {
    throw new Error('No PDF created yet');
  }

  // Check the last PDF (created with custom file ID)
  const lastPdf = pdfContext.pdfs[pdfContext.pdfs.length - 1];
  if (lastPdf.fileId !== expectedFileId) {
    throw new Error(
      `File ID mismatch:\n  Expected: ${expectedFileId}\n  Actual: ${lastPdf.fileId}`
    );
  }
});

Then('the PDFs should have different file IDs', function () {
  if (pdfContext.pdfs.length < 2) {
    throw new Error('Need at least 2 PDFs to compare file IDs');
  }

  const ids = new Set(pdfContext.pdfs.map((p) => p.fileId));
  if (ids.size !== pdfContext.pdfs.length) {
    throw new Error(
      `Expected ${pdfContext.pdfs.length} different file IDs, got ${ids.size} unique IDs`
    );
  }
});
