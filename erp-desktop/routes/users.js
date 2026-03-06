const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const Branch = require('../models/Branch');
const { Op } = require('sequelize');

// --- User Management ---

// Get all users (admin only)
router.get("/", authenticate, async (req, res) => {
    try {
        if (!req.user.is_superuser && req.user.role !== 'admin') {
            return res.status(403).json({ detail: "Not enough permissions" });
        }

        const users = await User.findAll({
            attributes: { exclude: ['hashed_password'] },
            include: [{ model: Branch, as: 'Branch' }]
        });

        res.json(users);
    } catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({ detail: "Internal server error" });
    }
});

// Create user (admin only)
router.post("/", authenticate, async (req, res) => {
    try {
        if (!req.user.is_superuser && req.user.role !== 'admin') {
            return res.status(403).json({ detail: "Not enough permissions" });
        }

        const { username, email, password, full_name, is_superuser, role, branch_id } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ detail: "User with this username or email already exists" });
        }

        // Validate branch_id for non-admin users
        if (role !== 'admin' && !branch_id) {
            return res.status(400).json({ detail: "Branch is mandatory for non-admin users" });
        }

        // Hash password
        const hashed_password = await User.hashPassword(password);

        // Create user
        const user = await User.create({
            username,
            email,
            hashed_password,
            full_name,
            is_superuser: is_superuser || (role === 'admin'),
            role: role || 'pos_user',
            branch_id: branch_id || null,
            is_active: true
        });

        res.status(201).json({
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            branch_id: user.branch_id,
            is_active: user.is_active,
            is_superuser: user.is_superuser
        });
    } catch (error) {
        console.error("Create user error:", error);
        res.status(500).json({ detail: "Internal server error" });
    }
});

// Update user (admin only)
router.put("/:id", authenticate, async (req, res) => {
    try {
        if (!req.user.is_superuser && req.user.role !== 'admin') {
            return res.status(403).json({ detail: "Not enough permissions" });
        }

        const { id } = req.params;
        const { username, email, password, full_name, is_superuser, role, branch_id, is_active } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ detail: "User not found" });
        }

        // Prepare update data
        const updateData = {
            username,
            email,
            full_name,
            is_superuser: is_superuser !== undefined ? (role === 'admin' || is_superuser) : user.is_superuser,
            role: role || user.role,
            branch_id: branch_id !== undefined ? branch_id : user.branch_id,
            is_active: is_active !== undefined ? is_active : user.is_active
        };

        // Validate branch_id for non-admin users if role is being updated
        if (updateData.role !== 'admin' && !updateData.branch_id) {
            return res.status(400).json({ detail: "Branch is mandatory for non-admin users" });
        }

        // Hash password if provided
        if (password) {
            updateData.hashed_password = await User.hashPassword(password);
        }

        await user.update(updateData);

        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            branch_id: user.branch_id,
            is_active: user.is_active,
            is_superuser: user.is_superuser
        });
    } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ detail: "Internal server error" });
    }
});

// Delete user (admin only)
router.delete("/:id", authenticate, async (req, res) => {
    try {
        if (!req.user.is_superuser && req.user.role !== 'admin') {
            return res.status(403).json({ detail: "Not enough permissions" });
        }

        const { id } = req.params;

        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ detail: "Cannot delete yourself" });
        }

        const deleted = await User.destroy({ where: { id } });

        if (deleted) {
            res.json({ message: "User deleted" });
        } else {
            res.status(404).json({ detail: "User not found" });
        }
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ detail: "Internal server error" });
    }
});

module.exports = router;
