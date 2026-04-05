// Generated from: ../../specs/features/browser/admin/reports_list.feature
import { test } from "playwright-bdd";

test.describe('Admin Reports List - Browser Behavior', () => {

  test.beforeEach('Background', async ({ Given, page }, testInfo) => { if (testInfo.error) return;
    await Given('I navigate to "/api/admin/reports_list"', null, { page }); 
  });
  
  test('Reports list renders', { tag: ['@browser', '@pending', '@p1'] }, async ({ Then, page }) => { 
    await Then('I should see the heading "Admin Reports"', null, { page }); 
  });

  test('Report links visible', { tag: ['@browser', '@pending', '@p1'] }, async ({ Then, page }) => { 
    await Then('I should see link "Available Report"', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('../../specs/features/browser/admin/reports_list.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":13,"tags":["@browser","@pending","@p1"],"steps":[{"pwStepLine":7,"gherkinStepLine":10,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/api/admin/reports_list\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/api/admin/reports_list\"","children":[{"start":15,"value":"/api/admin/reports_list","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":11,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then I should see the heading \"Admin Reports\"","stepMatchArguments":[{"group":{"start":25,"value":"\"Admin Reports\"","children":[{"start":26,"value":"Admin Reports","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":14,"pickleLine":17,"tags":["@browser","@pending","@p1"],"steps":[{"pwStepLine":7,"gherkinStepLine":10,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/api/admin/reports_list\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/api/admin/reports_list\"","children":[{"start":15,"value":"/api/admin/reports_list","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":15,"gherkinStepLine":18,"keywordType":"Outcome","textWithKeyword":"Then I should see link \"Available Report\"","stepMatchArguments":[{"group":{"start":18,"value":"\"Available Report\"","children":[{"start":19,"value":"Available Report","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end