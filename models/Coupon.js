const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Coupon = sequelize.define('Coupon', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    type: {
        type: DataTypes.ENUM('percentage', 'fixed_amount'),
        allowNull: false
    },
    value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    min_purchase: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    expiry_date: {
        type: DataTypes.DATEONLY
    },
    usage_limit: {
        type: DataTypes.INTEGER,
        defaultValue: null // null means unlimited
    },
    used_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'sales_coupons',
    timestamps: true
});

module.exports = Coupon;
