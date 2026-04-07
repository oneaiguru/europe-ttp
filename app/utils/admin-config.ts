import { readJson, writeJson, GCS_PATHS } from './gcs';

export async function getAdminConfig(): Promise<Record<string, unknown>> {
  try {
    const config = await readJson(GCS_PATHS.ADMIN_CONFIG) as Record<string, unknown>;
    return (config.raw_config as Record<string, unknown>) || {};
  } catch {
    // File not found — return empty config (matching legacy admin.py:78-80)
    return {};
  }
}

export async function setAdminConfig(configParams: Record<string, unknown>): Promise<void> {
  // Read existing config
  let config: Record<string, unknown> = {};
  try {
    config = await readJson(GCS_PATHS.ADMIN_CONFIG) as Record<string, unknown>;
  } catch {
    // File not found — start fresh
  }

  config.raw_config = configParams;

  // Extract whitelisted user emails (matching legacy admin.py:47-53)
  const whitelistedEmails: string[] = [];
  const whitelistedUsers = configParams.i_whitelisted_user;
  if (Array.isArray(whitelistedUsers)) {
    for (const user of whitelistedUsers) {
      if (user && typeof user === 'object' && 'i_whitelisted_user_email' in user) {
        const email = (user as Record<string, unknown>).i_whitelisted_user_email;
        if (typeof email === 'string') {
          whitelistedEmails.push(email.trim().toLowerCase());
        }
      }
    }
  }
  // Merge with existing whitelist (don't wipe — legacy admin.py:47-53 appends)
  const existingEmails = Array.isArray(config.whitelisted_user_emails)
    ? (config.whitelisted_user_emails as string[])
    : [];
  config.whitelisted_user_emails = [...new Set([...existingEmails, ...whitelistedEmails])];

  await writeJson(GCS_PATHS.ADMIN_CONFIG, config);
}
