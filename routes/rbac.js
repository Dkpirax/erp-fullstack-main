const express = require('express');
const router = express.Router();
const RolePermission = require('../models/RolePermission');
const { authenticate } = require('../middleware/auth');

// --- Role Based Access Control (RBAC) ---

router.get("/permissions", authenticate, async (req, res) => {
    try {
        if (!req.user.is_superuser && req.user.role !== 'admin') {
            return res.status(403).json({ detail: "Forbidden" });
        }
        const permissions = await RolePermission.findAll();
        res.json(permissions);
    } catch (error) {
        console.error("Get permissions error:", error);
        res.status(500).json({ detail: "Failed to fetch permissions" });
    }
});

router.post("/permissions", authenticate, async (req, res) => {
    try {
        if (!req.user.is_superuser && req.user.role !== 'admin') {
            return res.status(403).json({ detail: "Forbidden" });
        }

        const { role, resource, can_create, can_read, can_update, can_delete } = req.body;

        // Upsert permission
        // Since we have a unique constraint on [role, resource], this works for both create and update
        const [permission] = await RolePermission.upsert({
            role,
            resource,
            can_create,
            can_read,
            can_update,
            can_delete
        });

        res.json(permission);
    } catch (error) {
        console.error("Save permission error:", error);
        res.status(500).json({ detail: "Failed to save permission" });
    }
});

module.exports = router;
