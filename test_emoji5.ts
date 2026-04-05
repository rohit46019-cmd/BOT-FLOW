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
  const targetGroup = "-1003672030592";

  if (!sessionString || isNaN(apiId) || !apiHash || !targetGroup) {
    console.error("Missing credentials");
    process.exit(1);
  }

  const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();
  console.log("Connected to Telegram");

  try {
    // 1. Find the emoji document ID
    const searchResult = await client.invoke(
      new Api.messages.SearchCustomEmoji({
        emoticon: "✅",
        hash: 0n,
      })
    );
    
    let iconEmojiId: bigint | undefined = undefined;
    if (searchResult instanceof Api.EmojiList && searchResult.documentId.length > 0) {
      iconEmojiId = searchResult.documentId[0];
      console.log("Found emoji ID:", iconEmojiId);
    }

    // 2. Create a test topic
    const createResult = await client.invoke(
      new Api.channels.CreateForumTopic({
        channel: targetGroup,
        title: "Test Topic Icon",
        iconEmojiId: iconEmojiId,
        randomId: Math.floor(Math.random() * 1000000),
      })
    );
    console.log("Created topic:", createResult);

  } catch (e) {
    console.error(e);
  }

  await client.disconnect();
  process.exit(0);
}

test();
