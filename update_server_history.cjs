const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('SessionHistorySchema')) {
  const schemaStr = `
const SessionHistorySchema = new mongoose.Schema({
  account_id: { type: String, default: "default", index: true },
  start_time: { type: Number, required: true },
  end_time: { type: Number, required: true },
  duration_seconds: { type: Number, required: true },
});
const SessionHistory = mongoose.model("SessionHistory", SessionHistorySchema);
`;
  code = code.replace(/const Keyword = mongoose\.model\("Keyword", KeywordSchema\);/, `const Keyword = mongoose.model("Keyword", KeywordSchema);\n${schemaStr}`);
  
  // also inject history into stats response
  const statsLine = `loginUser,`;
  const statsReplacement = `loginUser, sessionHistory: await SessionHistory.find({ account_id: accountId }).sort({ end_time: -1 }).limit(10),`;
  code = code.replace(statsLine, statsReplacement);
  
  // also add record to session history on disconnect/logout
  // search for accountClients.delete
  
  fs.writeFileSync('server.ts', code);
  console.log('Schema added');
} else {
  console.log('Schema exists');
}
