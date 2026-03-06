
import { test, expect } from '@playwright/test';
import config from '../../test-config.json';

test.describe('Web Inventory Management', () => {
    test.beforeEach(async ({ page }) => {
        // Authenticate
        await page.goto('/login');
        await page.getByPlaceholder('Username').fill(config.admin.username);
        await page.getByPlaceholder('Password').fill(config.admin.password);
        await page.getByRole('button', { name: /Login/i }).click();
        await page.waitForURL('/');
    });

    test('Create and Read Product', async ({ page }) => {
        const productName = `Playwright Product ${Date.now()}`;

        await page.goto('/supply-chain/inventory');
        await expect(page.getByRole('heading', { name: /Inventory/i })).toBeVisible();

        // Create
        await page.getByRole('button', { name: /Add Product/i }).click();
        await page.getByLabel('Product Name *').fill(productName);
        await page.getByLabel('SKU *').fill(`SKU-${Date.now()}`); // Assuming SKU required
        await page.getByLabel('Selling Price ($)').fill('100.50');
        await page.getByLabel('Cost Price ($)').fill('80.00');
        await page.getByLabel('Stock Quantity').fill('50');

        await page.getByRole('dialog').getByRole('button', { name: /Add Product/i }).click();

        // Verify (assuming list refreshes)
        await expect(page.getByText(productName)).toBeVisible();
    });
});
