import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import TelegramBot from "node-telegram-bot-api";
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://rohit37819_db_user:P7E2iD0dqVhCwrI0@cluster0.1e9ikck.mongodb.net/?appName=Cluster0";
mongoose.connect(MONGODB_URI).then(() => console.log("Connected to MongoDB")).catch(err => console.error("MongoDB connection error:", err));

// Schemas
const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
});
const Setting = mongoose.model("Setting", SettingSchema);

const TopicSchema = new mongoose.Schema({
  telegram_topic_id: { type: Number, required: true, unique: true },
  name: { type: String },
  created_at: { type: Date, default: Date.now }
});
const Topic = mongoose.model("Topic", TopicSchema);

const KeywordSchema = new mongoose.Schema({
  keyword: { type: String, required: true, unique: true },
  reply: { type: String, required: true }
});
const Keyword = mongoose.model("Keyword", KeywordSchema);

// Helper functions
const getSetting = async (key: string) => await Setting.findOne({ key });
const setSetting = async (key: string, value: string) => await Setting.findOneAndUpdate({ key }, { value }, { upsert: true, new: true });
const getTopicCount = async () => await Topic.countDocuments();
const logTopic = async (topicId: number, name: string) => {
  try {
    await Topic.create({ telegram_topic_id: topicId, name });
  } catch (err) {}
};

// Initialize default settings
async function initSettings() {
  const autoReply = await getSetting("auto_reply");
  if (!autoReply) await setSetting("auto_reply", "Welcome to the new topic!");
  
  const delay = await getSetting("delay_seconds");
  if (!delay) await setSetting("delay_seconds", "0");
  
  const apiId = await getSetting("api_id");
  if (!apiId || apiId.value === "0" || apiId.value === "") {
    await setSetting("api_id", "34669075");
    console.log("Default API ID set.");
  }
  
  const apiHash = await getSetting("api_hash");
  if (!apiHash || apiHash.value === "") {
    await setSetting("api_hash", "b0f0ffda80d58bea235b2d232fbcbc79");
    console.log("Default API Hash set.");
  }

  const defaultPhone = await getSetting("default_phone");
  if (!defaultPhone) {
    await setSetting("default_phone", "+919006334503");
    console.log("Default Phone set.");
  }
}
initSettings();

