import { Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ADMIN_UNAUTHORIZED_HTML,
  renderAdminUnauthorized,
} from '../../../app/admin/permissions/render';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type TestUser = {
  email: string;
  role: string;
  [key: string]: unknown;
};

type AdminWorld = {
  currentUser?: TestUser;
  currentRole?: string;
  currentPage?: string;
  responseHtml?: string;
};

function getWorld(world: unknown): AdminWorld {
  return world as AdminWorld;
}

export let cachedUsers: TestUser[] | null = null;

/**
 * Reset cached data between test scenarios.
 * Called by common.ts Before hook to prevent state leakage.
 */
export function resetAdminStepsCache(): void {
  cachedUsers = null;
}

function loadTestUsers(): TestUser[] {
  if (cachedUsers) {
    return cachedUsers;
  }
  const fixturesPath = path.resolve(__dirname, '../../fixtures/test-users.json');
  const raw = fs.readFileSync(fixturesPath, 'utf-8');
  const parsed = JSON.parse(raw) as { users?: TestUser[] };
  cachedUsers = parsed.users ?? [];
  return cachedUsers;
}

function getUserByRole(role: string): TestUser | undefined {
  return loadTestUsers().find((user) => user.role === role);
}

const ADMIN_REPORTS_LIST_LINKS = [
  { href: '/api/admin/ttc_applicants_reports', label: 'TTC Report' },
  { href: '/api/admin/ttc_applicants_integrity', label: 'TTC Integrity Report' },
  { href: '/api/admin/post_ttc_course_feedback', label: 'Post TTC Report' },
  { href: '/api/admin/post_sahaj_ttc_course_feedback', label: 'Post Sahaj TTC Report' },
  { href: '/api/admin/settings', label: 'Admin Settings' },
];

async function renderAdminDashboardHtml(): Promise<string> {
  const module = await import('../../../app/admin/ttc_applicants_summary/render');
  return module.renderAdminDashboard({
    ttcListHtml: '<div><select id="ttc_list"><option value="test_ttc">Test TTC</option></select></div>',
  });
}

async function renderAdminReportsListHtml(): Promise<string> {
  const module = await import('../../../app/admin/reports_list/render');
  return module.renderAdminReportsList();
}

async function renderAdminSettingsHtml(): Promise<string> {
  const module = await import('../../../app/admin/settings/render');
  return module.renderAdminSettings();
}

Given('I am authenticated as an admin user', function () {
  const world = getWorld(this);
  const adminUser = getUserByRole('admin') || {
    email: 'test.admin@example.com',
    role: 'admin',
  };
  world.currentUser = adminUser;
  world.currentRole = 'admin';
});

Given('I am authenticated as a non-admin user', function () {
  const world = getWorld(this);
  const applicantUser = getUserByRole('applicant') || {
    email: 'test.applicant@example.com',
    role: 'applicant',
  };
  world.currentUser = applicantUser;
  world.currentRole = 'non-admin';
});

When('I open the admin dashboard page', async function () {
  const world = getWorld(this);
  world.currentPage = 'admin-dashboard';
  world.responseHtml = await renderAdminDashboardHtml();
});

When('I open the admin reports list page', async function () {
  const world = getWorld(this);
  world.currentPage = 'admin-reports-list';
  world.responseHtml = await renderAdminReportsListHtml();
});

When('I open the admin settings page', async function () {
  const world = getWorld(this);
  world.currentPage = 'admin-settings';
  world.responseHtml = await renderAdminSettingsHtml();
});

When('I open an admin-only page', async function () {
  const world = getWorld(this);
  world.currentPage = '/admin/ttc_applicants_summary.html';
  if (world.currentRole !== 'admin') {
    world.responseHtml = renderAdminUnauthorized();
    return;
  }
  world.responseHtml = await renderAdminDashboardHtml();
});

Then('I should see the admin dashboard content', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('Admin'));
  assert.ok(html.includes('ttc_applicants_summary'));
});

Then('I should see the admin settings content', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('Admin Settings'));
  assert.ok(html.includes('Please enter settings for TTC portal'));
  assert.ok(html.includes('settings_page'));
});

Then('I should see the list of available report pages', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('Admin'));
  ADMIN_REPORTS_LIST_LINKS.forEach((link) => {
    assert.ok(html.includes(link.href));
    assert.ok(html.includes(link.label));
  });
});

Then('I should see an unauthorized message', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes(ADMIN_UNAUTHORIZED_HTML));
});
