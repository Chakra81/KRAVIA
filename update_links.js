const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'frontend', 'src'));
let updatedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace hardcoded kravia.onrender.com with localhost
    if (content.includes('https://kravia.onrender.com')) {
        // We replace both /api and base url instances
        content = content.replace(/https:\/\/kravia\.onrender\.com\/api/g, 'http://127.0.0.1:8000/api');
        content = content.replace(/https:\/\/kravia\.onrender\.com/g, 'http://127.0.0.1:8000');
        fs.writeFileSync(file, content, 'utf8');
        updatedCount++;
        console.log('Updated: ' + file);
    }
});

console.log('Total files updated: ' + updatedCount);
