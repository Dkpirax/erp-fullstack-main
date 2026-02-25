/**
 * WhatsApp Bot – Order Manager
 * -----------------------------------
 * Creates orders in the ERP database when a WhatsApp customer completes
 * the checkout flow, registering (or fetching) the customer record first.
 */

'use strict';

const { Op } = require('sequelize');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');

/**
 * Find or create a CRM customer record for the WhatsApp user.
 * @param {string} phone  - E.164 phone number (the WhatsApp "from")
 * @param {string} name   - display name captured during conversation
 */
async function findOrCreateCustomer(phone, name) {
    // First try to find by phone
    let customer = await Customer.findOne({ where: { phone } });

    if (!customer) {
        // Use a unique dummy email to satisfy the unique constraint
        const dummyEmail = `wa_${phone.replace(/\D/g, '')}@whatsapp.bot`;
        customer = await Customer.create({
            name: name || `WhatsApp ${phone}`,
            phone,
            email: dummyEmail
        });
    }

    // Update name if we now have a real name
    if (name && customer.name !== name && !customer.name.startsWith('WhatsApp')) {
        await customer.update({ name });
    }

    return customer;
}

/**
 * Place an order for the items in the cart.
 * @param {object} session - bot session (has cart, customerName, customerPhone)
 * @returns {object}       - the created Order record (plain JS)
 */
async function placeOrder(session) {
    const { cart, customerPhone, customerName } = session;
    if (!cart || cart.length === 0) throw new Error('Cart is empty');

    // 1. Find / create customer
    const customer = await findOrCreateCustomer(customerPhone, customerName);

    // 2. Calculate total
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    // 3. Generate order number
    const orderNumber = `WA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 4. Create order
    const order = await Order.create({
        order_number: orderNumber,
        customer_id: customer.id,
        total_amount: total.toFixed(2),
        status: 'PENDING',
        source: 'MANUAL',
        payment_method: 'whatsapp_cod',
        notes: `WhatsApp order from ${customerPhone}`
    });

    // 5. Create order items and (optionally) decrement stock
    for (const item of cart) {
        await OrderItem.create({
            order_id: order.id,
            product_id: item.productId,
            quantity: item.qty,
            unit_price: item.price,
            total_price: (item.price * item.qty).toFixed(2)
        });

        // Decrement stock if possible (best-effort)
        try {
            const product = await Product.findByPk(item.productId);
            if (product && product.stock_quantity >= item.qty) {
                await product.decrement('stock_quantity', { by: item.qty });
                if (product.stock_quantity - item.qty <= 0) {
                    await product.update({ stock_status: 'outofstock' });
                }
            }
        } catch (stockErr) {
            console.error('[Order] Stock update error:', stockErr.message);
        }
    }

    return order.toJSON();
}

module.exports = { placeOrder, findOrCreateCustomer };
