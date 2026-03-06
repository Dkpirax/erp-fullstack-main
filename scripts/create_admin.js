const sequelize = require('../config/database');
const User = require('../models/User');
require('dotenv').config();

async function createAdmin() {
    try {
        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Database connection established.');

        // Ensure User table exists (create if not exists)
        // Ensure User table exists (update if needed)
        await User.sync({ alter: true });
        console.log('✅ User table synced.');

        // Check if admin already exists
        const existingAdmin = await User.findOne({
            where: { email: 'admin@example.com' }
        });

        const hashedPassword = await User.hashPassword('admin');

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists. Updating password to default...');
            await existingAdmin.update({
                hashed_password: hashedPassword,
                is_active: true,
                is_superuser: true
            });
            console.log('✅ Admin password reset to "admin".');

            console.log('');
            console.log('Login credentials:');
            console.log('  Email/Username: admin@example.com');
            console.log('  Password: admin');

            process.exit(0);
        }

        // Create admin user

        const admin = await User.create({
            username: 'admin',
            email: 'admin@example.com',
            hashed_password: hashedPassword,
            full_name: 'System Administrator',
            is_active: true,
            is_superuser: true
        });

        console.log('✅ Admin user created successfully!');
        console.log('');
        console.log('Login credentials:');
        console.log('  Email/Username: admin@example.com');
        console.log('  Password: admin');
        console.log('');
        console.log('⚠️  Please change the password after first login!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        process.exit(1);
    }
}

createAdmin();
