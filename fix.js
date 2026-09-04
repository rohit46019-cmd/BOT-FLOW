const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPanel.tsx', 'utf8');
const search = "        </div>\n      )}\n      </>\n      )}\n";
code = code.split(search).join('');
fs.writeFileSync('src/components/SettingsPanel.tsx', code);
