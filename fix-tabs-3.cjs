const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPanel.tsx', 'utf-8');

// revert all
code = code.replace(/<\/>\)\}/g, ')}');

// Add the correct endings.
// The structure I added was:
// {activeTabSettings === "ai" && (<>
//      {/* AI Integration Card */}
// But I need to close the previous condition right before this!
// Currently it is:
//       )}
//
//       {activeTabSettings === "ai" && (<>
//       {/* AI Integration Card */}
// 
// I will replace `      )}\n\n      {activeTabSettings === "ai"` with `      </>)}\n\n      {activeTabSettings === "ai"`
// And so on for the others.

code = code.replace(/      \)\}\n\n      \{activeTabSettings === "ai"/g, '      </>)}\n\n      {activeTabSettings === "ai"');
code = code.replace(/      \)\}\n\n      \{activeTabSettings === "photo"/g, '      </>)}\n\n      {activeTabSettings === "photo"');
code = code.replace(/      \)\}\n\n      \{activeTabSettings === "alerts"/g, '      </>)}\n\n      {activeTabSettings === "alerts"');
code = code.replace(/      \)\}\n\n      \{activeTabSettings === "advanced"/g, '      </>)}\n\n      {activeTabSettings === "advanced"');
code = code.replace(/      \)\}\n\n      \{\/\* Save Button/g, '      </>)}\n\n      {/* Save Button');

fs.writeFileSync('src/components/SettingsPanel.tsx', code);
