const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const Product = require('../models/Product');
const { authenticate } = require('../middleware/auth');

// --- WooCommerce Settings ---

router.get("/settings", authenticate, async (req, res) => {
    try {
        const settings = await Settings.findAll({
            where: {
                group: 'woocommerce'
            }
        });

        const config = {
            store_url: "",
            consumer_key: "",
            consumer_secret: ""
        };

        settings.forEach(s => {
            if (s.key === 'woocommerce_store_url') config.store_url = s.value;
            if (s.key === 'woocommerce_consumer_key') config.consumer_key = s.value;
            if (s.key === 'woocommerce_consumer_secret') config.consumer_secret = s.value;
        });

        res.json(config);
    } catch (error) {
        console.error("Get settings error:", error);
        res.status(500).json({ detail: "Failed to fetch settings" });
    }
});

router.put("/settings", authenticate, async (req, res) => {
    try {
        const { store_url, consumer_key, consumer_secret } = req.body;

        await Settings.upsert({ key: 'woocommerce_store_url', value: store_url, group: 'woocommerce' });
        await Settings.upsert({ key: 'woocommerce_consumer_key', value: consumer_key, group: 'woocommerce' });
        await Settings.upsert({ key: 'woocommerce_consumer_secret', value: consumer_secret, group: 'woocommerce' });

        res.json({ message: "Settings saved successfully" });
    } catch (error) {
        console.error("Save settings error:", error);
        res.status(500).json({ detail: "Failed to save settings" });
    }
});

// --- WooCommerce Sync ---

router.post("/sync/products", authenticate, async (req, res) => {
    try {
        // 1. Get WooCommerce Settings
        const settings = await Settings.findAll({
            where: { group: 'woocommerce' }
        });

        let storeUrl = "";
        let consumerKey = "";
        let consumerSecret = "";

        settings.forEach(s => {
            if (s.key === 'woocommerce_store_url') storeUrl = s.value;
            if (s.key === 'woocommerce_consumer_key') consumerKey = s.value;
            if (s.key === 'woocommerce_consumer_secret') consumerSecret = s.value;
        });

        if (!storeUrl || !consumerKey || !consumerSecret) {
            return res.status(400).json({ detail: "WooCommerce settings not configured" });
        }

        // Ensure URL is clean
        storeUrl = storeUrl.replace(/\/$/, "");

        // 2. Fetch Products from WooCommerce
        const perPage = req.query.per_page || 100;
        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

        console.log(`Syncing products from: ${storeUrl}/wp-json/wc/v3/products`);

        const response = await fetch(`${storeUrl}/wp-json/wc/v3/products?per_page=${perPage}`, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });

        if (!response.ok) {
            throw new Error(`WooCommerce API Error: ${response.status} ${response.statusText}`);
        }

        const wcProducts = await response.json();
        console.log(`Fetched ${wcProducts.length} products from WooCommerce`);

        // 3. Upsert into Database
        let syncedCount = 0;
        for (const wcProduct of wcProducts) {
            await Product.upsert({
                woocommerce_product_id: wcProduct.id,
                name: wcProduct.name,
                sku: wcProduct.sku || `WC-${wcProduct.id}`,
                description: wcProduct.description?.replace(/<[^>]*>?/gm, '') || "", // Strip HTML
                price: wcProduct.price || 0,
                regular_price: wcProduct.regular_price || null,
                sale_price: wcProduct.sale_price || null,
                stock_quantity: wcProduct.stock_quantity || 0,
                stock_status: wcProduct.stock_status,
                image_url: wcProduct.images && wcProduct.images.length > 0 ? wcProduct.images[0].src : null,
                // Default to first supplier if exists, or null
                // supplier_id: 1
            });
            syncedCount++;
        }

        res.json({
            message: "Products synced successfully",
            count: syncedCount,
            total_fetched: wcProducts.length
        });

    } catch (error) {
        console.error("Sync products error:", error);
        res.status(500).json({ detail: error.message || "Failed to sync products" });
    }
});

// --- WooCommerce Data Fetching ---

