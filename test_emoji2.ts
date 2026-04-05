import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
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
    // Search for the emoji
    const result = await client.invoke(
      new Api.messages.GetEmojiStickers({
        hash: 0n,
      })
    );
    console.log("GetEmojiStickers:", result);
  } catch (e) {
    console.error(e);
  }

  await client.disconnect();
  process.exit(0);
}

test();
