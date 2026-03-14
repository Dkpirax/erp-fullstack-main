const fs = require('fs');

async function testProducts() {
    try {
        const formData = new FormData();
        formData.append('username', 'admin');
        formData.append('password', 'admin');

        const loginRes = await fetch('http://127.0.0.1:3000/api/v1/login/access-token', {
            method: 'POST',
            body: formData
        });

        const loginData = await loginRes.json();
        const token = loginData.access_token;

        const productsRes = await fetch('http://127.0.0.1:3000/api/v1/products?limit=200', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const productsData = await productsRes.json();

        if (!productsRes.ok) {
            console.log('Products fetch failed:', productsRes.status, productsData);
            return;
        }

        if (productsData.products && productsData.products.length > 0) {
            console.log('First product sample (keys):', Object.keys(productsData.products[0]));
            console.log('First product size fields:', {
                size: productsData.products[0].size,
                size_numeric: productsData.products[0].size_numeric
            });
        }
        console.log('Products fetch successful! Count:', productsData.products ? productsData.products.length : 0);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testProducts();
