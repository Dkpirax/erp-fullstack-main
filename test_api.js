const fs = require('fs');

async function testApi() {
    try {
        const formData = new FormData();
        formData.append('username', 'admin');
        formData.append('password', 'admin');

        const loginRes = await fetch('http://127.0.0.1:3000/api/v1/login/access-token', {
            method: 'POST',
            body: formData
        });

        const loginData = await loginRes.json();

        if (!loginRes.ok) {
            fs.writeFileSync('test_output.txt', 'Login failed: ' + JSON.stringify(loginData) + '\n');
            return;
        }

        fs.writeFileSync('test_output.txt', 'Token: ' + loginData.access_token + '\n');

        const usersRes = await fetch('http://127.0.0.1:3000/api/v1/users', {
            headers: { 'Authorization': `Bearer ${loginData.access_token}` }
        });

        const usersData = await usersRes.json();

        if (!usersRes.ok) {
            fs.appendFileSync('test_output.txt', 'Users fetch failed: ' + usersRes.status + ' ' + JSON.stringify(usersData) + '\n');
            return;
        }

        fs.appendFileSync('test_output.txt', 'Users fetch successful!\n');
    } catch (e) {
        fs.writeFileSync('test_output.txt', 'Error: ' + e.message + '\n');
    }
}

testApi();
