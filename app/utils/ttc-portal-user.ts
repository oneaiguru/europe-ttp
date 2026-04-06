import { readJson, writeJson, GCS_PATHS } from './gcs';

// Re-export GCS_PATHS for convenience
export { GCS_PATHS };

/** Convert truthy string values to boolean (ported from pyutils/utils.py str2bool) */
function str2bool(value: unknown): boolean {
  if (!value || typeof value !== 'string') return false;
  return ['1', 'y', 't', 'true'].includes(value.toLowerCase());
}

/** Format current UTC time as YYYY-MM-DD HH:MM:SS (matches Python strftime) */
function utcNowFormatted(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

interface FormInstance {
  data: Record<string, unknown>;
  form_instance_page_data: Record<string, unknown>;
  form_instance_display: string;
  is_agreement_accepted: boolean;
  is_form_submitted: boolean;
  send_confirmation_to_candidate: boolean;
  is_form_complete: boolean;
  last_update_datetime: string;
}

interface UserJSON {
  username?: string;
  email?: string;
  name?: string;
  photo_file?: string;
  photo_url?: string;
  current_evaluation_id?: string;
  form_data?: Record<string, Record<string, FormInstance>>;
  is_profile_complete?: Record<string, boolean>;
  home_country?: string;
  config?: Record<string, unknown>;
}

export class TTCPortalUser {
  username = '';
  email = '';
  name = '';
  photoFile = '';
  currentEvaluationId = '';
  formData: Record<string, Record<string, FormInstance>> = {};
  isProfileComplete: Record<string, boolean> = {};
  homeCountry = '';
  config: Record<string, unknown> = {};

  private constructor() {}

  /** Async factory — loads user data from GCS */
  static async create(email: string): Promise<TTCPortalUser> {
    const user = new TTCPortalUser();
    await user.loadUserData(email);
    return user;
  }

  private initializeUser(data: UserJSON): void {
    this.username = data.username ?? '';
    this.email = data.email ?? this.email ?? '';
    this.name = data.name ?? '';
    this.photoFile = data.photo_file ?? '';
    this.currentEvaluationId = data.current_evaluation_id ?? '';
    this.formData = data.form_data ?? {};
    this.isProfileComplete = data.is_profile_complete ?? {};
    this.homeCountry = data.home_country ?? '';
    this.config = data.config ?? {};
  }

  private async loadUserData(email: string): Promise<void> {
    this.email = email;
    try {
      const data = await readJson(
        GCS_PATHS.USER_CONFIG_PREFIX + email + '.json',
      ) as UserJSON;
      this.initializeUser(data);
    } catch (e: unknown) {
      // GCS NotFoundError — initialize with empty data (Python lines 316-319)
      if (e && typeof e === 'object' && 'code' in e && (e as { code: number }).code === 404) {
        this.initializeUser({ email });
      } else if (e instanceof Error && e.message?.includes('No such object')) {
        this.initializeUser({ email });
      } else {
        throw e;
      }
    }
  }

  async saveUserData(): Promise<void> {
    await writeJson(
      GCS_PATHS.USER_CONFIG_PREFIX + this.email + '.json',
      this.toJSON(),
    );
  }

  private toJSON(): UserJSON {
    return {
      username: this.username,
      email: this.email,
      name: this.name,
      photo_file: this.photoFile,
      current_evaluation_id: this.currentEvaluationId,
      form_data: this.formData,
      is_profile_complete: this.isProfileComplete,
      home_country: this.homeCountry,
      config: this.config,
    };
  }

  setFormData(
    formType: string,
    formInstance: string | null | undefined,
    data: Record<string, unknown>,
    pageData: Record<string, unknown>,
    display: string,
  ): void {
    let instance = 'default';
    if (formInstance && formInstance.trim() !== '') {
      instance = formInstance;
    }

    let form: Partial<FormInstance> = {};
    if (formType in this.formData && instance in this.formData[formType]) {
      form = this.formData[formType][instance];
    }

    form.data = data;
    form.form_instance_page_data = pageData;
    form.form_instance_display = display;

    // Completeness check — any null or empty string field means incomplete
    let isComplete = true;
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (val == null || String(val).trim() === '') {
        isComplete = false;
        break;
      }
    }

    form.is_agreement_accepted = str2bool(data['i_agreement_accepted']);
    form.is_form_submitted = str2bool(data['i_form_submitted']);
    form.send_confirmation_to_candidate = str2bool(data['i_send_confirmation_to_candidate']);

    // Name extraction
    if ('i_name' in data) {
      this.name = String(data['i_name']).trim();
    } else {
      const fname = String(data['i_fname'] ?? '').trim();
      const lname = String(data['i_lname'] ?? '').trim();
      this.name = fname + ' ' + lname;
    }

    form.is_form_complete = isComplete;
    if (formType.includes('profile')) {
      this.isProfileComplete[formType] = isComplete;
    }
    form.last_update_datetime = utcNowFormatted();

    if (!(formType in this.formData)) {
      this.formData[formType] = {};
    }
    this.formData[formType][instance] = form as FormInstance;

    // Last stored form is stored in default as well for easy retrieval
    if (instance !== 'default') {
      this.formData[formType]['default'] = form as FormInstance;
    }

    // Email sending is deferred to Phase 6 — skip send_submission_emails
  }

  getFormData(formType: string, formInstance: string | null | undefined): Record<string, unknown> {
    let instance = 'default';
    if (formInstance && formInstance.trim() !== '') {
      instance = formInstance;
    }
    if (formType in this.formData && instance in this.formData[formType]) {
      return this.formData[formType][instance].data;
    }
    return {};
  }

  getFormInstances(formType: string): Record<string, { page_data: Record<string, unknown>; display: string }> {
    const instances: Record<string, { page_data: Record<string, unknown>; display: string }> = {};
    if (formType in this.formData) {
      for (const key of Object.keys(this.formData[formType])) {
        if (key !== 'default') {
          instances[key] = {
            page_data: this.formData[formType][key].form_instance_page_data ?? {},
            display: this.formData[formType][key].form_instance_display ?? key,
          };
        }
      }
    }
    return instances;
  }

  isFormSubmitted(formType: string, formInstance: string | null | undefined): boolean {
    let instance = 'default';
    if (formInstance && formInstance.trim() !== '') {
      instance = formInstance;
    }
    if (formType in this.formData && instance in this.formData[formType]) {
      return this.formData[formType][instance].is_form_submitted ?? false;
    }
    return false;
  }

  isFormComplete(formType: string, formInstance: string | null | undefined): boolean {
    let instance = 'default';
    if (formInstance && formInstance.trim() !== '') {
      instance = formInstance;
    }
    if (formType in this.formData && instance in this.formData[formType]) {
      return this.formData[formType][instance].is_form_complete ?? false;
    }
    return false;
  }

  setConfig(params: Record<string, unknown>): void {
    this.config = { ...this.config, ...params };
    if ('i_home_country' in params) {
      this.setHomeCountry(String(params['i_home_country']));
    }
  }

  getConfig(): Record<string, unknown> {
    return this.config;
  }

  setHomeCountry(country: string): void {
    this.homeCountry = country;
    this.config['i_home_country'] = country;
  }

  getHomeCountry(): string {
    return this.homeCountry;
  }

  getEmail(): string {
    return this.email;
  }
}
