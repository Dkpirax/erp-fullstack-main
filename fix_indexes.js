const seq = require('./config/database');

async function fixIndexes() {
    try {
        await seq.authenticate();
        console.log('Connected to DB');

        // Get all indexes on users table
        const [indexes] = await seq.query(
            "SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_NAME='users' AND TABLE_SCHEMA=DATABASE() AND INDEX_NAME != 'PRIMARY' GROUP BY INDEX_NAME;"
        );
        console.log('Current indexes on users table:', indexes.length);
        indexes.forEach(i => console.log(' -', i.INDEX_NAME));

        // Drop all duplicate/extra indexes except PRIMARY
        let dropped = 0;
        for (const idx of indexes) {
            try {
                await seq.query(`ALTER TABLE users DROP INDEX \`${idx.INDEX_NAME}\`;`);
                console.log(`✅ Dropped: ${idx.INDEX_NAME}`);
                dropped++;
            } catch (e) {
                console.log(`⚠️  Skip ${idx.INDEX_NAME}: ${e.message}`);
            }
        }
        console.log(`\nDone! Dropped ${dropped} indexes.`);
        console.log('Restart the server now.');
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await seq.close();
    }
}

fixIndexes();
