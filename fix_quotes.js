const fs = require('fs');

const filePath = 'frontend/src/pages/admin/Tasks.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the escaped quotes - replace literal backslash-quote with just quote
content = content.replace(/inputCls \+ \\" cursor-pointer\\"/g, 'inputCls + " cursor-pointer"');
content = content.replace(/inputCls \+ \\" resize-none\\"/g, 'inputCls + " resize-none"');

fs.writeFileSync(filePath, content);
console.log('Fixed');
