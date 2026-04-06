import { getAuthenticatedUser } from './auth';

// Port of constants.LIST_OF_ADMIN_PERMISSIONS from constants.py:84+
// NOTE: this is hardcoded for parity — will move to GCS config later
const LIST_OF_ADMIN_PERMISSIONS: Record<string, { countries: string[]; report_permissions: string[] }> = {
  'amit.nair@artofliving.org': {
    countries: ['US', 'CA'],
    report_permissions: [
      'ttc_applicants_summary.html',
      'post_sahaj_ttc_course_feedback_summary.html',
      'admin_settings.html',
      'ttc_applicants_integrity.html',
    ],
  },
  'n84.amit@gmail.com': {
    countries: ['US'],
    report_permissions: [
      'ttc_applicants_summary.html',
      'post_ttc_course_feedback_summary.html',
      'post_sahaj_ttc_course_feedback_summary.html',
      'ttc_applicants_reports.html',
      'admin_settings.html',
      'ttc_applicants_integrity.html',
    ],
  },
  'akshay.ponda@artofliving.org': {
    countries: ['US'],
    report_permissions: [
      'ttc_applicants_summary.html',
      'post_ttc_course_feedback_summary.html',
      'post_sahaj_ttc_course_feedback_summary.html',
      'ttc_applicants_reports.html',
      'admin_settings.html',
      'ttc_applicants_integrity.html',
    ],
  },
  'ttc@artofliving.org': {
    countries: ['US'],
    report_permissions: [
      'ttc_applicants_summary.html',
      'post_ttc_course_feedback_summary.html',
      'ttc_applicants_reports.html',
      'admin_settings.html',
    ],
  },
  'madhuri.karode@artofliving.org': {
    countries: ['US'],
    report_permissions: [
      'ttc_applicants_summary.html',
      'post_ttc_course_feedback_summary.html',
      'post_sahaj_ttc_course_feedback_summary.html',
    ],
  },
  'ralph.matta@artofliving.ca': {
    countries: ['CA'],
    report_permissions: [
      'ttc_applicants_reports.html',
      'post_ttc_course_feedback_summary.html',
    ],
  },
  'ttcdesk@artofliving.ca': {
    countries: ['CA'],
    report_permissions: [
      'ttc_applicants_reports.html',
      'post_ttc_course_feedback_summary.html',
    ],
  },
  'pooja.tolani@artofliving.ca': {
    countries: ['CA'],
    report_permissions: [
      'ttc_applicants_reports.html',
      'post_ttc_course_feedback_summary.html',
    ],
  },
  'bhavesh.tolani@artofliving.ca': {
    countries: ['CA'],
    report_permissions: [
      'ttc_applicants_reports.html',
      'post_ttc_course_feedback_summary.html',
    ],
  },
  'nikita.lomis@artofliving.ca': {
    countries: ['CA'],
    report_permissions: [
      'ttc_applicants_reports.html',
      'post_ttc_course_feedback_summary.html',
    ],
  },
  'sahajttc@artofliving.org': {
    countries: ['US'],
    report_permissions: [
      'post_sahaj_ttc_course_feedback_summary.html',
    ],
  },
  'satish.ahuja@gmail.com': {
    countries: ['US', 'CA', 'IN'],
    report_permissions: [
      'ttc_applicants_summary.html',
      'post_ttc_course_feedback_summary.html',
      'post_sahaj_ttc_course_feedback_summary.html',
      'ttc_applicants_reports.html',
      'admin_settings.html',
    ],
  },
  'tulasi.perry@artofliving.org': {
    countries: ['US'],
    report_permissions: [
      'post_sahaj_ttc_course_feedback_summary.html',
    ],
  },
  'ttp@in.artofliving.org': {
    countries: ['IN'],
    report_permissions: [
      'ttc_applicants_reports.html',
    ],
  },
  'admin.ttp@in.artofliving.org': {
    countries: ['IN'],
    report_permissions: [
      'ttc_applicants_reports.html',
    ],
  },
  'sushil.nachnani@artofliving.org': {
    countries: ['IN'],
    report_permissions: [
      'ttc_applicants_reports.html',
    ],
  },
  'jani@artofliving.org': {
    countries: ['IN'],
    report_permissions: [
      'ttc_applicants_reports.html',
    ],
  },
  'ashish.shah@artofliving.org': {
    countries: ['IN'],
    report_permissions: [
      'ttc_applicants_reports.html',
    ],
  },
};

