import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://rohit37819_db_user:P7E2iD0dqVhCwrI0@cluster0.1e9ikck.mongodb.net/?appName=Cluster0";

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
});
const Setting = mongoose.model("Setting", SettingSchema);

async function test() {
  await mongoose.connect(MONGODB_URI);
  const topicIcon = (await Setting.findOne({ key: "topic_icon" }))?.value || "🛑";
  console.log("Current topic_icon:", topicIcon);
  process.exit(0);
}

test();
