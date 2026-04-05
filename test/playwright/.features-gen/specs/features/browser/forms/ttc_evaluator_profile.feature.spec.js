// Generated from: ../../specs/features/browser/forms/ttc_evaluator_profile.feature
import { test } from "playwright-bdd";

test.describe('TTC Evaluator Profile - Browser Behavior', () => {

  test.beforeEach('Background', async ({ Given, page }, testInfo) => { if (testInfo.error) return;
    await Given('I navigate to "/api/forms/ttc_evaluator_profile"', null, { page }); 
  });
  
  test('Form renders with correct structure', { tag: ['@browser', '@pending', '@p1'] }, async ({ Then, And, page }) => { 
    await Then('I should see the heading "TTC Evaluator Profile"', null, { page }); 
    await And('the form should contain a submit button', null, { page }); 
    await And('the form should have input fields for personal details', null, { page }); 
  });

  test('Form accepts valid input', { tag: ['@browser', '@pending', '@p1'] }, async ({ When, Then, And, page }) => { 
    await When('I fill in "i_fname" with "John"', null, { page }); 
    await And('I fill in "i_lname" with "Doe"', null, { page }); 
    await Then('the fields should retain their values', null, { page }); 
  });

  test('Form field count matches legacy', { tag: ['@browser', '@pending', '@p2', '@parity'] }, async ({ Then, And, page }) => { 
    await Then('the input field count should be within 20% of the legacy form', null, { page }); 
    await And('the select field count should be within 20% of the legacy form', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('../../specs/features/browser/forms/ttc_evaluator_profile.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":14,"tags":["@browser","@pending","@p1"],"steps":[{"pwStepLine":7,"gherkinStepLine":11,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/api/forms/ttc_evaluator_profile\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/api/forms/ttc_evaluator_profile\"","children":[{"start":15,"value":"/api/forms/ttc_evaluator_profile","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":11,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then I should see the heading \"TTC Evaluator Profile\"","stepMatchArguments":[{"group":{"start":25,"value":"\"TTC Evaluator Profile\"","children":[{"start":26,"value":"TTC Evaluator Profile","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":12,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"And the form should contain a submit button","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"And the form should have input fields for personal details","stepMatchArguments":[]}]},
  {"pwTestLine":16,"pickleLine":20,"tags":["@browser","@pending","@p1"],"steps":[{"pwStepLine":7,"gherkinStepLine":11,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/api/forms/ttc_evaluator_profile\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/api/forms/ttc_evaluator_profile\"","children":[{"start":15,"value":"/api/forms/ttc_evaluator_profile","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":17,"gherkinStepLine":21,"keywordType":"Action","textWithKeyword":"When I fill in \"i_fname\" with \"John\"","stepMatchArguments":[{"group":{"start":10,"value":"\"i_fname\"","children":[{"start":11,"value":"i_fname","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":25,"value":"\"John\"","children":[{"start":26,"value":"John","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":18,"gherkinStepLine":22,"keywordType":"Action","textWithKeyword":"And I fill in \"i_lname\" with \"Doe\"","stepMatchArguments":[{"group":{"start":10,"value":"\"i_lname\"","children":[{"start":11,"value":"i_lname","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":25,"value":"\"Doe\"","children":[{"start":26,"value":"Doe","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":19,"gherkinStepLine":23,"keywordType":"Outcome","textWithKeyword":"Then the fields should retain their values","stepMatchArguments":[]}]},
  {"pwTestLine":22,"pickleLine":26,"tags":["@browser","@pending","@p2","@parity"],"steps":[{"pwStepLine":7,"gherkinStepLine":11,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/api/forms/ttc_evaluator_profile\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/api/forms/ttc_evaluator_profile\"","children":[{"start":15,"value":"/api/forms/ttc_evaluator_profile","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":23,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"Then the input field count should be within 20% of the legacy form","stepMatchArguments":[{"group":{"start":39,"value":"20","children":[]},"parameterTypeName":"int"}]},{"pwStepLine":24,"gherkinStepLine":28,"keywordType":"Outcome","textWithKeyword":"And the select field count should be within 20% of the legacy form","stepMatchArguments":[{"group":{"start":40,"value":"20","children":[]},"parameterTypeName":"int"}]}]},
]; // bdd-data-end