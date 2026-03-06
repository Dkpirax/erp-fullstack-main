const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Supplier = sequelize.define('Supplier', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    contact_person: {
        type: DataTypes.STRING(255)
    },
    email: {
        type: DataTypes.STRING(255)
    },
    phone: {
        type: DataTypes.STRING(50)
    },
    address: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'supply_chain_suppliers',
    timestamps: true
});

module.exports = Supplier;
