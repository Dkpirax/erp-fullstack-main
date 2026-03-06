
import { test, expect } from '@playwright/test';
import config from '../../test-config.json';

test.describe('Dashboard Smoke Test', () => {
    test('Dashboard loads correctly', async ({ page }) => {
        await page.goto('/login');
        await page.getByPlaceholder('Username').fill(config.admin.username);
        await page.getByPlaceholder('Password').fill(config.admin.password);
        await page.getByRole('button', { name: /Login/i }).click();

        await expect(page).toHaveURL('/');
        await expect(page.getByText('Dashboard Overview')).toBeVisible();
        await expect(page.getByText('Total Revenue')).toBeVisible();
        await expect(page.getByText('Active Orders')).toBeVisible();
    });
});
