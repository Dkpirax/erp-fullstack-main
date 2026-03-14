const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { authenticate } = require('../middleware/auth');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer for product image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- GET all products ---
router.get("/", authenticate, async (req, res) => {
    try {
        const { skip, limit, search } = req.query;
        const offset = parseInt(skip) || 0;
        const limitVal = parseInt(limit) || 200;

        const whereClause = {};
        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { sku: { [Op.like]: `%${search}%` } }
            ];
        }

        const products = await Product.findAll({ where: whereClause, offset, limit: limitVal });
        res.json({ products });
    } catch (error) {
        console.error("Get products error:", error);
        res.status(500).json({ detail: "Failed to fetch products" });
    }
});

// --- GET single product ---
router.get("/:id", authenticate, async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ detail: "Product not found" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ detail: "Failed to fetch product" });
    }
});

// --- POST create product ---
router.post("/", authenticate, async (req, res) => {
    try {
        const { name, sku, description, price, cost_price, stock_quantity, low_stock_threshold, image_url, supplier_id, category, barcode, size, size_numeric } = req.body;
        if (!name || !sku) return res.status(400).json({ detail: "Name and SKU are required" });

        const product = await Product.create({
            name, sku, description,
            price: parseFloat(price) || 0,
            cost_price: parseFloat(cost_price) || 0,
            stock_quantity: parseInt(stock_quantity) || 0,
            low_stock_threshold: parseInt(low_stock_threshold) || 10,
            image_url, supplier_id, category, barcode, size, size_numeric
        });

        // Notify all clients
        const io = req.app.get('io');
        if (io) io.emit('products:updated');

        res.status(201).json(product);
    } catch (error) {
        console.error("Create product error:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ detail: "SKU already exists" });
        }
        res.status(500).json({ detail: error.message || "Failed to create product" });
    }
});

// --- POST upload image ---
router.post("/upload", authenticate, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ detail: "No image file provided" });
        }
        // Return the virtual URL to the uploaded file
        res.json({ image_url: `/api/v1/uploads/${req.file.filename}` });
    } catch (error) {
        console.error("Upload image error:", error);
        res.status(500).json({ detail: "Failed to upload image" });
    }
});

// --- PUT update product ---
router.put("/:id", authenticate, async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ detail: "Product not found" });

        const { name, sku, description, price, cost_price, stock_quantity, low_stock_threshold, image_url, supplier_id, category, barcode, size, size_numeric } = req.body;

        await product.update({
            ...(name !== undefined && { name }),
            ...(sku !== undefined && { sku }),
            ...(description !== undefined && { description }),
            ...(price !== undefined && { price: parseFloat(price) || 0 }),
            ...(cost_price !== undefined && { cost_price: parseFloat(cost_price) || 0 }),
            ...(stock_quantity !== undefined && { stock_quantity: parseInt(stock_quantity) || 0 }),
            ...(low_stock_threshold !== undefined && { low_stock_threshold: parseInt(low_stock_threshold) || 10 }),
            ...(image_url !== undefined && { image_url }),
            ...(supplier_id !== undefined && { supplier_id }),
            ...(category !== undefined && { category }),
            ...(barcode !== undefined && { barcode }),
            ...(size !== undefined && { size }),
            ...(size_numeric !== undefined && { size_numeric }),
        });

        const io = req.app.get('io');
        if (io) io.emit('products:updated');

        res.json(product);
    } catch (error) {
        console.error("Update product error:", error);
        res.status(500).json({ detail: error.message || "Failed to update product" });
    }
});

// --- DELETE product ---
router.delete("/:id", authenticate, async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ detail: "Product not found" });
        
        // Append a deleted marker to the SKU to free it up for reuse
        const deletedSku = `${product.sku}-deleted-${Date.now()}`;
        await product.update({ 
            sku: deletedSku,
            woocommerce_product_id: null 
        });
        
        await product.destroy();

        const io = req.app.get('io');
        if (io) io.emit('products:updated');

        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Delete product error:", error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ detail: "Cannot delete product because it is being used in an existing order or system record." });
        }
        res.status(500).json({ detail: "Failed to delete product" });
    }
});

module.exports = router;

