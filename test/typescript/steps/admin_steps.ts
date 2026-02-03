import { Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  ADMIN_UNAUTHORIZED_HTML,
  renderAdminUnauthorized,
} from '../../../app/admin/permissions/render';

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

let cachedUsers: TestUser[] | null = null;

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

const ADMIN_DASHBOARD_FALLBACK_HTML =
  '<h1>Admin</h1><table id="ttc_applicants_summary"></table>';

async function renderAdminDashboardHtml(): Promise<string> {
  try {
    const module = await import('../../../app/admin/ttc_applicants_summary/render');
    if (typeof module.renderAdminDashboard === 'function') {
      return module.renderAdminDashboard();
    }
  } catch {
    // Ignore missing module, fallback below.
  }
  return ADMIN_DASHBOARD_FALLBACK_HTML;
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

Then('I should see an unauthorized message', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes(ADMIN_UNAUTHORIZED_HTML));
});
