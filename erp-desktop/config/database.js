const path = require('path');
const { Sequelize } = require('sequelize');
const { app } = require('electron');

// Get the user data directory to store the database so it persists and is writable
// Fallback to current directory if not running inside Electron
const userDataPath = app ? app.getPath('userData') : path.join(__dirname, '..');
const dbPath = path.join(userDataPath, 'database.sqlite');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false, // Set to console.log to see SQL queries
});

// Test connection
sequelize.authenticate()
    .then(() => {
        console.log(`✅ SQLite Database connection established successfully at ${dbPath}`);
    })
    .catch(err => {
        console.error('❌ Unable to connect to the SQLite database:', err);
    });

module.exports = sequelize;
