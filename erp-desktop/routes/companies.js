const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Company = require('../models/Company');
const Branch = require('../models/Branch');
const { authenticate } = require('../middleware/auth');

// Set up multer for logo uploads → stored in public/logos/
const logosDir = path.join(__dirname, '..', 'public', 'logos');
if (!fs.existsSync(logosDir)) fs.mkdirSync(logosDir, { recursive: true });

const logoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, logosDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `company_${req.params.id}_${Date.now()}${ext}`);
    }
});
const logoUpload = multer({
    storage: logoStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    }
});

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

// --- Logo Upload ---
router.post("/companies/:id/logo", authenticate, logoUpload.single('logo'), async (req, res) => {
    try {
        if (!req.user.is_superuser && req.user.role !== 'admin') {
            return res.status(403).json({ detail: "Not enough permissions" });
        }
        if (!req.file) {
            return res.status(400).json({ detail: "No file uploaded" });
        }

        const { id } = req.params;
        const logoUrl = `/logos/${req.file.filename}`;

        const [updated] = await Company.update({ logo_url: logoUrl }, { where: { id } });
        if (!updated) return res.status(404).json({ detail: "Company not found" });

        const updatedCompany = await Company.findByPk(id);
        res.json({ logo_url: updatedCompany.logo_url, company: updatedCompany });
    } catch (error) {
        console.error("Logo upload error:", error);
        res.status(500).json({ detail: error.message || "Failed to upload logo" });
    }
});

module.exports = router;

