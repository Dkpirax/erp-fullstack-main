const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const User = require('../models/User');
const RolePermission = require('../models/RolePermission');
const { generateToken, authenticate } = require('../middleware/auth');
const { Op } = require('sequelize');

// --- Authentication ---
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication
 */

/**
 * @swagger
 * /login/access-token:
 *   post:
 *     summary: Login to get access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                 token_type:
 *                   type: string
 *       400:
 *         description: Invalid credentials
 */
router.post("/login/access-token", upload.none(), async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log("Login attempt:", { username }); // Debug log (don't log password)
        // console.log("Login attempt:", { password }); // Debug log (don't log password)

        if (!username || !password) {
            return res.status(400).json({ detail: "Username and password are required" });
        }

        // Find user by username or email
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { username: username },
                    { email: username }
                ]
            }
        });

        console.log("User found:", { user }); // Debug log (don't log password)

        if (!user) {
            return res.status(400).json({ detail: "Incorrect username or password" });
        }

        // Verify password
        const isValidPassword = await user.verifyPassword(password);
        if (!isValidPassword) {
            return res.status(400).json({ detail: "Incorrect username or password" });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(400).json({ detail: "Inactive user" });
        }

        // Generate token
        const access_token = generateToken(user.username);

        return res.json({
            access_token,
            token_type: "bearer"
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ detail: "Internal server error" });
    }
});

// Test token endpoint
router.post("/login/test-token", authenticate, (req, res) => {
    res.json({
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        full_name: req.user.full_name,
        is_active: req.user.is_active,
        is_superuser: req.user.is_superuser
    });
});

// Get current user
router.get("/users/me", authenticate, async (req, res) => {
    try {
        const permissions = await RolePermission.findAll({
            where: { role: req.user.role }
        });

        res.json({
            id: req.user.id,
            email: req.user.email,
            username: req.user.username,
            full_name: req.user.full_name,
            is_active: req.user.is_active,
            is_superuser: req.user.is_superuser,
            role: req.user.role,
            branch_id: req.user.branch_id,
            permissions: permissions
        });
    } catch (error) {
        console.error("Get me error:", error);
        res.status(500).json({ detail: "Failed to fetch user details" });
    }
});

module.exports = router;
