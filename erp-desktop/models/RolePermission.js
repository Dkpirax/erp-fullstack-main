const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RolePermission = sequelize.define('RolePermission', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    role: {
        type: DataTypes.STRING(50), // Matches User role enum values
        allowNull: false
    },
    resource: {
        type: DataTypes.STRING(50), // e.g., 'users', 'inventory', 'suppliers'
        allowNull: false
    },
    can_create: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    can_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    can_update: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    can_delete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'role_permissions',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['role', 'resource']
        }
    ]
});

module.exports = RolePermission;
