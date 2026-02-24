const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Company = sequelize.define('Company', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    tax_id: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    website: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    // Bank Details
    account_name: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    account_number: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    bank_name: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    iban: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    swift: {
        type: DataTypes.STRING(50),
        allowNull: true
    }
}, {
    tableName: 'companies',
    timestamps: true
});

module.exports = Company;
