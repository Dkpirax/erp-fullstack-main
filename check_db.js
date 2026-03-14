const sequelize = require('./config/database');
const Product = require('./models/Product');

async function checkSchema() {
    try {
        const [results] = await sequelize.query("DESCRIBE inventory_products");
        console.log('Table schema:', results.map(r => r.Field));
    } catch (e) {
        console.error('Error checking schema:', e.message);
    } finally {
        process.exit();
    }
}

checkSchema();
