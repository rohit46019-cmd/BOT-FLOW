
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
});
const Setting = mongoose.model("Setting", SettingSchema);

const LogSchema = new mongoose.Schema({
  level: { type: String, enum: ['info', 'error', 'warn'], default: 'info' },
  message: { type: String, required: true },
  details: { type: String },
  route: { type: String },
  timestamp: { type: Date, default: Date.now }
});
const Log = mongoose.model("Log", LogSchema);

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://rohit37819_db_user:P7E2iD0dqVhCwrI0@cluster0.1e9ikck.mongodb.net/?appName=Cluster0";

async function checkLogoutReason() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const lastReason = await Setting.findOne({ key: "last_logout_reason" });
    const lastTime = await Setting.findOne({ key: "last_logout_time" });
    
    console.log("--- LAST LOGOUT INFO ---");
    console.log("Reason:", lastReason ? lastReason.value : "None recorded");
    console.log("Time:", lastTime ? lastTime.value : "None recorded");
    
    const recentLogs = await Log.find({ 
      message: { $regex: /UserBot logged out|Disconnected/i } 
    }).sort({ timestamp: -1 }).limit(5);
    
    console.log("\n--- RECENT LOGOUT LOGS ---");
    recentLogs.forEach(log => {
      console.log(`[${log.timestamp.toISOString()}] ${log.message}`);
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkLogoutReason();
