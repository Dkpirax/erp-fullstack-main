/**
 * WhatsApp Bot – Conversation Handler
 * ======================================
 * State machine that processes incoming WhatsApp messages and drives
 * a shopping conversation:
 *
 *  IDLE ──► BROWSING ──► PRODUCT_DETAIL ──► CART ──► CONFIRM ──► DONE
 *             │                                ▲
 *             └──────── search results ────────┘
 *
 * Each state decides what reply to send based on the incoming message type
 * (text, interactive reply, or list selection).
 */

'use strict';

const rag = require('./rag-engine');
const wa = require('./whatsapp-api');
const { getSession, clearSession } = require('./session-store');
const { placeOrder } = require('./order-manager');

// ─── Emoji & Formatting helpers ───────────────────────────────────────────────

const currencySymbol = process.env.CURRENCY_SYMBOL || 'Rs.';

function formatPrice(price) {
    return `${currencySymbol} ${parseFloat(price).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
}

function productLine(p) {
    const stock = p.stock_status === 'instock'
        ? `✅ In Stock (${p.stock_quantity})`
        : '❌ Out of Stock';
    return (
        `*${p.name}*\n` +
        `SKU: ${p.sku}\n` +
        `Price: ${formatPrice(p.price)}\n` +
        `${stock}\n` +
        (p.description ? `📝 ${p.description.slice(0, 120)}${p.description.length > 120 ? '…' : ''}` : '')
    ).trim();
}

function cartSummary(cart) {
    if (cart.length === 0) return '🛒 Your cart is empty.';
    let lines = ['🛒 *Your Cart:*\n'];
    let total = 0;
    cart.forEach((item, i) => {
        const subtotal = item.price * item.qty;
        total += subtotal;
        lines.push(`${i + 1}. ${item.name} × ${item.qty} = ${formatPrice(subtotal)}`);
    });
    lines.push(`\n💰 *Total: ${formatPrice(total)}*`);
    return lines.join('\n');
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Process one incoming webhook event object (a single message from the webhook).
 * @param {object} messageEvent - parsed object from Meta webhook
 */
async function handleMessage(messageEvent) {
    const phone = messageEvent.from;
    const session = getSession(phone);

    // Extract text / interactive reply from the message
    const { text, interactiveId, interactiveTitle } = extractContent(messageEvent);

    console.log(`[Bot] from=${phone} state=${session.state} text="${text}" interactiveId="${interactiveId}"`);

    // ── Global commands (work in any state) ───────────────────────────────────
    const normalized = (text || '').toLowerCase().trim();

    if (['hi', 'hello', 'hey', 'start', 'menu', 'home'].includes(normalized)) {
        session.state = 'IDLE';
        return sendMainMenu(phone, session);
    }

    if (['reset', 'cancel', 'quit', 'exit'].includes(normalized)) {
        clearSession(phone);
        return wa.sendText(phone,
            '🔄 Session reset. Send *hi* anytime to start shopping again!');
    }

    if (['cart', 'my cart', 'view cart'].includes(normalized)) {
        return sendCartView(phone, session);
    }

    if (['checkout', 'buy', 'order', 'place order'].includes(normalized)) {
        session.state = 'CONFIRM';
        return sendConfirmation(phone, session);
    }

    // ── State machine ─────────────────────────────────────────────────────────
    switch (session.state) {
        case 'IDLE':
            return handleIdle(phone, session, text, interactiveId);

        case 'BROWSING':
            return handleBrowsing(phone, session, text, interactiveId, interactiveTitle);

        case 'PRODUCT_DETAIL':
            return handleProductDetail(phone, session, text, interactiveId);

        case 'CART':
            return handleCart(phone, session, text, interactiveId, interactiveTitle);

        case 'CONFIRM':
            return handleConfirm(phone, session, text, interactiveId);

        case 'AWAIT_NAME':
            return handleAwaitName(phone, session, text);

        default:
            session.state = 'IDLE';
            return sendMainMenu(phone, session);
    }
}

// ─── State handlers ───────────────────────────────────────────────────────────

async function handleIdle(phone, session, text, interactiveId) {
    // Handle main-menu button choices
    if (interactiveId === 'browse_all') {
        session.state = 'BROWSING';
        return sendProductCatalogue(phone, session);
    }
    if (interactiveId === 'view_cart') {
        return sendCartView(phone, session);
    }

    // If user typed something that looks like a search, run RAG
    if (text && text.length > 1) {
        session.state = 'BROWSING';
        return runSearch(phone, session, text);
    }

    return sendMainMenu(phone, session);
}

async function handleBrowsing(phone, session, text, interactiveId, interactiveTitle) {
    // User selected a product from the list
    if (interactiveId && interactiveId.startsWith('product_')) {
        const productId = parseInt(interactiveId.replace('product_', ''), 10);
        session.selectedProductId = productId;
        session.state = 'PRODUCT_DETAIL';
        return sendProductDetail(phone, session, productId);
    }

    // User typed something → treat as a new search
    if (text && text.length > 1) {
        return runSearch(phone, session, text);
    }

    return wa.sendText(phone, 'Please choose a product from the list, or type a product name to search. 🔍');
}

async function handleProductDetail(phone, session, text, interactiveId) {
    if (interactiveId === 'add_to_cart') {
        return addToCart(phone, session, session.selectedProductId);
    }
    if (interactiveId === 'view_cart') {
        return sendCartView(phone, session);
    }
    if (interactiveId === 'back_browse') {
        session.state = 'BROWSING';
        return sendProductCatalogue(phone, session);
    }

    // User typed something → new search
    if (text && text.length > 1) {
        session.state = 'BROWSING';
        return runSearch(phone, session, text);
    }

    return sendProductDetailButtons(phone, session.selectedProductId);
}

async function handleCart(phone, session, text, interactiveId) {
    if (interactiveId === 'confirm_order') {
        session.state = 'CONFIRM';
        return sendConfirmation(phone, session);
    }
    if (interactiveId === 'clear_cart') {
        session.cart = [];
        await wa.sendText(phone, '🗑️ Cart cleared!');
        session.state = 'IDLE';
        return sendMainMenu(phone, session);
    }
    if (interactiveId === 'continue_shopping') {
        session.state = 'BROWSING';
        return sendProductCatalogue(phone, session);
    }

    if (text && text.length > 1) {
        session.state = 'BROWSING';
        return runSearch(phone, session, text);
    }

    return sendCartView(phone, session);
}

async function handleConfirm(phone, session, text, interactiveId) {
    if (interactiveId === 'yes_order' || (text || '').toLowerCase() === 'yes') {
        // Ask for name if not known
        if (!session.customerName) {
            session.state = 'AWAIT_NAME';
            return wa.sendText(phone,
                '✏️ Please enter your *full name* so we can prepare your order:');
        }
        return finalizeOrder(phone, session);
    }

    if (interactiveId === 'no_order' || ['no', 'back', 'cancel'].includes((text || '').toLowerCase())) {
        session.state = 'CART';
        return sendCartView(phone, session);
    }

    return sendConfirmation(phone, session);
}

async function handleAwaitName(phone, session, text) {
    if (!text || text.trim().length < 2) {
        return wa.sendText(phone, '❌ Please enter a valid name (at least 2 characters).');
    }
    session.customerName = text.trim();
    return finalizeOrder(phone, session);
}

// ─── Actions ──────────────────────────────────────────────────────────────────

async function sendMainMenu(phone, session) {
    const cartCount = session.cart.reduce((s, i) => s + i.qty, 0);
    const cartLabel = cartCount > 0 ? `View Cart (${cartCount})` : 'View Cart';

    await wa.sendButtons(phone,
        `👋 Welcome to *ERP Shop*!\n\nYou can:\n• Type a product name to search\n• Browse our full catalogue\n• View your cart\n\nHow can I help you today?`,
        [
            { id: 'browse_all', title: '🛍️ Browse All' },
            { id: 'view_cart', title: `🛒 ${cartLabel}` }
        ]
    );
}

async function sendProductCatalogue(phone, session) {
    const products = await rag.getAllProducts(10);

    if (products.length === 0) {
        session.state = 'IDLE';
        return wa.sendText(phone, '😔 No products are currently available. Please check back later!');
    }

    const rows = products.map(p => ({
        id: `product_${p.id}`,
        title: p.name.slice(0, 24),
        description: `${formatPrice(p.price)} • ${p.stock_status === 'instock' ? '✅ In Stock' : '❌ Out of Stock'}`
    }));

    await wa.sendList(phone, '🛍️ Our Products',
        'Browse our catalogue below. Tap a product to see details.',
        'View Products',
        [{ title: 'Available Products', rows }]
    );
}

async function runSearch(phone, session, query) {
    await wa.sendText(phone, `🔍 Searching for *"${query}"*…`);

    const results = await rag.search(query);

    if (results.length === 0) {
        await wa.sendText(phone,
            `😔 No products found for *"${query}"*.\n\nTry a different keyword or type *menu* to go back.`);
        return sendMainMenu(phone, session);
    }

    const rows = results.map(p => ({
        id: `product_${p.id}`,
        title: p.name.slice(0, 24),
        description: `${formatPrice(p.price)} • ${p.stock_status === 'instock' ? '✅ In Stock' : '❌ Out of Stock'}`
    }));

    await wa.sendList(phone,
        `🔍 Results for "${query}"`,
        `Found ${results.length} product(s). Tap one for details.`,
        'Select Product',
        [{ title: 'Search Results', rows }]
    );
}

async function sendProductDetail(phone, session, productId) {
    const product = await rag.getProductById(productId);

    if (!product) {
        await wa.sendText(phone, '❌ Product not found. Please try again.');
        session.state = 'BROWSING';
        return sendProductCatalogue(phone, session);
    }

    session.selectedProductId = productId;

    const detail = productLine(product);
    await wa.sendButtons(phone, detail, [
        { id: 'add_to_cart', title: '🛒 Add to Cart' },
        { id: 'view_cart', title: '📋 View Cart' },
        { id: 'back_browse', title: '◀️ Go Back' }
    ]);
}

async function sendProductDetailButtons(phone, productId) {
    const product = await rag.getProductById(productId);
    if (!product) return;
    const detail = productLine(product);
    await wa.sendButtons(phone, detail, [
        { id: 'add_to_cart', title: '🛒 Add to Cart' },
        { id: 'view_cart', title: '📋 View Cart' },
        { id: 'back_browse', title: '◀️ Go Back' }
    ]);
}

async function addToCart(phone, session, productId) {
    const product = await rag.getProductById(productId);

    if (!product) {
        return wa.sendText(phone, '❌ Product not found.');
    }
    if (product.stock_status !== 'instock' || product.stock_quantity <= 0) {
        return wa.sendText(phone,
            `😔 Sorry, *${product.name}* is currently out of stock.`);
    }

    // Check if already in cart
    const existing = session.cart.find(i => i.productId === productId);
    if (existing) {
        existing.qty += 1;
    } else {
        session.cart.push({
            productId: product.id,
            name: product.name,
            price: parseFloat(product.price),
            qty: 1
        });
    }

    await wa.sendText(phone,
        `✅ *${product.name}* added to cart!\n\nType *cart* to view your cart or continue browsing.`);

    session.state = 'CART';
    return sendCartView(phone, session);
}

async function sendCartView(phone, session) {
    session.state = 'CART';

    if (session.cart.length === 0) {
        await wa.sendText(phone, '🛒 Your cart is empty.\n\nType *hi* to start shopping!');
        session.state = 'IDLE';
        return sendMainMenu(phone, session);
    }

    const summary = cartSummary(session.cart);

    await wa.sendButtons(phone, summary, [
        { id: 'confirm_order', title: '✅ Checkout' },
        { id: 'continue_shopping', title: '🛍️ Keep Shopping' },
        { id: 'clear_cart', title: '🗑️ Clear Cart' }
    ]);
}

async function sendConfirmation(phone, session) {
    if (session.cart.length === 0) {
        return sendCartView(phone, session);
    }

    const summary = cartSummary(session.cart);
    const name = session.customerName ? `\n👤 Name: *${session.customerName}*` : '';

    await wa.sendButtons(phone,
        `${summary}${name}\n\nPayment: Cash on Delivery 💵\n\n*Confirm your order?*`,
        [
            { id: 'yes_order', title: '✅ Yes, Order!' },
            { id: 'no_order', title: '❌ Go Back' }
        ]
    );
}

async function finalizeOrder(phone, session) {
    try {
        await wa.sendText(phone, '⏳ Placing your order…');
        const order = await placeOrder(session);

        // Clear cart and reset
        const orderSummary = cartSummary(session.cart);
        session.cart = [];
        session.state = 'IDLE';

        await wa.sendText(phone,
            `🎉 *Order Placed Successfully!*\n\n` +
            `📋 Order #: *${order.order_number}*\n` +
            `${orderSummary}\n\n` +
            `Our team will contact you shortly to arrange delivery.\n` +
            `Thank you for shopping with us! 🙏\n\n` +
            `Type *hi* to continue shopping.`
        );
    } catch (err) {
        console.error('[Bot] Order placement failed:', err);
        await wa.sendText(phone,
            `❌ Sorry, we couldn't place your order right now.\n` +
            `Please try again or contact support.\n\nError: ${err.message}`
        );
    }
}

// ─── Content extractor ────────────────────────────────────────────────────────

/**
 * Extract a normalized text string and interactive IDs from the raw Meta
 * webhook message object.
 */
function extractContent(msg) {
    let text = null;
    let interactiveId = null;
    let interactiveTitle = null;

    if (msg.type === 'text') {
        text = msg.text?.body?.trim() || null;
    } else if (msg.type === 'interactive') {
        const ia = msg.interactive;
        if (ia.type === 'list_reply') {
            interactiveId = ia.list_reply?.id || null;
            interactiveTitle = ia.list_reply?.title || null;
        } else if (ia.type === 'button_reply') {
            interactiveId = ia.button_reply?.id || null;
            interactiveTitle = ia.button_reply?.title || null;
        }
    } else if (msg.type === 'button') {
        // Quick-reply buttons (older API)
        interactiveId = msg.button?.payload || null;
        interactiveTitle = msg.button?.text || null;
    }

    return { text, interactiveId, interactiveTitle };
}

module.exports = { handleMessage };
