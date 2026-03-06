const bcrypt = require('bcryptjs');

async function testPassword() {
    const hash = "$2a$10$lXkAw2BzlGV8x8HBfcN2Ueh1YTEfgfeR1hP3rPFxYBgyp4J17VGwC";
    const isValid = await bcrypt.compare('admin', hash);
    console.log("Is 'admin' valid password?", isValid);
}

testPassword();
