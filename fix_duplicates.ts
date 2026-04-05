import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://rohit37819_db_user:P7E2iD0dqVhCwrI0@cluster0.1e9ikck.mongodb.net/?appName=Cluster0";

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: { type: String, required: true }
});

const Setting = mongoose.model("Setting", SettingSchema);

async function main() {
  await mongoose.connect(MONGODB_URI);
  
  const settings = await Setting.find({});
  const keyMap = new Map();
  
  for (const s of settings) {
    if (!keyMap.has(s.key)) {
      keyMap.set(s.key, []);
    }
    keyMap.get(s.key).push(s);
  }
  
  for (const [key, docs] of keyMap.entries()) {
    if (docs.length > 1) {
      console.log(`Found ${docs.length} duplicates for key: ${key}`);
      // Keep the first one (which is what findOneAndUpdate updates)
      // Or keep the last one? 
      // Let's keep the one that was most recently updated, but we don't have updatedAt.
      // Let's keep the first one since findOneAndUpdate updates the first one.
      const [keep, ...remove] = docs;
      for (const doc of remove) {
        await Setting.deleteOne({ _id: doc._id });
        console.log(`Deleted duplicate ${doc._id} for key ${key}`);
      }
    }
  }
  
  // Now create the unique index
  try {
    await Setting.collection.createIndex({ key: 1 }, { unique: true });
    console.log("Created unique index on key");
  } catch (e) {
    console.error("Failed to create index:", e);
  }
  
  process.exit(0);
}

main();
