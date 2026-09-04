const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const helper = `
async function recordSessionEnd(accountId, sessionStartTime) {
  if (sessionStartTime) {
    const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
    if (duration > 60) { // Only record sessions longer than a minute
      try {
        await SessionHistory.create({
          account_id: accountId,
          start_time: sessionStartTime,
          end_time: Date.now(),
          duration_seconds: duration
        });
      } catch (e) {
        console.error("Error saving session history:", e);
      }
    }
  }
}
`;

if (!code.includes('recordSessionEnd')) {
  code = code.replace(/const SessionHistory = mongoose\.model\("SessionHistory", SessionHistorySchema\);/, `const SessionHistory = mongoose.model("SessionHistory", SessionHistorySchema);\n${helper}`);
  
  // replace accountClients.delete(accId) with:
  // if (accountClients.has(accId)) { recordSessionEnd(accId, accountClients.get(accId).sessionStartTime); } accountClients.delete(accId);
  code = code.replace(/accountClients\.delete\((.*?)\);/g, (match, p1) => {
    return `if (accountClients.has(${p1})) { await recordSessionEnd(${p1}, accountClients.get(${p1})?.sessionStartTime); }\n                ${match}`;
  });
  
  fs.writeFileSync('server.ts', code);
  console.log("Helper added and injected");
}
