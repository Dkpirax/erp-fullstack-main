
import { test, expect } from '@playwright/test';

test.describe('Web Inventory Management', () => {
    test.beforeEach(async ({ page }) => {
        // Authenticate
        await page.goto('/login');
        await page.getByPlaceholder('Username').fill('admin');
        await page.getByPlaceholder('Password').fill('admin');
        await page.getByRole('button', { name: /Log in/i }).click();
        await page.waitForURL('/');
    });

    test('Create and Read Product', async ({ page }) => {
        const productName = `Playwright Product ${Date.now()}`;

        await page.goto('/products');
        await expect(page.getByRole('heading', { name: /Products/i })).toBeVisible();

        // Create
        await page.getByRole('button', { name: /Add Product/i }).click();
        await page.getByLabel('Name').fill(productName);
        await page.getByLabel('SKU').fill(`SKU-${Date.now()}`); // Assuming SKU required
        await page.getByLabel('Price').fill('100.50');
        // Add more fields if required like Cost Price, Quantity
        await page.getByLabel('Cost Price').fill('80.00');
        await page.getByLabel('Quantity').fill('50');

        await page.getByRole('button', { name: /Save/i }).first().click();

        // Verify (assuming list refreshes)
        await expect(page.getByText(productName)).toBeVisible();
    });
});
