// Generated from: ../../specs/features/browser/portal/disabled.feature
import { test } from "playwright-bdd";

test.describe('Portal Disabled Page - Browser Behavior', () => {

  test.beforeEach('Background', async ({ Given, page }, testInfo) => { if (testInfo.error) return;
    await Given('I navigate to "/api/portal/disabled"', null, { page }); 
  });
  
  test('Disabled notice displays', { tag: ['@browser', '@pending'] }, async ({ Then, page }) => { 
    await Then('I should see "not available" on the page', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('../../specs/features/browser/portal/disabled.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":12,"tags":["@browser","@pending"],"steps":[{"pwStepLine":7,"gherkinStepLine":10,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/api/portal/disabled\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/api/portal/disabled\"","children":[{"start":15,"value":"/api/portal/disabled","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":11,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"Then I should see \"not available\" on the page","stepMatchArguments":[{"group":{"start":13,"value":"\"not available\"","children":[{"start":14,"value":"not available","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end