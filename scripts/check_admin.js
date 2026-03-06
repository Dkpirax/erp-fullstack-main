const User = require('../models/User');
const sequelize = require('../config/database');

async function checkAdmin() {
    try {
        await sequelize.authenticate();
        const admin = await User.findOne({ where: { username: 'admin' } });
        if (admin) {
            console.log('Admin user found:', admin.email);
            console.log('Created at:', admin.createdAt); // Check timestamp
        } else {
            console.log('Admin user NOT found.');
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkAdmin();
