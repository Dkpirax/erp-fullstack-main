
import { test, expect } from '@playwright/test';
import config from '../../test-config.json';

test.describe('Web Authentication', () => {

    test('Login with valid credentials', async ({ page }) => {
        await page.goto('/login');
        await expect(page).toHaveTitle(/frontend/);

        await page.getByPlaceholder('Username').fill(config.admin.username);
        await page.getByPlaceholder('Password').fill(config.admin.password);
        await page.getByRole('button', { name: /Login/i }).click();

        await expect(page).toHaveURL('/');
        await expect(page.getByText('Dashboard Overview')).toBeVisible();
    });

    test('Login with invalid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.getByPlaceholder('Username').fill('wronguser');
        await page.getByPlaceholder('Password').fill('wrongpass');
        await page.getByRole('button', { name: /Login/i }).click();

        await expect(page.getByText(/Incorrect username or password/i)).toBeVisible();
    });

});
