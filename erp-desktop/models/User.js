const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    email: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false,
        validate: {
            isEmail: true,
            notEmpty: true
        }
    },
    hashed_password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    full_name: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    is_superuser: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    role: {
        type: DataTypes.ENUM('admin', 'manager', 'sales', 'accountant', 'hr', 'inventory', 'pos_user'),
        defaultValue: 'pos_user'
    },
    branch_id: {
        type: DataTypes.INTEGER,
        allowNull: true // Nullable for global admins, mandatory for others via logic
    }
}, {
    tableName: 'users',
    timestamps: false,
    indexes: [
        { fields: ['username'] },
        { fields: ['email'] }
    ]
});

// Instance method to verify password
User.prototype.verifyPassword = async function (password) {
    return await bcrypt.compare(password, this.hashed_password);
};

// Static method to hash password
User.hashPassword = async function (password) {
    return await bcrypt.hash(password, 10);
};

module.exports = User;
