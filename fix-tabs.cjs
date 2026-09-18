const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPanel.tsx', 'utf-8');

code = code.replace(/\{activeTabSettings === "ai" && \(/g, '{activeTabSettings === "ai" && (<>');
code = code.replace(/\{activeTabSettings === "photo" && \(/g, '{activeTabSettings === "photo" && (<>');
code = code.replace(/\{activeTabSettings === "alerts" && \(/g, '{activeTabSettings === "alerts" && (<>');

fs.writeFileSync('src/components/SettingsPanel.tsx', code);
