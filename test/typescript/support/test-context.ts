/**
 * Shared test context module for TypeScript BDD step definitions.
 *
 * This module provides a centralized, type-safe way to access test context
 * stored on globalThis. It includes type guards, safe accessors, and
 * initialization functions to prevent runtime errors from load order issues.
 *
 * Usage:
 *   import { getTestContext, initTestContext } from './support/test-context';
 *
 *   // Initialize once (typically in e2e_api_steps.ts at module load)
 *   initTestContext();
 *
 *   // Access with runtime safety check
 *   const ctx = getTestContext();
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TestUser {
  email: string;
  role: string;
  home_country: string;
  name: string;
  profile_complete?: boolean;
  photo_uploaded?: boolean;
}

interface TTCOption {
  value: string;
  display: string;
  display_until: string;
  display_countries: string[];
  display_data: Record<string, string>;
}

interface FormSubmission {
  form_type: string;
  email?: string;
  ttc_option?: string;
  applicant_email?: string;
  evaluator_email?: string;
  candidate_email?: string;
  candidate_name?: string;
  graduate_email?: string;
  data: Record<string, unknown>;
  status: string;
  matching_method?: 'email' | 'name_fallback' | 'fuzzy_email' | 'no_match';
  manual_review?: boolean;
}

interface ApiResponse {
  status: string;
  body: string;
}

/**
 * Test context interface shared across all E2E and validation steps.
 */
export interface TestContext {
  currentEmail?: string;
  currentRole?: string;
  currentUser?: TestUser;
  currentTtcOption?: TTCOption;
  lastSubmission?: FormSubmission;
  response?: ApiResponse;
  homeCountry?: string;
  whitelist: string[];
  whitelistTargetEmail?: string;
  whitelistGraceExpired: boolean;
  evaluations: FormSubmission[];
  evaluationsCount: number;
  applicantSubmissions: Record<string, unknown>;
  applicants: Record<string, TestUser>;
  graduates: Record<string, unknown>;
  testModeEnabled: boolean;
  currentPage?: string;
  numEvaluators?: number;
  requestedReportEmail?: string;
  userSummary: Record<string, unknown>;
  evaluationsList: unknown[];
  lastNotification?: { to: string; type: string };
  flaggedMissingFeedback?: string[];
  postTtcSelfEvalEmails?: string[];
  postTtcFeedbackEmails?: string[];
  postTtcSubmissions?: {
    selfEval?: boolean;
    coTeacherFeedback?: boolean;
  };
  // Validation and draft step properties
  field_errors?: Record<string, string>;
  drafts?: Record<string, { form_type?: string; status?: string; data?: Record<string, unknown>; preserved?: boolean }>;
  // E2E workflow properties
  applicantUploads?: Record<string, {
    photo_url: string;
    document_urls: string[];
  }>;
  currentApplicantEmail?: string;
  currentApplicantSubmission?: {
    form_type: string;
    ttc_option?: string;
    data: Record<string, unknown>;
    status: string;
  };
  currentView?: string;
}

// Extend the global interface to allow testContext property
declare global {
  var testContext: TestContext;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for TestContext.
 * Checks if an unknown object has the expected TestContext shape.
 *
 * @param obj - Any value to check
 * @returns True if obj matches TestContext structure
 */
export function isTestContext(obj: unknown): obj is TestContext {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const ctx = obj as Partial<TestContext>;

  // Check for required array properties
  return (
    Array.isArray(ctx.whitelist) &&
    Array.isArray(ctx.evaluations) &&
    typeof ctx.evaluationsCount === 'number' &&
    typeof ctx.whitelistGraceExpired === 'boolean' &&
    typeof ctx.testModeEnabled === 'boolean' &&
    typeof ctx.applicantSubmissions === 'object' &&
    typeof ctx.applicants === 'object' &&
    typeof ctx.graduates === 'object' &&
    typeof ctx.userSummary === 'object' &&
    Array.isArray(ctx.evaluationsList)
  );
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize testContext on globalThis with default values.
 * Safe to call multiple times - will only initialize once.
 *
 * This should be called once at module load time (typically in e2e_api_steps.ts).
 */
export function initTestContext(): void {
  if (typeof globalThis.testContext === 'undefined') {
    globalThis.testContext = {
      whitelist: [],
      whitelistGraceExpired: false,
      evaluations: [],
      evaluationsCount: 0,
      applicantSubmissions: {},
      applicants: {},
      graduates: {},
      testModeEnabled: true,
      userSummary: {},
      evaluationsList: [],
    };
  }
}

// ============================================================================
// SAFE ACCESSOR
// ============================================================================

/**
 * Get the test context from globalThis with runtime safety check.
 *
 * @returns TestContext object
 * @throws Error if testContext is not initialized
 */
export function getTestContext(): TestContext {
  if (typeof globalThis.testContext === 'undefined') {
    throw new Error(
      'testContext not initialized. Call initTestContext() before accessing test context. ' +
      'This typically happens in e2e_api_steps.ts at module load time.'
    );
  }

  if (!isTestContext(globalThis.testContext)) {
    throw new Error(
      'globalThis.testContext does not match expected TestContext structure. ' +
      'This may indicate a load order issue or conflicting type declaration.'
    );
  }

  return globalThis.testContext;
}
