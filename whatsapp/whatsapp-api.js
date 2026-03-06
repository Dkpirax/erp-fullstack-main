/**
 * WhatsApp Cloud API – Sender Helper
 * -----------------------------------
 * Wraps the Meta WhatsApp Business Cloud API v19.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

'use strict';

const axios = require('axios');

const BASE_URL = 'https://graph.facebook.com/v19.0';

function getPhoneNumberId() {
    return process.env.WHATSAPP_PHONE_NUMBER_ID;
}

function getToken() {
    return process.env.WHATSAPP_ACCESS_TOKEN;
}

/** Send a plain text message */
async function sendText(to, text) {
    return _send(to, {
        type: 'text',
        text: { body: text, preview_url: false }
    });
}

/**
 * Send an interactive list message (sections with rows).
 * @param {string} to - recipient phone number (E.164)
 * @param {string} headerText - bold header text (max 60 chars)
 * @param {string} bodyText   - main message body
 * @param {string} buttonLabel - button label (max 20 chars)
 * @param {Array}  sections   - [{ title, rows: [{ id, title, description }] }]
 */
async function sendList(to, headerText, bodyText, buttonLabel, sections) {
    return _send(to, {
        type: 'interactive',
        interactive: {
            type: 'list',
            header: { type: 'text', text: headerText.slice(0, 60) },
            body: { text: bodyText.slice(0, 1024) },
            footer: { text: 'Powered by ERP Shop 🛒' },
            action: {
                button: buttonLabel.slice(0, 20),
                sections
            }
        }
    });
}

/**
 * Send an interactive reply-button message (max 3 buttons).
 * @param {string} to
 * @param {string} bodyText
 * @param {Array}  buttons  - [{ id, title }]
 */
async function sendButtons(to, bodyText, buttons) {
    return _send(to, {
        type: 'interactive',
        interactive: {
            type: 'button',
            body: { text: bodyText.slice(0, 1024) },
            footer: { text: 'Powered by ERP Shop 🛒' },
            action: {
                buttons: buttons.slice(0, 3).map(b => ({
                    type: 'reply',
                    reply: { id: b.id, title: b.title.slice(0, 20) }
                }))
            }
        }
    });
}

/** Low-level: POST a message payload to the Cloud API */
async function _send(to, messagePayload) {
    const phoneId = getPhoneNumberId();
    const token = getToken();

    if (!phoneId || !token) {
        console.warn('[WhatsApp] WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN not set – skipping send.');
        return null;
    }

    try {
        const body = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            ...messagePayload
        };

        const response = await axios.post(
            `${BASE_URL}/${phoneId}/messages`,
            body,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );
        return response.data;
    } catch (err) {
        const errData = err.response?.data || err.message;
        console.error('[WhatsApp] Send error:', JSON.stringify(errData, null, 2));
        throw err;
    }
}

module.exports = { sendText, sendList, sendButtons };
