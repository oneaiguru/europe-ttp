# Task: Admin Config Persistence + Route Wiring

## Goal
Port admin config CRUD from Python to TypeScript and wire the get-config/set-config routes to use real GCS persistence instead of mock data.

## Context
The legacy admin config is a JSON file in GCS (`config/admin_config.json`). Admin users can read/write settings (whitelisted users, etc.) through the settings page. The TS app currently returns `MOCK_SETTINGS_DATA` from `mock-data.ts`. This task replaces that with real GCS reads/writes.

## Read These Files First
1. `/Users/m/Downloads/europe-ttp-master@44c225683f8/admin.py` (lines 41-80) — `set_admin_config()` and `get_raw_admin_config()` methods to port
2. `/Users/m/ttp-split-experiment/app/api/admin/admin/get-config/route.ts` (full file) — currently imports `MOCK_SETTINGS_DATA`
3. `/Users/m/ttp-split-experiment/app/api/admin/admin/set-config/route.ts` (full file) — if it exists, check current implementation
4. `/Users/m/ttp-split-experiment/app/utils/gcs.ts` — `readJson()`, `writeJson()` for persistence
5. `/Users/m/ttp-split-experiment/app/utils/auth-middleware.ts` — `requireAdminForPage()` for auth
6. `/Users/m/ttp-split-experiment/app/api/admin/mock-data.ts` (lines 383-396) — `MOCK_SETTINGS_DATA` shape to match

## Changes Required

### 1. Create `app/utils/admin-config.ts`

```typescript
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
  config.whitelisted_user_emails = whitelistedEmails;

  await writeJson(GCS_PATHS.ADMIN_CONFIG, config);
}
```

### 2. Modify `app/api/admin/admin/get-config/route.ts`

Replace the entire file:
```typescript
import { getAdminConfig } from '../../../../utils/admin-config';
import { requireAdminForPage } from '../../../../utils/auth-middleware';

export async function GET(request: Request): Promise<Response> {
  const auth = await requireAdminForPage(request, 'admin_settings.html');
  if (auth instanceof Response) return auth;

  const config = await getAdminConfig();
  // CRITICAL: keep text/plain — client JS does JSON.parse(data)
  return new Response(JSON.stringify(config), {
    headers: { 'content-type': 'text/plain' },
  });
}
```

### 3. Modify `app/api/admin/admin/set-config/route.ts`

Replace or create. **IMPORTANT:** The settings page uses jQuery `$.post()` which sends `application/x-www-form-urlencoded` data (see `settings/render.ts:143-146`), NOT JSON. The `config_params` field is a JSON string inside a form field.

```typescript
import { setAdminConfig } from '../../../../utils/admin-config';
import { requireAdminForPage } from '../../../../utils/auth-middleware';

export async function POST(request: Request): Promise<Response> {
  const auth = await requireAdminForPage(request, 'admin_settings.html');
  if (auth instanceof Response) return auth;

  // Settings page sends form-urlencoded via jQuery $.post(), not JSON
  const contentType = request.headers.get('content-type') || '';
  let configParams: Record<string, unknown>;

  if (contentType.includes('application/json')) {
    const body = await request.json() as Record<string, unknown>;
    configParams = body.config_params as Record<string, unknown>;
  } else {
    // Form-urlencoded: config_params is a JSON string field
    const formData = await request.formData();
    const raw = formData.get('config_params');
    if (typeof raw !== 'string') {
      return Response.json({ error: 'config_params required' }, { status: 400 });
    }
    configParams = JSON.parse(raw) as Record<string, unknown>;
  }

  if (!configParams || typeof configParams !== 'object') {
    return Response.json({ error: 'config_params must be an object' }, { status: 400 });
  }

  await setAdminConfig(configParams);
  return Response.json({ ok: true });
}
```

## Constraints
- Keep `text/plain` content-type on get-config response (client JS double-parses)
- Do NOT modify `mock-data.ts` yet — other routes still depend on it
- Do NOT modify any admin HTML page routes — only the data API routes
- `getAdminConfig()` returns `raw_config` content, matching what legacy's `get_raw_admin_config()` returns (the inner config, not the wrapper)

## Verification
- `npx tsc --noEmit` must pass

## Completion
- Commit with message: `feat: port admin config CRUD with GCS persistence`
- Report: files changed, verification result
