import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import TelegramBot from "node-telegram-bot-api";
import { TelegramClient, Api } from "telegram";
import { NewMessage } from "telegram/events/index.js";
import { StringSession } from "telegram/sessions/index.js";
import { CustomFile } from "telegram/client/uploads.js";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini
// const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const DEFAULT_AI_PERSONA = `You are a smart assistant for a Telegram store selling paid study batches (SSC, Railway, etc.) for 87rs each. You have leaked batches from many top teachers. Your goal is to answer user queries about price, availability, and payment.
- Context: Users are students preparing for exams.
- Language: Reply in the same language as the user (Hindi, English, or Hinglish).
- Robustness: Users may use slang or misspell words; interpret their intent correctly.
- Pricing: Each batch is 87rs.
- Behavior: Be helpful, concise, and polite.
- Constraint: If the message is generic (e.g., 'ok', 'hmm') or doesn't need a reply, strictly output 'NO_REPLY'.`;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://rohit37819_db_user:P7E2iD0dqVhCwrI0@cluster0.1e9ikck.mongodb.net/?appName=Cluster0";
mongoose.connect(MONGODB_URI).then(() => console.log("Connected to MongoDB")).catch(err => console.error("MongoDB connection error:", err));

// Schemas
const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: { type: String, required: true },
  ownerId: { type: String, required: true, default: "default" }
});
SettingSchema.index({ key: 1, ownerId: 1 }, { unique: true });
const Setting = mongoose.model("Setting", SettingSchema);

const TopicSchema = new mongoose.Schema({
  telegram_topic_id: { type: Number, required: true },
  name: { type: String },
  ownerId: { type: String, required: true, default: "default" },
  created_at: { type: Date, default: Date.now }
});
TopicSchema.index({ telegram_topic_id: 1, ownerId: 1 }, { unique: true });
const Topic = mongoose.model("Topic", TopicSchema);

const KeywordSchema = new mongoose.Schema({
  keyword: { type: String }, // Legacy single keyword
  keywords: { type: [String], default: [] }, // New array of keywords
  reply: { type: String }, // Made optional to support message_link only
  photo: { type: String }, // Base64 string (legacy)
  message_link: { type: String }, // Legacy Telegram message link
  message_links: { type: [String], default: [] }, // Multiple Telegram message links
  max_replies: { type: Number, default: 2 }, // Max replies per topic per keyword rule
  match_mode: { type: String, enum: ['exact', 'partial'], default: 'exact' },
  ai_reply_enabled: { type: Boolean, default: false },
  ownerId: { type: String, required: true, default: "default" }
});
const Keyword = mongoose.model("Keyword", KeywordSchema);

const LogSchema = new mongoose.Schema({
  level: { type: String, enum: ['info', 'error', 'warn'], default: 'info' },
  message: { type: String, required: true },
  details: { type: String },
  route: { type: String },
  ownerId: { type: String, required: true, default: "default" },
  timestamp: { type: Date, default: Date.now }
});
const Log = mongoose.model("Log", LogSchema);

const ReplyHistorySchema = new mongoose.Schema({
  topic_id: { type: Number, required: true },
  keyword_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Keyword', required: true },
  count: { type: Number, default: 0 },
  ownerId: { type: String, required: true, default: "default" },
  last_updated: { type: Date, default: Date.now }
});
ReplyHistorySchema.index({ topic_id: 1, keyword_id: 1, ownerId: 1 }, { unique: true });
const ReplyHistory = mongoose.model("ReplyHistory", ReplyHistorySchema);

const PhotoReplyHistorySchema = new mongoose.Schema({
  topic_id: { type: Number, required: true },
  count: { type: Number, default: 0 },
  ownerId: { type: String, required: true, default: "default" },
  last_updated: { type: Date, default: Date.now }
});
PhotoReplyHistorySchema.index({ topic_id: 1, ownerId: 1 }, { unique: true });
const PhotoReplyHistory = mongoose.model("PhotoReplyHistory", PhotoReplyHistorySchema);

const AccountSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true },
  sessionString: { type: String, required: true },
  apiId: { type: Number, required: true },
  apiHash: { type: String, required: true },
  name: { type: String },
  username: { type: String },
  targetGroupIds: { type: [String], default: ["-1003672030592"] },
  isActive: { type: Boolean, default: true },
  ownerId: { type: String, required: true, default: "default" },
  createdAt: { type: Date, default: Date.now }
});
AccountSchema.index({ phoneNumber: 1, ownerId: 1 }, { unique: true });
const Account = mongoose.model("Account", AccountSchema);

const BlockedTopicSchema = new mongoose.Schema({
  telegram_topic_id: { type: Number, required: true },
  name: { type: String },
  link: { type: String },
  ownerId: { type: String, required: true, default: "default" },
  created_at: { type: Date, default: Date.now }
});
BlockedTopicSchema.index({ telegram_topic_id: 1, ownerId: 1 }, { unique: true });
const BlockedTopic = mongoose.model("BlockedTopic", BlockedTopicSchema);

// Helper functions
const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const getSetting = async (key: string, ownerId: string = "default") => await Setting.findOne({ key, ownerId });
const setSetting = async (key: string, value: string, ownerId: string = "default") => await Setting.findOneAndUpdate({ key, ownerId }, { value }, { upsert: true, new: true });
const getTopicCount = async (ownerId: string = "default") => await Topic.countDocuments({ ownerId });
const getTodayTopicCount = async (ownerId: string = "default") => {
  const now = new Date();
  // Convert to IST (Asia/Kolkata)
  const istDateStr = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istDateStr);
  istDate.setHours(0, 0, 0, 0);
  
  // We need to convert this IST midnight back to UTC for the query
  // IST = UTC + 5:30
  // So UTC = IST - 5:30
  const startOfIstDayUtc = new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000));
  
  return await Topic.countDocuments({ created_at: { $gte: startOfIstDayUtc }, ownerId });
};
const logTopic = async (topicId: number, name: string, ownerId: string = "default") => {
  try {
    await Topic.create({ telegram_topic_id: topicId, name, ownerId });
  } catch (err) {}
};

const saveLog = async (message: string, level: 'info' | 'error' | 'warn' = 'info', route?: string, details?: any, ownerId: string = "default") => {
  try {
    await Log.create({
      message,
      level,
      route,
      ownerId,
      details: details ? (typeof details === 'string' ? details : JSON.stringify(details, null, 2)) : undefined
    });
  } catch (err) {
    console.error("Failed to save log to DB:", err);
  }
};

