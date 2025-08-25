import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('http://localhost:8080');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/奖金模拟系统/);
});

test('get started link', async ({ page }) => {
  await page.goto('http://localhost:8080');

  // Click the login button.
  await page.click('text=登录');

  // Expects the URL to contain login.
  await expect(page).toHaveURL(/.*login/);
});