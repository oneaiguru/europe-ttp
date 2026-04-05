import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Given, Then } = createBdd();

Given('I navigate to {string}', async ({ page }, path: string) => {
  await page.goto(path);
});

Then('I should see {string} on the page', async ({ page }, text: string) => {
  await expect(page.getByText(text, { exact: false })).toBeVisible();
});

Then('I should see element {string}', async ({ page }, selector: string) => {
  await expect(page.locator(selector)).toBeAttached();
});

Then(
  'I should see element {string} with text {string}',
  async ({ page }, selector: string, text: string) => {
    await expect(page.locator(selector)).toHaveText(text);
  },
);

Then('I should see a list with {int} links', async ({ page }, count: number) => {
  await expect(page.locator('ul > li > a')).toHaveCount(count);
});

Then('I should see link {string}', async ({ page }, text: string) => {
  await expect(page.getByRole('link', { name: text })).toBeVisible();
});
