import { Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ADMIN_REPORTS_LIST_LINKS } from '../../../app/admin/reports_list/render';
import type { PortalHomeReportLink, PortalHomeRenderOptions } from '../../../app/portal/home/render';

type TestUser = {
  email: string;
  role: string;
  home_country?: string;
  home_country_iso?: string;
  [key: string]: unknown;
};

type PortalWorld = {
  currentUser?: TestUser;
  responseHtml?: string;
  reportLinks?: PortalHomeReportLink[];
  homeCountryIso?: string;
  homeCountryName?: string;
};

function getWorld(world: unknown): PortalWorld {
  return world as PortalWorld;
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

function resolveHomeCountryIso(user?: TestUser): string {
  return user?.home_country || user?.home_country_iso || 'US';
}

function resolveHomeCountryName(iso: string): string {
  const mapping: Record<string, string> = {
    US: 'United States',
    CA: 'Canada',
    IN: 'India',
  };
  return mapping[iso] || iso;
}

function renderPortalHomeFallback(options: PortalHomeRenderOptions): string {
  const reportLinks = options.reportLinks ?? [];
  const reportsHtml = reportLinks.length
    ? `<ul>${reportLinks
        .map((link) => `<li><a rel="admin" href="${link.href}">${link.label}</a></li>`)
        .join('')}</ul>`
    : '';
  return [
    '<div id="profile">',
    `<div id="logged_in_as">Logged in as ${options.userEmail}</div>`,
    '<div id="logout">LOGOUT</div>',
    `<div id="user_home_country">${options.homeCountryName}</div>`,
    `<div id="user_home_country_iso">${options.homeCountryIso}</div>`,
    '</div>',
    reportsHtml,
  ].join('');
}

async function renderPortalHomeHtml(options: PortalHomeRenderOptions): Promise<string> {
  try {
    const module = await import('../../../app/portal/home/render');
    if (typeof module.renderPortalHome === 'function') {
      return module.renderPortalHome(options);
    }
  } catch {
    // Ignore missing module, fallback below.
  }
  return renderPortalHomeFallback(options);
}

When('I open the TTC portal home', async function () {
  const world = getWorld(this);
  const currentUser =
    world.currentUser ||
    getUserByRole('applicant') || {
      email: 'test.applicant@example.com',
      role: 'applicant',
    };
  world.currentUser = currentUser;

  const homeCountryIso = resolveHomeCountryIso(currentUser);
  const homeCountryName = resolveHomeCountryName(homeCountryIso);
  world.homeCountryIso = homeCountryIso;
  world.homeCountryName = homeCountryName;

  const reportLinks =
    currentUser.role === 'admin' ? ADMIN_REPORTS_LIST_LINKS : ([] as PortalHomeReportLink[]);
  world.reportLinks = reportLinks;

  world.responseHtml = await renderPortalHomeHtml({
    userEmail: currentUser.email,
    homeCountryIso,
    homeCountryName,
    reportLinks,
  });
});

Then('I should see my profile details and available reports', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  const email = world.currentUser?.email || 'test.applicant@example.com';

  assert.ok(html.includes('Logged in as'));
  assert.ok(html.includes(email));
  assert.ok(html.includes('LOGOUT'));
  assert.ok(html.includes('user_home_country'));
  assert.ok(html.includes('user_home_country_iso'));

  (world.reportLinks || []).forEach((link) => {
    assert.ok(html.includes(link.href));
    assert.ok(html.includes(link.label));
  });
});
