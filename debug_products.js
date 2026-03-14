const axios = require('axios');
require('dotenv').config();

async function debug() {
    try {
        // Login
        const loginRes = await axios.post('http://localhost:3000/api/v1/login/access-token', 
            'username=admin&password=admin',
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        const token = loginRes.data.access_token;

        // Get products
        const res = await axios.get('http://localhost:3000/api/v1/products', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const products = res.data.products || res.data;
        if (products && products.length > 0) {
            console.log('FULL PRODUCT DATA:', JSON.stringify(products[0], null, 2));
        }
    } catch (e) {
        console.error('Debug failed:', e.message);
    }
}
debug();
