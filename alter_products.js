const sequelize = require('./config/database');

async function run() {
    try {
        await sequelize.query('ALTER TABLE inventory_products ADD COLUMN category VARCHAR(255) DEFAULT \'Uncategorized\';');
        console.log('Successfully added category column.');
    } catch (e) {
        console.log('Error (might already exist): ', e.message);
    }
    process.exit(0);
}
run();
