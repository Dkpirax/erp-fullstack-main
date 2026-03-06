const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Account = require('./Account');

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    description: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    reference: {
        type: DataTypes.STRING(100)
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('DEBIT', 'CREDIT'),
        allowNull: false
    },
    account_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Account,
            key: 'id'
        }
    },
    related_entity_type: {
        type: DataTypes.STRING(50) // e.g., 'Order', 'Invoice'
    },
    related_entity_id: {
        type: DataTypes.INTEGER
    }
}, {
    tableName: 'finance_transactions',
    timestamps: true
});

Transaction.belongsTo(Account, { foreignKey: 'account_id' });
Account.hasMany(Transaction, { foreignKey: 'account_id' });

module.exports = Transaction;
