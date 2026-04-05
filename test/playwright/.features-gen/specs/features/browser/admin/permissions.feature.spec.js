// Generated from: ../../specs/features/browser/admin/permissions.feature
import { test } from "playwright-bdd";

test.describe('Admin Permissions - Browser Behavior', () => {

  test.beforeEach('Background', async ({ Given, page }, testInfo) => { if (testInfo.error) return;
    await Given('I navigate to "/api/admin/permissions"', null, { page }); 
  });
  
  test('Unauthorized message displays', { tag: ['@browser', '@pending', '@p1'] }, async ({ Then, page }) => { 
    await Then('I should see "UN-AUTHORIZED" on the page', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('../../specs/features/browser/admin/permissions.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":13,"tags":["@browser","@pending","@p1"],"steps":[{"pwStepLine":7,"gherkinStepLine":10,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/api/admin/permissions\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/api/admin/permissions\"","children":[{"start":15,"value":"/api/admin/permissions","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":11,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then I should see \"UN-AUTHORIZED\" on the page","stepMatchArguments":[{"group":{"start":13,"value":"\"UN-AUTHORIZED\"","children":[{"start":14,"value":"UN-AUTHORIZED","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end