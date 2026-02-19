
import { test, expect } from '@playwright/test';

test.describe('Web Authentication', () => {
    test('Login with valid credentials', async ({ page }) => {
        await page.goto('/login');
        await expect(page).toHaveTitle(/ERP/);

        await page.getByPlaceholder('Username').fill('admin');
        await page.getByPlaceholder('Password').fill('admin');
        await page.getByRole('button', { name: /Log in/i }).click();

        await expect(page).toHaveURL('/');
        await expect(page.getByText('Dashboard')).toBeVisible();
    });

    test('Login with invalid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.getByPlaceholder('Username').fill('wronguser');
        await page.getByPlaceholder('Password').fill('wrongpass');
        await page.getByRole('button', { name: /Log in/i }).click();

        await expect(page.getByText(/Invalid/i)).toBeVisible();
    });
});
