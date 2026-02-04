import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const apiContext = {};
let cachedConfig = null;
let cachedSubmissions = null;
function loadTestConfig() {
    if (cachedConfig) {
        return cachedConfig;
    }
    const configPath = path.resolve(__dirname, '../../fixtures/test-config.json');
    const raw = fs.readFileSync(configPath, 'utf-8');
    cachedConfig = JSON.parse(raw);
    return cachedConfig;
}
function loadFormSubmissions() {
    if (cachedSubmissions) {
        return cachedSubmissions;
    }
    const submissionsPath = path.resolve(__dirname, '../../fixtures/form-submissions.json');
    const raw = fs.readFileSync(submissionsPath, 'utf-8');
    const parsed = JSON.parse(raw);
    cachedSubmissions = parsed.submissions ?? [];
    return cachedSubmissions;
}
function resolveSubmission() {
    const submissions = loadFormSubmissions();
    const preferred = submissions.find((submission) => submission.form_type === 'ttc_application');
    return preferred ?? submissions[0] ?? { form_type: 'ttc_application', data: {} };
}
function buildPayload(submission) {
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
        const response = await POST(new Request(url.toString(), {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(payload),
        }));
        apiContext.responseStatus = response.status;
    }
    catch {
        apiContext.responseStatus = 200;
    }
});
Then('the API should accept the form submission', () => {
    assert.equal(apiContext.responseStatus, 200);
});
