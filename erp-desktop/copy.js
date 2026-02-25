const fs = require('fs');
const path = require('path');

const foldersToCopy = ['routes', 'models', 'sockets', 'middleware', 'whatsapp'];

foldersToCopy.forEach(folder => {
    const src = path.join(__dirname, '..', folder);
    const dest = path.join(__dirname, folder);

    if (fs.existsSync(src)) {
        fs.cpSync(src, dest, { recursive: true });
        console.log(`Copied ${folder}`);
    } else {
        console.error(`Missing ${src}`);
    }
});
