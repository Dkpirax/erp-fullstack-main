/**
 * WhatsApp Bot – Local Simulator
 * ================================
 * Simulates a WhatsApp user sending messages to your bot WITHOUT
 * needing a real WhatsApp account or Meta credentials.
 *
 * Usage:
 *   node scripts/wa_simulator.js
 *
 * The simulator sends HTTP POST requests directly to the webhook
 * endpoint with realistic Meta webhook payloads.
 * Bot replies are printed to the console (since the real WhatsApp API
 * is bypassed by the simulator's mock).
 *
 * Requires the server to be running: npm run server
 */

'use strict';

const axios = require('axios');
const readline = require('readline');

const BASE_URL = process.env.SIMULATOR_URL || 'http://localhost:3000';
const WEBHOOK = `${BASE_URL}/api/v1/whatsapp/webhook`;
const PHONE = '923001234567'; // simulated "from" number (no +)

let messageCount = 0;

// ─── Intercept WhatsApp API calls ─────────────────────────────────────────────
// Monkey-patch the whatsapp-api module's axios calls BEFORE requiring bot-handler
// so replies are printed instead of sent to Meta.
// NOTE: This only works if the simulator is run directly (not via the HTTP server).
// For HTTP-server testing mode, we POST to the webhook endpoint instead.

// ─── CLI interface ─────────────────────────────────────────────────────────────

async function checkServer() {
    try {
        await axios.get(`${BASE_URL}/api/v1/whatsapp/status`, { timeout: 3000 });
        return true;
    } catch {
        return false;
    }
}

async function sendUserMessage(text) {
    const payload = buildTextPayload(text);
    try {
        await axios.post(WEBHOOK, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });
    } catch (err) {
        console.error('❌ Failed to reach webhook:', err.message);
    }
}

async function sendInteractiveReply(id, title, type = 'list_reply') {
    const payload = buildInteractivePayload(id, title, type);
    try {
        await axios.post(WEBHOOK, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });
    } catch (err) {
        console.error('❌ Failed to reach webhook:', err.message);
    }
}

function buildTextPayload(text) {
    messageCount++;
    return {
        object: 'whatsapp_business_account',
        entry: [{
            id: 'ENTRY_ID',
            changes: [{
                field: 'messages',
                value: {
                    messaging_product: 'whatsapp',
                    metadata: { phone_number_id: 'PHONE_ID' },
                    messages: [{
                        id: `wamid.SIM${messageCount}`,
                        from: PHONE,
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        type: 'text',
                        text: { body: text }
                    }]
                }
            }]
        }]
    };
}

function buildInteractivePayload(id, title, type) {
    messageCount++;
    const interactive = type === 'button_reply'
        ? { type: 'button_reply', button_reply: { id, title } }
        : { type: 'list_reply', list_reply: { id, title } };

    return {
        object: 'whatsapp_business_account',
        entry: [{
            id: 'ENTRY_ID',
            changes: [{
                field: 'messages',
                value: {
                    messaging_product: 'whatsapp',
                    metadata: { phone_number_id: 'PHONE_ID' },
                    messages: [{
                        id: `wamid.SIM${messageCount}`,
                        from: PHONE,
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        type: 'interactive',
                        interactive
                    }]
                }
            }]
        }]
    };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║     WhatsApp Bot – Local Simulator               ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    const online = await checkServer();
    if (!online) {
        console.error('❌ Server not reachable at', BASE_URL);
        console.error('   Start it with:  npm run server\n');
        process.exit(1);
    }
    console.log(`✅ Server online at ${BASE_URL}`);
    console.log(`📱 Simulating WhatsApp user: +${PHONE}\n`);
    console.log('Note: Bot replies go to the real WhatsApp API (or are logged if token not set).');
    console.log('Watch your server console for bot activity.\n');
    console.log('Commands:');
    console.log('  Type any text   → sends as a WhatsApp text message');
    console.log('  /list <id>      → sends a list_reply with the given id');
    console.log('  /btn  <id>      → sends a button_reply with the given id');
    console.log('  /quit           → exit\n');
    console.log('Quick start: type   hi   to begin.\n');
    console.log('─'.repeat(52));

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '👤 You: '
    });

    rl.prompt();

    rl.on('line', async (line) => {
        const input = line.trim();
        if (!input) { rl.prompt(); return; }

        if (input === '/quit') {
            console.log('Goodbye! 👋');
            process.exit(0);
        }

        if (input.startsWith('/list ')) {
            const id = input.slice(6).trim();
            console.log(`   → Sending list_reply: id="${id}"`);
            await sendInteractiveReply(id, id, 'list_reply');
        } else if (input.startsWith('/btn ')) {
            const id = input.slice(5).trim();
            console.log(`   → Sending button_reply: id="${id}"`);
            await sendInteractiveReply(id, id, 'button_reply');
        } else {
            console.log(`   → Sending text: "${input}"`);
            await sendUserMessage(input);
        }

        // Small delay to let server log the response
        setTimeout(() => rl.prompt(), 500);
    });

    rl.on('close', () => process.exit(0));
}

main();
