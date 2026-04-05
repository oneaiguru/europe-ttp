// Generated from: ../../specs/features/browser/admin/settings.feature
import { test } from "playwright-bdd";

test.describe('Admin Settings Page - Browser Behavior', () => {

  test.beforeEach('Background', async ({ Given, page }, testInfo) => { if (testInfo.error) return;
    await Given('I navigate to "/api/admin/settings"', null, { page }); 
  });
  
  test('Settings page renders', { tag: ['@browser', '@pending', '@p1'] }, async ({ Then, And, page }) => { 
    await Then('I should see the heading "Admin Settings"', null, { page }); 
    await And('I should see element "#settings_page"', null, { page }); 
  });

  test('Parity with legacy', { tag: ['@browser', '@pending', '@p2', '@parity'] }, async ({ Then, And, context, page }) => { 
    await Then('the form element count should match the legacy at "/api/legacy/admin_settings"', null, { context, page }); 
    await And('the page should have a whitelisted user management section', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('../../specs/features/browser/admin/settings.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":13,"tags":["@browser","@pending","@p1"],"steps":[{"pwStepLine":7,"gherkinStepLine":10,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/api/admin/settings\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/api/admin/settings\"","children":[{"start":15,"value":"/api/admin/settings","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":11,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then I should see the heading \"Admin Settings\"","stepMatchArguments":[{"group":{"start":25,"value":"\"Admin Settings\"","children":[{"start":26,"value":"Admin Settings","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":12,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"And I should see element \"#settings_page\"","stepMatchArguments":[{"group":{"start":21,"value":"\"#settings_page\"","children":[{"start":22,"value":"#settings_page","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":15,"pickleLine":18,"tags":["@browser","@pending","@p2","@parity"],"steps":[{"pwStepLine":7,"gherkinStepLine":10,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/api/admin/settings\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/api/admin/settings\"","children":[{"start":15,"value":"/api/admin/settings","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":16,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then the form element count should match the legacy at \"/api/legacy/admin_settings\"","stepMatchArguments":[{"group":{"start":50,"value":"\"/api/legacy/admin_settings\"","children":[{"start":51,"value":"/api/legacy/admin_settings","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":17,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"And the page should have a whitelisted user management section","stepMatchArguments":[]}]},
]; // bdd-data-end