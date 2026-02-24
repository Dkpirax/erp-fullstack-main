const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const Branch = require('../models/Branch');
const { authenticate } = require('../middleware/auth');

// --- Company Management ---

router.get("/companies", authenticate, async (req, res) => {
    try {
        const companies = await Company.findAll({ include: [Branch] });
        res.json(companies);
    } catch (error) {
        console.error("Get companies error:", error);
        res.status(500).json({ detail: "Failed to fetch companies" });
    }
});

router.post("/companies", authenticate, async (req, res) => {
    try {
        if (!req.user.is_superuser && req.user.role !== 'admin') {
            return res.status(403).json({ detail: "Not enough permissions" });
        }
        const company = await Company.create(req.body);
        res.status(201).json(company);
    } catch (error) {
        console.error("Create company error:", error);
        res.status(500).json({ detail: "Failed to create company" });
    }
});

router.put("/companies/:id", authenticate, async (req, res) => {
    try {
        if (!req.user.is_superuser && req.user.role !== 'admin') {
            return res.status(403).json({ detail: "Not enough permissions" });
        }
        const { id } = req.params;
        const [updated] = await Company.update(req.body, { where: { id } });
        if (updated) {
            const updatedCompany = await Company.findByPk(id);
            res.json(updatedCompany);
        } else {
            res.status(404).json({ detail: "Company not found" });
        }
    } catch (error) {
        console.error("Update company error:", error);
        res.status(500).json({ detail: "Failed to update company" });
    }
});

// --- Branch Management ---

router.get("/branches", authenticate, async (req, res) => {
    try {
        const branches = await Branch.findAll({ include: [Company] });
        res.json(branches);
    } catch (error) {
        console.error("Get branches error:", error);
        res.status(500).json({ detail: "Failed to fetch branches" });
    }
});

router.post("/branches", authenticate, async (req, res) => {
    try {
        if (!req.user.is_superuser && req.user.role !== 'admin') {
            return res.status(403).json({ detail: "Not enough permissions" });
        }
        const branch = await Branch.create(req.body);
        res.status(201).json(branch);
    } catch (error) {
        console.error("Create branch error:", error);
        res.status(500).json({ detail: "Failed to create branch" });
    }
});

router.put("/branches/:id", authenticate, async (req, res) => {
    try {
        if (!req.user.is_superuser && req.user.role !== 'admin') {
            return res.status(403).json({ detail: "Not enough permissions" });
        }
        const { id } = req.params;
        const [updated] = await Branch.update(req.body, { where: { id } });
        if (updated) {
            const updatedBranch = await Branch.findByPk(id);
            res.json(updatedBranch);
        } else {
            res.status(404).json({ detail: "Branch not found" });
        }
    } catch (error) {
        console.error("Update branch error:", error);
        res.status(500).json({ detail: "Failed to update branch" });
    }
});

router.delete("/branches/:id", authenticate, async (req, res) => {
    try {
        if (!req.user.is_superuser && req.user.role !== 'admin') {
            return res.status(403).json({ detail: "Not enough permissions" });
        }
        const { id } = req.params;
        const deleted = await Branch.destroy({ where: { id } });
        if (deleted) {
            res.json({ message: "Branch deleted" });
        } else {
            res.status(404).json({ detail: "Branch not found" });
        }
    } catch (error) {
        console.error("Delete branch error:", error);
        res.status(500).json({ detail: "Failed to delete branch" });
    }
});

module.exports = router;
