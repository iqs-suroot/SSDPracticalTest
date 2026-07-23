const { test, expect } = require('@playwright/test');

test('user can submit a valid search term and see the result page', async ({ page }) => {
  await page.goto('/');
  await page.fill('#searchTerm', 'playwright ui test');
  await page.click('button[type="submit"]');

  await expect(page.locator('h1')).toHaveText('Search Result');
  await expect(page.locator('strong')).toHaveText('playwright ui test');
  await expect(page.getByRole('button', { name: 'Back to Home' })).toBeVisible();
});

test('SQL injection payload is blocked client-side and the field is cleared', async ({ page }) => {
  await page.goto('/');
  await page.fill('#searchTerm', "' OR 1=1 --");
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#searchTerm')).toHaveValue('');
  await expect(page.locator('#clientError')).toContainText('Invalid input detected');
});

test('server still rejects an attack payload if client-side validation is bypassed', async ({ page }) => {
  await page.goto('/');
  await page.fill('#searchTerm', "' OR 1=1 --");
  // Submit the form directly, bypassing the client-side JS validation,
  // to prove the server-side check in server.js is the real gate.
  await page.evaluate(() => document.getElementById('searchForm').submit());

  await expect(page).toHaveURL(/error=/);
});

test('back to home button returns to the search form', async ({ page }) => {
  await page.goto('/');
  await page.fill('#searchTerm', 'go home test');
  await page.click('button[type="submit"]');
  await page.getByRole('button', { name: 'Back to Home' }).click();

  await expect(page.locator('#searchTerm')).toBeVisible();
});
