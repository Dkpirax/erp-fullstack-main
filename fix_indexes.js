const seq = require('./config/database');

async function fixAllIndexes() {
    try {
        await seq.authenticate();
        console.log('✅ Connected to DB');

        // Get all tables
        const [tables] = await seq.query("SHOW TABLES");
        const dbName = seq.getDatabaseName();
        const tableField = `Tables_in_${dbName}`;

        console.log(`🔍 Found ${tables.length} tables in ${dbName}`);

        for (const tableObj of tables) {
            const tableName = tableObj[tableField];
            console.log(`\n📂 Auditing table: ${tableName}`);

            // Get all indexes except PRIMARY
            const [indexes] = await seq.query(
                `SELECT INDEX_NAME FROM information_schema.STATISTICS 
                 WHERE TABLE_NAME='${tableName}' AND TABLE_SCHEMA='${dbName}' 
                 AND INDEX_NAME != 'PRIMARY' GROUP BY INDEX_NAME;`
            );

            if (indexes.length === 0) {
                console.log(`  - No non-primary indexes found.`);
                continue;
            }

            console.log(`  - Found ${indexes.length} non-primary indexes.`);

            // Drop them
            let dropped = 0;
            for (const idx of indexes) {
                try {
                    await seq.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${idx.INDEX_NAME}\`;`);
                    console.log(`    ✅ Dropped index: ${idx.INDEX_NAME}`);
                    dropped++;
                } catch (e) {
                    console.log(`    ⚠️  Could not drop ${idx.INDEX_NAME}: ${e.message}`);
                }
            }
            console.log(`  - Successfully cleaned up ${dropped} indexes from ${tableName}.`);
        }

        console.log('\n✨ Database cleanup complete. Now run sync.');
    } catch (e) {
        console.error('❌ Error during cleanup:', e.message);
    } finally {
        await seq.close();
    }
}

fixAllIndexes();

