const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
const badStr1 = `globalApprovalMode,
        appLogo =`;
code = code.split(badStr1).join(`globalApprovalMode =`);

const badStr2 = `!globalApprovalMode,
        appLogo`;
code = code.split(badStr2).join(`!globalApprovalMode`);

const badStr3 = `globalApprovalMode,
        appLogo
      } = req.body;`;
code = code.split(badStr3).join(`globalApprovalMode, appLogo } = req.body;`);

fs.writeFileSync('server.ts', code);