let userClient: TelegramClient | null = null;
let phoneCodeHash: string | null = null;
let phoneNumber: string | null = null;

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  const token = process.env.TELEGRAM_BOT_TOKEN || "8561216489:AAH4QgiM9kKXbGMYudLASGU46_mAiklDgIM";
  const groupId = "-1003672030592"; // Strictly enforced Group ID

  // Initialize User Client if session exists
  const sessionString = (await getSetting("session_string"))?.value;
  const apiIdRaw = (await getSetting("api_id"))?.value || "";
  const apiHash = ((await getSetting("api_hash"))?.value || "").trim();
  const apiId = parseInt(apiIdRaw.trim(), 10);

  if (sessionString && !isNaN(apiId) && apiId > 0 && apiHash) {
    userClient = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
      connectionRetries: 5,
    });
    await userClient.connect();
    console.log("UserBot connected using saved session.");
    setupUserBotHandlers(userClient, groupId);
  }

  const bot = new TelegramBot(token, { polling: true });

  function setupUserBotHandlers(client: TelegramClient, targetGroupId: string) {
    client.addEventHandler(async (event: any) => {
      const message = event.message;
      if (!message) return;

      const chatId = message.peerId?.channelId?.toString() || message.peerId?.chatId?.toString();
      const normalizedTargetId = targetGroupId.replace("-100", "");

      // 1. Topic Creation Handler
      if (message.action instanceof Api.MessageActionTopicCreate) {
        if (chatId === normalizedTargetId) {
          const topicName = message.action.title;
          const topicId = message.id;
          await logTopic(topicId, topicName);
          
          const autoReply = (await getSetting("auto_reply"))?.value || "Welcome!";
          const delaySeconds = parseInt((await getSetting("delay_seconds"))?.value || "0", 10);
          
          setTimeout(async () => {
            try {
              await client.sendMessage(message.peerId, {
                message: autoReply,
                replyTo: topicId,
              });
            } catch (err) {
              console.error("UserBot failed to send auto-reply:", err);
            }
          }, delaySeconds * 1000);
        }
      }

      // 2. Keyword Handler
      if (message.message && !message.out) {
        if (chatId === normalizedTargetId) {
          const text = message.message.toLowerCase();
          const keywords = await Keyword.find();
          
          for (const kw of keywords) {
            if (text.includes(kw.keyword.toLowerCase())) {
              try {
                await client.sendMessage(message.peerId, {
                  message: kw.reply,
                  replyTo: message.id,
                });
                console.log(`Keyword match: ${kw.keyword} -> ${kw.reply}`);
                break; // Only reply to the first matching keyword
              } catch (err) {
                console.error("UserBot failed to send keyword reply:", err);
              }
            }
          }
        }
      }
    });
  }

  // Bot Logic (Fallback)
  bot.on("message", async (msg) => {
    // Only process messages from the target group
    if (msg.chat.id.toString() !== groupId) return;

    if (msg.forum_topic_created && !userClient) {
      const topicName = msg.forum_topic_created.name;
      const topicId = msg.message_thread_id;

      if (topicId) {
        await logTopic(topicId, topicName);
        const autoReply = (await getSetting("auto_reply"))?.value || "Welcome!";
        const delaySeconds = parseInt((await getSetting("delay_seconds"))?.value || "0", 10);
        
        setTimeout(async () => {
          try {
            await bot.sendMessage(groupId, autoReply, { message_thread_id: topicId });
          } catch (err) {
            console.error("Bot failed to send auto-reply:", err);
          }
        }, delaySeconds * 1000);
      }
    }
  });

  // API Routes
  app.get("/api/stats", async (req, res) => {
    res.json({
      topicCount: await getTopicCount(),
      autoReply: (await getSetting("auto_reply"))?.value || "",
      delaySeconds: parseInt((await getSetting("delay_seconds"))?.value || "0", 10),
      isUserBotConnected: !!userClient && userClient.connected,
      apiId: (await getSetting("api_id"))?.value || "",
      apiHash: (await getSetting("api_hash"))?.value || "",
      defaultPhone: (await getSetting("default_phone"))?.value || "",
    });
  });

  app.post("/api/settings", async (req, res) => {
    const { autoReply, delaySeconds, apiId, apiHash } = req.body;
    if (typeof autoReply === "string") await setSetting("auto_reply", autoReply);
    if (typeof delaySeconds !== "undefined") await setSetting("delay_seconds", String(delaySeconds));
    if (typeof apiId !== "undefined") await setSetting("api_id", String(apiId));
    if (typeof apiHash !== "undefined") await setSetting("api_hash", String(apiHash));
    res.json({ success: true });
  });

  // Keyword Routes
  app.get("/api/keywords", async (req, res) => {
    const keywords = await Keyword.find();
    res.json(keywords);
  });

  app.post("/api/keywords", async (req, res) => {
    const { keyword, reply } = req.body;
    try {
      await Keyword.findOneAndUpdate({ keyword }, { reply }, { upsert: true, new: true });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/keywords/:id", async (req, res) => {
    try {
      await Keyword.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // UserBot Auth Routes
  app.post("/api/auth/send-code", async (req, res) => {
    const { phone } = req.body;
    let apiIdRaw = (await getSetting("api_id"))?.value || "";
    let apiHash = (await getSetting("api_hash"))?.value || "";

    // Trim whitespace
    apiIdRaw = apiIdRaw.trim();
    apiHash = apiHash.trim();

    const apiId = parseInt(apiIdRaw, 10);

    if (!apiId || isNaN(apiId) || !apiHash) {
      return res.status(400).json({ error: "Valid API ID and Hash are required in settings." });
    }

    console.log(`Attempting login with API ID: ${apiId} (Hash length: ${apiHash.length})`);

    try {
      userClient = new TelegramClient(new StringSession(""), apiId, apiHash, {
        connectionRetries: 5,
      });
      await userClient.connect();
      const result = await userClient.sendCode({ apiId, apiHash }, phone);
      phoneCodeHash = result.phoneCodeHash;
      phoneNumber = phone;
      res.json({ success: true });
    } catch (err: any) {
      console.error("SendCode error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    const { code, password } = req.body;
    if (!userClient || !phoneNumber || !phoneCodeHash) return res.status(400).json({ error: "Session not initialized" });

    try {
      try {
        await userClient.invoke(
          new Api.auth.SignIn({
            phoneNumber: phoneNumber,
            phoneCodeHash: phoneCodeHash,
            phoneCode: code,
          })
        );
      } catch (err: any) {
        if (err.errorMessage === "SESSION_PASSWORD_NEEDED") {
          if (!password) {
            return res.status(401).json({ error: "2FA Password required" });
          }
          const apiIdRaw = (await getSetting("api_id"))?.value || "";
          const apiHash = ((await getSetting("api_hash"))?.value || "").trim();
          const apiId = parseInt(apiIdRaw.trim(), 10);
          
          await userClient.signInWithPassword({ apiId, apiHash }, {
            password: async () => password,
            onError: (err) => { throw err; }
          });
        } else {
          throw err;
        }
      }

      const sessionString = (userClient.session as StringSession).save();
      await setSetting("session_string", sessionString);
      setupUserBotHandlers(userClient, groupId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      if (userClient) {
        await userClient.disconnect();
        userClient = null;
      }
      await Setting.deleteOne({ key: "session_string" });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/broadcast", async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    try {
      if (userClient && userClient.connected) {
        await userClient.sendMessage(groupId, { message });
      } else {
        await bot.sendMessage(groupId, message);
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
