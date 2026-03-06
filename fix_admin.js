const sequelize = require('./config/database');
const User = require('./models/User');

async function fixAdminRole() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Update the admin user
        const result = await User.update(
            { role: 'admin', is_superuser: true },
            { where: { username: 'admin' } }
        );

        if (result[0] > 0) {
            console.log('Admin user updated with role "admin"!');
        } else {
            console.log('No user with username "admin" found. Trying to create...');
            const hashedPassword = await User.hashPassword('admin');
            await User.create({
                username: 'admin',
                email: 'admin@example.com',
                hashed_password: hashedPassword,
                full_name: 'System Administrator',
                is_active: true,
                is_superuser: true,
                role: 'admin',
                branch_id: null
            });
            console.log('Admin user created with role "admin"!');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error fixing admin:', error);
        process.exit(1);
    }
}

fixAdminRole();
