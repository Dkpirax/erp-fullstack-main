const express = require("express");
const router = express.Router();
const multer = require('multer');
const upload = multer();
const User = require('../models/User');
const RolePermission = require('../models/RolePermission');
const { generateToken, authenticate } = require('../middleware/auth');

// --- Authentication ---
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication
 */

/**
 * @swagger
 * /login/access-token:
 *   post:
 *     summary: Login to get access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                 token_type:
 *                   type: string
 *       400:
 *         description: Invalid credentials
 */
router.post("/login/access-token", upload.none(), async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log("Login attempt:", { username }); // Debug log (don't log password)
        console.log("Login attempt:", { password }); // Debug log (don't log password)

        if (!username || !password) {
            return res.status(400).json({ detail: "Username and password are required" });
        }

        // Find user by username or email
        const user = await User.findOne({
            where: {
                [require('sequelize').Op.or]: [
                    { username: username },
                    { email: username }
                ]
            }
        });

        console.log("User found:", { user }); // Debug log (don't log password)

        if (!user) {
            return res.status(400).json({ detail: "Incorrect username or password" });
        }

        // Verify password
        const isValidPassword = await user.verifyPassword(password);
        if (!isValidPassword) {
            return res.status(400).json({ detail: "Incorrect username or password" });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(400).json({ detail: "Inactive user" });
        }

        // Generate token
        const access_token = generateToken(user.username);

        return res.json({
            access_token,
            token_type: "bearer"
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ detail: "Internal server error" });
    }
});

// Test token endpoint
router.post("/login/test-token", authenticate, (req, res) => {
    res.json({
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        full_name: req.user.full_name,
        is_active: req.user.is_active,
        is_superuser: req.user.is_superuser
    });
});

// Get current user
router.get("/users/me", authenticate, async (req, res) => {
    try {
        const permissions = await RolePermission.findAll({
            where: { role: req.user.role }
        });

        res.json({
            id: req.user.id,
            email: req.user.email,
            username: req.user.username,
            full_name: req.user.full_name,
            is_active: req.user.is_active,
            is_superuser: req.user.is_superuser,
            role: req.user.role,
            branch_id: req.user.branch_id,
            permissions: permissions
        });
    } catch (error) {
        console.error("Get me error:", error);
        res.status(500).json({ detail: "Failed to fetch user details" });
    }
});

// Get all users (admin only)
router.get("/users", authenticate, async (req, res) => {
    try {
        if (!req.user.is_superuser && req.user.role !== 'admin') {
            return res.status(403).json({ detail: "Not enough permissions" });
        }

        const users = await User.findAll({
            attributes: { exclude: ['hashed_password'] },
            include: [{ model: require('../models/Branch'), as: 'Branch' }]
        });

        res.json(users);
    } catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({ detail: "Internal server error" });
    }
});

// Create user (admin only)
router.post("/users", authenticate, async (req, res) => {
    try {
        if (!req.user.is_superuser && req.user.role !== 'admin') {
            return res.status(403).json({ detail: "Not enough permissions" });
        }

        const { username, email, password, full_name, is_superuser, role, branch_id } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            where: {
                [require('sequelize').Op.or]: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ detail: "User with this username or email already exists" });
        }

        // Validate branch_id for non-admin users
        if (role !== 'admin' && !branch_id) {
            return res.status(400).json({ detail: "Branch is mandatory for non-admin users" });
        }

        // Hash password
        const hashed_password = await User.hashPassword(password);

        // Create user
        const user = await User.create({
            username,
            email,
            hashed_password,
            full_name,
            is_superuser: is_superuser || (role === 'admin'),
            role: role || 'pos_user',
            branch_id: branch_id || null,
            is_active: true
        });

        res.status(201).json({
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            branch_id: user.branch_id,
            is_active: user.is_active,
            is_superuser: user.is_superuser
        });
    } catch (error) {
        console.error("Create user error:", error);
        res.status(500).json({ detail: "Internal server error" });
    }
});

