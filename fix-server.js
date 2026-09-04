const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/globalApprovalMode,\n        appLogo/g, 'globalApprovalMode');
fs.writeFileSync('server.ts', code);
