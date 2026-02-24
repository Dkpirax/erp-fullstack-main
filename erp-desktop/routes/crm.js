const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { authenticate } = require('../middleware/auth');

// --- CRM (Customer Relationship Management) ---

router.get("/customers", authenticate, async (req, res) => {
    try {
        const customers = await Customer.findAll();
        res.json(customers);
    } catch (error) {
        console.error("Get customers error:", error);
        res.status(500).json({ detail: "Failed to fetch customers" });
    }
});

router.post("/customers", authenticate, async (req, res) => {
    try {
        const { name, email, phone, address, company } = req.body;

        if (!name) {
            return res.status(400).json({ detail: "Customer name is required" });
        }

        // Check for duplicates if email is provided
        if (email) {
            const existingCustomer = await Customer.findOne({ where: { email } });
            if (existingCustomer) {
                return res.status(400).json({ detail: "Customer with this email already exists" });
            }
        }

        const newCustomer = await Customer.create({
            name,
            email,
            phone,
            address,
            company
        });

        res.status(201).json(newCustomer);
    } catch (error) {
        console.error("Create customer error:", error);
        res.status(500).json({ detail: error.message || "Failed to create customer" });
    }
});

router.put("/customers/:id", authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address, company } = req.body;

        const customer = await Customer.findByPk(id);
        if (!customer) {
            return res.status(404).json({ detail: "Customer not found" });
        }

        // Check for email duplicate if changing email
        if (email && email !== customer.email) {
            const existingCustomer = await Customer.findOne({ where: { email } });
            if (existingCustomer) {
                return res.status(400).json({ detail: "Customer with this email already exists" });
            }
        }

        await customer.update({
            name: name || customer.name,
            email: email || customer.email,
            phone: phone || customer.phone,
            address: address || customer.address,
            company: company || customer.company
        });

        res.json(customer);
    } catch (error) {
        console.error("Update customer error:", error);
        res.status(500).json({ detail: error.message || "Failed to update customer" });
    }
});

module.exports = router;
