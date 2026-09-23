const mongoose = require('mongoose');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("No MONGODB_URI found in env!");
    return;
  }
  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("Connected! Fetching logs...");
  
  const LogSchema = new mongoose.Schema({
    message: String,
    level: String,
    category: String,
    timestamp: Date,
    details: mongoose.Schema.Types.Mixed
  });
  const Log = mongoose.model('Log', LogSchema);
  
  const logs = await Log.find().sort({ timestamp: -1 }).limit(30);
  console.log("--- RECENT LOGS ---");
  for (const log of logs) {
    console.log(`[${log.timestamp.toISOString()}] [${log.level}] [${log.category}] ${log.message}`);
    if (log.details) {
      console.log("Details:", JSON.stringify(log.details, null, 2));
    }
  }
  await mongoose.disconnect();
}

run().catch(console.error);
