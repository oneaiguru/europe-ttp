import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'path';
import { authContext } from './auth_steps';

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

  getConfig(): Record<string, unknown> {
    return this.config;
  }

  setConfig(configParams: Record<string, unknown> | string): void {
    let params: Record<string, unknown>;

    if (typeof configParams === 'string') {
      params = JSON.parse(configParams);
    } else {
      params = configParams;
    }

    // Update config with provided params
    for (const [key, value] of Object.entries(params)) {
      this.config[key] = value;
    }
  }

  getFormInstances(
    formType: string
  ): Record<string, { page_data: Record<string, unknown>; display: string }> {
    /** Get all form instances for a form type, excluding 'default'. */
    const formInstances: Record<string, { page_data: Record<string, unknown>; display: string }> =
      {};

    if (this.formData[formType]) {
      for (const instanceId in this.formData[formType]) {
        if (instanceId !== 'default') {
          const instance = this.formData[formType][instanceId];
          formInstances[instanceId] = {
            page_data: instance.form_instance_page_data,
            display: instance.form_instance_display,
          };
        }
      }
    }

    return formInstances;
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
  user?: MockTTCPortalUser;
  formType?: string;
  formInstances?: Record<string, { page_data: Record<string, unknown>; display: string }>;
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

// Config management context
interface ConfigContext {
  ttcUser?: MockTTCPortalUser;
  userConfig?: Record<string, unknown>;
  lastConfigUpdate?: Record<string, unknown>;
}

const configContext: ConfigContext = {};

When('I request my user configuration', function (this: World) {
  // Get or create ttcUser from configContext
  let ttcUser = configContext.ttcUser;
  if (!ttcUser) {
    // Create a mock user if not already present
    ttcUser = new MockTTCPortalUser();

    // Get email from authContext if available
    const currentUser = authContext.currentUser;
    let email = 'test.applicant@example.com';
    if (currentUser && currentUser.email) {
      email = currentUser.email;
    }

    ttcUser.loadUserData(email);
    configContext.ttcUser = ttcUser;
  }

  configContext.userConfig = ttcUser.getConfig();
});

Then('I should receive my saved configuration', function () {
  const userConfig = configContext.userConfig;
  assert.ok(userConfig, 'No configuration was retrieved');
  assert.ok(typeof userConfig === 'object', 'Configuration should be an object');
  assert.ok(userConfig !== null, 'Configuration should not be null');
});

When('I update my user configuration', function (this: World) {
  // Get or create ttcUser from configContext
  let ttcUser = configContext.ttcUser;
  if (!ttcUser) {
    // Create a mock user if not already present
    ttcUser = new MockTTCPortalUser();

    // Get email from authContext if available
    const currentUser = authContext.currentUser;
    let email = 'test.applicant@example.com';
    if (currentUser && currentUser.email) {
      email = currentUser.email;
    }

    ttcUser.loadUserData(email);
    configContext.ttcUser = ttcUser;
  }

  const testConfig = { i_home_country: 'IN' };
  ttcUser.setConfig(testConfig);
  configContext.lastConfigUpdate = testConfig;
});

Then('my configuration should be saved', function () {
  const ttcUser = configContext.ttcUser;
  assert.ok(ttcUser, 'User should be authenticated');

  const lastUpdate = configContext.lastConfigUpdate;
  assert.ok(lastUpdate, 'Config should have been updated');

  const savedConfig = ttcUser!.getConfig();
  assert.ok(savedConfig, 'Saved config should not be null');

  // Verify the update was persisted
  for (const [key, value] of Object.entries(lastUpdate!)) {
    assert.strictEqual(savedConfig[key], value, `Config key ${key} should be ${value}`);
  }
});

// Get Form Data Context
interface GetFormDataContext {
  savedFormUser?: MockTTCPortalUser;
  savedFormType?: string;
  savedFormInstance?: string;
  savedFormData?: Record<string, unknown>;
  retrievedFormData?: Record<string, unknown>;
}

const getFormDataContext: GetFormDataContext = {};

Given('I have previously saved form data for a form instance', async function () {
  const submission = resolveSubmission();
  const formType = submission.form_type ?? 'ttc_application';
  const formInstance = submission.form_instance ?? 'default';
  const formData = submission.data ?? { i_fname: 'John', i_lname: 'Doe' };
  const formInstancePageData = submission.form_instance_page_data ?? {};
  const formInstanceDisplay = submission.id ?? submission.ttc_option ?? 'default';

  // Create mock user and save data
  const user = new MockTTCPortalUser();
  const userEmail = resolveEmail(this, submission);
  user.loadUserData(userEmail);

  user.setFormData(formType, formInstance, formData, formInstancePageData, formInstanceDisplay);

  // Store in context for later steps
  getFormDataContext.savedFormUser = user;
  getFormDataContext.savedFormType = formType;
  getFormDataContext.savedFormInstance = formInstance;
  getFormDataContext.savedFormData = formData;
});

When('I request that form data', async function (this: World) {
  const user = getFormDataContext.savedFormUser;
  assert.ok(user, 'Expected savedFormUser to be set in context');

  const formType = getFormDataContext.savedFormType ?? 'ttc_application';
  const formInstance = getFormDataContext.savedFormInstance ?? 'default';

  // Call getFormData to retrieve the stored data
  const retrievedData = user.getFormData(formType, formInstance);
  assert.ok(retrievedData, 'Expected getFormData to return data');

  // Extract the 'data' field from the stored form structure
  getFormDataContext.retrievedFormData = retrievedData.data ?? {};
});

Then('I should receive the stored form data', function () {
  const retrieved = getFormDataContext.retrievedFormData;
  const original = getFormDataContext.savedFormData;

  assert.ok(retrieved, 'Expected retrievedFormData to be set');
  assert.ok(original, 'Expected savedFormData to be set');

  // Verify all fields from original data are in retrieved data
  for (const [key, value] of Object.entries(original)) {
    assert.ok(key in retrieved, `Expected key ${key} to be in retrieved data`);
    assert.strictEqual(
      retrieved[key],
      value,
      `Expected ${key} to be ${value}, got ${retrieved[key]}`
    );
  }
});

Given('I have multiple form instances for a form type', function () {
  const user = new MockTTCPortalUser();
  user.loadUserData('test.applicant@example.com');

  // Set up multiple form instances for ttc_application
  user.setFormData(
    'ttc_application',
    'test_us_future',
    { i_fname: 'John', i_lname: 'Doe', i_email: 'john@example.com' },
    { dates: 'Jan 2025', country: 'US' },
    'US TTC - January 2025'
  );

  user.setFormData(
    'ttc_application',
    'test_india_future',
    { i_fname: 'Jane', i_lname: 'Smith', i_email: 'jane@example.com' },
    { dates: 'Feb 2025', country: 'IN' },
    'India TTC - February 2025'
  );

  userFormContext.user = user;
  userFormContext.formType = 'ttc_application';
});

When('I request the list of form instances', function () {
  if (!userFormContext.user) {
    throw new Error('User not initialized');
  }
  userFormContext.formInstances = userFormContext.user.getFormInstances(
    userFormContext.formType as string
  );
});

Then('I should receive the available form instances', function () {
  assert.ok(userFormContext.formInstances, 'Form instances should be defined');
  assert.ok(typeof userFormContext.formInstances === 'object', 'Form instances should be an object');

  const instances = userFormContext.formInstances as Record<string, unknown>;

  // Verify 'default' is excluded
  assert.ok(!('default' in instances), "'default' instance should not be in the results");

  // Verify we have the expected instances
  assert.ok('test_us_future' in instances, 'test_us_future instance should be present');
  assert.ok('test_india_future' in instances, 'test_india_future instance should be present');

  // Verify structure
  const usInstance = instances.test_us_future as Record<string, unknown>;
  const indiaInstance = instances.test_india_future as Record<string, unknown>;

  assert.ok('page_data' in usInstance, 'US instance should have page_data');
  assert.ok('display' in usInstance, 'US instance should have display');
  assert.strictEqual(usInstance.display, 'US TTC - January 2025');

  const usPageData = usInstance.page_data as Record<string, unknown>;
  assert.strictEqual(usPageData.country, 'US');

  assert.ok('page_data' in indiaInstance, 'India instance should have page_data');
  assert.ok('display' in indiaInstance, 'India instance should have display');
  assert.strictEqual(indiaInstance.display, 'India TTC - February 2025');

  const indiaPageData = indiaInstance.page_data as Record<string, unknown>;
  assert.strictEqual(indiaPageData.country, 'IN');
});
