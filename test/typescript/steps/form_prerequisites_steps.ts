/**
 * Form Prerequisites and Conditional Availability Step Definitions
 *
 * This module implements BDD steps for testing form availability based on:
 * 1. Course completion prerequisites (Happiness Program → Part 1 → Part 2 → YES++)
 * 2. Home country filtering for TTC options
 *
 * Since this is new functionality not present in the legacy codebase,
 * these are test-side mock implementations.
 */

import { Given, When, Then } from '@cucumber/cucumber';

export interface CourseCompletions {
  happiness_program: boolean;
  part_1: boolean;
  part_2: boolean;
  ttc_submitted?: boolean;
}

export interface PrerequisitesContext {
  course_completions: CourseCompletions;
  available_forms: string[];
  home_country: string;
}

// Global context for prerequisites testing
const prerequisitesContext: PrerequisitesContext = {
  course_completions: {
    happiness_program: false,
    part_1: false,
    part_2: false,
  },
  available_forms: [],
  home_country: 'US',
};

/**
 * Initialize the prerequisites context if needed
 */
function initPrerequisitesContext(): void {
  if (!prerequisitesContext.course_completions) {
    prerequisitesContext.course_completions = {
      happiness_program: false,
      part_1: false,
      part_2: false,
    };
  }
  if (!prerequisitesContext.available_forms) {
    prerequisitesContext.available_forms = [];
  }
  if (!prerequisitesContext.home_country) {
    prerequisitesContext.home_country = 'US';
  }
}

/**
 * Update the list of available forms based on course completions and home country
 */
function updateAvailableForms(): void {
  const completions = prerequisitesContext.course_completions;
  const homeCountry = prerequisitesContext.home_country;
  const forms: string[] = [];

  // Base form - depends on home country
  if (homeCountry === 'IN') {
    forms.push('ttc_application_in');
  } else {
    forms.push('ttc_application_us');
  }

  // DSN requires Happiness Program
  if (completions.happiness_program) {
    forms.push('dsn_application');
  }

  // Part 1 requires Happiness Program
  if (completions.happiness_program) {
    forms.push('part_1_application');
  }

  // Part 2 requires Part 1
  if (completions.part_1) {
    forms.push('part_2_application');
  }

  // YES++ requires both Part 1 and Part 2
  if (completions.part_1 && completions.part_2) {
    forms.push('yes_plus_application');
  }

  prerequisitesContext.available_forms = forms;
}

// Note: 'I am authenticated as applicant with email "{string}"' is already
// implemented in e2e_api_steps.ts, so we don't duplicate it here.

// Step: I have NOT completed the Happiness Program
// Note: Using Given since it's primarily used as a precondition
Given('I have NOT completed the Happiness Program', function () {
  initPrerequisitesContext();
  prerequisitesContext.course_completions.happiness_program = false;
  updateAvailableForms();
});

// Step: the DSN application form should NOT be available
Then('the DSN application form should NOT be available', function () {
  const forms = prerequisitesContext.available_forms || [];
  if (forms.includes('dsn_application')) {
    throw new Error(
      `DSN application should not be available, got: ${JSON.stringify(forms)}`
    );
  }
});

// Step: I complete the Happiness Program
// Note: Using When since it's primarily used as an action
When('I complete the Happiness Program', function () {
  initPrerequisitesContext();
  prerequisitesContext.course_completions.happiness_program = true;
  updateAvailableForms();
});

// Step: the DSN application form should become available
Then('the DSN application form should become available', function () {
  if (!prerequisitesContext.course_completions.happiness_program) {
    throw new Error('Happiness Program must be completed for DSN');
  }
  const forms = prerequisitesContext.available_forms || [];
  if (!forms.includes('dsn_application')) {
    throw new Error(
      `DSN application should be available, got: ${JSON.stringify(forms)}`
    );
  }
});

// Step: I have completed Part 1 but NOT Part 2
When('I have completed Part 1 but NOT Part 2', function () {
  initPrerequisitesContext();
  prerequisitesContext.course_completions.happiness_program = true;
  prerequisitesContext.course_completions.part_1 = true;
  prerequisitesContext.course_completions.part_2 = false;
  updateAvailableForms();
});

// Step: the YES+ application form should NOT be available
Then('the YES+ application form should NOT be available', function () {
  const forms = prerequisitesContext.available_forms || [];
  if (forms.includes('yes_plus_application')) {
    throw new Error(
      `YES+ application should not be available, got: ${JSON.stringify(forms)}`
    );
  }
});

// Step: I complete Part 2
When('I complete Part 2', function () {
  initPrerequisitesContext();
  prerequisitesContext.course_completions.part_2 = true;
  updateAvailableForms();
});

