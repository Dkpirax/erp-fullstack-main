const express = require("express");
const router = express.Router();

// Mount sub-routers
router.use('/', require('./auth'));       // Handles /login/..., /users/me
router.use('/users', require('./users')); // Handles /users (list, create), /users/:id (update, delete)
router.use('/acl', require('./rbac'));    // Handles /acl/permissions
router.use('/', require('./companies'));  // Handles /companies, /branches
router.use('/woocommerce', require('./woocommerce')); // Handles /woocommerce/settings, /woocommerce/sync/products, etc.
router.use('/products', require('./products')); // Handles /products
router.use('/pos', require('./pos'));     // Handles /pos/sessions/active, /pos/orders
router.use('/crm', require('./crm'));     // Handles /crm/customers
router.use('/supply-chain', require('./supply-chain')); // Handles /supply-chain/products, /supply-chain/suppliers
router.use('/finance', require('./finance')); // Handles /finance/accounts, etc.
router.use('/coupons', require('./coupons')); // Handles /coupons
router.use('/loyalty', require('./loyalty')); // Handles /loyalty/settings
router.use('/social-media', require('./social')); // Handles /social-media/messages
router.use('/chat', require('./chat'));   // Handles /chat/history/:userId, /chat/notifications
router.use('/', require('./system'));     // Handles /health

// DB Sync (Keep internal only or move to server.js? 
// The original api.js ran this sync IIFE. ideally this should be in server.js, 
// but to be safe and duplicate existing behavior I can leave it here or better, 
// move it to a dedicated file or server.js.
// However, the user asked to "create different routes". 
// The sync logic isn't a route.
// In the original file: lines 1396-1408
// (async () => { try { await Coupon.sync... } ... })();
// It is better to move this to server.js or a separate startup script, 
// but since I am refactoring `api.js`, I should probably ensure it still runs.
// `server.js` calls `sequelize.sync({ alter: true })` at line 59.
// The original `api.js` block seems redundant or specific to certain models.
// `server.js` syncs ALL models if imported?
// `api.js` was importing specific models and syncing them again.
// Let's verify `server.js` sync logic.
// `server.js`: await sequelize.sync({ alter: true });
// This syncs all models defined in sequelize instance.
// Provided `require('./models/User')` is called, etc.
// In `api.js` refactor, models are required in subfiles.
// `server.js` requires `api.js` (which requires subfiles) BEFORE calling startServer?
// `const apiRoutes = require("./routes/api");` is at top level.
// So subfiles are required.
// So models are required.
// So `sequelize.models` is populated.
// So `sequelize.sync` in `server.js` should cover it.
// The block in `api.js` was likely a duplicate or explicit safety measure.
// I will omit the IIFE sync block in `api.js` as it is redundant with `server.js`.
// The user has `server.js` calling `.sync()`.

module.exports = router;
