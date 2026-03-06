const sequelize = require('./config/database');
const Customer = require('./models/Customer');
const Product = require('./models/Product');

async function checkData() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected');

        const customer = await Customer.findByPk(1);
        console.log('Customer 1:', customer ? JSON.stringify(customer.toJSON(), null, 2) : 'NOT FOUND');

        const product = await Product.findByPk(4);
        console.log('Product 4:', product ? JSON.stringify(product.toJSON(), null, 2) : 'NOT FOUND');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkData();
