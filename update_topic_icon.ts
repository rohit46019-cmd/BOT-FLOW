import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://rohit37819_db_user:P7E2iD0dqVhCwrI0@cluster0.1e9ikck.mongodb.net/?appName=Cluster0";

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
});
const Setting = mongoose.model("Setting", SettingSchema);

async function test() {
  await mongoose.connect(MONGODB_URI);
  await Setting.findOneAndUpdate({ key: "topic_icon" }, { value: "✅" }, { upsert: true });
  console.log("Updated topic_icon to ✅");
  process.exit(0);
}

test();
