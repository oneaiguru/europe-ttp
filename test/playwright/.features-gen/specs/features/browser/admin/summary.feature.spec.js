// Generated from: ../../specs/features/browser/admin/summary.feature
import { test } from "playwright-bdd";

test.describe('Admin Applicants Summary - Browser Behavior', () => {

  test.beforeEach('Background', async ({ Given, page }, testInfo) => { if (testInfo.error) return;
    await Given('I navigate to "/api/admin/ttc_applicants_summary"', null, { page }); 
  });
  
  test('Dashboard renders', { tag: ['@browser', '@pending', '@p1'] }, async ({ Then, page }) => { 
    await Then('I should see the heading "TTC Applicants Summary"', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('../../specs/features/browser/admin/summary.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":13,"tags":["@browser","@pending","@p1"],"steps":[{"pwStepLine":7,"gherkinStepLine":10,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/api/admin/ttc_applicants_summary\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/api/admin/ttc_applicants_summary\"","children":[{"start":15,"value":"/api/admin/ttc_applicants_summary","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":11,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then I should see the heading \"TTC Applicants Summary\"","stepMatchArguments":[{"group":{"start":25,"value":"\"TTC Applicants Summary\"","children":[{"start":26,"value":"TTC Applicants Summary","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end