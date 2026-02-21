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
  reply: { type: String, required: true },
  photo: { type: String } // Base64 string
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

  const bot = new TelegramBot(token, { polling: true });

  // Handle polling errors to prevent crash and clean up logs
  bot.on("polling_error", (error: any) => {
    if (error.message && error.message.includes("409 Conflict")) {
      // This is expected during rapid restarts in this environment
      return;
    }
    console.error("Telegram Bot Polling Error:", error);
  });

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
                if (kw.photo) {
                  // Convert base64 to buffer
                  const buffer = Buffer.from(kw.photo.split(",")[1] || kw.photo, "base64");
                  await client.sendFile(message.peerId, {
                    file: buffer,
                    caption: kw.reply,
                    replyTo: message.id,
                  });
                } else {
                  await client.sendMessage(message.peerId, {
                    message: kw.reply,
                    replyTo: message.id,
                  });
                }
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

  // Bot Logic (Logging only, no auto-replies)
  bot.on("message", async (msg) => {
    // Only process messages from the target group
    if (msg.chat.id.toString() !== groupId) return;

    if (msg.forum_topic_created) {
      const topicName = msg.forum_topic_created.name;
      const topicId = msg.message_thread_id;

      if (topicId) {
        await logTopic(topicId, topicName);
      }
    }
  });

  // API Routes
  app.get("/api/stats", async (req, res) => {
    try {
      const topicCount = await getTopicCount();
      const autoReply = (await getSetting("auto_reply"))?.value || "";
      const delaySeconds = parseInt((await getSetting("delay_seconds"))?.value || "0", 10);
      const isUserBotConnected = !!userClient && userClient.connected;
      const apiId = (await getSetting("api_id"))?.value || "";
      const apiHash = (await getSetting("api_hash"))?.value || "";
      const defaultPhone = (await getSetting("default_phone"))?.value || "";

      res.json({
        topicCount,
        autoReply,
        delaySeconds,
        isUserBotConnected,
        apiId,
        apiHash,
        defaultPhone,
      });
    } catch (err: any) {
      console.error("Error in /api/stats:", err);
      res.status(500).json({ error: err.message });
    }
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
    const { keyword, reply, photo } = req.body;
    try {
      await Keyword.findOneAndUpdate({ keyword }, { reply, photo }, { upsert: true, new: true });
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

  app.get("/api/topics", async (req, res) => {
    try {
      const topics = await Topic.find().sort({ created_at: -1 });
      res.json(topics);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/group/messages", async (req, res) => {
    console.log("Accessing /api/group/messages");
    if (!userClient || !userClient.connected) {
      console.log("UserBot not connected");
      return res.status(400).json({ error: "UserBot not connected" });
    }
    try {
      const { topicId } = req.query;
      const options: any = { limit: 50 };
      
      if (topicId) {
        options.replyTo = parseInt(topicId as string, 10);
      }

      const messages = await userClient.getMessages(groupId, options);
      if (!messages) {
        return res.json([]);
      }
      
      const formattedMessages = messages
        .filter(m => m && m.message) // Filter out empty messages
        .map((m: any) => ({
          id: m.id,
          text: m.message,
          date: m.date,
          senderId: m.senderId?.toString(),
          isOutgoing: m.out,
          replyToMsgId: m.replyTo?.replyToMsgId,
        }));
      res.json(formattedMessages.reverse()); // Reverse to show oldest first
    } catch (err: any) {
      console.error("Error fetching messages:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/broadcast", async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    try {
      if (userClient && userClient.connected) {
        await userClient.sendMessage(groupId, { message });
        res.json({ success: true });
      } else {
        res.status(400).json({ error: "Telegram ID not logged in. Please login first." });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API 404 Handler
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
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

  // Start Server immediately
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Connect UserBot in background
    (async () => {
      try {
        const sessionString = (await getSetting("session_string"))?.value;
        const apiIdRaw = (await getSetting("api_id"))?.value || "";
        const apiHash = ((await getSetting("api_hash"))?.value || "").trim();
        const apiId = parseInt(apiIdRaw.trim(), 10);

        if (sessionString && !isNaN(apiId) && apiId > 0 && apiHash) {
          console.log("Attempting to connect UserBot...");
          userClient = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
            connectionRetries: 5,
          });
          await userClient.connect();
          console.log("UserBot connected using saved session.");
          setupUserBotHandlers(userClient, groupId);
        }
      } catch (err) {
        console.error("Failed to connect UserBot on startup:", err);
      }
    })();
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("Shutting down...");
    if (bot.isPolling()) {
      await bot.stopPolling();
    }
    if (userClient) {
      await userClient.disconnect();
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer();
