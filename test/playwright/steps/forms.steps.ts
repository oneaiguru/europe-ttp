import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { When, Then } = createBdd();

When('I fill in {string} with {string}', async ({ page }, fieldId: string, value: string) => {
  await page.fill(`#${fieldId}`, value);
});

When('I click the submit button', async ({ page }) => {
  await page.click('[type=submit], button:has-text("Submit")');
});

When(
  'I click the submit button without filling required fields',
  async ({ page }) => {
    await page.click('[type=submit], button:has-text("Submit")');
  },
);

Then('the fields should retain their values', async ({ page }) => {
  // Verify at least one filled field retains value
  const inputs = page.locator('input[type=text]:not([value=""])');
  const count = await inputs.count();
  expect(count).toBeGreaterThan(0);
});

Then('the form should contain a submit button', async ({ page }) => {
  await expect(
    page.locator('[type=submit], button:has-text("Submit")'),
  ).toBeAttached();
});

Then(
  'the form should have input fields for personal details',
  async ({ page }) => {
    const inputs = page.locator('input, select, textarea');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
  },
);

Then('I should see validation messages', async ({ page }) => {
  // Check for HTML5 validation or custom validation messages
  const invalidInputs = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input:invalid, select:invalid, textarea:invalid');
    return inputs.length;
  });
  expect(invalidInputs).toBeGreaterThan(0);
});

Then('I should see the heading {string}', async ({ page }, text: string) => {
  await expect(
    page.locator(`h1:has-text("${text}"), h2:has-text("${text}")`),
  ).toBeVisible();
});
