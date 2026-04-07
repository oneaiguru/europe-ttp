// @google-cloud/storage is an optionalDependency — use dynamic import() so the module
// loads without crashing when the package isn't installed (e.g., local dev without GCS).
// Lazy singleton pattern: first call to getStorage() does the import and caches.

let storageInstance: InstanceType<typeof import('@google-cloud/storage').Storage> | null = null;

async function getStorage() {
  if (storageInstance) return storageInstance;
  try {
    const { Storage } = await import('@google-cloud/storage');
    const emulatorHost = process.env.STORAGE_EMULATOR_HOST;
    storageInstance = new Storage(emulatorHost ? { apiEndpoint: emulatorHost } : {});
    return storageInstance;
  } catch {
    throw new Error('GCS not available — install @google-cloud/storage');
  }
}

function getBucketName(): string {
  const name = process.env.GCS_BUCKET_NAME;
  if (!name) throw new Error('GCS_BUCKET_NAME env var not set');
  return name;
}

// GCS path constants (ported from constants.py lines 30-62)
export const GCS_PATHS = {
  USER_CONFIG_PREFIX: 'user_data/',
  USER_SUMMARY_BY_USER: 'user_data/summary/user_summary_by_user.json',
  USER_SUMMARY_BY_FORM_TYPE: 'user_data/summary/user_summary_by_form_type.json',
  USER_INTEGRITY_BY_USER: 'user_data/integrity/user_integrity_by_user.json',
  APPLICANT_ENROLLED_LIST: 'user_data/integrity/applicant_enrolled_list.csv',
  ADMIN_CONFIG: 'config/admin_config.json',
  FORM_CONFIG_PREFIX: 'config/forms/',
  TTC_COUNTRY_AND_DATES: 'config/forms/ttc_country_and_dates.json',
  TEMP_PREFIX: 'tmp/',
} as const;

export interface FileMetadata {
  name: string;
  updated: Date;
  timeCreated: Date;
}

export async function readJson(path: string): Promise<unknown> {
  const storage = await getStorage();
  const bucket = storage.bucket(getBucketName());
  const [contents] = await bucket.file(path).download();
  return JSON.parse(contents.toString());
}

export async function writeJson(path: string, data: unknown): Promise<void> {
  const storage = await getStorage();
  const bucket = storage.bucket(getBucketName());
  await bucket.file(path).save(JSON.stringify(data), {
    contentType: 'text/plain',
  });
}

export async function readText(path: string): Promise<string> {
  const storage = await getStorage();
  const bucket = storage.bucket(getBucketName());
  const [contents] = await bucket.file(path).download();
  return contents.toString();
}

export async function writeText(path: string, content: string): Promise<void> {
  const storage = await getStorage();
  const bucket = storage.bucket(getBucketName());
  await bucket.file(path).save(content, {
    contentType: 'text/plain',
  });
}

export async function listFiles(prefix: string, minUpdated?: Date): Promise<FileMetadata[]> {
  const storage = await getStorage();
  const bucket = storage.bucket(getBucketName());
  const [files] = await bucket.getFiles({ prefix });

  const results: FileMetadata[] = [];
  for (const file of files) {
    const [metadata] = await file.getMetadata();
    const updated = new Date(metadata.updated as string);
    if (minUpdated && updated <= minUpdated) {
      continue;
    }
    results.push({
      name: file.name,
      updated,
      timeCreated: new Date(metadata.timeCreated as string),
    });
  }
  return results;
}

export async function fileExists(path: string): Promise<boolean> {
  const storage = await getStorage();
  const bucket = storage.bucket(getBucketName());
  const [exists] = await bucket.file(path).exists();
  return exists;
}

export async function getFileMetadata(path: string): Promise<FileMetadata> {
  const storage = await getStorage();
  const bucket = storage.bucket(getBucketName());
  const [metadata] = await bucket.file(path).getMetadata();
  return {
    name: metadata.name as string,
    updated: new Date(metadata.updated as string),
    timeCreated: new Date(metadata.timeCreated as string),
  };
}
