// Generated from: ../../specs/features/browser/portal/home.feature
import { test } from "playwright-bdd";

test.describe('Portal Home Page - Browser Behavior', () => {

  test.beforeEach('Background', async ({ Given, page }, testInfo) => { if (testInfo.error) return;
    await Given('I navigate to "/api/portal/home"', null, { page }); 
  });
  
  test('Profile section displays user identity', { tag: ['@browser', '@p1'] }, async ({ Then, And, page }) => { 
    await Then('I should see "Logged in as" on the page', null, { page }); 
    await And('I should see "test.applicant@example.com" on the page', null, { page }); 
    await And('I should see element "#logged_in_as"', null, { page }); 
    await And('I should see element "#logout" with text "LOGOUT"', null, { page }); 
  });

  test('Profile section displays home country', { tag: ['@browser', '@p1'] }, async ({ Then, And, page }) => { 
    await Then('I should see element "#user_home_country" with text "United States"', null, { page }); 
    await And('I should see element "#user_home_country_iso" with text "US"', null, { page }); 
  });

  test('Report links are visible', { tag: ['@browser', '@p1'] }, async ({ Then, And, page }) => { 
    await Then('I should see a list with 2 links', null, { page }); 
    await And('I should see link "TTC Reports"', null, { page }); 
    await And('I should see link "Applicants Summary"', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('../../specs/features/browser/portal/home.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":11,"tags":["@browser","@p1"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/api/portal/home\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/api/portal/home\"","children":[{"start":15,"value":"/api/portal/home","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":11,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"Then I should see \"Logged in as\" on the page","stepMatchArguments":[{"group":{"start":13,"value":"\"Logged in as\"","children":[{"start":14,"value":"Logged in as","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":12,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"And I should see \"test.applicant@example.com\" on the page","stepMatchArguments":[{"group":{"start":13,"value":"\"test.applicant@example.com\"","children":[{"start":14,"value":"test.applicant@example.com","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":13,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"And I should see element \"#logged_in_as\"","stepMatchArguments":[{"group":{"start":21,"value":"\"#logged_in_as\"","children":[{"start":22,"value":"#logged_in_as","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":14,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"And I should see element \"#logout\" with text \"LOGOUT\"","stepMatchArguments":[{"group":{"start":21,"value":"\"#logout\"","children":[{"start":22,"value":"#logout","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":41,"value":"\"LOGOUT\"","children":[{"start":42,"value":"LOGOUT","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":17,"pickleLine":18,"tags":["@browser","@p1"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/api/portal/home\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/api/portal/home\"","children":[{"start":15,"value":"/api/portal/home","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":18,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then I should see element \"#user_home_country\" with text \"United States\"","stepMatchArguments":[{"group":{"start":21,"value":"\"#user_home_country\"","children":[{"start":22,"value":"#user_home_country","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":52,"value":"\"United States\"","children":[{"start":53,"value":"United States","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":19,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"And I should see element \"#user_home_country_iso\" with text \"US\"","stepMatchArguments":[{"group":{"start":21,"value":"\"#user_home_country_iso\"","children":[{"start":22,"value":"#user_home_country_iso","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":56,"value":"\"US\"","children":[{"start":57,"value":"US","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":22,"pickleLine":23,"tags":["@browser","@p1"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/api/portal/home\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/api/portal/home\"","children":[{"start":15,"value":"/api/portal/home","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":23,"gherkinStepLine":24,"keywordType":"Outcome","textWithKeyword":"Then I should see a list with 2 links","stepMatchArguments":[{"group":{"start":25,"value":"2","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":24,"gherkinStepLine":25,"keywordType":"Outcome","textWithKeyword":"And I should see link \"TTC Reports\"","stepMatchArguments":[{"group":{"start":18,"value":"\"TTC Reports\"","children":[{"start":19,"value":"TTC Reports","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":25,"gherkinStepLine":26,"keywordType":"Outcome","textWithKeyword":"And I should see link \"Applicants Summary\"","stepMatchArguments":[{"group":{"start":18,"value":"\"Applicants Summary\"","children":[{"start":19,"value":"Applicants Summary","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end