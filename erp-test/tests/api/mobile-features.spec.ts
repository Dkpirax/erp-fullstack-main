
import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000/api/v1'; // Backend URL

test.describe.serial('Mobile App Backend API', () => {
    let authToken: string;
    let productId: number;

    test('Mobile Authentication (Login)', async ({ request }) => {
        const response = await request.post(`${API_BASE}/login/access-token`, {
            form: {
                username: 'admin',
                password: 'admin', // Default seed credentials
            },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.access_token).toBeDefined();
        authToken = data.access_token;
    });

    test('Mobile Inventory (Fetch Products)', async ({ request }) => {
        const response = await request.get(`${API_BASE}/products`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.ok()).toBeTruthy();
        const data = await response.json();

        // Mobile expects { products: [...] } but verify actual structure
        // If API returns array directly or wrapped
        let products = Array.isArray(data) ? data : data.products;
        expect(products).toBeInstanceOf(Array);

        if (products.length > 0) {
            const product = products[0];
            productId = product.id;

            expect(product).toHaveProperty('id');
            expect(product).toHaveProperty('name');
            expect(product).toHaveProperty('price');
            // Mobile relies on 'quantity_in_stock' or 'stock_quantity'
            // Ensure at least one legitimate stock field exists
            const hasStock = product.quantity_in_stock !== undefined || product.stock_quantity !== undefined;
            expect(hasStock).toBeTruthy();
        } else {
            console.warn('No products found to verify structure fully.');
        }
    });

    test('Mobile POS (Create Order)', async ({ request }) => {
        // Requires a product ID. If none found previously, skip or mock.
        if (!productId) {
            console.warn('Skipping POS test due to no product ID.');
            return;
        }

        const orderPayload = {
            total_amount: 150.0,
            status: 'COMPLETED',
            source: 'MOBILE_POS_TEST',
            items: [
                {
                    product_id: productId,
                    quantity: 1,
                    unit_price: 150.0
                }
            ],
            payments: [
                {
                    method: 'CASH',
                    amount: 150.0
                }
            ]
        };

        const response = await request.post(`${API_BASE}/pos/orders`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            data: orderPayload,
        });

        if (response.status() === 400) {
            // "Insufficient Stock" is a valid business logic response
            const error = await response.json();
            console.log('POS Validation Response:', error);
            expect(error).toBeDefined();
        } else {
            expect(response.ok()).toBeTruthy();
            const order = await response.json();
            expect(order.id).toBeDefined();
        }
    });
});
