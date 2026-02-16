/**
 * Course Eligibility Dashboard Step Definitions
 *
 * This module implements BDD steps for testing the eligibility dashboard that shows
 * users which courses/forms they are eligible for based on their completed prerequisites.
 *
 * This is NEW functionality not present in the legacy codebase, implemented as a test-side mock.
 */

import { DataTable, Given, When, Then } from '@cucumber/cucumber';

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
  const rawTable = dataTable.raw();
  if (rawTable.length === 0) {
    throw new Error('Expected eligibility table to include a header row');
  }

  const headerRow = rawTable[0].map((column) => column.trim());
  const normalizedHeader = headerRow.map((column) => column.toLowerCase());
  const requiredColumns = ['course', 'prerequisite', 'status'] as const;
  const columnIndex: Record<(typeof requiredColumns)[number], number> = {
    course: -1,
    prerequisite: -1,
    status: -1,
  };

  for (const [index, column] of normalizedHeader.entries()) {
    if (requiredColumns.includes(column as (typeof requiredColumns)[number])) {
      columnIndex[column as (typeof requiredColumns)[number]] = index;
    }
  }

  const missingColumns = requiredColumns.filter((column) => columnIndex[column] === -1);
  if (missingColumns.length > 0) {
    throw new Error(
      `Eligibility table missing required columns: ${missingColumns.join(', ')} (got: ${headerRow.join(', ')})`,
    );
  }

  if (rawTable.length <= 1) {
    throw new Error('Expected eligibility table to include at least one course row');
  }

  const expected: Course[] = rawTable.slice(1).map((row, index) => {
    const course = row[columnIndex.course];
    const prerequisite = row[columnIndex.prerequisite];
    const status = row[columnIndex.status];

    if (!course || !prerequisite || !status) {
      throw new Error(
        `Eligibility table row ${index + 1} must include course, prerequisite, and status`,
      );
    }

    return {
      course,
      prerequisite,
      status,
    };
  });

  if (expected.length === 0) {
    throw new Error('Expected eligibility table to include at least one course row');
  }

  const actual = eligibilityDashboardContext.courses;
  const actualByCourse = new Map<string, Course>(
    actual.map((course) => [course.course, course]),
  );

  // Verify all expected courses are present with matching prerequisite and status.
  for (const expCourse of expected) {
    const actualCourse = actualByCourse.get(expCourse.course);
    if (!actualCourse) {
      throw new Error(
        `Expected course not found in dashboard: ${expCourse.course} (got: ${JSON.stringify(actual)})`,
      );
    }

    if (
      actualCourse.prerequisite !== expCourse.prerequisite ||
      actualCourse.status !== expCourse.status
    ) {
      throw new Error(
        `Course "${expCourse.course}" mismatch. Expected prerequisite "${expCourse.prerequisite}" and status "${expCourse.status}", ` +
          `got prerequisite "${actualCourse.prerequisite}" and status "${actualCourse.status}".`,
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