// Helper function for topic renaming
const handleTopicRenaming = async (client: TelegramClient, message: any, topicIcon: string, renameKeywordsStr: string, renameMatchMode: string, ownerId: string, bypassKeywordCheck: boolean = false) => {
  const replyToId = message.replyTo?.replyToMsgId;
  if (!replyToId) return;

  // Fetch Topic Name
  let topicName = "Unknown Topic";
  
  // 1. Try DB
  const topic = await Topic.findOne({ telegram_topic_id: replyToId, ownerId });
  if (topic && topic.name) {
    topicName = topic.name;
  } 
  
  // 2. Try fetching the topic creation message
  if (topicName === "Unknown Topic") {
    try {
      const messages = await client.getMessages(message.peerId, { ids: [replyToId] });
      if (messages && messages.length > 0) {
        const topicMsg = messages[0];
        if (topicMsg.action && topicMsg.action instanceof Api.MessageActionTopicCreate) {
          topicName = topicMsg.action.title;
          await logTopic(replyToId, topicName, ownerId);
        }
      }
    } catch (e) {
      console.error("Failed to fetch topic info from message", e);
    }
  }

  // 3. Try fetching from Forum Topics list (most reliable for existing topics)
  if (topicName === "Unknown Topic") {
    try {
      console.log(`Fetching forum topics to find name for ${replyToId}...`);
      const result = await client.invoke(
        new Api.channels.GetForumTopics({
          channel: await client.getInputEntity(message.peerId),
          q: "", // Empty query
          offsetDate: 0,
          offsetId: 0,
          offsetTopic: 0,
          limit: 100
        })
      );
      
      if (result && result.topics) {
        // Cache all topics found to avoid future lookups
        for (const t of result.topics) {
          if (t instanceof Api.ForumTopic && t.title) {
            // Update DB with found topic
            await Topic.findOneAndUpdate(
              { telegram_topic_id: t.id, ownerId },
              { name: t.title },
              { upsert: true }
            );
            
            if (t.id === replyToId) {
              topicName = t.title;
              console.log(`Found topic name via GetForumTopics: ${topicName}`);
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch topic info from GetForumTopics", e);
    }
  }

  // Rename Logic
  try {
    let shouldRename = true;
    
    // If keywords are set, check if message matches (UNLESS bypassed)
    if (!bypassKeywordCheck && renameKeywordsStr.trim()) {
      const keywords = renameKeywordsStr.split(",").map(k => k.trim()).filter(k => k);
      if (keywords.length > 0) {
        // Check both message (caption) and text (if different)
        const text = (message.message || message.text || "").toLowerCase();
        let matchFound = false;
        
        for (const kw of keywords) {
          const kwLower = kw.toLowerCase();
          if (renameMatchMode === 'partial') {
            if (text.includes(kwLower)) {
              matchFound = true;
              break;
            }
          } else {
            // Exact match (word boundary)
            const regex = new RegExp(`(?<=^|[^\\p{L}\\p{N}])${escapeRegExp(kwLower)}(?=$|[^\\p{L}\\p{N}])`, 'gui');
            if (regex.test(text)) {
              matchFound = true;
              break;
            }
          }
        }
        
        if (!matchFound) {
          shouldRename = false;
          console.log(`Topic rename skipped: Message "${text}" did not match keywords [${keywords.join(", ")}] with mode ${renameMatchMode}`);
        }
      }
    }

    if (topicName === "Unknown Topic") {
       console.log(`Skipping rename for topic ${replyToId}: Name is unknown`);
       shouldRename = false;
    }

    topicName = topicName.trim();
    const suffix = `${topicIcon}${topicIcon}`;

    if (shouldRename && !topicName.endsWith(suffix)) {
      let newTopicName = `${topicName} ${suffix}`;
      // Telegram limit is 128 chars
      if (newTopicName.length > 128) {
          newTopicName = newTopicName.substring(0, 128);
      }

      console.log(`Renaming topic ${replyToId} to "${newTopicName}"`);
      
      await client.invoke(
        new Api.channels.EditForumTopic({
          channel: await client.getInputEntity(message.peerId),
          topicId: replyToId,
          title: newTopicName
        })
      );
      
      // Update DB
      await Topic.findOneAndUpdate(
        { telegram_topic_id: replyToId, ownerId },
        { name: newTopicName },
        { upsert: true }
      );
      
      await saveLog(`Renamed topic ${replyToId} to "${newTopicName}"`, 'info', 'USERBOT', null, ownerId);
    } else if (shouldRename && topicName.endsWith(suffix)) {
      console.log(`Topic ${replyToId} already has suffix "${suffix}". Skipping.`);
    }
  } catch (renameErr: any) {
    console.error("Failed to rename topic:", renameErr);
    await saveLog(`Failed to rename topic ${replyToId}: ${renameErr.message}`, 'error', 'USERBOT', null, ownerId);
  }
  
  return topicName;
};

// SSE Clients
let sseClients: any[] = [];

function sendSseEvent(type: string, data: any) {
  sseClients.forEach(client => {
    client.res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
  });
}

// Initialize default settings
async function initSettings() {
  const autoReply = await getSetting("auto_reply");
  if (!autoReply) await setSetting("auto_reply", "Welcome to the new topic!");
  
  const delay = await getSetting("delay_seconds");
  if (!delay) await setSetting("delay_seconds", "0");
  
  const photoReplyEnabled = await getSetting("photo_reply_enabled");
  if (!photoReplyEnabled) await setSetting("photo_reply_enabled", "false");

  const photoReplyMessage = await getSetting("photo_reply_message");
  if (!photoReplyMessage) await setSetting("photo_reply_message", "ok wait");

  const photoReplyMax = await getSetting("photo_reply_max");
  if (!photoReplyMax) await setSetting("photo_reply_max", "2");

  const notificationSoundEnabled = await getSetting("notification_sound_enabled");
  if (!notificationSoundEnabled) await setSetting("notification_sound_enabled", "true");

  const notificationSoundType = await getSetting("notification_sound_type");
  if (!notificationSoundType) await setSetting("notification_sound_type", "default");

  const topicIcon = await getSetting("topic_icon");
  if (!topicIcon) await setSetting("topic_icon", "✅");

  const aiModeEnabled = await getSetting("ai_mode_enabled");
  if (!aiModeEnabled) await setSetting("ai_mode_enabled", "false");

  const aiPersona = await getSetting("ai_persona");
  if (!aiPersona) {
    await setSetting("ai_persona", DEFAULT_AI_PERSONA);
  } else {
    // Optional: Update legacy default to new default if it matches the old generic one
    const oldDefault = "You are a helpful assistant. Reply in Hinglish, Hindi, or English. Be casual and friendly. If the message doesn't require a response, reply with 'NO_REPLY'.";
    if (aiPersona.value === oldDefault) {
      await setSetting("ai_persona", DEFAULT_AI_PERSONA);
      console.log("Updated AI Persona to new sales context.");
    }
  }

  const geminiApiKeys = await getSetting("gemini_api_keys");
  if (!geminiApiKeys) {
    await setSetting("gemini_api_keys", JSON.stringify([]));
    console.log("Gemini API Keys setting initialized.");
  }

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
  
  const systemPaused = await getSetting("system_paused");
  if (!systemPaused) {
    await setSetting("system_paused", "false");
    console.log("System Paused setting initialized.");
  }

  const autoResetKeywords = await getSetting("auto_reset_keywords");
  if (!autoResetKeywords) {
    await setSetting("auto_reset_keywords", "true");
    console.log("Auto Reset Keywords setting initialized.");
  }

  const autoBlockKeywords = await getSetting("auto_block_keywords");
  if (!autoBlockKeywords) {
    await setSetting("auto_block_keywords", JSON.stringify([]));
    console.log("Auto Block Keywords setting initialized.");
  }

  const autoBlockMatchMode = await getSetting("auto_block_match_mode");
  if (!autoBlockMatchMode) {
    await setSetting("auto_block_match_mode", "partial");
    console.log("Auto Block Match Mode setting initialized.");
  }
}
initSettings();

let userClients = new Map<string, TelegramClient>();
let phoneCodeHash: string | null = null;
let phoneNumber: string | null = null;
let cachedKeywords: any[] = [];

async function refreshKeywordCache() {
  try {
    cachedKeywords = await Keyword.find();
    console.log(`Keyword cache refreshed: ${cachedKeywords.length} keywords.`);
  } catch (err) {
    console.error("Failed to refresh keyword cache:", err);
  }
}

export const app = express();

async function startServer() {
  app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
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

  function setupUserBotHandlers(client: TelegramClient, targetGroupIds: string[], ownerId: string) {
    client.addEventHandler(async (event: any) => {
      const message = event.message;
      if (!message) return;

      // Fast ID extraction
      let chatId: string = "";
      if (message.peerId) {
        if (message.peerId.channelId) chatId = "-100" + message.peerId.channelId.toString();
        else if (message.peerId.chatId) chatId = "-" + message.peerId.chatId.toString();
        else if (message.peerId.userId) chatId = message.peerId.userId.toString();
      }

      const normalizedChatId = chatId.replace("-100", "");
      const isTargetGroup = targetGroupIds.some(gid => gid.replace("-100", "") === normalizedChatId);
      
      if (!isTargetGroup) {
        return;
      }

      // Check if system is paused
      const isSystemPaused = (await getSetting("system_paused", ownerId))?.value === "true";
      if (isSystemPaused) {
        console.log(`System is paused for ${ownerId}. Skipping message processing.`);
        return;
      }

      console.log(`UserBot (${ownerId}) processing message in ${chatId}: "${message.message || '[No text]'}"`);

      // Check if topic is blocked
      const topicId = message.replyTo?.replyToMsgId || message.id;
      const isBlocked = await BlockedTopic.findOne({ telegram_topic_id: topicId, ownerId });
      if (isBlocked) {
        console.log(`Topic ${topicId} is blocked for ${ownerId}. Skipping processing.`);
        return;
      }

      // Check keyword reset logic
      const autoResetEnabled = (await getSetting("auto_reset_keywords", ownerId))?.value === "true";

      // Auto-Block Keywords Logic
      const autoBlockKeywordsStr = (await getSetting("auto_block_keywords", ownerId))?.value || "[]";
      let blockKeywords: { keyword: string, matchMode: 'exact' | 'partial' }[] = [];
      try {
        blockKeywords = JSON.parse(autoBlockKeywordsStr);
      } catch (e) {
        // Fallback for old comma-separated format
        if (autoBlockKeywordsStr.trim()) {
          blockKeywords = autoBlockKeywordsStr.split(",").map(k => ({ keyword: k.trim(), matchMode: 'partial' as const })).filter(k => k.keyword);
        }
      }

      if (blockKeywords.length > 0 && message.message && !message.out) {
        const msgText = message.message.toLowerCase();
        let shouldBlock = false;

        for (const item of blockKeywords) {
          const kw = item.keyword.toLowerCase();
          if (item.matchMode === 'exact') {
            // Exact match (case insensitive)
            if (msgText === kw) {
              shouldBlock = true;
              break;
            }
          } else {
            // Partial match
            if (msgText.includes(kw)) {
              shouldBlock = true;
              break;
            }
          }
        }

        if (shouldBlock) {
          console.log(`Auto-blocking topic ${topicId} due to keyword match for ${ownerId}.`);
          
          // Get topic name
          const topicInfo = await Topic.findOne({ telegram_topic_id: topicId, ownerId });
          const name = topicInfo ? topicInfo.name : "Unknown Topic";
          const link = `https://t.me/c/${normalizedChatId}/${topicId}`;

          await BlockedTopic.findOneAndUpdate(
            { telegram_topic_id: topicId, ownerId },
            { name, link },
            { upsert: true }
          );

          await saveLog(`Topic ${topicId} auto-blocked due to keyword match`, 'warn', 'USERBOT', { topicName: name }, ownerId);
          
          // Notify frontend
          sendSseEvent('topic_blocked', {
            message: `Topic "${name}" auto-blocked`,
            topicName: name,
            ownerId: ownerId,
            timestamp: new Date()
          });

          return; // Stop processing this message
        }
      }

      // 0. Photo Handler
      if (!message.out && message.media && (message.media.photo || (message.media.document && message.media.document.mimeType.startsWith('image/')))) {
        const photoReplyEnabled = (await getSetting("photo_reply_enabled", ownerId))?.value === "true";
        
        if (photoReplyEnabled) {
          const topicId = message.replyTo?.replyToMsgId || message.id;
          const photoReplyMax = parseInt((await getSetting("photo_reply_max", ownerId))?.value || "2", 10);

          // Check photo reply history for this topic
          let history = await PhotoReplyHistory.findOne({ topic_id: topicId, ownerId });
          if (history && history.count >= photoReplyMax) {
            console.log(`Photo reply limit reached for topic ${topicId} (${history.count}/${photoReplyMax}) for ${ownerId}. Skipping.`);
            return;
          }

          const photoReplyMessage = (await getSetting("photo_reply_message", ownerId))?.value || "ok wait";
          console.log(`Photo detected for ${ownerId}. Sending auto-reply: "${photoReplyMessage}"`);
          
          try {
            await client.sendMessage(message.peerId, {
              message: photoReplyMessage,
              replyTo: message.id,
            });

            // Update history
            if (!history) {
              await PhotoReplyHistory.create({ topic_id: topicId, count: 1, ownerId });
            } else {
              history.count += 1;
              history.last_updated = new Date();
              await history.save();
            }

            // Fetch Topic Name & Rename if needed
            const topicIcon = (await getSetting("topic_icon", ownerId))?.value || "🛑";
            const renameKeywordsStr = (await getSetting("topic_rename_keywords", ownerId))?.value || "";
            const renameMatchMode = (await getSetting("topic_rename_match_mode", ownerId))?.value || "exact";

            // Pass true to bypass keyword check for photos
            const topicName = await handleTopicRenaming(client, message, topicIcon, renameKeywordsStr, renameMatchMode, ownerId, true);
            
            // Notify frontend
            sendSseEvent('photo_received', {
              message: `${topicName} sent a photo`,
              topicName: topicName,
              ownerId: ownerId,
              timestamp: new Date()
            });
            
            await saveLog(`Photo auto-reply sent to ${topicName}: "${photoReplyMessage}" (Count: ${history ? history.count : 1}/${photoReplyMax})`, 'info', 'USERBOT', null, ownerId);
          } catch (err: any) {
            console.error("Failed to send photo auto-reply:", err);
            await saveLog(`Failed to send photo auto-reply: ${err.message}`, 'error', 'USERBOT', null, ownerId);
          }
        }
      }

      // 1. Topic Creation Handler
      if (message.action instanceof Api.MessageActionTopicCreate) {
        const topicName = message.action.title;
        const topicId = message.id;
        console.log(`New topic detected: ${topicId} - ${topicName} for ${ownerId}`);
        await logTopic(topicId, topicName, ownerId);
        
        const autoReply = (await getSetting("auto_reply", ownerId))?.value || "Welcome!";
        const delaySeconds = parseInt((await getSetting("delay_seconds", ownerId))?.value || "0", 10);
        
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
      } else {
        // Fallback: Check if topic exists in DB for any message in a topic
        const topicId = message.replyTo?.replyToMsgId || message.id;
        // Only if it looks like a topic ID (usually small integer relative to chat, but in forums it's the message ID of the topic creation)
        if (topicId && message.peerId) {
             // We can't easily know if it's a topic or just a reply without checking context, 
             // but for forums, the top message ID is the topic ID.
             // Let's try to find it. If not found, we might want to fetch it.
             // However, fetching every time is expensive.
             // Let's just rely on the fact that if we are processing a message in a topic, we should know about it.
             // For now, let's just ensure we log it if we can confirm it's a topic.
             // Actually, the user wants "Total Topics" to work.
             // If the bot missed the creation event, we need a way to add it.
             
             // Simple approach: If it's a forum channel, try to get topic info if missing?
             // This might be too heavy.
             // Let's just log the topic if we haven't seen it, assuming the current message ID *might* be the topic ID if it's a thread starter?
             // No, replyToMsgId is the topic ID in forums.
             if (message.replyTo?.replyToMsgId) {
                 const tid = message.replyTo.replyToMsgId;
                 const exists = await Topic.exists({ telegram_topic_id: tid, ownerId });
                 if (!exists) {
                     // It's a new topic we haven't seen (or missed creation event)
                     // We don't know the name easily without fetching.
                     // Let's just log it as "Unknown Topic" or try to fetch.
                     // Fetching is better.
                     try {
                         // This is specific to Telegram Client API
                         // We can try to get the message with that ID to see if it's a service message for topic creation?
                         // Or just save it with a placeholder name.
                         await logTopic(tid, "Detected Topic", ownerId);
                         console.log(`Auto-detected missing topic ${tid} for ${ownerId}`);
                     } catch (e) {
                         console.error(`Failed to auto-log topic ${tid}`, e);
                     }
                 }
             }
        }
      // 2. Keyword Handler
      let keywordMatched = false;
      if (message.message && !message.out) {
        const text = message.message.toLowerCase().trim();
        const matches: { kw: any, index: number, matchedWord: string }[] = [];
        
        console.log(`Checking keywords for: "${text}"`);
        
        // Fetch keywords for this owner
        const userKeywords = await Keyword.find({ ownerId });
        
        for (const kw of userKeywords) {
          // Collect all trigger words for this rule (legacy + new array)
          const triggerWords = [...(kw.keywords || [])];
          if (kw.keyword && !triggerWords.includes(kw.keyword)) {
            triggerWords.push(kw.keyword);
          }

          // Check each trigger word
          for (const word of triggerWords) {
            const wordLower = word.toLowerCase().trim();
            if (!wordLower) continue;

            const escapedWord = escapeRegExp(wordLower);
            let regex: RegExp;
            
            if (kw.match_mode === 'partial') {
              regex = new RegExp(escapedWord, 'gi');
            } else {
              // Unicode-friendly boundary check: matches if surrounded by non-letters/numbers or at start/end
              regex = new RegExp(`(?<=^|[^\\p{L}\\p{N}])${escapedWord}(?=$|[^\\p{L}\\p{N}])`, 'gui');
            }
            
            let match;
            let found = false;

            // Regex match
            while ((match = regex.exec(text)) !== null) {
              console.log(`Keyword "${wordLower}" matched via regex (${kw.match_mode || 'exact'}) at index ${match.index}`);
              matches.push({ kw, index: match.index, matchedWord: wordLower });
              found = true;
              break; // Only match this specific word once per message
            }
          }
        }

        // Sort matches by their appearance in the message
        matches.sort((a, b) => a.index - b.index);

        if (matches.length > 0) {
          keywordMatched = true;
          console.log(`Found ${matches.length} keyword matches in message. Processing sequentially...`);
          
          const processedRuleIds = new Set<string>();

          for (const match of matches) {
            const kw = match.kw;
            
            // Skip if we've already replied for this rule (group of keywords)
            if (processedRuleIds.has(kw._id.toString())) {
              console.log(`Skipping duplicate match for rule ${kw._id} (word: ${match.matchedWord})`);
              continue;
            }

            console.log(`Processing matched keyword: ${match.matchedWord} (Rule ID: ${kw._id}) at index ${match.index}`);
            
            try {
              const replyToMsgId = message.id;
              const topicId = message.replyTo?.replyToMsgId;

              // Rate limiting check: Max replies per keyword rule per topic
              if (topicId) {
                const history = await ReplyHistory.findOne({ topic_id: topicId, keyword_id: kw._id, ownerId });
                const maxReplies = kw.max_replies || 2;
                
                let currentCount = 0;
                if (history) {
                  const lastUpdated = new Date(history.last_updated);
                  const today = new Date();
                  
                  // Check if same day in IST (Indian Standard Time)
                  const lastUpdatedIST = lastUpdated.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
                  const todayIST = today.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
                  
                  if (lastUpdatedIST === todayIST || !autoResetEnabled) {
                    currentCount = history.count;
                  } else {
                    // It's a new day and reset is enabled
                    currentCount = 0;
                  }
                }

                if (currentCount >= maxReplies) {
                  console.log(`Skipping reply for keyword "${match.matchedWord}" in topic ${topicId}: limit reached (${currentCount}/${maxReplies}).`);
                  continue;
                }
              }

              processedRuleIds.add(kw._id.toString());

              // Collect all links to process (legacy + new array)
              const linksToProcess = [...(kw.message_links || [])];
              if (kw.message_link && !linksToProcess.includes(kw.message_link)) {
                linksToProcess.push(kw.message_link);
              }

              // 1. AI Reply (if enabled)
              if (kw.ai_reply_enabled) {
                console.log(`Triggering AI reply for keyword: ${match.matchedWord} for ${ownerId}`);
                const aiModeEnabled = (await getSetting("ai_mode_enabled", ownerId))?.value === "true";
                
                if (aiModeEnabled) {
                   const geminiApiKeysSetting = await getSetting("gemini_api_keys", ownerId);
                   let apiKeys: string[] = [];
                   try {
                     apiKeys = JSON.parse(geminiApiKeysSetting?.value || "[]");
                   } catch (e) {}
                   
                   const envKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
                   if (envKey && !apiKeys.includes(envKey)) apiKeys.push(envKey);
                   
                   if (apiKeys.length > 0) {
                     const aiPersona = (await getSetting("ai_persona", ownerId))?.value || DEFAULT_AI_PERSONA;
                     
                     for (const apiKey of apiKeys) {
                       try {
                         const genAI = new GoogleGenAI({ apiKey });
                         const response = await genAI.models.generateContent({
                           model: "gemini-2.5-flash",
                           contents: [
                             {
                               role: "user",
                               parts: [
                                 { text: `System Instruction: ${aiPersona}` },
                                 { text: `User Message: "${message.message}"` },
                                 { text: `Context: The user triggered a keyword "${match.matchedWord}". Reply naturally to their query. If the message is short, generic, or doesn't need a reply, output 'NO_REPLY'.` }
                               ]
                             }
                           ]
                         });
                         
                         const aiReply = response.text.trim();
                         if (aiReply && aiReply !== "NO_REPLY") {
                           console.log(`AI Reply (Keyword Triggered): "${aiReply}"`);
                           await client.sendMessage(message.peerId, {
                             message: aiReply,
                             replyTo: message.id,
                           });
                           await saveLog(`AI Auto-Reply (Keyword: ${match.matchedWord}): "${aiReply}"`, 'info', 'USERBOT');
                           break; // Success
                         }
                       } catch (e) {
                         console.error("AI Keyword Reply failed:", e);
                       }
                     }
                   }
                }
              }

              if (linksToProcess.length > 0) {
                console.log(`Handling ${linksToProcess.length} message links for keyword: ${match.matchedWord}`);
                
                // Send the custom reply message first if it exists
                if (kw.reply) {
                  await client.sendMessage(message.peerId, {
                    message: kw.reply,
                    replyTo: replyToMsgId,
                  });
                }

                for (const link of linksToProcess) {
                  const parts = link.split("/").filter(p => p.length > 0);
                  const messageId = parseInt(parts[parts.length - 1], 10);
                  
                  if (!isNaN(messageId)) {
                    let fromPeer: any = chatId;
                    
                    if (link.includes("/c/")) {
                      const cIndex = parts.indexOf("c");
                      if (cIndex !== -1 && parts[cIndex + 1]) {
                        fromPeer = `-100${parts[cIndex + 1]}`;
                      }
                    } else {
                      const tmeIndex = parts.indexOf("t.me");
                      if (tmeIndex !== -1 && parts[tmeIndex + 1]) {
                        fromPeer = parts[tmeIndex + 1];
                      } else if (parts.length >= 3) {
                        fromPeer = parts[2];
                      }
                    }

                    const topMsgId = message.replyTo?.replyToMsgId;
                    
                    try {
                      try {
                        await client.getEntity(fromPeer);
                      } catch (e) {}

                      await client.invoke(
                        new Api.messages.ForwardMessages({
                          fromPeer: fromPeer,
                          id: [messageId],
                          randomId: [BigInt(Math.floor(Math.random() * 1e15)) as any],
                          toPeer: message.peerId,
                          topMsgId: topMsgId,
                        })
                      );
                      console.log(`Forwarded message ${messageId} for keyword: ${kw.keyword}`);
                    } catch (forwardErr: any) {
                      console.error("Forwarding failed, trying fallback:", forwardErr.message);
                      await client.forwardMessages(message.peerId, {
                        messages: [messageId],
                        fromPeer: chatId,
                      });
                    }
                  }
                  // Small delay between forwards
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
              } else if (kw.photo) {
                console.log(`Sending photo reply for keyword: ${kw.keyword}`);
                const base64Data = kw.photo.includes(",") ? kw.photo.split(",")[1] : kw.photo;
                const buffer = Buffer.from(base64Data, "base64");
                
                const fileToUpload = new CustomFile("photo.jpg", buffer.length, "", buffer);
                const toUpload = await client.uploadFile({
                  file: fileToUpload,
                  workers: 1,
                });

                await client.sendFile(message.peerId, {
                  file: toUpload,
                  caption: kw.reply || "",
                  replyTo: replyToMsgId,
                  forceDocument: false,
                });
              } else if (kw.reply) {
                console.log(`Sending text reply for keyword: ${kw.keyword}`);
                await client.sendMessage(message.peerId, {
                  message: kw.reply,
                  replyTo: replyToMsgId,
                });
              }
              
              // Update reply history count
              if (topicId) {
                const today = new Date();
                const history = await ReplyHistory.findOne({ topic_id: topicId, keyword_id: kw._id, ownerId });
                let isSameDay = false;
                
                if (history) {
                  const lastUpdated = new Date(history.last_updated);
                  const lastUpdatedIST = lastUpdated.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
                  const todayIST = today.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
                  
                  if (lastUpdatedIST === todayIST) {
                    isSameDay = true;
                  }
                }

                if (history && isSameDay) {
                   await ReplyHistory.findByIdAndUpdate(history._id, { $inc: { count: 1 }, last_updated: today });
                } else {
                   // Upsert with set count 1 (resets if exists but old, creates if new)
                   await ReplyHistory.findOneAndUpdate(
                      { topic_id: topicId, keyword_id: kw._id, ownerId },
                      { count: 1, last_updated: today },
                      { upsert: true }
                   );
                }
              }
              
              await saveLog(`Keyword matched: ${match.matchedWord}`, 'info', 'USERBOT', null, ownerId);
              
              // Add a small delay between replies to avoid spamming/rate limits
              if (matches.length > 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } catch (err: any) {
              console.error(`UserBot failed to reply to keyword "${kw.keyword}":`, err);
              await saveLog(`Failed to reply to keyword ${kw.keyword}: ${err.message}`, 'error', 'USERBOT', null, ownerId);
            }
          }
        }

      // 3. AI Smart Reply (Fallback)
      if (!keywordMatched && message.message && !message.out) {
        const aiModeEnabled = (await getSetting("ai_mode_enabled", ownerId))?.value === "true";
        if (aiModeEnabled) {
          // Fetch keys from settings
          const geminiApiKeysSetting = await getSetting("gemini_api_keys", ownerId);
          let apiKeys: string[] = [];
          try {
            apiKeys = JSON.parse(geminiApiKeysSetting?.value || "[]");
          } catch (e) {
            console.error("Failed to parse gemini_api_keys setting", e);
          }

          // Add environment variable key as fallback/primary if not in list
          const envKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
          if (envKey && !apiKeys.includes(envKey)) {
            apiKeys.push(envKey);
          }

          if (apiKeys.length === 0) {
            console.warn(`AI Mode is enabled for ${ownerId} but no Gemini API Keys found.`);
            return;
          }

          const aiPersona = (await getSetting("ai_persona", ownerId))?.value || DEFAULT_AI_PERSONA;
          
          let aiReply = null;
          let success = false;

          // Try keys one by one
          for (const apiKey of apiKeys) {
            try {
              console.log(`Attempting AI reply for ${ownerId} with key ending in ...${apiKey.slice(-4)}`);
              const genAI = new GoogleGenAI({ apiKey });
              const response = await genAI.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                  {
                    role: "user",
                    parts: [
                      { text: `System Instruction: ${aiPersona}` },
                      { text: `User Message: "${message.message}"` },
                      { text: `Context: This is a Telegram group chat. Reply naturally. If the message is short, generic, or doesn't need a reply, output 'NO_REPLY'.` }
                    ]
                  }
                ]
              });
              
              aiReply = response.text.trim();
              success = true;
              break; // Success! Stop trying keys.
            } catch (aiErr: any) {
              let errorMsg = aiErr.message || String(aiErr);
              
              // Try to parse JSON error message if possible
              try {
                if (typeof errorMsg === 'string' && errorMsg.startsWith('{')) {
                  const parsed = JSON.parse(errorMsg);
                  if (parsed.error && parsed.error.message) {
                    errorMsg = parsed.error.message;
                  }
                }
              } catch (e) {
                // Ignore parse error
              }

              console.error(`AI Generation failed with key ...${apiKey.slice(-4)}:`, errorMsg);
              
              // Log specific critical errors to the dashboard so the user knows WHICH key is bad
              if (errorMsg.includes("leaked") || errorMsg.includes("not valid") || errorMsg.includes("API_KEY_INVALID")) {
                await saveLog(`Invalid API Key (...${apiKey.slice(-4)}): ${errorMsg}`, 'error', 'AI_SYSTEM', null, ownerId);
              }
            }
          }

          if (success) {
            if (aiReply && aiReply !== "NO_REPLY") {
              console.log(`AI Reply generated for ${ownerId}: "${aiReply}"`);
              await client.sendMessage(message.peerId, {
                message: aiReply,
                replyTo: message.id,
              });
              await saveLog(`AI Auto-Reply: "${aiReply}"`, 'info', 'USERBOT', null, ownerId);
              
              // Notify frontend
              sendSseEvent('ai_reply', {
                message: `AI Replied: ${aiReply}`,
                originalMessage: message.message,
                ownerId: ownerId,
                timestamp: new Date()
              });
            } else {
              console.log(`AI decided not to reply (NO_REPLY) for ${ownerId}.`);
            }
          } else {
            const errorMessage = "All Gemini API Keys failed. Please check your keys in settings.";
            await saveLog(`AI Generation failed: ${errorMessage}`, 'error', 'USERBOT');
          }
        }
      }
    });
  }

  // Bot Logic (Logging only, no auto-replies)
  bot.on("message", async (msg) => {
    // Only process messages from the target group
    if (msg.chat.id.toString() !== groupId) return;
    
    // Topic creation is handled by UserBot (MTProto) for better ownerId isolation
  });

  // SSE Endpoint
  app.get("/api/notifications", (req, res) => {
    const ownerId = (req.query.ownerId as string) || "default";
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, res, ownerId };
    sseClients.push(newClient);

    req.on("close", () => {
      sseClients = sseClients.filter(client => client.id !== clientId);
    });
  });

  // Middleware to extract ownerId
  const getOwnerId = (req: express.Request) => {
    return (req.headers["x-owner-id"] as string) || "default";
  };

  // API Routes
  app.get("/api/stats", async (req, res) => {
    const ownerId = getOwnerId(req);
    try {
      const topicCount = await getTopicCount(ownerId);
      const todayTopicCount = await getTodayTopicCount(ownerId);
      const autoReply = (await getSetting("auto_reply", ownerId))?.value || "";
      const delaySeconds = parseInt((await getSetting("delay_seconds", ownerId))?.value || "0", 10);
      const isSystemPaused = (await getSetting("system_paused", ownerId))?.value === "true";
      const photoReplyEnabled = (await getSetting("photo_reply_enabled", ownerId))?.value === "true";
      const photoReplyMessage = (await getSetting("photo_reply_message", ownerId))?.value || "ok wait";
      const photoReplyMax = parseInt((await getSetting("photo_reply_max", ownerId))?.value || "2", 10);
      const notificationSoundEnabled = (await getSetting("notification_sound_enabled", ownerId))?.value === "true";
      const notificationSoundType = (await getSetting("notification_sound_type", ownerId))?.value || "default";
      const topicIcon = (await getSetting("topic_icon", ownerId))?.value || "🛑";
      const topicRenameKeywords = (await getSetting("topic_rename_keywords", ownerId))?.value || "";
      const topicRenameMatchMode = (await getSetting("topic_rename_match_mode", ownerId))?.value || "exact";
      const autoResetKeywords = (await getSetting("auto_reset_keywords", ownerId))?.value === "true";
      const autoBlockKeywords = (await getSetting("auto_block_keywords", ownerId))?.value || "";
      const aiModeEnabled = (await getSetting("ai_mode_enabled", ownerId))?.value === "true";
      const aiPersona = (await getSetting("ai_persona", ownerId))?.value || "";
      const geminiApiKeys = (await getSetting("gemini_api_keys", ownerId))?.value || "[]";
      
      const accounts = await Account.find({ ownerId });
      const formattedAccounts = accounts.map(acc => ({
        phoneNumber: acc.phoneNumber,
        name: acc.name,
        username: acc.username,
        isActive: acc.isActive,
        isConnected: userClients.has(acc.phoneNumber) && userClients.get(acc.phoneNumber)!.connected,
        apiId: acc.apiId,
        targetGroupIds: acc.targetGroupIds
      }));

      const apiId = (await getSetting("api_id", ownerId))?.value || "";
      const apiHash = (await getSetting("api_hash", ownerId))?.value || "";
      const defaultPhone = (await getSetting("default_phone", ownerId))?.value || "";

      res.json({
        topicCount,
        todayTopicCount,
        autoReply,
        delaySeconds,
        isSystemPaused,
        photoReplyEnabled,
        photoReplyMessage,
        photoReplyMax,
        notificationSoundEnabled,
        notificationSoundType,
        topicIcon,
        topicRenameKeywords,
        topicRenameMatchMode,
        autoResetKeywords,
        autoBlockKeywords,
        aiModeEnabled,
        aiPersona,
        geminiApiKeys,
        accounts: formattedAccounts,
        apiId,
        apiHash,
        defaultPhone,
      });
    } catch (err: any) {
      console.error("Error in /api/stats:", err);
      await saveLog(err.message, 'error', '/api/stats', null, ownerId);
      res.status(500).json({ error: `[GET /api/stats] ${err.message}` });
    }
  });

  app.post("/api/settings", async (req, res) => {
    const ownerId = getOwnerId(req);
    try {
      const { autoReply, delaySeconds, apiId, apiHash, systemPaused, photoReplyEnabled, photoReplyMessage, photoReplyMax, notificationSoundEnabled, notificationSoundType, topicIcon, topicRenameKeywords, topicRenameMatchMode, autoResetKeywords, autoBlockKeywords, aiModeEnabled, aiPersona, geminiApiKeys } = req.body;
      if (typeof autoReply === "string") await setSetting("auto_reply", autoReply, ownerId);
      if (typeof delaySeconds !== "undefined") await setSetting("delay_seconds", String(delaySeconds), ownerId);
      if (typeof apiId !== "undefined") await setSetting("api_id", String(apiId), ownerId);
      if (typeof apiHash !== "undefined") await setSetting("api_hash", String(apiHash), ownerId);
      if (typeof systemPaused !== "undefined") await setSetting("system_paused", String(systemPaused), ownerId);
      if (typeof photoReplyEnabled !== "undefined") await setSetting("photo_reply_enabled", String(photoReplyEnabled), ownerId);
      if (typeof photoReplyMessage !== "undefined") await setSetting("photo_reply_message", String(photoReplyMessage), ownerId);
      if (typeof photoReplyMax !== "undefined") await setSetting("photo_reply_max", String(photoReplyMax), ownerId);
      if (typeof notificationSoundEnabled !== "undefined") await setSetting("notification_sound_enabled", String(notificationSoundEnabled), ownerId);
      if (typeof notificationSoundType !== "undefined") await setSetting("notification_sound_type", String(notificationSoundType), ownerId);
      if (typeof topicIcon !== "undefined") await setSetting("topic_icon", String(topicIcon), ownerId);
      if (typeof topicRenameKeywords !== "undefined") await setSetting("topic_rename_keywords", String(topicRenameKeywords), ownerId);
      if (typeof topicRenameMatchMode !== "undefined") await setSetting("topic_rename_match_mode", String(topicRenameMatchMode), ownerId);
      if (typeof autoResetKeywords !== "undefined") await setSetting("auto_reset_keywords", String(autoResetKeywords), ownerId);
      if (typeof autoBlockKeywords !== "undefined") await setSetting("auto_block_keywords", String(autoBlockKeywords), ownerId);
      if (typeof aiModeEnabled !== "undefined") await setSetting("ai_mode_enabled", String(aiModeEnabled), ownerId);
      if (typeof aiPersona !== "undefined") await setSetting("ai_persona", String(aiPersona), ownerId);
      if (typeof geminiApiKeys !== "undefined") await setSetting("gemini_api_keys", String(geminiApiKeys), ownerId);
      
      await saveLog("Settings updated", 'info', '/api/settings', { autoReply, delaySeconds, apiId, systemPaused, photoReplyEnabled, photoReplyMax, notificationSoundEnabled, notificationSoundType, topicIcon, topicRenameKeywords, topicRenameMatchMode, autoResetKeywords, autoBlockKeywords, aiModeEnabled }, ownerId);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Error in /api/settings:", err);
      await saveLog(err.message, 'error', '/api/settings', req.body, ownerId);
      res.status(500).json({ error: `[POST /api/settings] ${err.message}` });
    }
  });

  app.post("/api/verify-gemini", async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) {
        return res.status(400).json({ success: false, error: "API Key is required" });
      }

      const genAI = new GoogleGenAI({ apiKey });
      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: "Hello" }] }]
      });
      
      if (response && response.text) {
        res.json({ success: true });
      } else {
        res.json({ success: false, error: "No response from Gemini" });
      }
    } catch (err: any) {
      console.error("Gemini Verification Error:", err);
      let errorMessage = err.message;
      if (err.message?.includes("API key not valid") || err.toString().includes("API_KEY_INVALID")) {
        errorMessage = "Invalid API Key";
      }
      res.json({ success: false, error: errorMessage });
    }
  });

  // Keyword Routes
  app.get("/api/keywords", async (req, res) => {
    const ownerId = getOwnerId(req);
    try {
      const keywords = await Keyword.find({ ownerId });
      res.json(keywords);
    } catch (err: any) {
      res.status(500).json({ error: `[GET /api/keywords] ${err.message}` });
    }
  });

  app.post("/api/keywords", async (req, res) => {
    const ownerId = getOwnerId(req);
    const { id, keyword, keywords, reply, photo, message_link, message_links, max_replies, match_mode, ai_reply_enabled } = req.body;
    try {
      // Ensure keywords is an array
      const keywordsArray = Array.isArray(keywords) ? keywords : (keyword ? [keyword] : []);
      
      const updateData = { 
        keyword, // Keep legacy
        keywords: keywordsArray, 
        reply, 
        photo, 
        message_link, 
        message_links,
        max_replies: typeof max_replies === 'number' ? max_replies : 2,
        match_mode: match_mode || 'exact',
        ai_reply_enabled: !!ai_reply_enabled,
        ownerId
      };
      
      if (id) {
        await Keyword.findOneAndUpdate({ _id: id, ownerId }, updateData);
      } else {
        await Keyword.create(updateData);
      }
      
      // Refresh cache in background to speed up response
      refreshKeywordCache().catch(err => console.error("Background cache refresh failed:", err));
      
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: `[POST /api/keywords] ${err.message}` });
    }
  });

  app.delete("/api/keywords/:id", async (req, res) => {
    const ownerId = getOwnerId(req);
    try {
      await Keyword.findOneAndDelete({ _id: req.params.id, ownerId });
      refreshKeywordCache().catch(err => console.error("Background cache refresh failed:", err));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: `[DELETE /api/keywords] ${err.message}` });
    }
  });

  // Export/Import Routes
  app.get("/api/data/export", async (req, res) => {
    const ownerId = getOwnerId(req);
    try {
      const keywords = await Keyword.find({ ownerId });
      const settings = await Setting.find({ ownerId, key: { $ne: "session_string" } }); // Don't export session string
      res.json({ keywords, settings });
    } catch (err: any) {
      res.status(500).json({ error: `[GET /api/data/export] ${err.message}` });
    }
  });

  app.post("/api/data/import", express.json({ limit: '10mb' }), async (req, res) => {
    const ownerId = getOwnerId(req);
    try {
      const { keywords, settings } = req.body;
      
      if (keywords && Array.isArray(keywords)) {
        for (const kw of keywords) {
          await Keyword.findOneAndUpdate(
            { keyword: kw.keyword, ownerId },
            { 
              keywords: kw.keywords || [kw.keyword],
              reply: kw.reply, 
              photo: kw.photo, 
              message_link: kw.message_link,
              message_links: kw.message_links || [],
              max_replies: kw.max_replies || 2,
              match_mode: kw.match_mode || 'exact',
              ownerId
            },
            { upsert: true }
          );
        }
      }

      if (settings && Array.isArray(settings)) {
        for (const s of settings) {
          if (s.key !== "session_string") {
            await Setting.findOneAndUpdate(
              { key: s.key, ownerId },
              { value: s.value, ownerId },
              { upsert: true }
            );
          }
        }
      }

      await refreshKeywordCache();
      await saveLog("Data imported", 'info', '/api/data/import', null, ownerId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: `[POST /api/data/import] ${err.message}` });
    }
  });

  // UserBot Auth Routes
  app.post("/api/auth/send-code", async (req, res) => {
    const ownerId = getOwnerId(req);
    const { phone } = req.body;
    let apiIdRaw = (await getSetting("api_id", ownerId))?.value || "";
    let apiHash = (await getSetting("api_hash", ownerId))?.value || "";

    // Trim whitespace
    apiIdRaw = apiIdRaw.trim();
    apiHash = apiHash.trim();

    const apiId = parseInt(apiIdRaw, 10);

    if (!apiId || isNaN(apiId) || !apiHash) {
      return res.status(400).json({ error: "Valid API ID and Hash are required in settings." });
    }

    // Check if user already has an account (Restriction: 1 account per ownerId)
    const existingAccountCount = await Account.countDocuments({ ownerId });
    if (existingAccountCount >= 1) {
      return res.status(400).json({ error: "Only one Telegram account is allowed per device/Owner ID. Please logout existing account first." });
    }

    console.log(`Attempting login for ${ownerId} with API ID: ${apiId} (Hash length: ${apiHash.length})`);

    try {
      const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
        connectionRetries: 5,
      });
      await client.connect();
      const result = await client.sendCode({ apiId, apiHash }, phone);
      
      // Store temporary client for this phone
      userClients.set(phone, client);
      
      phoneCodeHash = result.phoneCodeHash;
      phoneNumber = phone;
      await saveLog(`Auth code sent to ${phone}`, 'info', '/api/auth/send-code', null, ownerId);
      res.json({ success: true });
    } catch (err: any) {
      console.error("SendCode error:", err);
      await saveLog(err.message, 'error', '/api/auth/send-code', { phone, apiId }, ownerId);
      res.status(500).json({ error: `[POST /api/auth/send-code] ${err.message}` });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    const ownerId = getOwnerId(req);
    const { code, password } = req.body;
    const client = phoneNumber ? userClients.get(phoneNumber) : null;
    
    if (!client || !phoneNumber || !phoneCodeHash) return res.status(400).json({ error: "Session not initialized" });

    try {
      try {
        await client.invoke(
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
          const apiIdRaw = (await getSetting("api_id", ownerId))?.value || "";
          const apiHash = ((await getSetting("api_hash", ownerId))?.value || "").trim();
          const apiId = parseInt(apiIdRaw.trim(), 10);
          
          await client.signInWithPassword({ apiId, apiHash }, {
            password: async () => password,
            onError: (err) => { throw err; }
          });
        } else {
          throw err;
        }
      }

      const sessionString = (client.session as StringSession).save();
      const apiIdRaw = (await getSetting("api_id", ownerId))?.value || "34669075";
      const apiHash = ((await getSetting("api_hash", ownerId))?.value || "b0f0ffda80d58bea235b2d232fbcbc79").trim();
      const apiId = parseInt(apiIdRaw.trim(), 10);

      // Fetch user info
      const me = await client.getMe();
      const name = `${me.firstName || ""} ${me.lastName || ""}`.trim() || "Telegram User";
      const username = me.username || "";

      await Account.findOneAndUpdate(
        { phoneNumber: phoneNumber, ownerId },
        { 
          sessionString, 
          apiId, 
          apiHash, 
          name,
          username,
          isActive: true,
          ownerId
        },
        { upsert: true }
      );

      const currentAcc = await Account.findOne({ phoneNumber, ownerId });
      setupUserBotHandlers(client, currentAcc?.targetGroupIds || [groupId], ownerId);
      await saveLog(`UserBot signed in: ${phoneNumber}`, 'info', '/api/auth/signin', null, ownerId);
      res.json({ success: true });
    } catch (err: any) {
      await saveLog(err.message, 'error', '/api/auth/signin', { phoneNumber }, ownerId);
      res.status(500).json({ error: `[POST /api/auth/signin] ${err.message}` });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    const ownerId = getOwnerId(req);
    const { phoneNumber: phoneToLogout } = req.body;
    try {
      if (phoneToLogout) {
        const client = userClients.get(phoneToLogout);
        if (client) {
          await client.disconnect();
          userClients.delete(phoneToLogout);
        }
        await Account.deleteOne({ phoneNumber: phoneToLogout, ownerId });
      } else {
        // Logout all for this owner
        const accounts = await Account.find({ ownerId });
        for (const acc of accounts) {
          const client = userClients.get(acc.phoneNumber);
          if (client) {
            await client.disconnect();
            userClients.delete(acc.phoneNumber);
          }
        }
        await Account.deleteMany({ ownerId });
        await Setting.deleteOne({ key: "session_string", ownerId });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: `[POST /api/auth/logout] ${err.message}` });
    }
  });

  app.post("/api/accounts/update-groups", async (req, res) => {
    const ownerId = getOwnerId(req);
    const { phoneNumber, targetGroupIds } = req.body;
    try {
      if (!phoneNumber || !Array.isArray(targetGroupIds)) {
        return res.status(400).json({ error: "Phone number and group IDs array are required" });
      }
      
      // Update the account
      await Account.findOneAndUpdate({ phoneNumber, ownerId }, { targetGroupIds });
      
      // Update the running client's handler if it exists
      const client = userClients.get(phoneNumber);
      if (client) {
          // We need to remove the old handler and add a new one with updated groups.
          // However, 'setupUserBotHandlers' adds an event handler but doesn't return a reference to remove it easily
          // without storing it.
          // The simplest way to apply changes is to disconnect and reconnect the client.
          console.log(`Restarting client for ${phoneNumber} to apply group changes...`);
          await client.disconnect();
          await client.connect();
          // Re-setup handlers with NEW group IDs
          setupUserBotHandlers(client, targetGroupIds, ownerId);
      }
      
      await saveLog(`Updated group IDs for ${phoneNumber}`, 'info', '/api/accounts/update-groups', null, ownerId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/topics", async (req, res) => {
    const ownerId = getOwnerId(req);
    try {
      const topics = await Topic.find({ ownerId }).sort({ created_at: -1 });
      res.json(topics);
    } catch (err: any) {
      res.status(500).json({ error: `[GET /api/topics] ${err.message}` });
    }
  });

  app.get("/api/group/messages", async (req, res) => {
    const ownerId = getOwnerId(req);
    console.log(`Accessing /api/group/messages for ${ownerId}`);
    
    // Find a client belonging to this owner
    const ownerAccounts = await Account.find({ ownerId, isActive: true });
    const firstClient = ownerAccounts
      .map(acc => userClients.get(acc.phoneNumber))
      .find(c => c && c.connected);

    if (!firstClient) {
      console.log(`No connected UserBot found for ${ownerId}`);
      return res.status(400).json({ error: "No connected UserBot found" });
    }
    try {
      const { topicId } = req.query;
      const options: any = { limit: 50 };
      
      if (topicId) {
        options.replyTo = parseInt(topicId as string, 10);
      }

      const messages = await firstClient.getMessages(groupId, options);
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
      res.status(500).json({ error: `[GET /api/group/messages] ${err.message}` });
    }
  });

  app.post("/api/broadcast", async (req, res) => {
    const ownerId = getOwnerId(req);
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    try {
      const ownerAccounts = await Account.find({ ownerId, isActive: true });
      const connectedClients = ownerAccounts
        .map(acc => userClients.get(acc.phoneNumber))
        .filter(c => c && c.connected);

      if (connectedClients.length > 0) {
        // Use the first connected client for broadcast
        await connectedClients[0]!.sendMessage(groupId, { message });
        await saveLog("Broadcast sent", 'info', '/api/broadcast', { messageLength: message.length }, ownerId);
        res.json({ success: true });
      } else {
        res.status(400).json({ error: "No Telegram accounts connected. Please login first." });
      }
    } catch (err: any) {
      await saveLog(err.message, 'error', '/api/broadcast', null, ownerId);
      res.status(500).json({ error: `[POST /api/broadcast] ${err.message}` });
    }
  });

  app.get("/api/logs", async (req, res) => {
    const ownerId = getOwnerId(req);
    try {
      const logs = await Log.find({ ownerId }).sort({ timestamp: -1 }).limit(100);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Blocked Topics Routes
  app.get("/api/blocked-topics", async (req, res) => {
    const ownerId = getOwnerId(req);
    try {
      const blocked = await BlockedTopic.find({ ownerId }).sort({ created_at: -1 });
      res.json(blocked);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/blocked-topics", async (req, res) => {
    const ownerId = getOwnerId(req);
    const { link } = req.body;
    if (!link) return res.status(400).json({ error: "Link required" });

    try {
      const parts = link.split("/").filter((p: string) => p.length > 0);
      const topicId = parseInt(parts[parts.length - 1], 10);

      if (isNaN(topicId)) {
        return res.status(400).json({ error: "Invalid topic link" });
      }

      // Toggle behavior: If already blocked, unblock it
      const existing = await BlockedTopic.findOne({ telegram_topic_id: topicId, ownerId });
      if (existing) {
        await BlockedTopic.findByIdAndDelete(existing._id);
        await saveLog(`Topic ${topicId} unblocked via link`, 'info', '/api/blocked-topics', { link }, ownerId);
        return res.json({ success: true, action: 'unblocked' });
      }

      // Try to find topic name from our Topic collection
      const topicInfo = await Topic.findOne({ telegram_topic_id: topicId, ownerId });
      const name = topicInfo ? topicInfo.name : "Unknown Topic";

      await BlockedTopic.create({
        telegram_topic_id: topicId,
        name,
        link,
        ownerId
      });
      
      await saveLog(`Topic ${topicId} blocked`, 'info', '/api/blocked-topics', { link, name }, ownerId);
      res.json({ success: true, action: 'blocked', name });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/blocked-topics/:id", async (req, res) => {
    const ownerId = getOwnerId(req);
    try {
      await BlockedTopic.findOneAndDelete({ _id: req.params.id, ownerId });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/logs", async (req, res) => {
    try {
      await Log.deleteMany({});
      res.json({ success: true });
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
  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Initial keyword cache load
    await refreshKeywordCache();
    
    // Connect UserBots in background
    (async () => {
      try {
        const accounts = await Account.find({ isActive: true });
        console.log(`Found ${accounts.length} active accounts to connect.`);
        
        for (const acc of accounts) {
          try {
            console.log(`Connecting UserBot for ${acc.phoneNumber}...`);
            const client = new TelegramClient(new StringSession(acc.sessionString), acc.apiId, acc.apiHash, {
              connectionRetries: 5,
            });
            await client.connect();
            userClients.set(acc.phoneNumber, client);
            console.log(`UserBot ${acc.phoneNumber} connected successfully.`);
            setupUserBotHandlers(client, acc.targetGroupIds || [groupId], acc.ownerId);
            await saveLog(`UserBot ${acc.phoneNumber} connected automatically on startup`, "info", "SYSTEM", null, acc.ownerId);
          } catch (accErr: any) {
            console.error(`Failed to connect UserBot ${acc.phoneNumber}:`, accErr.message);
            await saveLog(`Startup connection failed for ${acc.phoneNumber}: ${accErr.message}`, "error", "SYSTEM");
          }
        }

        // Legacy support: check if there's a session_string in settings that isn't in Accounts
        const legacySession = (await getSetting("session_string"))?.value;
        if (legacySession) {
          const apiIdRaw = (await getSetting("api_id"))?.value || "34669075";
          const apiHash = ((await getSetting("api_hash"))?.value || "b0f0ffda80d58bea235b2d232fbcbc79").trim();
          const apiId = parseInt(apiIdRaw.trim(), 10);
          
          // Check if this session is already handled
          const alreadyHandled = accounts.some(a => a.sessionString === legacySession);
          
          if (!alreadyHandled && !isNaN(apiId) && apiId > 0 && apiHash) {
             console.log("Connecting legacy UserBot session...");
             const client = new TelegramClient(new StringSession(legacySession), apiId, apiHash, {
               connectionRetries: 5,
             });
             await client.connect();
             const me = await client.getMe() as any;
             const phone = me.phone || "Legacy";
             userClients.set(phone, client);
             setupUserBotHandlers(client, [groupId], "default");
             
             // Migrate to Account model
             await Account.findOneAndUpdate(
               { phoneNumber: phone, ownerId: "default" },
               { sessionString: legacySession, apiId, apiHash, isActive: true },
               { upsert: true }
             );
             console.log(`Legacy UserBot ${phone} connected and migrated.`);
          }
        }
      } catch (err: any) {
        console.error("Failed to connect UserBots on startup:", err);
        await saveLog(`Startup connection failed: ${err.message}`, "error", "SYSTEM");
      }
    })();
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("Shutting down...");
    if (bot.isPolling()) {
      await bot.stopPolling();
    }
    for (const client of userClients.values()) {
      await client.disconnect();
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer();
