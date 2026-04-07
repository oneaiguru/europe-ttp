import { promises as fs } from 'node:fs';
import path from 'node:path';

const emulatorHost = process.env.STORAGE_EMULATOR_HOST || 'http://fake-gcs:4443';
const bucket = process.env.GCS_BUCKET_NAME || 'artofliving-ttcdesk.appspot.com';
const seedRoot = path.resolve(process.cwd(), 'seed/gcs');

async function ensureBucketExists() {
  const bucketMetaUrl = `${emulatorHost}/storage/v1/b/${encodeURIComponent(bucket)}`;
  const bucketRes = await fetch(bucketMetaUrl);
  if (bucketRes.ok) {
    console.log(`Bucket already exists: ${bucket}`);
    return;
  }

  if (bucketRes.status !== 404) {
    throw new Error(`Unexpected bucket metadata status ${bucketRes.status}`);
  }

  const createRes = await fetch(`${emulatorHost}/storage/v1/b`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: bucket }),
  });

  if (!createRes.ok && createRes.status !== 409) {
    const body = await createRes.text();
    throw new Error(`Bucket create failed (${createRes.status}): ${body}`);
  }

  console.log(`Bucket created: ${bucket}`);
}

async function walkFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function toObjectName(filePath) {
  const relative = path.relative(seedRoot, filePath);
  return relative.split(path.sep).join('/');
}

function contentTypeFor(objectName) {
  return objectName.endsWith('.json') ? 'application/json' : 'text/plain';
}

async function objectExists(objectName) {
  const url = `${emulatorHost}/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(objectName)}`;
  const res = await fetch(url);
  if (res.status === 404) return false;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Object metadata failed for ${objectName} (${res.status}): ${body}`);
  }
  return true;
}

async function uploadObjectIfMissing(filePath) {
  const objectName = toObjectName(filePath);
  if (await objectExists(objectName)) {
    console.log(`Seed skip (exists): ${objectName}`);
    return;
  }

  const body = await fs.readFile(filePath);
  const uploadUrl = `${emulatorHost}/upload/storage/v1/b/${encodeURIComponent(bucket)}/o?uploadType=media&name=${encodeURIComponent(objectName)}`;
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': contentTypeFor(objectName) },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Seed upload failed for ${objectName} (${res.status}): ${text}`);
  }

  console.log(`Seeded: ${objectName}`);
}

async function main() {
  await ensureBucketExists();
  const files = await walkFiles(seedRoot);
  for (const filePath of files) {
    await uploadObjectIfMissing(filePath);
  }
  console.log('GCS seed completed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
