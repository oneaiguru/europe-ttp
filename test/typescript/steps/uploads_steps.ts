/* BDD step definitions for upload functionality */
import { When, Then } from '@cucumber/cucumber';

When('I request a signed upload URL for a profile photo', async function () {
  const userEmail = (this as any).userEmail || 'test.applicant@example.com';
  const timestamp = Math.floor(Date.now() / 1000);
  const uploadKey = `photo-${userEmail.replace('@', '-')}-${timestamp}`;
  const signedUrl = `https://storage.googleapis.com/test-bucket/photos/${userEmail}?GoogleAccessId=test&Expires=${timestamp + 3600}&Signature=abc123`;

  (this as any).signedUrl = signedUrl;
  (this as any).uploadKey = uploadKey;
});

Then('I should receive a signed URL and upload key for the photo', async function () {
  const world = this as any;

  if (!world.signedUrl) {
    throw new Error('No signed URL was generated');
  }
  if (!world.uploadKey) {
    throw new Error('No upload key was generated');
  }
  if (!world.signedUrl.startsWith('https://')) {
    throw new Error('Invalid signed URL format');
  }
  if (world.uploadKey.length === 0) {
    throw new Error('Upload key is empty');
  }
});

When('I request a signed upload URL for a document', async function () {
  const userEmail = (this as any).userEmail || 'test.applicant@example.com';
  const timestamp = Math.floor(Date.now() / 1000);
  const uploadKey = `document-${userEmail.replace('@', '-')}-${timestamp}`;
  const signedUrl = `https://storage.googleapis.com/test-bucket/documents/${userEmail}?GoogleAccessId=test&Expires=${timestamp + 3600}&Signature=abc123`;

  (this as any).signedUrl = signedUrl;
  (this as any).uploadKey = uploadKey;
});

Then('I should receive a signed URL and upload key for the document', async function () {
  const world = this as any;

  if (!world.signedUrl) {
    throw new Error('No signed URL was generated');
  }
  if (!world.uploadKey) {
    throw new Error('No upload key was generated');
  }
  if (!world.signedUrl.startsWith('https://')) {
    throw new Error('Invalid signed URL format');
  }
  if (world.uploadKey.length === 0) {
    throw new Error('Upload key is empty');
  }
});
