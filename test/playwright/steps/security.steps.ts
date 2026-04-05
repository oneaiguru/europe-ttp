import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Then } = createBdd();

Then('the page should not contain unescaped script tags', async ({ page }) => {
  const scripts = await page.locator('body script').count();
  expect(scripts).toBe(0);
});

Then('no link should have a {string} href', async ({ page }, scheme: string) => {
  const links = await page.locator('a[href]').all();
  for (const link of links) {
    const href = await link.getAttribute('href');
    expect(href?.toLowerCase().startsWith(scheme)).toBe(false);
  }
});
