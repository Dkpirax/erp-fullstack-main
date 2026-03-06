// Quick syntax check for all WhatsApp bot modules
// Uses __dirname so it works regardless of cwd.
const path = require('path');
const root = path.resolve(__dirname, '..');

const modules = [
    { label: 'whatsapp/rag-engine', file: path.join(root, 'whatsapp', 'rag-engine') },
    { label: 'whatsapp/whatsapp-api', file: path.join(root, 'whatsapp', 'whatsapp-api') },
    { label: 'whatsapp/session-store', file: path.join(root, 'whatsapp', 'session-store') },
    { label: 'whatsapp/order-manager', file: path.join(root, 'whatsapp', 'order-manager') },
    { label: 'whatsapp/bot-handler', file: path.join(root, 'whatsapp', 'bot-handler') },
    { label: 'routes/whatsapp', file: path.join(root, 'routes', 'whatsapp') }
];

let allOk = true;
for (const { label, file } of modules) {
    try {
        require(file);
        console.log('OK  ' + label);
    } catch (e) {
        console.error('ERR ' + label + ': ' + e.message);
        allOk = false;
    }
}

// Close Sequelize pool so the process can exit cleanly
try {
    const sequelize = require(path.join(root, 'config', 'database'));
    sequelize.close().catch(() => { }).finally(() => {
        if (allOk) {
            console.log('\nAll WhatsApp bot modules loaded successfully!');
        } else {
            console.log('\nSome modules failed. Check errors above.');
        }
        process.exit(allOk ? 0 : 1);
    });
} catch (_) {
    process.exit(allOk ? 0 : 1);
}
