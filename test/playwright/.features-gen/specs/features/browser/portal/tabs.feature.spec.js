// Generated from: ../../specs/features/browser/portal/tabs.feature
import { test } from "playwright-bdd";

test.describe('Portal Tab Page - Browser Behavior', () => {

  test.beforeEach('Background', async ({ Given, page }, testInfo) => { if (testInfo.error) return;
    await Given('I navigate to "/api/portal/tabs"', null, { page }); 
  });
  
  test('Tab displays TTC Desk info', { tag: ['@browser'] }, async ({ Then, page }) => { 
    await Then('I should see "United States TTC Desk" on the page', null, { page }); 
  });

  test('Tab displays contact email', { tag: ['@browser'] }, async ({ Then, page }) => { 
    await Then('I should see link "ttc@artofliving.org"', null, { page }); 
  });

  test('Contact section has correct structure', { tag: ['@browser'] }, async ({ Then, page }) => { 
    await Then('I should see element ".tab-contact"', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('../../specs/features/browser/portal/tabs.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":10,"tags":["@browser"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/api/portal/tabs\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/api/portal/tabs\"","children":[{"start":15,"value":"/api/portal/tabs","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":11,"gherkinStepLine":11,"keywordType":"Outcome","textWithKeyword":"Then I should see \"United States TTC Desk\" on the page","stepMatchArguments":[{"group":{"start":13,"value":"\"United States TTC Desk\"","children":[{"start":14,"value":"United States TTC Desk","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":14,"pickleLine":13,"tags":["@browser"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/api/portal/tabs\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/api/portal/tabs\"","children":[{"start":15,"value":"/api/portal/tabs","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":15,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then I should see link \"ttc@artofliving.org\"","stepMatchArguments":[{"group":{"start":18,"value":"\"ttc@artofliving.org\"","children":[{"start":19,"value":"ttc@artofliving.org","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":18,"pickleLine":16,"tags":["@browser"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/api/portal/tabs\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/api/portal/tabs\"","children":[{"start":15,"value":"/api/portal/tabs","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":19,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"Then I should see element \".tab-contact\"","stepMatchArguments":[{"group":{"start":21,"value":"\".tab-contact\"","children":[{"start":22,"value":".tab-contact","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end