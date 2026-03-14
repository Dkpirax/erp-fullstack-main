const fs = require('fs');

async function testOrders() {
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

        const ordersRes = await fetch('http://127.0.0.1:3000/api/v1/pos/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const ordersData = await ordersRes.json();

        if (!ordersRes.ok) {
            console.log('Orders fetch failed:', ordersRes.status, ordersData);
            return;
        }

        console.log('Orders fetch successful! Count:', Array.isArray(ordersData) ? ordersData.length : 0);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testOrders();
