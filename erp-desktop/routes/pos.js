const express = require('express');
const router = express.Router();
const { Order, OrderItem, Customer, Product } = require('../models');
const Settings = require('../models/Settings');
const { authenticate } = require('../middleware/auth');
const sequelize = require('../config/database');

// ─── POS Settings ────────────────────────────────────────────────────────────

// GET  /api/v1/pos/settings  — returns { tax_rate }
router.get('/settings', authenticate, async (req, res) => {
    try {
        const row = await Settings.findOne({ where: { key: 'pos_tax_rate' } });
        res.json({ tax_rate: row ? parseFloat(row.value) : 10.0 });
    } catch (err) {
        console.error('Get POS settings error:', err);
        res.status(500).json({ detail: 'Failed to fetch settings' });
    }
});

// PUT  /api/v1/pos/settings  — body: { tax_rate: number }
router.put('/settings', authenticate, async (req, res) => {
    try {
        const { tax_rate } = req.body;
        const val = parseFloat(tax_rate);
        if (isNaN(val) || val < 0 || val > 100) {
            return res.status(400).json({ detail: 'tax_rate must be 0–100' });
        }
        await Settings.upsert({
            key: 'pos_tax_rate',
            value: val.toString(),
            group: 'pos'
        });
        res.json({ tax_rate: val });
    } catch (err) {
        console.error('Update POS settings error:', err);
        res.status(500).json({ detail: 'Failed to update settings' });
    }
});



// --- POS (Point of Sale) ---

// Get Active POS Session (Mock)
router.get("/sessions/active", authenticate, (req, res) => {
    // Mock active session
    res.json({
        id: 1,
        user_id: req.user.id,
        start_time: new Date().toISOString(),
        opening_cash: 100.00,
        status: "OPEN"
    });
});

// Create POS Session (Mock/Stub)
router.post("/sessions", authenticate, async (req, res) => {
    try {
        const { opening_cash } = req.body;
        // Mock session creation
        res.status(201).json({ id: 1, opening_cash: opening_cash || 0, status: 'OPEN' });
    } catch (error) {
        console.error("Create session error:", error);
        res.status(500).json({ detail: "Failed to create session" });
    }
});

router.post("/orders", authenticate, async (req, res) => {
    const orderData = req.body;
    console.log("New POS Order:", orderData);

    const t = await sequelize.transaction();

    try {
        // Validate Customer if provided
        if (orderData.customer_id && orderData.customer_id > 0) {
            const customerExists = await Customer.findByPk(orderData.customer_id);
            if (!customerExists) {
                await t.rollback();
                return res.status(400).json({ detail: `Customer with ID ${orderData.customer_id} not found` });
            }
        }

        // Validate Products
        if (orderData.items && orderData.items.length > 0) {
            for (const item of orderData.items) {
                const product = await Product.findByPk(item.product_id);
                if (!product) {
                    await t.rollback();
                    return res.status(400).json({ detail: `Product with ID ${item.product_id} not found` });
                }
            }
        }

        // Create the Order
        const newOrder = await Order.create({
            order_number: `POS-${Date.now()}`,
            customer_id: (orderData.customer_id && orderData.customer_id > 0) ? orderData.customer_id : null,
            total_amount: orderData.total_amount,
            status: orderData.status || 'COMPLETED',
            source: 'POS',
            payment_method: orderData.payments && orderData.payments.length > 0 ? orderData.payments[0].method : 'CASH',
            notes: orderData.notes
        }, { transaction: t });

        // Create Order Items
        if (orderData.items && orderData.items.length > 0) {
            const itemsToCreate = orderData.items.map(item => ({
                order_id: newOrder.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.quantity * item.unit_price
            }));

            await OrderItem.bulkCreate(itemsToCreate, { transaction: t });
        }

        // Apply Loyalty Points if applicable
        if (orderData.customer_id && orderData.points_earned > 0) {
            const customer = await Customer.findByPk(orderData.customer_id, { transaction: t });
            if (customer) {
                await customer.increment('points', { by: orderData.points_earned, transaction: t });
            }
        }

        await t.commit();

        // Fetch the complete order with items to return
        const createdOrder = await Order.findByPk(newOrder.id, {
            include: [OrderItem]
        });

        res.json(createdOrder);

    } catch (error) {
        if (!t.finished) {
            await t.rollback();
        }
        console.error("Create POS order error:", error);
        res.status(500).json({ detail: error.message || "Failed to create order" });
    }
});

router.get("/orders", authenticate, async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                {
                    model: OrderItem,
                    include: [Product]
                },
                {
                    model: Customer
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Debug logging
        if (orders.length > 0) {
            // console.log("First Order Customer ID:", orders[0].customer_id);
            // console.log("First Order Customer Obj:", JSON.stringify(orders[0].Customer));
        }

        // Manual fetch for customers to ensure names show up
        const customerIds = [...new Set(orders.map(o => o.customer_id).filter(id => id))];
        let customerMap = {};

        if (customerIds.length > 0) {
            try {
                const customers = await Customer.findAll({
                    where: {
                        id: customerIds
                    },
                    attributes: ['id', 'name']
                });
                customers.forEach(c => {
                    customerMap[c.id] = c.name;
                });
                console.log("Customer Lookup Map:", customerMap);
            } catch (err) {
                console.error("Error fetching customers manually:", err);
            }
        }

        // Map OrderItems to items for consistency
        const formattedOrders = orders.map(order => {
            const plain = order.get({ plain: true });

            const mappedItems = (plain.OrderItems || []).map(item => ({
                ...item,
                product_name: item.Product ? item.Product.name : "Unknown Product"
            }));

            return {
                ...plain,
                created_at: plain.createdAt, // Map database camelCase to API snake_case
                items: mappedItems,
                customer_name: customerMap[plain.customer_id] || "Walk-in Customer",
                // Ensure payments is present if needed
                payments: plain.payment_method ? [{ method: plain.payment_method, amount: plain.total_amount }] : []
            };
        });

        res.json(formattedOrders);
    } catch (error) {
        console.error("Get POS orders error:", error);
        res.status(500).json({ detail: error.message || "Failed to fetch orders" });
    }
});

router.get("/orders/:id", authenticate, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const order = await Order.findByPk(id, {
            include: [
                { model: OrderItem, include: [Product] }, // Include Product details in items if needed
                { model: Customer }
            ]
        });

        if (!order) {
            return res.status(404).json({ detail: "Order not found" });
        }

        // Transform to match expected frontend structure if necessary
        // The frontend expects: items: [{ product_name, quantity, unit_price, subtotal }]
        const orderJSON = order.toJSON();
        orderJSON.items = orderJSON.OrderItems.map(item => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.Product ? item.Product.name : "Unknown Product",
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price // Ensure total_price is mapped if needed by frontend
        }));

        // Map customer name
        orderJSON.customer_name = orderJSON.Customer ? orderJSON.Customer.name : "Walk-in Customer";

        // Ensure payments structure exists if frontend expects it
        if (!orderJSON.payments) {
            orderJSON.payments = [{
                method: orderJSON.payment_method,
                amount: orderJSON.total_amount
            }];
        }

        res.json(orderJSON);
    } catch (error) {
        console.error("Get POS order detail error:", error);
        res.status(500).json({ detail: "Failed to fetch order details" });
    }
});

module.exports = router;
