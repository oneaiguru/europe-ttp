/**
 * Course Eligibility Dashboard Step Definitions
 *
 * This module implements BDD steps for testing the eligibility dashboard that shows
 * users which courses/forms they are eligible for based on their completed prerequisites.
 *
 * This is NEW functionality not present in the legacy codebase, implemented as a test-side mock.
 */

import { Given, When, Then } from '@cucumber/cucumber';

// Import prerequisites context from form_prerequisites_steps
import {
  prerequisitesContext,
  initPrerequisitesContext,
  updateAvailableForms,
} from './form_prerequisites_steps';

/**
 * Course eligibility interface
 */
interface Course {
  course: string;
  prerequisite: string;
  status: string;
}

/**
 * Form message interface
 */
interface FormMessage {
  available: boolean;
  message: string;
  explanation: string | null;
}

/**
 * Eligibility dashboard context
 */
interface EligibilityDashboard {
  courses: Course[];
  formMessages: Record<string, FormMessage>;
}

/**
 * DataTable interface from Cucumber
 */
interface DataTable {
  rawTable?: string[][];
  rows?: string[][];
}

export const eligibilityDashboardContext: EligibilityDashboard = {
  courses: [],
  formMessages: {},
};

export let formAccessAttempt: string | null = null;

/**
 * Get list of courses with eligibility status based on course completions.
 */
function getEligibilityCourses(): Course[] {
  const completions = prerequisitesContext.course_completions;
  const ttc_submitted = completions.ttc_submitted || false;

  return [
    {
      course: 'TTC Application',
      prerequisite: 'None',
      status: 'Eligible',
    },
    {
      course: 'TTC Evaluation',
      prerequisite: 'TTC Application submitted',
      status: ttc_submitted ? 'Eligible' : 'Not Eligible',
    },
    {
      course: 'DSN Application',
      prerequisite: 'Happiness Program completed',
      status: completions.happiness_program ? 'Eligible' : 'Not Eligible',
    },
    {
      course: 'Part 1',
      prerequisite: 'Happiness Program completed',
      status: completions.happiness_program ? 'Eligible' : 'Not Eligible',
    },
    {
      course: 'Part 2',
      prerequisite: 'Part 1 completed',
      status: completions.part_1 ? 'Eligible' : 'Not Eligible',
    },
  ];
}

/**
 * Initialize the eligibility dashboard context.
 */
function initEligibilityDashboardContext(): void {
  initPrerequisitesContext();
  updateAvailableForms();

  eligibilityDashboardContext.courses = [];
  eligibilityDashboardContext.formMessages = {};
  formAccessAttempt = null;
}

/**
 * Reset eligibility dashboard state between test scenarios.
 * Called by common.ts Before hook to prevent state leakage.
 */
export function resetEligibilityDashboardState(): void {
  eligibilityDashboardContext.courses = [];
  eligibilityDashboardContext.formMessages = {};
  formAccessAttempt = null;
}

// Step: I view my course eligibility dashboard
When('I view my course eligibility dashboard', function () {
  initEligibilityDashboardContext();
  eligibilityDashboardContext.courses = getEligibilityCourses();
});

// Step: I should see a list of available courses with prerequisites:
// Note: Both with and without colon to handle cucumber version differences
Then('I should see a list of available courses with prerequisites:', function (dataTable: DataTable) {
  expectCoursesToMatch(dataTable);
});

Then('I should see a list of available courses with prerequisites', function (dataTable: DataTable) {
  expectCoursesToMatch(dataTable);
});

/**
 * Helper to verify courses match expected data table
 */
function expectCoursesToMatch(dataTable: DataTable): void {
  const expected: Course[] = [];
  const rawTable = dataTable.rawTable || dataTable.rows || [];

  // Skip header row if present
  const startIdx = rawTable.length > 0 && rawTable[0][0] === 'course' ? 1 : 0;

  for (let i = startIdx; i < rawTable.length; i++) {
    const row = rawTable[i];
    expected.push({
      course: row[0],
      prerequisite: row[1],
      status: row[2],
    });
  }

  const actual = eligibilityDashboardContext.courses;

  // Verify all expected courses are present
  for (const expCourse of expected) {
    const found = actual.some(
      (actCourse) =>
        actCourse.course === expCourse.course &&
        actCourse.prerequisite === expCourse.prerequisite &&
        actCourse.status === expCourse.status,
    );

    if (!found) {
      throw new Error(
        `Expected course not found in dashboard: ${JSON.stringify(expCourse)} (got: ${JSON.stringify(actual)})`,
      );
    }
  }
}

// Step: I attempt to access the DSN application form
When('I attempt to access the DSN application form', function () {
  initEligibilityDashboardContext();

  const forms = prerequisitesContext.available_forms || [];
  const isAvailable = forms.includes('dsn_application');

  formAccessAttempt = 'dsn_application';

  if (isAvailable) {
    eligibilityDashboardContext.formMessages['dsn_application'] = {
      available: true,
      message: 'available',
      explanation: null,
    };
  } else {
    eligibilityDashboardContext.formMessages['dsn_application'] = {
      available: false,
      message: 'not available',
      explanation: 'Complete Happiness Program first',
    };
  }
});

// Step: I should see "not available" message
Then('I should see "not available" message', function () {
  if (formAccessAttempt === null) {
    throw new Error('No form access attempt recorded');
  }

  const form = formAccessAttempt;
  const messageData = eligibilityDashboardContext.formMessages[form];

  if (!messageData) {
    throw new Error(`No message data found for form: ${form}`);
  }

  if (messageData.message !== 'not available') {
    throw new Error(
      `Expected "not available" message, got: ${JSON.stringify(messageData)}`,
    );
  }
});

// Step: the message should explain the prerequisite: "{string}"
// Note: Both patterns for different cucumber versions
Then('the message should explain the prerequisite: "{string}"', function (explanation: string) {
  assertExplanationMatches(explanation);
});

Then('the message should explain the prerequisite: {string}', function (explanation: string) {
  assertExplanationMatches(explanation);
});

/**
 * Helper to verify explanation matches
 */
function assertExplanationMatches(explanation: string): void {
  if (formAccessAttempt === null) {
    throw new Error('No form access attempt recorded');
  }

  const form = formAccessAttempt;
  const messageData = eligibilityDashboardContext.formMessages[form];

  if (!messageData) {
    throw new Error(`No message data found for form: ${form}`);
  }

  if (messageData.explanation !== explanation) {
    throw new Error(
      `Expected explanation "${explanation}", got: "${messageData.explanation}"`,
    );
  }
}

// Step: the DSN form shows as "not available"
// Note: Used as Given in the feature file
Given('the DSN form shows as "not available"', function () {
  initPrerequisitesContext();
  updateAvailableForms();

  const forms = prerequisitesContext.available_forms || [];
  if (forms.includes('dsn_application')) {
    throw new Error(
      `DSN application should not be available, got: ${JSON.stringify(forms)}`,
    );
  }
});

// Step: I refresh the eligibility dashboard
When('I refresh the eligibility dashboard', function () {
  initEligibilityDashboardContext();
  eligibilityDashboardContext.courses = getEligibilityCourses();
});

// Step: the DSN form should show as "available"
Then('the DSN form should show as "available"', function () {
  initPrerequisitesContext();
  updateAvailableForms();

  const forms = prerequisitesContext.available_forms || [];
  if (!forms.includes('dsn_application')) {
    throw new Error(
      `DSN application should be available, got: ${JSON.stringify(forms)}`,
    );
  }
});