// Step: the YES+ application form should become available
Then('the YES+ application form should become available', function () {
  if (!prerequisitesContext.course_completions.part_1) {
    throw new Error('Part 1 must be completed for YES+');
  }
  if (!prerequisitesContext.course_completions.part_2) {
    throw new Error('Part 2 must be completed for YES+');
  }
  const forms = prerequisitesContext.available_forms || [];
  if (!forms.includes('yes_plus_application')) {
    throw new Error(
      `YES+ application should be available, got: ${JSON.stringify(forms)}`
    );
  }
});

// Step: the Part 1 course application should NOT be available
Then('the Part 1 course application should NOT be available', function () {
  const forms = prerequisitesContext.available_forms || [];
  if (forms.includes('part_1_application')) {
    throw new Error(
      `Part 1 application should not be available, got: ${JSON.stringify(forms)}`
    );
  }
});

// Step: the Part 1 course application should become available
Then('the Part 1 course application should become available', function () {
  if (!prerequisitesContext.course_completions.happiness_program) {
    throw new Error('Happiness Program must be completed for Part 1');
  }
  const forms = prerequisitesContext.available_forms || [];
  if (!forms.includes('part_1_application')) {
    throw new Error(
      `Part 1 application should be available, got: ${JSON.stringify(forms)}`
    );
  }
});

// Step: I have NOT completed Part 1
When('I have NOT completed Part 1', function () {
  initPrerequisitesContext();
  prerequisitesContext.course_completions.happiness_program = true;
  prerequisitesContext.course_completions.part_1 = false;
  prerequisitesContext.course_completions.part_2 = false;
  updateAvailableForms();
});

// Step: the Part 2 course application should NOT be available
Then('the Part 2 course application should NOT be available', function () {
  const forms = prerequisitesContext.available_forms || [];
  if (forms.includes('part_2_application')) {
    throw new Error(
      `Part 2 application should not be available, got: ${JSON.stringify(forms)}`
    );
  }
});

// Step: I complete Part 1
When('I complete Part 1', function () {
  initPrerequisitesContext();
  prerequisitesContext.course_completions.part_1 = true;
  updateAvailableForms();
});

// Step: the Part 2 course application should become available
Then('the Part 2 course application should become available', function () {
  if (!prerequisitesContext.course_completions.part_1) {
    throw new Error('Part 1 must be completed for Part 2');
  }
  const forms = prerequisitesContext.available_forms || [];
  if (!forms.includes('part_2_application')) {
    throw new Error(
      `Part 2 application should be available, got: ${JSON.stringify(forms)}`
    );
  }
});

// Step: my home country is {string}
When('my home country is {string}', function (country: string) {
  initPrerequisitesContext();
  prerequisitesContext.home_country = country;
  // Always update available forms when home country changes
  updateAvailableForms();
});

// Step: US-specific TTC options should be available
Then('US-specific TTC options should be available', function () {
  if (prerequisitesContext.home_country !== 'US') {
    throw new Error('Home country should be US');
  }
  // Check if ttc_application_us is in the available forms
  const forms = prerequisitesContext.available_forms || [];
  if (!forms.includes('ttc_application_us')) {
    throw new Error(
      `Should have US-specific TTC options, got: ${JSON.stringify(forms)}`
    );
  }
});

// Step: India-specific TTC options should NOT be available
Then('India-specific TTC options should NOT be available', function () {
  const forms = prerequisitesContext.available_forms || [];
  const indiaOptions = forms.filter(
    (f) => f.includes('in') || f.includes('_in') || f.includes('india')
  );
  if (indiaOptions.length > 0) {
    throw new Error(
      `Should not have India-specific TTC options, got: ${JSON.stringify(indiaOptions)}`
    );
  }
});

// Step: I update my home country to {string}
When('I update my home country to {string}', function (country: string) {
  initPrerequisitesContext();
  prerequisitesContext.home_country = country;
  updateAvailableForms();
});

// Step: India-specific TTC options should become available
Then('India-specific TTC options should become available', function () {
  if (prerequisitesContext.home_country !== 'IN') {
    throw new Error('Home country should be IN');
  }
  // Verify that India-specific form is in the available forms list
  const forms = prerequisitesContext.available_forms || [];
  if (!forms.includes('ttc_application_in')) {
    throw new Error(
      `India-specific TTC options should be available, got: ${JSON.stringify(forms)}`
    );
  }
});

// Export context and functions for use by other step files (e.g., eligibility_dashboard_steps)
export { prerequisitesContext, initPrerequisitesContext, updateAvailableForms };
