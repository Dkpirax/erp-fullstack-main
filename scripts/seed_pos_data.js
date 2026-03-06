const sequelize = require('../config/database');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
require('dotenv').config();

async function seedPOSData() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connection established.');

        // 1. Ensure a Supplier exists (for Product)
        let supplier = await Supplier.findByPk(1);
        if (!supplier) {
            console.log('Creating default supplier...');
            supplier = await Supplier.create({
                id: 1,
                name: 'Default Supplier',
                contact_person: 'John Doe',
                email: 'supplier@example.com',
                phone: '1234567890'
            });
            console.log('✅ Default Supplier created.');
        }

        // 2. Ensure Customer 1 exists
        let customer = await Customer.findByPk(1);
        if (!customer) {
            console.log('Creating default customer (ID: 1)...');
            customer = await Customer.create({
                id: 1,
                name: 'Walk-in Customer',
                email: 'walkin@example.com',
                phone: '0000000000'
            });
            console.log('✅ Customer 1 created.');
        } else {
            console.log('ℹ️ Customer 1 already exists.');
        }

        // 3. Ensure Product 4 exists
        let product = await Product.findByPk(4);
        if (!product) {
            console.log('Creating test product (ID: 4)...');
            product = await Product.create({
                id: 4,
                sku: 'NB-A5-100-2',
                name: 'A5 Size Note Book 100-2',
                description: 'Test Product for POS',
                price: 975.00,
                cost_price: 500.00,
                stock_quantity: 100,
                stock_status: 'instock',
                supplier_id: supplier.id
            });
            console.log('✅ Product 4 created.');
        } else {
            console.log('ℹ️ Product 4 already exists.');
        }

        console.log('\n🎉 Seed data check complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
}

seedPOSData();
