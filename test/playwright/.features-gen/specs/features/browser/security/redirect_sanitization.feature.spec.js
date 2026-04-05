// Generated from: ../../specs/features/browser/security/redirect_sanitization.feature
import { test } from "playwright-bdd";

test.describe('Redirect Sanitization - Browser Behavior', () => {

  test('Safe redirect URL is accepted', { tag: ['@browser', '@p1'] }, async ({ Given, Then, page }) => { 
    await Given('I navigate to "/api/portal/home"', null, { page }); 
    await Then('I should see link "TTC Reports"', null, { page }); 
  });

  test('Report links use sanitized hrefs', { tag: ['@browser', '@p1'] }, async ({ Given, Then, And, page }) => { 
    await Given('I navigate to "/api/portal/home"', null, { page }); 
    await Then('I should see link "TTC Reports"', null, { page }); 
    await And('I should see link "Applicants Summary"', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('../../specs/features/browser/security/redirect_sanitization.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":8,"tags":["@browser","@p1"],"steps":[{"pwStepLine":7,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/api/portal/home\"","stepMatchArguments":[{"group":{"start":14,"value":"\"/api/portal/home\"","children":[{"start":15,"value":"/api/portal/home","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":10,"keywordType":"Outcome","textWithKeyword":"Then I should see link \"TTC Reports\"","stepMatchArguments":[{"group":{"start":18,"value":"\"TTC Reports\"","children":[{"start":19,"value":"TTC Reports","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":11,"pickleLine":13,"tags":["@browser","@p1"],"steps":[{"pwStepLine":12,"gherkinStepLine":14,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/api/portal/home\"","stepMatchArguments":[{"group":{"start":14,"value":"\"/api/portal/home\"","children":[{"start":15,"value":"/api/portal/home","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":13,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then I should see link \"TTC Reports\"","stepMatchArguments":[{"group":{"start":18,"value":"\"TTC Reports\"","children":[{"start":19,"value":"TTC Reports","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":14,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"And I should see link \"Applicants Summary\"","stepMatchArguments":[{"group":{"start":18,"value":"\"Applicants Summary\"","children":[{"start":19,"value":"Applicants Summary","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end