// Flat list of all admin emails (keys of the permissions dict)
const LIST_OF_ADMINS = new Set(Object.keys(LIST_OF_ADMIN_PERMISSIONS));

// Map from Next.js route segments to legacy page keys
const ROUTE_TO_PAGE_KEY: Record<string, string> = {
  'ttc_applicants_summary': 'ttc_applicants_summary.html',
  'ttc_applicants_reports': 'ttc_applicants_reports.html',
  'ttc_applicants_integrity': 'ttc_applicants_integrity.html',
  'settings': 'admin_settings.html',
  'reports_list': 'ttc_applicants_reports.html',
  'post_ttc_course_feedback': 'post_ttc_course_feedback_summary.html',
  'post_sahaj_ttc_course_feedback': 'post_sahaj_ttc_course_feedback_summary.html',
};

type AuthResult = { email: string } | Response;

/**
 * Check if request has valid cron header.
 * Cron trust model: if CRON_SECRET env is set, require x-cron-secret header match.
 * If CRON_SECRET not set, accept x-appengine-cron header (dev mode only).
 */
function isCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    return request.headers.get('x-cron-secret') === cronSecret;
  }
  return request.headers.get('x-appengine-cron') === 'true';
}

/**
 * Check page permission (port of admin.py:140-155 check_permissions).
 */
function checkPermissions(email: string, page: string): boolean {
  const perms = LIST_OF_ADMIN_PERMISSIONS[email];
  if (!perms) return false;
  return perms.report_permissions.includes(page);
}

/**
 * Checks authenticated user. Returns { email } on success or 401 Response on failure.
 */
export async function requireAuth(request: Request): Promise<AuthResult> {
  const email = await getAuthenticatedUser(request);
  if (!email) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }
  return { email };
}

/**
 * Checks user is in LIST_OF_ADMINS (no page-specific permission).
 */
export async function requireAdmin(request: Request): Promise<AuthResult> {
  const email = await getAuthenticatedUser(request);
  if (!email) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (!LIST_OF_ADMINS.has(email)) {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }
  return { email };
}

/**
 * Checks user has permission for a specific page.
 */
export async function requireAdminForPage(request: Request, page: string): Promise<AuthResult> {
  const email = await getAuthenticatedUser(request);
  if (!email) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (!checkPermissions(email, page)) {
    return Response.json({ error: 'Permission denied' }, { status: 403 });
  }
  return { email };
}

/**
 * Checks user has permission for ANY of the listed pages.
 */
export async function requireAdminAnyOf(request: Request, pages: string[]): Promise<AuthResult> {
  const email = await getAuthenticatedUser(request);
  if (!email) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (!pages.some(page => checkPermissions(email, page))) {
    return Response.json({ error: 'Permission denied' }, { status: 403 });
  }
  return { email };
}

/**
 * Checks admin list OR cron header.
 */
export async function requireAdminOrCron(request: Request): Promise<AuthResult> {
  if (isCronRequest(request)) {
    return { email: 'cron' };
  }
  const email = await getAuthenticatedUser(request);
  if (!email) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (!LIST_OF_ADMINS.has(email)) {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }
  return { email };
}

/**
 * Checks admin with any-of page permission OR cron header.
 */
export async function requireAdminAnyOfOrCron(request: Request, pages: string[]): Promise<AuthResult> {
  if (isCronRequest(request)) {
    return { email: 'cron' };
  }
  const email = await getAuthenticatedUser(request);
  if (!email) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (!pages.some(page => checkPermissions(email, page))) {
    return Response.json({ error: 'Permission denied' }, { status: 403 });
  }
  return { email };
}

export { LIST_OF_ADMINS, LIST_OF_ADMIN_PERMISSIONS, ROUTE_TO_PAGE_KEY };
