// Generated from: ../../specs/features/browser/security/xss.feature
import { test } from "playwright-bdd";

test.describe('XSS Prevention - Browser Behavior', () => {

  test('Portal home escapes user email in HTML', { tag: ['@browser', '@p1'] }, async ({ Given, Then, And, page }) => { 
    await Given('I navigate to "/api/portal/home"', null, { page }); 
    await Then('I should see "test.applicant@example.com" on the page', null, { page }); 
    await And('the page should not contain unescaped script tags', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('../../specs/features/browser/security/xss.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":8,"tags":["@browser","@p1"],"steps":[{"pwStepLine":7,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/api/portal/home\"","stepMatchArguments":[{"group":{"start":14,"value":"\"/api/portal/home\"","children":[{"start":15,"value":"/api/portal/home","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":10,"keywordType":"Outcome","textWithKeyword":"Then I should see \"test.applicant@example.com\" on the page","stepMatchArguments":[{"group":{"start":13,"value":"\"test.applicant@example.com\"","children":[{"start":14,"value":"test.applicant@example.com","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":9,"gherkinStepLine":11,"keywordType":"Outcome","textWithKeyword":"And the page should not contain unescaped script tags","stepMatchArguments":[]}]},
]; // bdd-data-end