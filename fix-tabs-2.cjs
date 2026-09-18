const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPanel.tsx', 'utf-8');

code = code.replace(/      \)\}/g, '      </>)}');
code = code.replace(/\{activeTabSettings === "advanced" && \(<>\n      <\/>\)\}/, '</>)}\n\n      {activeTabSettings === "advanced" && (<>');

fs.writeFileSync('src/components/SettingsPanel.tsx', code);
