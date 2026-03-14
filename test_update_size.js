const axios = require('axios');

async function testUpdate() {
    try {
        const loginRes = await axios.post('http://localhost:3000/api/v1/login/access-token', 
            'username=admin&password=admin',
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        const token = loginRes.data.access_token;

        const res = await axios.get('http://localhost:3000/api/v1/products', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const products = res.data.products || res.data;
        if (products.length > 0) {
            const p = products[0];
            console.log('Updating product:', p.id, p.name);
            const updateRes = await axios.put(`http://localhost:3000/api/v1/products/${p.id}`, {
                size_numeric: "45"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Update result:', updateRes.data.size_numeric);
        }
    } catch (e) {
        console.error('Update failed:', e.message);
    }
}
testUpdate();
