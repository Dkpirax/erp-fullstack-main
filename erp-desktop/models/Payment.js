const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'sales_orders',
            key: 'id'
        }
    },
    payment_method: {
        type: DataTypes.ENUM('CASH', 'CARD', 'CHECK'),
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    // Check-specific fields
    check_number: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    check_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    check_type: {
        type: DataTypes.ENUM('PERSONAL', 'BUSINESS', 'CASHIERS', 'TRAVELERS'),
        allowNull: true
    },
    check_from: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Name of the person/entity issuing the check'
    },
    bank_name: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    deposit_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Date when check will be deposited'
    },
    check_status: {
        type: DataTypes.ENUM('PENDING', 'DEPOSITED', 'CLEARED', 'BOUNCED'),
        allowNull: true,
        defaultValue: 'PENDING'
    },
    // Card-specific fields (optional for future use)
    card_last_four: {
        type: DataTypes.STRING(4),
        allowNull: true
    },
    card_type: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    transaction_id: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'payments',
    timestamps: true
});

module.exports = Payment;