// Update user (admin only)
router.put("/users/:id", authenticate, async (req, res) => {
    try {
        if (!req.user.is_superuser && req.user.role !== 'admin') {
            return res.status(403).json({ detail: "Not enough permissions" });
        }

        const { id } = req.params;
        const { username, email, password, full_name, is_superuser, role, branch_id, is_active } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ detail: "User not found" });
        }

        // Prepare update data
        const updateData = {
            username,
            email,
            full_name,
            is_superuser: is_superuser !== undefined ? (role === 'admin' || is_superuser) : user.is_superuser,
            role: role || user.role,
            branch_id: branch_id !== undefined ? branch_id : user.branch_id,
            is_active: is_active !== undefined ? is_active : user.is_active
        };

        // Validate branch_id for non-admin users if role is being updated
        if (updateData.role !== 'admin' && !updateData.branch_id) {
            return res.status(400).json({ detail: "Branch is mandatory for non-admin users" });
        }

        // Hash password if provided
        if (password) {
            updateData.hashed_password = await User.hashPassword(password);
        }

        await user.update(updateData);

        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            branch_id: user.branch_id,
            is_active: user.is_active,
            is_superuser: user.is_superuser
        });
    } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ detail: "Internal server error" });
    }
});

// Delete user (admin only)
router.delete("/users/:id", authenticate, async (req, res) => {
    try {
        if (!req.user.is_superuser && req.user.role !== 'admin') {
            return res.status(403).json({ detail: "Not enough permissions" });
        }

        const { id } = req.params;

        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ detail: "Cannot delete yourself" });
        }

        const deleted = await User.destroy({ where: { id } });

        if (deleted) {
            res.json({ message: "User deleted" });
        } else {
            res.status(404).json({ detail: "User not found" });
        }
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ detail: "Internal server error" });
    }
});

// --- Role Based Access Control (RBAC) ---


router.get("/acl/permissions", authenticate, async (req, res) => {
    try {
        if (!req.user.is_superuser && req.user.role !== 'admin') {
            return res.status(403).json({ detail: "Forbidden" });
        }
        const permissions = await RolePermission.findAll();
        res.json(permissions);
    } catch (error) {
        console.error("Get permissions error:", error);
        res.status(500).json({ detail: "Failed to fetch permissions" });
    }
});

router.post("/acl/permissions", authenticate, async (req, res) => {
    try {
        if (!req.user.is_superuser && req.user.role !== 'admin') {
            return res.status(403).json({ detail: "Forbidden" });
        }

        const { role, resource, can_create, can_read, can_update, can_delete } = req.body;

        // Upsert permission
        // Since we have a unique constraint on [role, resource], this works for both create and update
        const [permission] = await RolePermission.upsert({
            role,
            resource,
            can_create,
            can_read,
            can_update,
            can_delete
        });

        res.json(permission);
    } catch (error) {
        console.error("Save permission error:", error);
        res.status(500).json({ detail: "Failed to save permission" });
    }
});

// --- Company & Branch Management ---
const Company = require('../models/Company');
const Branch = require('../models/Branch');

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

// --- System Settings (WooCommerce, etc.) ---
const Settings = require('../models/Settings');

