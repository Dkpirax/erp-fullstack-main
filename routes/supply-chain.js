const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const { authenticate } = require('../middleware/auth');

// --- Supply Chain ---

router.get("/products", authenticate, async (req, res) => {
    // Mock data for products (keeping as is for now)
    const products = [
        {
            id: 1,
            sku: "PROD-001",
            name: "Premium Widget",
            description: "High quality widget",
            price: 50.00,
            cost_price: 30.00,
            quantity_in_stock: 100,
            supplier_id: 1
        },
        {
            id: 2,
            sku: "PROD-002",
            name: "Standard Gadget",
            description: "Standard quality gadget",
            price: 50.50,
            cost_price: 35.00,
            quantity_in_stock: 50,
            supplier_id: 1
        },
        {
            id: 3,
            sku: "PROD-003",
            name: "Economy Tool",
            description: "Cheap tool",
            price: 18.80,
            cost_price: 10.00,
            quantity_in_stock: 200,
            supplier_id: 2
        }
    ];
    res.json(products);
});

router.get("/suppliers", authenticate, async (req, res) => {
    try {
        const suppliers = await Supplier.findAll();
        res.json(suppliers);
    } catch (error) {
        console.error("Get suppliers error:", error);
        res.status(500).json({ detail: "Failed to fetch suppliers" });
    }
});

router.post("/suppliers", authenticate, async (req, res) => {
    try {
        const supplier = await Supplier.create(req.body);
        res.status(201).json(supplier);
    } catch (error) {
        console.error("Create supplier error:", error);
        res.status(500).json({ detail: "Failed to create supplier" });
    }
});

router.put("/suppliers/:id", authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const [updated] = await Supplier.update(req.body, { where: { id } });
        if (updated) {
            const updatedSupplier = await Supplier.findByPk(id);
            res.json(updatedSupplier);
        } else {
            res.status(404).json({ detail: "Supplier not found" });
        }
    } catch (error) {
        console.error("Update supplier error:", error);
        res.status(500).json({ detail: "Failed to update supplier" });
    }
});

router.delete("/suppliers/:id", authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Supplier.destroy({ where: { id } });
        if (deleted) {
            res.json({ message: "Supplier deleted" });
        } else {
            res.status(404).json({ detail: "Supplier not found" });
        }
    } catch (error) {
        console.error("Delete supplier error:", error);
        res.status(500).json({ detail: "Failed to delete supplier" });
    }
});

module.exports = router;
