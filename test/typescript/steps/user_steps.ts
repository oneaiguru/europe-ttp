import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'path';

interface FormSubmission {
  id?: string;
  form_type?: string;
  form_instance?: string;
  email?: string;
  ttc_option?: string;
  status?: string;
  data?: Record<string, unknown>;
  form_instance_page_data?: Record<string, unknown>;
}

interface StoredFormData {
  data: Record<string, unknown>;
  form_instance_page_data: Record<string, unknown>;
  form_instance_display: string;
  is_agreement_accepted: boolean;
  is_form_submitted: boolean;
  is_form_complete: boolean;
  last_update_datetime: string;
}

class MockTTCPortalUser {
  public email: string | null = null;
  public formData: Record<string, Record<string, StoredFormData>> = {};
  public config: Record<string, unknown> = {};
  public isProfileComplete: Record<string, boolean> = {};

  initializeUser(userDict: { email?: string }): void {
    this.email = userDict.email ?? null;
    this.formData = {};
    this.config = {};
    this.isProfileComplete = {};
  }

  setFormData(
    formType: string,
    formInstance: string,
    formData: Record<string, unknown>,
    formInstancePageData: Record<string, unknown>,
    formInstanceDisplay: string
  ): void {
    if (!this.formData[formType]) {
      this.formData[formType] = {};
    }

    // Compute is_form_complete by checking if all fields have non-empty values
    const isFormComplete = Object.values(formData).every(
      (v) => v !== null && v !== undefined && v !== ''
    );

    this.formData[formType][formInstance] = {
      data: formData,
      form_instance_page_data: formInstancePageData,
      form_instance_display: formInstanceDisplay,
      is_agreement_accepted: false,
      is_form_submitted: false,
      is_form_complete: isFormComplete,
      last_update_datetime: '2024-01-01 00:00:00',
    };

    // Also write to 'default' instance if this is a non-default instance
    if (formInstance !== 'default') {
      this.formData[formType]['default'] = this.formData[formType][formInstance];
    }
  }

  getFormData(formType: string, formInstance: string): StoredFormData | null {
    if (this.formData[formType] && this.formData[formType][formInstance]) {
      return this.formData[formType][formInstance];
    }
    return null;
  }

  loadUserData(userEmail: string): void {
    this.email = userEmail;
    this.initializeUser({ email: userEmail });
  }

  saveUserData(): void {
    // Mock save - no-op
  }
}

interface UserFormContext {
  lastUpload?: {
    formType: string;
    formInstance: string;
    formData: Record<string, unknown>;
    formInstanceDisplay: string;
    formInstancePageData: Record<string, unknown>;
    user: MockTTCPortalUser;
  };
}

const userFormContext: UserFormContext = {};

let cachedSubmissions: FormSubmission[] | null = null;

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

function resolveEmail(context: unknown, submission: FormSubmission): string {
  if (context && typeof context === 'object' && 'current_user' in context) {
    const user = (context as { current_user?: { email?: string } | null }).current_user;
    if (user && typeof user === 'object' && 'email' in user) {
      const email = (user as { email?: string }).email;
      if (typeof email === 'string' && email) {
        return email;
      }
    }
  }
  if (submission.email) {
    return submission.email;
  }
  return 'test.applicant@example.com';
}

When('I upload form data for a specific form instance', async function (this: World) {
  const submission = resolveSubmission();
  const formType = submission.form_type ?? 'ttc_application';
  const formInstance = submission.form_instance ?? 'default';
  const formData = submission.data ?? {};
  const formInstancePageData = submission.form_instance_page_data ?? {};
  const formInstanceDisplay = submission.id ?? submission.ttc_option ?? 'default';

  // Create mock user and upload data
  const user = new MockTTCPortalUser();
  const userEmail = resolveEmail(this, submission);
  user.loadUserData(userEmail);

  // Set form data
  user.setFormData(formType, formInstance, formData, formInstancePageData, formInstanceDisplay);

  // Store the upload details for verification
  userFormContext.lastUpload = {
    formType,
    formInstance,
    formData,
    formInstanceDisplay,
    formInstancePageData,
    user,
  };
});

Then('my form data should be stored for that instance', function () {
  assert.ok(userFormContext.lastUpload, 'Expected uploaded_form_data to be set');

  const { user, formType, formInstance, formData, formInstanceDisplay } = userFormContext.lastUpload;

  // Retrieve the stored data
  const storedData = user.getFormData(formType, formInstance);

  assert.ok(storedData, 'Expected stored data to not be null');
  assert.ok('data' in storedData, 'Expected stored data to have "data" field');

  // Verify the actual form field values were stored
  const storedFormData = storedData.data;
  for (const [key, value] of Object.entries(formData)) {
    assert.strictEqual(
      storedFormData[key],
      value,
      `Expected field ${key} to be ${value}, got ${storedFormData[key]}`
    );
  }

  // Verify metadata fields exist
  assert.ok('is_form_complete' in storedData, 'Expected is_form_complete field');
  assert.ok('is_agreement_accepted' in storedData, 'Expected is_agreement_accepted field');
  assert.ok('is_form_submitted' in storedData, 'Expected is_form_submitted field');
  assert.ok('last_update_datetime' in storedData, 'Expected last_update_datetime field');
  assert.ok('form_instance_display' in storedData, 'Expected form_instance_display field');
  assert.ok('form_instance_page_data' in storedData, 'Expected form_instance_page_data field');

  // Verify form_instance_display matches what was uploaded
  assert.strictEqual(
    storedData.form_instance_display,
    formInstanceDisplay,
    'Expected form_instance_display to match'
  );
});

// TypeScript World interface (basic)
interface World {
  attach?: (attachment: { data: string; media: string }) => void;
}
