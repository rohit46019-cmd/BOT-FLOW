import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://rohit37819_db_user:P7E2iD0dqVhCwrI0@cluster0.1e9ikck.mongodb.net/?appName=Cluster0";

async function run() {
  await mongoose.connect(MONGODB_URI);
  try {
    await mongoose.connection.collection("settings").dropIndex("userId_1_key_1");
    console.log("Dropped userId_1_key_1 index from settings");
  } catch (e) {
    console.log("Error dropping index:", e.message);
  }
  try {
    await mongoose.connection.collection("topics").dropIndex("telegram_topic_id_1");
    console.log("Dropped telegram_topic_id_1 index from topics");
  } catch (e) {
    console.log("Error dropping index:", e.message);
  }
  try {
    await mongoose.connection.collection("keywords").dropIndex("keyword_1");
    console.log("Dropped keyword_1 index from keywords");
  } catch (e) {
    console.log("Error dropping index:", e.message);
  }
  process.exit(0);
}

run();