router.get("/orders", authenticate, async (req, res) => {
    try {
        const page = req.query.page || 1;
        const perPage = req.query.per_page || 20;
        const status = req.query.status;

        // 1. Get WooCommerce Settings
        const settings = await Settings.findAll({
            where: { group: 'woocommerce' }
        });

        let storeUrl = "";
        let consumerKey = "";
        let consumerSecret = "";

        settings.forEach(s => {
            if (s.key === 'woocommerce_store_url') storeUrl = s.value;
            if (s.key === 'woocommerce_consumer_key') consumerKey = s.value;
            if (s.key === 'woocommerce_consumer_secret') consumerSecret = s.value;
        });

        if (!storeUrl || !consumerKey || !consumerSecret) {
            // If settings not configured, return empty list (prevents t.map error)
            return res.json([]);
        }

        // Ensure URL is clean
        storeUrl = storeUrl.replace(/\/$/, "");
        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

        let url = `${storeUrl}/wp-json/wc/v3/orders?page=${page}&per_page=${perPage}`;
        if (status) {
            url += `&status=${encodeURIComponent(status)}`;
        }

        console.log(`Fetching orders from: ${url}`);

        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });

        if (!response.ok) {
            console.error(`WooCommerce API Error: ${response.status} ${response.statusText}`);
            // Fallback to empty array if API fails
            return res.json([]);
        }

        const orders = await response.json();

        // Ensure strictly array is returned
        if (Array.isArray(orders)) {
            res.json(orders);
        } else {
            // In case API returns something weird
            console.error("WooCommerce API returned non-array for orders:", orders);
            res.json([]);
        }

    } catch (error) {
        console.error("Get WooCommerce orders error:", error);
        res.status(500).json({ detail: "Failed to fetch orders from WooCommerce" });
    }
});

router.get("/products", authenticate, async (req, res) => {
    try {
        const page = req.query.page || 1;
        const perPage = req.query.per_page || 20;
        const search = req.query.search || "";

        // 1. Get WooCommerce Settings
        const settings = await Settings.findAll({
            where: { group: 'woocommerce' }
        });

        let storeUrl = "";
        let consumerKey = "";
        let consumerSecret = "";

        settings.forEach(s => {
            if (s.key === 'woocommerce_store_url') storeUrl = s.value;
            if (s.key === 'woocommerce_consumer_key') consumerKey = s.value;
            if (s.key === 'woocommerce_consumer_secret') consumerSecret = s.value;
        });

        if (!storeUrl || !consumerKey || !consumerSecret) {
            // If settings not configured, return empty list or sample data
            return res.json([]);
        }

        // Ensure URL is clean
        storeUrl = storeUrl.replace(/\/$/, "");
        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

        let url = `${storeUrl}/wp-json/wc/v3/products?page=${page}&per_page=${perPage}`;
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }

        console.log(`Fetching products from: ${url}`);

        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });

        if (!response.ok) {
            console.error(`WooCommerce API Error: ${response.status} ${response.statusText}`);
            // Fallback to empty array if API fails
            return res.json([]);
        }

        const products = await response.json();
        res.json(products);

    } catch (error) {
        console.error("Get WooCommerce products error:", error);
        res.status(500).json({ detail: "Failed to fetch products from WooCommerce" });
    }
});

router.get("/products/:id", authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Get WooCommerce Settings
        const settings = await Settings.findAll({
            where: { group: 'woocommerce' }
        });

        let storeUrl = "";
        let consumerKey = "";
        let consumerSecret = "";

        settings.forEach(s => {
            if (s.key === 'woocommerce_store_url') storeUrl = s.value;
            if (s.key === 'woocommerce_consumer_key') consumerKey = s.value;
            if (s.key === 'woocommerce_consumer_secret') consumerSecret = s.value;
        });

        if (!storeUrl || !consumerKey || !consumerSecret) {
            return res.status(400).json({ detail: "WooCommerce settings not configured" });
        }

        // Ensure URL is clean
        storeUrl = storeUrl.replace(/\/$/, "");
        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

        const url = `${storeUrl}/wp-json/wc/v3/products/${id}`;

        console.log(`Fetching product ${id} from: ${url}`);

        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });

        if (!response.ok) {
            console.error(`WooCommerce API Error: ${response.status} ${response.statusText}`);
            if (response.status === 404) {
                return res.status(404).json({ detail: "Product not found on WooCommerce" });
            }
            return res.status(response.status).json({ detail: "Failed to fetch product from WooCommerce" });
        }

        const product = await response.json();
        res.json(product);

    } catch (error) {
        console.error("Get WooCommerce product error:", error);
        res.status(500).json({ detail: "Failed to fetch product from WooCommerce" });
    }
});

