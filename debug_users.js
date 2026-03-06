const sequelize = require('./config/database');
const User = require('./models/User');
const fs = require('fs');

async function debugUsers() {
    try {
        await sequelize.authenticate();
        const users = await User.findAll();
        fs.writeFileSync('users_utf8.json', JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
}

debugUsers();
