const sequelize = require('../config/database');
const Product = require('../models/Product');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Supplier = require('../models/Supplier');

console.log("Syncing database schema...");

sequelize.sync({ alter: true })
    .then(() => {
        console.log("✅ Database synced successfully (alter: true).");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Error syncing database:", err);
        process.exit(1);
    });
