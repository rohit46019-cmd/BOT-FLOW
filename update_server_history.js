const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('SessionHistory')) {
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
  fs.writeFileSync('server.ts', code);
  console.log('Schema added');
} else {
  console.log('Schema exists');
}