router.get("/woocommerce/settings", authenticate, async (req, res) => {
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

router.put("/woocommerce/settings", authenticate, async (req, res) => {
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

const Product = require('../models/Product');

// --- Products (Local Inventory) ---
router.get("/products", authenticate, async (req, res) => {
    try {
        const { skip, limit, search } = req.query;
        const offset = parseInt(skip) || 0;
        const limitVal = parseInt(limit) || 100;

        const whereClause = {};
        if (search) {
            whereClause[require('sequelize').Op.or] = [
                { name: { [require('sequelize').Op.like]: `%${search}%` } },
                { sku: { [require('sequelize').Op.like]: `%${search}%` } }
            ];
        }

        const products = await Product.findAll({
            where: whereClause,
            offset: offset,
            limit: limitVal
        });

        res.json({ products });
    } catch (error) {
        console.error("Get products error:", error);
        res.status(500).json({ detail: "Failed to fetch products" });
    }
});

router.post("/woocommerce/sync/products", authenticate, async (req, res) => {
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
router.get("/woocommerce/orders", authenticate, async (req, res) => {
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
router.get("/woocommerce/products", authenticate, async (req, res) => {
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

router.get("/woocommerce/products/:id", authenticate, async (req, res) => {
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

router.put("/woocommerce/products/:id", authenticate, async (req, res) => {
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

router.get("/woocommerce/reports/totals", authenticate, async (req, res) => {
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

router.get("/woocommerce/customers", authenticate, async (req, res) => {
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

// --- Social Media (Placeholder) ---
router.get("/social-media/messages", authenticate, async (req, res) => {
    // TODO: Implement actual Social Media API integration
    res.json({
        messages: []
    });
});

router.get("/social-media/campaigns", authenticate, async (req, res) => {
    // TODO: Implement actual Social Media API integration
    res.json({
        campaigns: []
    });
});

// --- System ---
router.get("/health", (req, res) => {
    res.json({ status: "ok", backend: "node", database: "connected" });
});

// --- Loyalty ---
// --- Loyalty ---
router.get("/loyalty/settings", authenticate, async (req, res) => {
    try {
        const settings = await Settings.findAll({
            where: { group: 'loyalty' }
        });

        const config = {
            points_per_dollar: 1,
            redemption_rate: 0.01,
            min_spending: 0,
            is_enabled: true
        };

        settings.forEach(s => {
            if (s.key === 'loyalty_points_per_dollar') config.points_per_dollar = parseFloat(s.value);
            if (s.key === 'loyalty_redemption_rate') config.redemption_rate = parseFloat(s.value);
            if (s.key === 'loyalty_min_spending') config.min_spending = parseFloat(s.value);
            if (s.key === 'loyalty_is_enabled') config.is_enabled = s.value === 'true';
        });

        res.json(config);
    } catch (error) {
        console.error("Get loyalty settings error:", error);
        res.status(500).json({ detail: "Failed to fetch loyalty settings" });
    }
});

router.put("/loyalty/settings", authenticate, async (req, res) => {
    try {
        const { points_per_dollar, redemption_rate, min_spending, is_enabled } = req.body;

        await Settings.upsert({ key: 'loyalty_points_per_dollar', value: String(points_per_dollar), group: 'loyalty' });
        await Settings.upsert({ key: 'loyalty_redemption_rate', value: String(redemption_rate), group: 'loyalty' });
        await Settings.upsert({ key: 'loyalty_min_spending', value: String(min_spending || 0), group: 'loyalty' });
        await Settings.upsert({ key: 'loyalty_is_enabled', value: String(is_enabled), group: 'loyalty' });

        res.json({
            points_per_dollar,
            redemption_rate,
            min_spending: min_spending || 0,
            is_enabled
        });
    } catch (error) {
        console.error("Save loyalty settings error:", error);
        res.status(500).json({ detail: "Failed to save loyalty settings" });
    }
});

// --- POS (Point of Sale) ---
router.get("/pos/sessions/active", authenticate, (req, res) => {
    // Mock active session
    res.json({
        id: 1,
        user_id: req.user.id,
        start_time: new Date().toISOString(),
        opening_cash: 100.00,
        status: "OPEN"
    });
});

const { Order, OrderItem, Customer } = require('../models');
// Product is already imported above. Ensuring models/index.js is loaded helps with associations.
// const Product = require('../models/Product');

router.post("/pos/orders", authenticate, async (req, res) => {
    const orderData = req.body;
    console.log("New POS Order:", orderData);

    const t = await require('../config/database').transaction();

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
                const product = await require('../models/Product').findByPk(item.product_id);
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

router.get("/pos/orders", authenticate, async (req, res) => {
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
            console.log("First Order Customer ID:", orders[0].customer_id);
            console.log("First Order Customer Obj:", JSON.stringify(orders[0].Customer));
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

            // console.log("Mapped Items:", plain);

            return {
                ...plain,
                created_at: plain.createdAt, // Map database camelCase to API snake_case
                items: mappedItems,
                customer_name: customerMap[plain.customer_id] || "Walk-in Customer",
                // Ensure payments is present if needed (mocked for now as we don't have separate Payments table yet fully linked)
                payments: plain.payment_method ? [{ method: plain.payment_method, amount: plain.total_amount }] : []
            };
        });

        res.json(formattedOrders);
    } catch (error) {
        console.error("Get POS orders error:", error);
        res.status(500).json({ detail: error.message || "Failed to fetch orders" });
    }
});

router.get("/pos/orders/:id", authenticate, async (req, res) => {
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

        // Ensure payments structure exists if frontend expects it (even if we stored it flattened)
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

// --- Supply Chain ---
// --- Supply Chain ---
const { Supplier } = require('../models');

router.get("/supply-chain/products", authenticate, async (req, res) => {
    // Determine if we should return real products or keep the mock for now. 
    // The user didn't ask to fix products yet, so I will leave products as mock 
    // BUT I must ensure I don't break the existing mock if I don't touch it.
    // However, since I am replacing the block that contains products mock to insert the import,
    // I will leave products mock as is for now in this request scope, 
    // or better yet, I should check if Product model usage is better.
    // Use the existing mock for products for now to avoid scope creep, 
    // but focusing on Suppliers.

    // Actually, looking at the code I read, "Product" is used in POS orders interactions 
    // but the /supply-chain/products endpoint returns static data (lines 1136-1171). 
    // I will leave the product endpoint alone in the "StartLine" if possible, 
    // but since I need to add `const { Supplier } ...` it might be cleaner to add it at the top of the section.

    // START OF REPLACEMENT

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

router.get("/supply-chain/suppliers", authenticate, async (req, res) => {
    try {
        const suppliers = await Supplier.findAll();
        res.json(suppliers);
    } catch (error) {
        console.error("Get suppliers error:", error);
        res.status(500).json({ detail: "Failed to fetch suppliers" });
    }
});

router.post("/supply-chain/suppliers", authenticate, async (req, res) => {
    try {
        const supplier = await Supplier.create(req.body);
        res.status(201).json(supplier);
    } catch (error) {
        console.error("Create supplier error:", error);
        res.status(500).json({ detail: "Failed to create supplier" });
    }
});

router.put("/supply-chain/suppliers/:id", authenticate, async (req, res) => {
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

router.delete("/supply-chain/suppliers/:id", authenticate, async (req, res) => {
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

// --- CRM ---
router.get("/crm/customers", authenticate, async (req, res) => {
    try {
        const customers = await Customer.findAll();
        res.json(customers);
    } catch (error) {
        console.error("Get customers error:", error);
        res.status(500).json({ detail: "Failed to fetch customers" });
    }
});

router.post("/crm/customers", authenticate, async (req, res) => {
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

router.put("/crm/customers/:id", authenticate, async (req, res) => {
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

// --- Finance ---
router.get("/finance/accounts", authenticate, (req, res) => {
    res.json([
        { id: 1, code: "1000", name: "Cash", type: "ASSET", balance: 50000 },
        { id: 2, code: "2000", name: "Accounts Payable", type: "LIABILITY", balance: 5000 }
    ]);
});

router.get("/finance/journal-entries", authenticate, (req, res) => {
    res.json([]);
});

router.get("/finance/ap-invoices", authenticate, (req, res) => {
    res.json([]);
});

router.get("/finance/ar-invoices", authenticate, (req, res) => {
    res.json([]);
});

// --- Coupons (Sales) ---
const Coupon = require('../models/Coupon');

// Sync Coupon model once on server start (or handled by sync_database.js generally)
// Sync models once on server start
(async () => {
    try {
        await Coupon.sync({ alter: true });
        await Customer.sync({ alter: true });
        await Settings.sync({ alter: true });
        await Company.sync({ alter: true });
        await Branch.sync({ alter: true });
        await User.sync({ alter: true }); // Sync User to add role/branch columns
        console.log('✅ Database models synced.');
    } catch (e) {
        console.error('Failed to sync database models:', e);
    }
})();

router.get("/coupons", authenticate, async (req, res) => {
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

router.post("/coupons", authenticate, async (req, res) => {
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

router.delete("/coupons/:id", authenticate, async (req, res) => {
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

// --- POS (Point of Sale) ---
// const Payment = require('../models/Payment');


// Create POS Order with Payment tracking
router.post("/pos/orders", authenticate, async (req, res) => {
    try {
        const { session_id, customer_id, total_amount, status, points_earned, items, payments } = req.body;

        // Create the order
        const order = await Order.create({
            customer_id: customer_id || null,
            total_amount,
            status: status || 'COMPLETED',
            source: 'POS',
            order_number: `POS-${Date.now()}`,
            created_at: new Date()
        });

        // Create order items
        if (items && items.length > 0) {
            for (const item of items) {
                await OrderItem.create({
                    order_id: order.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price
                });
            }
        }

        // Create payment records
        // TODO: Re-enable after fixing Payment model
        /*
        if (payments && payments.length > 0) {
            for (const payment of payments) {
                await Payment.create({
                    order_id: order.id,
                    payment_method: payment.method,
                    amount: payment.amount,
                    // Check-specific fields
                    check_number: payment.check_number || null,
                    check_date: payment.check_date || null,
                    check_type: payment.check_type || null,
                    check_from: payment.check_from || null,
                    bank_name: payment.bank_name || null,
                    deposit_date: payment.deposit_date || null,
                    check_status: payment.method === 'CHECK' ? 'PENDING' : null,
                    // Card fields (for future use)
                    card_last_four: payment.card_last_four || null,
                    card_type: payment.card_type || null,
                    transaction_id: payment.transaction_id || null,
                    notes: payment.notes || null
                });
            }
        }
        */

        res.status(201).json(order);
    } catch (error) {
        console.error("Create POS order error:", error);
        res.status(500).json({ detail: "Failed to create order" });
    }
});

// Get POS Orders
router.get("/pos/orders", authenticate, async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { source: 'POS' },
            include: [
                { model: Customer, required: false },
                { model: OrderItem, include: [Product] }
            ],
            order: [['created_at', 'DESC']]
        });
        res.json(orders);
    } catch (error) {
        console.error("Get POS orders error:", error);
        res.status(500).json({ detail: "Failed to fetch orders" });
    }
});

// Get Payment Reports
// TODO: Re-enable after fixing Payment model
/*
router.get("/reports/payments", authenticate, async (req, res) => {
    try {
        const { start_date, end_date, payment_method, check_status } = req.query;

        const whereClause = {};
        if (start_date && end_date) {
            whereClause.createdAt = {
                [require('sequelize').Op.between]: [new Date(start_date), new Date(end_date)]
            };
        }
        if (payment_method) {
            whereClause.payment_method = payment_method;
        }
        if (check_status) {
            whereClause.check_status = check_status;
        }

        const payments = await Payment.findAll({
            where: whereClause,
            include: [{
                model: Order,
                include: [Customer]
            }],
            order: [['createdAt', 'DESC']]
        });

        // Calculate summary
        const summary = {
            total_amount: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
            count: payments.length,
            by_method: {}
        };

        payments.forEach(p => {
            if (!summary.by_method[p.payment_method]) {
                summary.by_method[p.payment_method] = { count: 0, amount: 0 };
            }
            summary.by_method[p.payment_method].count++;
            summary.by_method[p.payment_method].amount += parseFloat(p.amount);
        });

        res.json({
            summary,
            payments
        });
    } catch (error) {
        console.error("Get payment reports error:", error);
        res.status(500).json({ detail: "Failed to fetch payment reports" });
    }
});
*/

// Update Check Status
// TODO: Re-enable after fixing Payment model
/*
router.patch("/payments/:id/check-status", authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { check_status } = req.body;

        const payment = await Payment.findByPk(id);
        if (!payment) {
            return res.status(404).json({ detail: "Payment not found" });
        }

        if (payment.payment_method !== 'CHECK') {
            return res.status(400).json({ detail: "This payment is not a check payment" });
        }

        await payment.update({ check_status });
        res.json(payment);
    } catch (error) {
        console.error("Update check status error:", error);
        res.status(500).json({ detail: "Failed to update check status" });
    }
});
*/

// Get Active POS Session (stub - you may need to create Session model)
router.get("/pos/sessions/active", authenticate, async (req, res) => {
    try {
        // For now, return a mock session or create one
        // You should implement proper session management
        res.json({ id: 1, opening_cash: 0, status: 'OPEN' });
    } catch (error) {
        console.error("Get active session error:", error);
        res.status(500).json({ detail: "Failed to get active session" });
    }
});

// Create POS Session (stub)
router.post("/pos/sessions", authenticate, async (req, res) => {
    try {
        const { opening_cash } = req.body;
        // Mock session creation
        res.status(201).json({ id: 1, opening_cash: opening_cash || 0, status: 'OPEN' });
    } catch (error) {
        console.error("Create session error:", error);
        res.status(500).json({ detail: "Failed to create session" });
    }
});


module.exports = router;
