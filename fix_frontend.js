const fs = require('fs');
const path = require('path');

let count = 0;

function replaceInDir(dir) {
    fs.readdirSync(dir).forEach(f => {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            replaceInDir(p);
        } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
            let content = fs.readFileSync(p, 'utf8');
            if (content.includes('http://localhost:8000')) {
                content = content.replace(/http:\/\/localhost:8000/g, '');
                fs.writeFileSync(p, content, 'utf8');
                console.log('Modified:', p);
                count++;
            }
        }
    });
}

replaceInDir('client/src');
console.log(`Finished modifying ${count} files.`);
