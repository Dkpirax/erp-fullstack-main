const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Settings = sequelize.define('Settings', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    key: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    group: {
        type: DataTypes.STRING(50),
        defaultValue: 'general'
    },
    is_encrypted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'system_settings',
    timestamps: true
});

module.exports = Settings;
