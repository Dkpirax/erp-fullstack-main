const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User'); // Assuming User model path

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false, // The user receiving the notification
        references: {
            model: User,
            key: 'id'
        }
    },
    type: {
        type: DataTypes.STRING, // e.g., 'MESSAGE', 'SYSTEM', 'ORDER'
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    reference_id: {
        type: DataTypes.INTEGER, // e.g., Message ID or Order ID
        allowNull: true
    },
    link: {
        type: DataTypes.STRING, // Optional link to navigate to
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'notifications'
});

module.exports = Notification;
