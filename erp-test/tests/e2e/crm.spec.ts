
import { test, expect } from '@playwright/test';
import config from '../../test-config.json';

test.describe('CRM Customer Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.getByPlaceholder('Username').fill(config.admin.username);
        await page.getByPlaceholder('Password').fill(config.admin.password);
        await page.getByRole('button', { name: /Login/i }).click();
        await page.waitForURL('/');
    });

    test('Create and Search Customer', async ({ page }) => {
        const timestamp = Date.now();
        const customerName = `Playwright Customer ${timestamp}`;
        const customerEmail = `customer${timestamp}@example.com`;

        // Navigate to CRM
        await page.goto('/crm/customers');
        await expect(page.getByRole('heading', { name: /Customer Management/i })).toBeVisible();

        // Open Add Modal
        await page.getByRole('button', { name: /Add Customer/i }).click();
        await expect(page.getByRole('dialog')).toBeVisible();

        // Fill Form
        await page.getByLabel('Name').fill(customerName);
        await page.getByLabel('Company').fill(`Company ${timestamp}`);
        await page.getByLabel('Email').fill(customerEmail);
        await page.getByLabel('Phone').fill('1234567890');
        await page.getByLabel('Address').fill('123 Test St');

        // Save
        await page.getByRole('button', { name: /Add Customer/i }).last().click();
        // Wait for modal to close
        await expect(page.getByRole('dialog')).toBeHidden();

        // Verify in list
        await page.getByPlaceholder(/Search customers/i).fill(customerName);
        await expect(page.getByText(customerName)).toBeVisible();
        await expect(page.getByText(customerEmail)).toBeVisible();
    });
});
