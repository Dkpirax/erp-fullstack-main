const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(255),
        unique: true
    },
    phone: {
        type: DataTypes.STRING(50)
    },
    address: {
        type: DataTypes.TEXT
    },
    company: {
        type: DataTypes.STRING(255)
    },
    woocommerce_id: {
        type: DataTypes.INTEGER,
        unique: true
    },
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'crm_customers',
    timestamps: true
});

module.exports = Customer;
