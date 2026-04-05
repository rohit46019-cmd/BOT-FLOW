import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  const stringSession = new StringSession(process.env.TELEGRAM_SESSION || "");
  const client = new TelegramClient(stringSession, parseInt(process.env.TELEGRAM_API_ID || "0"), process.env.TELEGRAM_API_HASH || "", {
    connectionRetries: 5,
  });

  await client.connect();
  console.log("Connected");

  try {
    // Try to get emoji document ID for ✅
    const result = await client.invoke(
      new Api.messages.GetStickerSet({
        stickerset: new Api.InputStickerSetEmojiDefaultStatuses(),
      })
    );
    console.log("Default statuses:", result.documents?.length);
    
    // Let's try to search emoji
    const searchResult = await client.invoke(
      new Api.messages.SearchCustomEmoji({
        emoticon: "✅",
        hash: 0n,
      })
    );
    console.log("Search custom emoji:", searchResult);
    
  } catch (e) {
    console.error(e);
  }

  await client.disconnect();
  process.exit(0);
}

test();
