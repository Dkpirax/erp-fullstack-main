/**
 * WhatsApp Bot – Session / Order Store
 * ----------------------------------------
 * Lightweight in-memory session store for multi-turn conversations.
 * Falls back gracefully – no Redis required.
 *
 * Session shape:
 * {
 *   state:        'IDLE' | 'BROWSING' | 'PRODUCT_DETAIL' | 'CART' | 'CONFIRM' | 'CHECKOUT'
 *   lastActivity: timestamp (ms)
 *   cart:         [{ productId, name, price, qty }]
 *   selectedProductId: number | null
 *   customerName: string | null
 *   customerPhone: string (the WhatsApp "from" number)
 * }
 */

'use strict';

const SESSION_TTL_MS = 30 * 60 * 1000; // 30-minute inactivity timeout

const sessions = new Map();

function getSession(phone) {
    const existing = sessions.get(phone);
    if (existing) {
        // Expire stale sessions
        if (Date.now() - existing.lastActivity > SESSION_TTL_MS) {
            sessions.delete(phone);
            return createSession(phone);
        }
        existing.lastActivity = Date.now();
        return existing;
    }
    return createSession(phone);
}

function createSession(phone) {
    const session = {
        state: 'IDLE',
        lastActivity: Date.now(),
        cart: [],
        selectedProductId: null,
        customerName: null,
        customerPhone: phone
    };
    sessions.set(phone, session);
    return session;
}

function clearSession(phone) {
    sessions.delete(phone);
}

// Purge expired sessions every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [phone, session] of sessions.entries()) {
        if (now - session.lastActivity > SESSION_TTL_MS) {
            sessions.delete(phone);
        }
    }
}, 10 * 60 * 1000);

module.exports = { getSession, clearSession };
