/**
 * WhatsApp Webhook Route
 * =======================
 * Handles two HTTP endpoints:
 *
 *  GET  /api/v1/whatsapp/webhook  – Meta verification handshake
 *  POST /api/v1/whatsapp/webhook  – Incoming messages from Meta
 *
 * Setup in Meta Developer Portal:
 *   Webhook URL   : https://<your-domain>/api/v1/whatsapp/webhook
 *   Verify Token  : value of WEBHOOK_VERIFY_TOKEN in .env
 *   Subscribed fields: messages
 */

'use strict';

const express = require('express');
const router = express.Router();
const { handleMessage } = require('../whatsapp/bot-handler');

// ─── GET /api/v1/whatsapp/webhook  – Meta verification ───────────────────────
router.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
        console.log('[WhatsApp] Webhook verified ✅');
        return res.status(200).send(challenge);
    }

    console.warn('[WhatsApp] Webhook verification failed. Check WEBHOOK_VERIFY_TOKEN.');
    res.sendStatus(403);
});

// ─── POST /api/v1/whatsapp/webhook  – Incoming messages ──────────────────────
router.post('/webhook', async (req, res) => {
    try {
        // Acknowledge receipt immediately (Meta requires < 20s response)
        res.sendStatus(200);

        const body = req.body;

        // Validate it is a WhatsApp message event
        if (body.object !== 'whatsapp_business_account') return;

        const entries = body.entry || [];
        for (const entry of entries) {
            const changes = entry.changes || [];
            for (const change of changes) {
                if (change.field !== 'messages') continue;

                const value = change.value || {};
                const messages = value.messages || [];

                for (const message of messages) {
                    // Skip non-user message types (status updates, etc.)
                    if (!message.from) continue;

                    // Fire-and-forget (errors are logged inside handleMessage)
                    handleMessage(message).catch(err =>
                        console.error('[WhatsApp] handleMessage error:', err)
                    );
                }
            }
        }
    } catch (err) {
        console.error('[WhatsApp] Webhook POST error:', err);
        // res already sent – can't send again
    }
});

// ─── GET /api/v1/whatsapp/status  – Health / status endpoint ─────────────────
router.get('/status', (req, res) => {
    res.json({
        status: 'online',
        configured: !!(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN),
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || 'NOT SET',
        verifyToken: process.env.WEBHOOK_VERIFY_TOKEN || 'NOT SET',
        webhookUrl: `${process.env.WEBHOOK_BASE_URL || 'http://localhost:' + (process.env.PORT || 3000)}/api/v1/whatsapp/webhook`
    });
});

module.exports = router;
