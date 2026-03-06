const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { authenticate } = require('../middleware/auth');

// --- Coupons (Sales) ---

router.get("/", authenticate, async (req, res) => {
    try {
        const coupons = await Coupon.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json(coupons);
    } catch (error) {
        console.error("Get coupons error:", error);
        res.status(500).json({ detail: "Failed to fetch coupons" });
    }
});

router.post("/", authenticate, async (req, res) => {
    try {
        const { code, type, value, min_purchase, expiry_date, usage_limit, is_active } = req.body;

        if (!code || !type || !value) {
            return res.status(400).json({ detail: "Code, Type and Value are required" });
        }

        const existing = await Coupon.findOne({ where: { code } });
        if (existing) {
            return res.status(400).json({ detail: "Coupon code already exists" });
        }

        const newCoupon = await Coupon.create({
            code: code.toUpperCase(),
            type,
            value,
            min_purchase: min_purchase || 0,
            expiry_date,
            usage_limit,
            is_active: is_active !== undefined ? is_active : true
        });

        res.status(201).json(newCoupon);
    } catch (error) {
        console.error("Create coupon error:", error);
        res.status(500).json({ detail: "Failed to create coupon" });
    }
});

router.delete("/:id", authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Coupon.destroy({ where: { id } });
        if (deleted) {
            res.json({ message: "Coupon deleted successfully" });
        } else {
            res.status(404).json({ detail: "Coupon not found" });
        }
    } catch (error) {
        console.error("Delete coupon error:", error);
        res.status(500).json({ detail: "Failed to delete coupon" });
    }
});

module.exports = router;
