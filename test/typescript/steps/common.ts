/**
 * Common BDD setup and state reset for TypeScript steps.
 *
 * This module provides a Before hook that resets all module-level state
 * between scenarios to prevent cross-scenario contamination.
 *
 * Each step file exports its context objects and reset functions,
 * which are called here to reset state before each scenario runs.
 */

import { Before } from '@cucumber/cucumber';

// Import all context objects from their respective files
import { apiContext, resetApiStepsCache } from './api_steps';
import { draftContext } from './draft_steps';
import {
  userFormContext,
  configContext,
  getFormDataContext,
  reportingContext,
  resetUserStepsCache,
} from './user_steps';
import { resetEligibilityDashboardState } from './eligibility_dashboard_steps';
import { prerequisitesContext } from './form_prerequisites_steps';
import { getIntegrityContext } from './integrity_steps';
import { resetAdminStepsCache } from './admin_steps';

/**
 * Reset all module-level state before each scenario.
 *
 * This ensures that state from one scenario doesn't leak into the next,
 * which could cause false positives or false negatives in test results.
 */
Before(function () {
  // Reset apiContext
  apiContext.responseStatus = undefined;
  apiContext.lastPayload = undefined;

  // Reset api_steps.ts cached data
  resetApiStepsCache();

  // Reset admin_steps.ts cached data
  resetAdminStepsCache();

  // Reset draftContext
  draftContext.drafts = {};
  draftContext.currentForm = undefined;
  draftContext.partialFormData = undefined;

  // Reset user_steps.ts cached data
  resetUserStepsCache();

  // Reset userFormContext
  for (const key of Object.keys(userFormContext)) {
    delete userFormContext[key as keyof typeof userFormContext];
  }

  // Reset configContext
  configContext.ttcUser = undefined;
  configContext.userConfig = undefined;
  configContext.lastConfigUpdate = undefined;

  // Reset getFormDataContext
  for (const key of Object.keys(getFormDataContext)) {
    delete getFormDataContext[key as keyof typeof getFormDataContext];
  }

  // Reset reportingContext
  reportingContext.targetUser = undefined;
  reportingContext.targetEmail = undefined;
  reportingContext.formData = undefined;

  // Reset eligibilityDashboardContext (including formAccessAttempt)
  resetEligibilityDashboardState();

  // Reset prerequisitesContext
  prerequisitesContext.course_completions = {
    happiness_program: false,
    part_1: false,
    part_2: false,
    ttc_submitted: false,
  };
  prerequisitesContext.available_forms = [];
  prerequisitesContext.home_country = 'US';

  // Reset integrityContext (stored in globalThis)
  const integrityCtx = getIntegrityContext();
  integrityCtx.currentEmail = undefined;
  integrityCtx.applicantEmail = undefined;
  integrityCtx.evaluationEmail = undefined;
  integrityCtx.integrityData = {};
  integrityCtx.evaluations = undefined;
  integrityCtx.csvData = undefined;
  integrityCtx.csvDownloadUrl = undefined;
  integrityCtx.mismatchedEvaluation = undefined;
  integrityCtx.lastReportRun = undefined;
  integrityCtx.response = undefined;
});
