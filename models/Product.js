const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Supplier = require('./Supplier');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    sku: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    category: {
        type: DataTypes.STRING(255),
        defaultValue: 'Uncategorized'
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    cost_price: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    stock_quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    low_stock_threshold: {
        type: DataTypes.INTEGER,
        defaultValue: 10
    },
    woocommerce_product_id: {
        type: DataTypes.INTEGER,
        unique: true
    },
    regular_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    sale_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    stock_status: {
        type: DataTypes.STRING(50),
        defaultValue: 'instock'
    },
    image_url: {
        type: DataTypes.STRING(2048), // URL length
        allowNull: true
    },
    size: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    size_numeric: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    supplier_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'supply_chain_suppliers',
            key: 'id'
        }
    }
}, {
    tableName: 'inventory_products',
    timestamps: true,
    paranoid: true
});

// Setup relationships
Product.belongsTo(Supplier, { foreignKey: 'supplier_id' });
Supplier.hasMany(Product, { foreignKey: 'supplier_id' });

module.exports = Product;
