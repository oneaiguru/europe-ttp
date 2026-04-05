// Generated from: ../../specs/features/browser/security/link_schemes.feature
import { test } from "playwright-bdd";

test.describe('Link Scheme Security - Browser Behavior', () => {

  test('Links do not use javascript scheme', { tag: ['@browser', '@pending', '@p2'] }, async ({ Given, Then, page }) => { 
    await Given('I navigate to "/api/portal/home"', null, { page }); 
    await Then('no link should have a "javascript:" href', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('../../specs/features/browser/security/link_schemes.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":11,"tags":["@browser","@pending","@p2"],"steps":[{"pwStepLine":7,"gherkinStepLine":12,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/api/portal/home\"","stepMatchArguments":[{"group":{"start":14,"value":"\"/api/portal/home\"","children":[{"start":15,"value":"/api/portal/home","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"Then no link should have a \"javascript:\" href","stepMatchArguments":[{"group":{"start":22,"value":"\"javascript:\"","children":[{"start":23,"value":"javascript:","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end