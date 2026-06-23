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

const dynamicApiString = "window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api'";
const dynamicBaseString = "window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000' : 'https://kravia.onrender.com'";

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Replace the top-level API definitions
    const apiRegex1 = /(const|let|var)\s+API\s*=\s*['"`]http:\/\/127\.0\.0\.1:8000\/api['"`]/g;
    const apiRegex2 = /(const|let|var)\s+API_BASE\s*=\s*['"`]http:\/\/127\.0\.0\.1:8000\/api['"`]/g;
    const baseRegex1 = /(const|let|var)\s+BASE\s*=\s*['"`]http:\/\/127\.0\.0\.1:8000['"`]/g;
    const baseRegex2 = /(const|let|var)\s+api\s*=\s*axios\.create\(\{\s*baseURL:\s*['"`]http:\/\/127\.0\.0\.1:8000['"`]\s*\}\)/g;
    
    content = content.replace(apiRegex1, `$1 API = ${dynamicApiString}`);
    content = content.replace(apiRegex2, `$1 API_BASE = ${dynamicApiString}`);
    content = content.replace(baseRegex1, `$1 BASE = ${dynamicBaseString}`);
    content = content.replace(baseRegex2, `$1 api = axios.create({ baseURL: ${dynamicBaseString} })`);

    // 2. We also have inline strings from earlier that we replaced.
    // e.g., axios.post(`http://127.0.0.1:8000/api/send-otp/`)
    // We should revert those strictly back to Kravia, or replace them with ${API} and ensure API is defined.
    // The safest and easiest path for the user right now is to just make a global variable or
    // just revert all remaining `http://127.0.0.1:8000` strings to the dynamic string conditionally, 
    // but a global helper is best.
    
    // Instead of complex parsing, let's just create an apiConfig.js and import it, but that's invasive.
    // Let's just find and replace `http://127.0.0.1:8000` with the dynamic base URL.
    // We will just do: ${window.location.hostname === 'localhost' ? 'http://127.0.0.1:8000' : 'https://kravia.onrender.com'}
    
    const inlineApiRegex = /http:\/\/127\.0\.0\.1:8000\/api/g;
    const inlineBaseRegex = /http:\/\/127\.0\.0\.1:8000/g;
    
    // We must NOT replace inside our new declarations.
    // So we'll first hide the dynamic strings.
    const tempToken1 = '___DYNAMIC_API_TOKEN___';
    const tempToken2 = '___DYNAMIC_BASE_TOKEN___';
    
    content = content.split(dynamicApiString).join(tempToken1);
    content = content.split(dynamicBaseString).join(tempToken2);
    
    // Now replace the remaining hardcoded local links with the literal dynamic string
    // using template literals so it works inside backticks.
    content = content.replace(inlineApiRegex, `\${${tempToken1}}`);
    content = content.replace(inlineBaseRegex, `\${${tempToken2}}`);
    
    // Restore dynamic strings
    content = content.split(tempToken1).join(`(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000/api' : 'https://kravia.onrender.com/api')`);
    content = content.split(tempToken2).join(`(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8000' : 'https://kravia.onrender.com')`);

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        updatedCount++;
        console.log('Made Dynamic: ' + file);
    }
});

console.log('Total files updated: ' + updatedCount);
