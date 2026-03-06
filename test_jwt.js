const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTc3MjgwNjc5OCwiZXhwIjoxNzczNDk3OTk4fQ.MMsyzR4ocQ-zKGAqq96t1uKQtD5qPKbex2-3nK-4dRc';

try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Token Valid! Decoded:", decoded);
} catch (e) {
    console.error("Token Invalid! Error:", e.name, e.message);
}
