import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://rohit37819_db_user:P7E2iD0dqVhCwrI0@cluster0.1e9ikck.mongodb.net/?appName=Cluster0";

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
});
const Setting = mongoose.model("Setting", SettingSchema);

async function test() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const sessionString = (await Setting.findOne({ key: "session_string" }))?.value;
  const apiIdRaw = (await Setting.findOne({ key: "api_id" }))?.value || "";
  const apiHash = ((await Setting.findOne({ key: "api_hash" }))?.value || "").trim();
  const apiId = parseInt(apiIdRaw.trim(), 10);

  if (!sessionString || isNaN(apiId) || !apiHash) {
    console.error("Missing credentials");
    process.exit(1);
  }

  const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();
  console.log("Connected to Telegram");

  try {
    const result = await client.invoke(
      new Api.messages.GetStickerSet({
        stickerset: new Api.InputStickerSetEmojiDefaultTopicIcons(),
        hash: 0
      })
    );
    
    if (result instanceof Api.messages.StickerSet) {
      console.log("Default topic icons count:", result.documents.length);
      for (const doc of result.documents) {
        if (doc instanceof Api.Document) {
          // Find the attribute that contains the emoji
          const attr = doc.attributes.find(a => a instanceof Api.DocumentAttributeCustomEmoji);
          if (attr && attr instanceof Api.DocumentAttributeCustomEmoji) {
            console.log(`Emoji: ${attr.alt}, ID: ${doc.id}`);
          }
        }
      }
    }
  } catch (e) {
    console.error(e);
  }

  await client.disconnect();
  process.exit(0);
}

test();
