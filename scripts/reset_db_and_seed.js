const db = require('../models');
const User = require('../models/User');

async function resetAndSeed() {
    try {
        console.log('🔄 Connecting to database...');
        await db.sequelize.authenticate();
        console.log('✅ Connected.');

        console.log('⚠️  WARNING: Resetting database. All data will be lost!');
        console.log('🔄 Dropping and recreating tables...');

        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { raw: true });
        await db.sequelize.sync({ force: true });
        await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { raw: true });

        console.log('✅ Tables recreated.');

        console.log('🔄 Creating default Admin user...');
        const hashedPassword = await User.hashPassword('admin');

        const admin = await User.create({
            username: 'admin',
            email: 'admin@example.com',
            hashed_password: hashedPassword,
            full_name: 'System Administrator',
            is_active: true,
            is_superuser: true,
            role: 'admin'
        });

        console.log('✅ Admin user created successfully!');
        console.log('------------------------------------------------');
        console.log('Login Credentials:');
        console.log('  Username: admin');
        console.log('  Password: admin');
        console.log('------------------------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting database:', error);
        process.exit(1);
    }
}

resetAndSeed();
