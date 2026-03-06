const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Customer = require('./Customer');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_number: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false
    },
    customer_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'crm_customers',
            key: 'id'
        }
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED'),
        defaultValue: 'PENDING'
    },
    source: {
        type: DataTypes.ENUM('POS', 'WOOCOMMERCE', 'MANUAL'),
        defaultValue: 'POS'
    },
    woocommerce_order_id: {
        type: DataTypes.INTEGER,
        unique: true
    },
    payment_method: {
        type: DataTypes.STRING(50)
    },
    notes: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'sales_orders',
    timestamps: true
});

Order.belongsTo(Customer, { foreignKey: 'customer_id' });
Customer.hasMany(Order, { foreignKey: 'customer_id' });

module.exports = Order;
