const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Use regex with replacer function to analyze the ternary
            content = content.replace(/\$\{theme === 'dark' \? '([^']+)' : '([^']+)'\}/g, (match, dark, light) => {
                let res = [];
                // If it's a text color
                if (dark.includes('text-white') || dark.includes('text-slate-300')) {
                    res.push('text-[var(--text-main)]');
                } else if (dark.includes('text-slate-400')) {
                    res.push('text-[var(--text-muted)]');
                }
                
                // If it's a border
                if (dark.includes('border-white')) {
                    res.push('border-[var(--border)]');
                }

                // If it's a background
                if (dark.includes('bg-slate-9') || dark.includes('bg-black') || dark.includes('bg-white/5') || dark.includes('bg-indigo-600/20')) {
                    res.push('bg-[var(--glass)]');
                }
                
                // If it has hover:bg
                if (dark.includes('hover:bg-white/10')) {
                    res.push('hover:bg-[var(--glass-hover)]');
                }
                if (dark.includes('hover:text-white')) {
                    res.push('hover:text-[var(--text-main)]');
                }

                if (res.length === 0) {
                    // Fallback
                    return 'bg-[var(--glass)] text-[var(--text-main)]';
                }

                return res.join(' ');
            });

            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated generic ternary in ${file}`);
            }
        }
    }
}

processDir(path.join(__dirname, 'src/pages'));
processDir(path.join(__dirname, 'src/components'));
