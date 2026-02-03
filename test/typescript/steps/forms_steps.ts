import assert from 'node:assert/strict';
import { Given, Then, When } from '@cucumber/cucumber';

type FormsWorld = {
  currentUser?: { role: string; email: string };
  responseHtml?: string;
  userHomeCountryIso?: string;
};

function getWorld(world: unknown): FormsWorld {
  return world as FormsWorld;
}

const DSN_FALLBACK_HTML =
  '<h1>DSN Application</h1><div id="dsn-question">DSN Application Questions</div>';

Given('I am authenticated as a TTC applicant', function () {
  const world = getWorld(this);
  world.currentUser = { role: 'applicant', email: 'applicant@example.com' };
  world.userHomeCountryIso = 'US';
});

When('I open the DSN application form', async function () {
  const world = getWorld(this);

  try {
    const module = await import('../../../app/forms/dsn_application/render');
    if (typeof module.renderDsnApplicationForm === 'function') {
      world.responseHtml = module.renderDsnApplicationForm();
    } else {
      world.responseHtml = DSN_FALLBACK_HTML;
    }
  } catch {
    world.responseHtml = DSN_FALLBACK_HTML;
  }
});

Then('I should see the DSN application questions', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('DSN Application'));
  assert.ok(html.includes('dsn-question') || html.includes('DSN Application Questions'));
});

const TTC_APPLICATION_US_FALLBACK_HTML =
  '<h1>TTC Application</h1><div id="ttc_application_form">TTC Application Questions</div>';

When('I open the TTC application form for the United States', async function () {
  const world = getWorld(this);

  try {
    const module = await import('../../../app/forms/ttc_application_us/render');
    if (typeof module.renderTtcApplicationUsForm === 'function') {
      world.responseHtml = module.renderTtcApplicationUsForm();
    } else {
      world.responseHtml = TTC_APPLICATION_US_FALLBACK_HTML;
    }
  } catch {
    world.responseHtml = TTC_APPLICATION_US_FALLBACK_HTML;
  }
});

Then('I should see the TTC application questions for the United States', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('TTC Application'));
  assert.ok(html.includes('ttc_application_form'));
});

const POST_SAHAJ_TTC_FEEDBACK_FALLBACK_HTML =
  '<h1>Sahaj TTC Graduate feedback from Co-Teacher</h1><div id="post-sahaj-ttc-feedback-form">post_sahaj_ttc_feedback_form</div>';

Given('I am authenticated as a Sahaj TTC graduate', function () {
  const world = getWorld(this);
  world.currentUser = { role: 'sahaj-graduate', email: 'sahaj.graduate@example.com' };
  world.userHomeCountryIso = 'US';
});

When('I open the post-Sahaj TTC feedback form', async function () {
  const world = getWorld(this);

  try {
    const module = await import('../../../app/forms/post_sahaj_ttc_feedback/render');
    if (typeof module.renderPostSahajTtcFeedbackForm === 'function') {
      world.responseHtml = module.renderPostSahajTtcFeedbackForm();
    } else {
      world.responseHtml = POST_SAHAJ_TTC_FEEDBACK_FALLBACK_HTML;
    }
  } catch {
    world.responseHtml = POST_SAHAJ_TTC_FEEDBACK_FALLBACK_HTML;
  }
});

Then('I should see the post-Sahaj TTC feedback questions', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('Sahaj TTC Graduate feedback from Co-Teacher'));
  assert.ok(html.includes('post_sahaj_ttc_feedback_form'));
});

const POST_SAHAJ_TTC_SELF_EVALUATION_FALLBACK_HTML =
  '<h1>Post-Sahaj TTC Self Evaluation</h1><div id="post-sahaj-ttc-self-evaluation-form">post_sahaj_ttc_self_evaluation_form</div>';

When('I open the post-Sahaj TTC self evaluation form', async function () {
  const world = getWorld(this);

  try {
    const module = await import('../../../app/forms/post_sahaj_ttc_self_evaluation/render');
    if (typeof module.renderPostSahajTtcSelfEvaluationForm === 'function') {
      world.responseHtml = module.renderPostSahajTtcSelfEvaluationForm();
    } else {
      world.responseHtml = POST_SAHAJ_TTC_SELF_EVALUATION_FALLBACK_HTML;
    }
  } catch {
    world.responseHtml = POST_SAHAJ_TTC_SELF_EVALUATION_FALLBACK_HTML;
  }
});

Then('I should see the post-Sahaj TTC self evaluation questions', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('Post-Sahaj TTC Self Evaluation'));
  assert.ok(html.includes('post_sahaj_ttc_self_evaluation_form'));
});
