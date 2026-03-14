const fs = require('fs');

async function testPosSettings() {
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

        const settingsRes = await fetch('http://127.0.0.1:3000/api/v1/pos/settings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const settingsData = await settingsRes.json();

        if (!settingsRes.ok) {
            console.log('Settings fetch failed:', settingsRes.status, settingsData);
            return;
        }

        console.log('Settings fetch successful:', settingsData);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testPosSettings();
