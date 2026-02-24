const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// --- Finance ---

router.get("/accounts", authenticate, (req, res) => {
    res.json([
        { id: 1, code: "1000", name: "Cash", type: "ASSET", balance: 50000 },
        { id: 2, code: "2000", name: "Accounts Payable", type: "LIABILITY", balance: 5000 }
    ]);
});

router.get("/journal-entries", authenticate, (req, res) => {
    res.json([]);
});

router.get("/ap-invoices", authenticate, (req, res) => {
    res.json([]);
});

router.get("/ar-invoices", authenticate, (req, res) => {
    res.json([]);
});

module.exports = router;
