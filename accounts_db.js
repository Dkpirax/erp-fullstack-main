const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'accounts.db'));
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS accounts_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('income','expense')),
    category TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    buying_cost REAL DEFAULT 0,
    gross_profit REAL DEFAULT 0,
    payment_method TEXT,
    reference_id TEXT,
    reference_type TEXT,
    date DATE NOT NULL DEFAULT (DATE('now')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT DEFAULT 'system'
  );

  CREATE TABLE IF NOT EXISTS expense_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK(type IN ('income','expense')),
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

try {
  db.exec(`INSERT OR IGNORE INTO expense_categories (name, type) VALUES
    ('Sales Revenue','income'),('Stock Purchase','expense'),
    ('Rent','expense'),('Staff Salary','expense'),
    ('Electricity','expense'),('Water','expense'),
    ('Internet','expense'),('Packaging','expense'),
    ('Freight / Delivery','expense'),('Alterations','expense'),
    ('Marketing / Ads','expense'),('Equipment','expense'),
    ('Miscellaneous','expense')`);

  db.exec(`INSERT OR IGNORE INTO settings (key, value) VALUES
    ('elais_model', 'phi3:mini'),
    ('elais_enabled', '1'),
    ('elais_source', 'local'),
    ('elais_online_url', 'https://ollama.com/api/chat'),
    ('elais_online_key', 'bb2b103e40b14846be8287cd366b3994.i2w1u91QQwYB2ePug1CB2B_m'),
    ('elais_online_model', 'qwen3.5'),
    ('selected_printer_name', ''),
    ('elais_personality', 'You are Elais, a friendly and smart business assistant for a clothing store in Sri Lanka. You speak in clear, simple English. Currency is always LKR. Be concise and practical. Never make up data.')`);
} catch(e) {
  console.error("Database initialization error:", e);
}

module.exports = db;
