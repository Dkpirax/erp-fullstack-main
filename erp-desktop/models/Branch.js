const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Branch = sequelize.define('Branch', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    company_id: {
        type: DataTypes.INTEGER,
        allowNull: false
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
    manager_name: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    is_main: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'branches',
    timestamps: true
});

module.exports = Branch;
