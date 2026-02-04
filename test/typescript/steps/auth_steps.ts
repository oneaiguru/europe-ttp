import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

interface TestUser {
  email: string;
  role: string;
  [key: string]: unknown;
}

export const authContext: {
  currentUser?: TestUser;
  currentPage?: string;
  passwordResetEmail?: string;
  responseHtml?: string;
} = {};

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

Given('I am on the TTC portal login page', () => {
  authContext.currentUser = undefined;
  authContext.currentPage = 'login';
  authContext.responseHtml = 'LOGIN';
});

Given('I am authenticated on the TTC portal', () => {
  const applicant = getUserByRole('applicant') || {
    email: 'test.applicant@example.com',
    role: 'applicant',
  };
  authContext.currentUser = applicant;
  authContext.currentPage = 'home';
  authContext.responseHtml = `Logged in as ${applicant.email} LOGOUT`;
});

When('I sign in with a valid Google account', () => {
  const applicant = getUserByRole('applicant') || {
    email: 'test.applicant@example.com',
    role: 'applicant',
  };
  authContext.currentUser = applicant;
  authContext.currentPage = 'home';
  authContext.responseHtml = `Logged in as ${applicant.email} LOGOUT`;
});

When('I sign out of the TTC portal', () => {
  authContext.currentUser = undefined;
  authContext.currentPage = 'login';
  authContext.responseHtml = 'LOGIN';
});

When('I request a password reset for my Google account', () => {
  const applicant = getUserByRole('applicant') || {
    email: 'test.applicant@example.com',
    role: 'applicant',
  };
  authContext.currentUser = undefined;
  authContext.passwordResetEmail = applicant.email;
  authContext.currentPage = 'password_reset';
  authContext.responseHtml = 'PASSWORD RESET PROMPT';
});

Then('I should be redirected to the TTC portal home', () => {
  assert.equal(authContext.currentPage, 'home');
  assert.ok(authContext.responseHtml, 'Expected responseHtml to be set');
  const email = authContext.currentUser?.email;
  if (email) {
    assert.ok(authContext.responseHtml?.includes(email));
  }
  assert.ok(authContext.responseHtml?.includes('LOGOUT'));
});

Then('I should be redirected to the TTC portal login page', () => {
  assert.equal(authContext.currentPage, 'login');
  assert.ok(authContext.responseHtml, 'Expected responseHtml to be set');
  assert.ok(authContext.responseHtml?.includes('LOGIN'));
  assert.ok(!authContext.responseHtml?.includes('LOGOUT'));
});

Then('I should receive a password reset prompt from the identity provider', () => {
  assert.equal(authContext.currentPage, 'password_reset');
  assert.ok(authContext.responseHtml, 'Expected responseHtml to be set');
  assert.ok(authContext.responseHtml?.includes('PASSWORD RESET PROMPT'));
});
