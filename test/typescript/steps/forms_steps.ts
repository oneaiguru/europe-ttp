import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';
import { authContext } from './auth_steps';
import { generateSessionToken } from '../../../app/utils/auth';
import {
  TEST_AUTH_MODE_SESSION,
  TEST_HMAC_SECRET,
  TEST_SESSION_MAX_AGE_SECONDS,
} from '../../fixtures/test-config.js';

type FormsWorld = {
  currentUser?: { role: string; email: string };
  responseHtml?: string;
  userHomeCountryIso?: string;
};

function getWorld(world: unknown): FormsWorld {
  return world as FormsWorld;
}

Given('I am authenticated as a TTC applicant', function () {
  const world = getWorld(this);
  const email = 'applicant@example.com';
  world.currentUser = { role: 'applicant', email };
  world.userHomeCountryIso = 'US';

  // Keep the shared authContext and environment in sync so other step files
  // (API/auth/upload steps) can build authenticated Requests deterministically.
  process.env.AUTH_MODE = TEST_AUTH_MODE_SESSION;
  process.env.UPLOAD_HMAC_SECRET = TEST_HMAC_SECRET;
  process.env.SESSION_HMAC_SECRET = TEST_HMAC_SECRET;
  process.env.SESSION_MAX_AGE_SECONDS = TEST_SESSION_MAX_AGE_SECONDS.toString();

  authContext.authMode = TEST_AUTH_MODE_SESSION;
  authContext.currentUser = { email, role: 'applicant' };
  authContext.sessionToken = generateSessionToken(email, TEST_HMAC_SECRET);
});

When('I open the DSN application form', async function () {
  const world = getWorld(this);
  const module = await import('../../../app/forms/dsn_application/render');
  world.responseHtml = module.renderDsnApplicationForm();
});

Then('I should see the DSN application questions', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('DSN Application'));
  assert.ok(html.includes('dsn-question') || html.includes('DSN Application Questions'));
});

When('I open the TTC application form for the United States', async function () {
  const world = getWorld(this);
  const module = await import('../../../app/forms/ttc_application_us/render');
  world.responseHtml = module.renderTtcApplicationUsForm();
});

Then('I should see the TTC application questions for the United States', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('TTC Application'));
  assert.ok(html.includes('ttc_application_form'));
});

When('I open the TTC application form for a non-US country', async function () {
  const world = getWorld(this);

  // Set user's home country to non-US (India for testing)
  world.userHomeCountryIso = 'IN';

  const module = await import('../../../app/forms/ttc_application_non_us/render');
  world.responseHtml = module.renderTtcApplicationNonUsForm();
});

Then('I should see the TTC application questions for that country', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('TTC Application'));
  assert.ok(html.includes('ttc_application_form_non_us'));
});

Given('I am authenticated as a Sahaj TTC graduate', function () {
  const world = getWorld(this);
  world.currentUser = { role: 'sahaj-graduate', email: 'sahaj.graduate@example.com' };
  world.userHomeCountryIso = 'US';
});

When('I open the post-Sahaj TTC feedback form', async function () {
  const world = getWorld(this);
  const module = await import('../../../app/forms/post_sahaj_ttc_feedback/render');
  world.responseHtml = module.renderPostSahajTtcFeedbackForm();
});

Then('I should see the post-Sahaj TTC feedback questions', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('Sahaj TTC Graduate feedback from Co-Teacher'));
  assert.ok(html.includes('post_sahaj_ttc_feedback_form'));
});

When('I open the post-Sahaj TTC self evaluation form', async function () {
  const world = getWorld(this);
  const module = await import('../../../app/forms/post_sahaj_ttc_self_evaluation/render');
  world.responseHtml = module.renderPostSahajTtcSelfEvaluationForm();
});

Then('I should see the post-Sahaj TTC self evaluation questions', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('Post-Sahaj TTC Self Evaluation'));
  assert.ok(html.includes('post_sahaj_ttc_self_evaluation_form'));
});

Given('I am authenticated as an evaluator', function () {
  const world = getWorld(this);
  world.currentUser = { role: 'evaluator', email: 'evaluator@example.com' };
  world.userHomeCountryIso = 'US';
});

When('I open the TTC evaluation form', async function () {
  const world = getWorld(this);
  const module = await import('../../../app/forms/ttc_evaluation/render');
  world.responseHtml = module.renderTtcEvaluationForm();
});

Then('I should see the TTC evaluation questions', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('TTC Evaluation'));
  assert.ok(html.includes('ttc-evaluation-form'));
});

When('I open the TTC applicant profile form', async function () {
  const world = getWorld(this);
  const module = await import('../../../app/forms/ttc_applicant_profile/render');
  world.responseHtml = module.renderTtcApplicantProfileForm();
});

Then('I should see the TTC applicant profile questions', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('TTC Applicant Profile'));
  assert.ok(html.includes('ttc-applicant-profile-form'));
});

When('I open the TTC evaluator profile form', async function () {
  const world = getWorld(this);
  const module = await import('../../../app/forms/ttc_evaluator_profile/render');
  world.responseHtml = module.renderTtcEvaluatorProfileForm();
});

Then('I should see the TTC evaluator profile questions', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('TTC Evaluator Profile'));
  assert.ok(html.includes('ttc-evaluator-profile-form'));
});

Given('I am authenticated as a TTC graduate', function () {
  const world = getWorld(this);
  world.currentUser = { role: 'ttc-graduate', email: 'graduate@example.com' };
  world.userHomeCountryIso = 'US';
});

When('I open the post-TTC self evaluation form', async function () {
  const world = getWorld(this);
  const module = await import('../../../app/forms/post_ttc_self_evaluation/render');
  world.responseHtml = module.renderPostTtcSelfEvaluationForm();
});

Then('I should see the post-TTC self evaluation questions', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('Post-TTC Self Evaluation'));
  assert.ok(html.includes('post_ttc_self_evaluation_form'));
});

When('I open the post-TTC feedback form', async function () {
  const world = getWorld(this);
  const module = await import('../../../app/forms/post_ttc_feedback/render');
  world.responseHtml = module.renderPostTtcFeedbackForm();
});

Then('I should see the post-TTC feedback questions', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('Post-TTC Feedback'));
  assert.ok(html.includes('post_ttc_feedback_form'));
});

Given('I am authenticated as a TTC admin', function () {
  const world = getWorld(this);
  world.currentUser = { role: 'ttc-admin', email: 'ttc-admin@example.com' };
  world.userHomeCountryIso = 'US';
});

When('I open the TTC portal settings form', async function () {
  const world = getWorld(this);
  const module = await import('../../../app/forms/ttc_portal_settings/render');
  world.responseHtml = module.renderTtcPortalSettingsForm();
});

Then('I should see the TTC portal settings questions', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('TTC Portal Settings'));
  assert.ok(html.includes('ttc-portal-settings-form'));
});
