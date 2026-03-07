import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://rohit37819_db_user:P7E2iD0dqVhCwrI0@cluster0.1e9ikck.mongodb.net/?appName=Cluster0";

async function run() {
  await mongoose.connect(MONGODB_URI);
  try {
    const indexes = await mongoose.connection.collection("keywords").indexes();
    console.log("Keywords indexes:", indexes);
  } catch (e) {
    console.log("Error:", e.message);
  }
  process.exit(0);
}

run();
