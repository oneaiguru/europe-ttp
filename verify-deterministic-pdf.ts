#!/usr/bin/env bun
/**
 * Manual verification script for deterministic PDF generation.
 *
 * This script demonstrates that PDFs generated with the same
 * configuration have identical hashes, proving determinism.
 */

import { createDeterministicPDF } from './app/utils/pdf';
import { createHash } from 'crypto';

function computePDFHash(doc: any): string {
  const pdfBytes = doc.output('arraybuffer');
  const hash = createHash('sha256');
  hash.update(new Uint8Array(pdfBytes));
  return hash.digest('hex');
}

console.log('=== Deterministic PDF Verification ===\n');

// Create two PDFs with default config
console.log('Creating two PDFs with default configuration...');
const doc1 = createDeterministicPDF();
const doc2 = createDeterministicPDF();

const hash1 = computePDFHash(doc1);
const hash2 = computePDFHash(doc2);

console.log(`PDF 1 hash: ${hash1}`);
console.log(`PDF 2 hash: ${hash2}`);
console.log(`Hashes match: ${hash1 === hash2 ? '✅ YES' : '❌ NO'}`);

// Verify creation date and file ID
console.log(`\nCreation date 1: ${doc1.getCreationDate()}`);
console.log(`Creation date 2: ${doc2.getCreationDate()}`);
console.log(`Dates match: ${doc1.getCreationDate() === doc2.getCreationDate() ? '✅ YES' : '❌ NO'}`);

console.log(`\nFile ID 1: ${doc1.getFileId()}`);
console.log(`File ID 2: ${doc2.getFileId()}`);
console.log(`IDs match: ${doc1.getFileId() === doc2.getFileId() ? '✅ YES' : '❌ NO'}`);

// Test custom values
console.log('\n=== Testing Custom Values ===\n');

const customDoc1 = createDeterministicPDF({
  creationDate: '2024-12-25T12:00:00Z',
  fileId: '00000000000000000000000000000001',
});

const customDoc2 = createDeterministicPDF({
  creationDate: '2024-12-25T12:00:00Z',
  fileId: '00000000000000000000000000000001',
});

const customHash1 = computePDFHash(customDoc1);
const customHash2 = computePDFHash(customDoc2);

console.log(`Custom PDF 1 hash: ${customHash1}`);
console.log(`Custom PDF 2 hash: ${customHash2}`);
console.log(`Custom hashes match: ${customHash1 === customHash2 ? '✅ YES' : '❌ NO'}`);

console.log(`\nCustom creation date: ${customDoc1.getCreationDate()}`);
console.log(`Custom file ID: ${customDoc1.getFileId()}`);

console.log('\n=== Verification Complete ===');
