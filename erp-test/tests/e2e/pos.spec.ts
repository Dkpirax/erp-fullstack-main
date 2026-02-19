
import { test, expect } from '@playwright/test';
import config from '../../test-config.json';

test.describe('POS System', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByPlaceholder('Username').fill(config.admin.username);
        await page.getByPlaceholder('Password').fill(config.admin.password);
        await page.getByRole('button', { name: /Login/i }).click();
        await page.waitForURL('/');
    });

    test('Add product to cart and verify total', async ({ page }) => {
        await page.goto('/pos');

        // Wait for products to load
        const productCard = page.locator('.product-card').first();
        await expect(productCard).toBeVisible({ timeout: 10000 });

        // Get product name and price
        const productName = await productCard.locator('h6').textContent();
        // Price might be like "$100.00"
        const priceText = await productCard.locator('.text-primary').textContent();
        const price = parseFloat(priceText?.replace('$', '') || '0');

        // Add to cart
        await productCard.click();

        // Verify cart has item
        const cartSection = page.locator('.col-md-4'); // Cart column
        await expect(cartSection.getByText(productName!)).toBeVisible();

        // Check total calculation
        // Total should be Price + Tax (10%)
        const tax = price * 0.1;
        const total = price + tax;

        // Verify Total in cart footer
        await expect(cartSection.getByText(`$${total.toFixed(2)}`)).toBeVisible();

        // Proceed to Pay
        await page.getByRole('button', { name: /Pay Now/i }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('dialog').getByText('Payment')).toBeVisible();
    });
});
