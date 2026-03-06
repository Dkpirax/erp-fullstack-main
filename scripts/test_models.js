const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

console.log("Checking Order associations...");
if (Order.associations.OrderItems) {
    console.log("✅ Order.hasMany(OrderItem) is defined.");
} else {
    console.error("❌ Order.hasMany(OrderItem) is MISSING!");
    // Attempt to manually define it to see if it fixes it
    // Order.hasMany(OrderItem, { foreignKey: 'order_id' });
}

console.log("Checking OrderItem associations...");
if (OrderItem.associations.Order) {
    console.log("✅ OrderItem.belongsTo(Order) is defined.");
} else {
    console.error("❌ OrderItem.belongsTo(Order) is MISSING!");
}

async function testFetch() {
    try {
        console.log("Testing Order.findAll...");
        // Use a limit to be fast
        const orders = await Order.findAll({
            include: [OrderItem],
            order: [['created_at', 'DESC']],
            limit: 1
        });
        console.log(`✅ Success! Fetched ${orders.length} orders.`);
    } catch (error) {
        console.error("❌ fetch failed:", error.message);
    }
}

testFetch();
