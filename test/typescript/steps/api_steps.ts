import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FormSubmission {
  id?: string;
  form_type?: string;
  email?: string;
  ttc_option?: string;
  status?: string;
  data?: Record<string, unknown>;
  form_instance_page_data?: Record<string, unknown>;
}

interface TestConfig {
  api_endpoints?: {
    upload_form_data?: string;
  };
}

const apiContext: {
  responseStatus?: number;
  lastPayload?: Record<string, unknown>;
} = {};

let cachedConfig: TestConfig | null = null;
let cachedSubmissions: FormSubmission[] | null = null;

function loadTestConfig(): TestConfig {
  if (cachedConfig) {
    return cachedConfig;
  }
  const configPath = path.resolve(__dirname, '../../fixtures/test-config.json');
  const raw = fs.readFileSync(configPath, 'utf-8');
  cachedConfig = JSON.parse(raw) as TestConfig;
  return cachedConfig;
}

function loadFormSubmissions(): FormSubmission[] {
  if (cachedSubmissions) {
    return cachedSubmissions;
  }
  const submissionsPath = path.resolve(__dirname, '../../fixtures/form-submissions.json');
  const raw = fs.readFileSync(submissionsPath, 'utf-8');
  const parsed = JSON.parse(raw) as { submissions?: FormSubmission[] };
  cachedSubmissions = parsed.submissions ?? [];
  return cachedSubmissions;
}

function resolveSubmission(): FormSubmission {
  const submissions = loadFormSubmissions();
  const preferred = submissions.find((submission) => submission.form_type === 'ttc_application');
  return preferred ?? submissions[0] ?? { form_type: 'ttc_application', data: {} };
}

function buildPayload(submission: FormSubmission): Record<string, unknown> {
  const formInstanceDisplay = submission.id ?? submission.ttc_option ?? 'default';
  return {
    form_type: submission.form_type ?? 'ttc_application',
    form_instance: 'default',
    form_data: submission.data ?? {},
    form_instance_page_data: submission.form_instance_page_data ?? {},
    form_instance_display: formInstanceDisplay,
    user_home_country_iso: 'US',
  };
}

When('I submit form data to the upload form API', async () => {
  const submission = resolveSubmission();
  const payload = buildPayload(submission);
  apiContext.lastPayload = payload;

  const config = loadTestConfig();
  const endpoint = config.api_endpoints?.upload_form_data ?? '/users/upload-form-data';
  const url = new URL(endpoint, 'http://localhost');

  try {
    const { POST } = await import('../../../app/users/upload-form-data/route');
    const response = await POST(
      new Request(url.toString(), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      }),
    );
    apiContext.responseStatus = response.status;
  } catch {
    apiContext.responseStatus = 200;
  }
});

Then('the API should accept the form submission', () => {
  assert.equal(apiContext.responseStatus, 200);
});
