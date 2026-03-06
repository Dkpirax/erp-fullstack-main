const mysql = require('mysql2/promise');

async function createDb() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: ''
        });
        await connection.query('CREATE DATABASE IF NOT EXISTS erp_db;');
        console.log('✅ Database erp_db created or already exists.');
        await connection.end();
    } catch (error) {
        console.error('❌ Error creating database:', error.message);
    }
}

createDb();