router.put("/products/:id", authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const productData = req.body;

        // 1. Get WooCommerce Settings
        const settings = await Settings.findAll({
            where: { group: 'woocommerce' }
        });

        let storeUrl = "";
        let consumerKey = "";
        let consumerSecret = "";

        settings.forEach(s => {
            if (s.key === 'woocommerce_store_url') storeUrl = s.value;
            if (s.key === 'woocommerce_consumer_key') consumerKey = s.value;
            if (s.key === 'woocommerce_consumer_secret') consumerSecret = s.value;
        });

        if (!storeUrl || !consumerKey || !consumerSecret) {
            return res.status(400).json({ detail: "WooCommerce settings not configured" });
        }

        // Ensure URL is clean
        storeUrl = storeUrl.replace(/\/$/, "");
        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

        const url = `${storeUrl}/wp-json/wc/v3/products/${id}`;

        console.log(`Updating product ${id} at: ${url}`);

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            console.error(`WooCommerce API Error: ${response.status} ${response.statusText}`);
            return res.status(response.status).json({ detail: "Failed to update product on WooCommerce" });
        }

        const updatedProduct = await response.json();

        // Also update local database if exists
        await Product.update({
            name: updatedProduct.name,
            sku: updatedProduct.sku,
            price: updatedProduct.price,
            regular_price: updatedProduct.regular_price,
            sale_price: updatedProduct.sale_price,
            stock_quantity: updatedProduct.stock_quantity,
            stock_status: updatedProduct.stock_status
        }, {
            where: { woocommerce_product_id: id }
        });

        res.json(updatedProduct);

    } catch (error) {
        console.error("Update WooCommerce product error:", error);
        res.status(500).json({ detail: "Failed to update product on WooCommerce" });
    }
});

router.get("/reports/totals", authenticate, async (req, res) => {
    // TODO: Implement actual WooCommerce API integration (Multiple calls: reports/products/count, orders, reports/customers/count)
    res.json({
        sales: 0,
        orders: [], // Array to prevent reduce error
        products: [], // Array to prevent find error
        customers: [], // Array to prevent find error
        items: 0,
        average_order_value: 0
    });
});

router.get("/customers", authenticate, async (req, res) => {
    try {
        const page = req.query.page || 1;
        const perPage = req.query.per_page || 20;
        const search = req.query.search || "";

        // 1. Get WooCommerce Settings
        const settings = await Settings.findAll({
            where: { group: 'woocommerce' }
        });

        let storeUrl = "";
        let consumerKey = "";
        let consumerSecret = "";

        settings.forEach(s => {
            if (s.key === 'woocommerce_store_url') storeUrl = s.value;
            if (s.key === 'woocommerce_consumer_key') consumerKey = s.value;
            if (s.key === 'woocommerce_consumer_secret') consumerSecret = s.value;
        });

        if (!storeUrl || !consumerKey || !consumerSecret) {
            return res.json([]);
        }

        // Ensure URL is clean
        storeUrl = storeUrl.replace(/\/$/, "");
        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

        let url = `${storeUrl}/wp-json/wc/v3/customers?page=${page}&per_page=${perPage}`;
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }

        console.log(`Fetching customers from: ${url}`);

        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });

        if (!response.ok) {
            console.error(`WooCommerce API Error: ${response.status} ${response.statusText}`);
            return res.json([]);
        }

        const customers = await response.json();

        if (Array.isArray(customers)) {
            res.json(customers);
        } else {
            console.error("WooCommerce API returned non-array for customers:", customers);
            res.json([]);
        }

    } catch (error) {
        console.error("Get WooCommerce customers error:", error);
        res.status(500).json({ detail: "Failed to fetch customers from WooCommerce" });
    }
});

module.exports = router;
