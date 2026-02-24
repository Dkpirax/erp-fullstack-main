const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { authenticate } = require('../middleware/auth');

// --- Loyalty ---

router.get("/settings", authenticate, async (req, res) => {
    try {
        const settings = await Settings.findAll({
            where: { group: 'loyalty' }
        });

        const config = {
            points_per_dollar: 1,
            redemption_rate: 0.01,
            min_spending: 0,
            is_enabled: true
        };

        settings.forEach(s => {
            if (s.key === 'loyalty_points_per_dollar') config.points_per_dollar = parseFloat(s.value);
            if (s.key === 'loyalty_redemption_rate') config.redemption_rate = parseFloat(s.value);
            if (s.key === 'loyalty_min_spending') config.min_spending = parseFloat(s.value);
            if (s.key === 'loyalty_is_enabled') config.is_enabled = s.value === 'true';
        });

        res.json(config);
    } catch (error) {
        console.error("Get loyalty settings error:", error);
        res.status(500).json({ detail: "Failed to fetch loyalty settings" });
    }
});

router.put("/settings", authenticate, async (req, res) => {
    try {
        const { points_per_dollar, redemption_rate, min_spending, is_enabled } = req.body;

        await Settings.upsert({ key: 'loyalty_points_per_dollar', value: String(points_per_dollar), group: 'loyalty' });
        await Settings.upsert({ key: 'loyalty_redemption_rate', value: String(redemption_rate), group: 'loyalty' });
        await Settings.upsert({ key: 'loyalty_min_spending', value: String(min_spending || 0), group: 'loyalty' });
        await Settings.upsert({ key: 'loyalty_is_enabled', value: String(is_enabled), group: 'loyalty' });

        res.json({
            points_per_dollar,
            redemption_rate,
            min_spending: min_spending || 0,
            is_enabled
        });
    } catch (error) {
        console.error("Save loyalty settings error:", error);
        res.status(500).json({ detail: "Failed to save loyalty settings" });
    }
});

module.exports = router;
