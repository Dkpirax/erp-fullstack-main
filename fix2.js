const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, 'client/src');
let count = 0;

function walk(currentDir) {
    const files = fs.readdirSync(currentDir);
    for (const f of files) {
        const fullPath = path.join(currentDir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.indexOf('http://localhost:8000') !== -1) {
                const newContent = content.split('http://localhost:8000').join('');
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log('Fixed:', fullPath);
                count++;
            }
        }
    }
}

console.log('Starting scan in:', dir);
walk(dir);
console.log('Fixed', count, 'files.');
