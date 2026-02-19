const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { Op } = require('sequelize');

// Get chat history with a specific user
router.get('/history/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;

        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { sender_id: currentUserId, receiver_id: userId },
                    { sender_id: userId, receiver_id: currentUserId }
                ]
            },
            order: [['createdAt', 'ASC']],
            include: [
                {
                    model: User,
                    as: 'Sender',
                    attributes: ['id', 'username', 'full_name']
                }
            ]
        });

        res.json(messages);
    } catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({ detail: 'Failed to fetch chat history' });
    }
});

// Get conversations (list of users previously chatted with)
// This is a bit complex in SQL/Sequelize efficiently, simplified version:
// Get distinct users from messages sent or received.
router.get('/conversations', authenticate, async (req, res) => {
    try {
        const currentUserId = req.user.id;

        // Find users who have exchanged messages with current user
        // We can just fetch all users for now if the user base is small, 
        // effectively showing a "Company Directory" style list.
        // Or specific logic to find "recent contacts".

        // For now, let's return all users except self, 
        // so the user can start a chat with anyone.
        const users = await User.findAll({
            where: {
                id: { [Op.ne]: currentUserId },
                is_active: true
            },
            attributes: ['id', 'username', 'full_name', 'email']
        });

        res.json(users);
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ detail: 'Failed to fetch conversations' });
    }
});

// Get unread notifications
router.get('/notifications', authenticate, async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: {
                user_id: req.user.id,
                is_read: false
            },
            order: [['createdAt', 'DESC']]
        });
        res.json(notifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ detail: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
router.put('/notifications/:id/read', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.update(
            { is_read: true },
            { where: { id, user_id: req.user.id } }
        );
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ detail: 'Failed to mark notification as read' });
    }
});

module.exports = router;
