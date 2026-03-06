const db = require('../models');

// Define the sync function
async function syncDatabase() {
    try {
        console.log('🔄 Connecting to database...');
        await db.sequelize.authenticate();
        console.log('✅ Database connection established.');

        console.log('🔄 Syncing models...');

        // Sync all defined models to the database
        // { alter: true } checks the current state of the table and performs the necessary changes to make it match the model.
        await db.sequelize.sync({ alter: true });

        console.log('✅ All tables have been successfully created/updated.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error syncing database:', error);
        process.exit(1);
    }
}

// Execute the sync
syncDatabase();
