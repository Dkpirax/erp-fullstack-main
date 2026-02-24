const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Account = sequelize.define('Account', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    balance: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00
    }
}, {
    tableName: 'finance_accounts',
    timestamps: true
});

module.exports = Account;
