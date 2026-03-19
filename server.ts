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
  keyword: { type: String }, // Legacy single keyword
  keywords: { type: [String], default: [] }, // New array of keywords
  reply: { type: String }, // Made optional to support message_link only
  photo: { type: String }, // Base64 string (legacy)
  message_link: { type: String }, // Legacy Telegram message link
  message_links: { type: [String], default: [] }, // Multiple Telegram message links
  max_replies: { type: Number, default: 2 }, // Max replies per topic per keyword rule
  match_mode: { type: String, enum: ['exact', 'partial'], default: 'exact' },
  ai_reply_enabled: { type: Boolean, default: false }
});
const Keyword = mongoose.model("Keyword", KeywordSchema);

const LogSchema = new mongoose.Schema({
  level: { type: String, enum: ['info', 'error', 'warn'], default: 'info' },
  message: { type: String, required: true },
  details: { type: String },
  route: { type: String },
  timestamp: { type: Date, default: Date.now }
});
const Log = mongoose.model("Log", LogSchema);

const ReplyHistorySchema = new mongoose.Schema({
  topic_id: { type: Number, required: true },
  keyword_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Keyword', required: true },
  count: { type: Number, default: 0 },
  last_updated: { type: Date, default: Date.now }
});
ReplyHistorySchema.index({ topic_id: 1, keyword_id: 1 }, { unique: true });
const ReplyHistory = mongoose.model("ReplyHistory", ReplyHistorySchema);

const PhotoReplyHistorySchema = new mongoose.Schema({
  topic_id: { type: Number, required: true, unique: true },
  count: { type: Number, default: 0 },
  last_updated: { type: Date, default: Date.now }
});
const PhotoReplyHistory = mongoose.model("PhotoReplyHistory", PhotoReplyHistorySchema);

const BlockedTopicSchema = new mongoose.Schema({
  telegram_topic_id: { type: Number, required: true, unique: true },
  name: { type: String },
  link: { type: String },
  created_at: { type: Date, default: Date.now }
});
const BlockedTopic = mongoose.model("BlockedTopic", BlockedTopicSchema);

const MissedTriggerSchema = new mongoose.Schema({
  message_id: { type: Number, required: true },
  chat_id: { type: String, required: true },
  topic_id: { type: Number },
  text: { type: String },
  matched_keyword: { type: String },
  rule_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Keyword' },
  timestamp: { type: Date, default: Date.now },
  processed: { type: Boolean, default: false }
});
const MissedTrigger = mongoose.model("MissedTrigger", MissedTriggerSchema);

// Helper functions
const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const getSetting = async (key: string) => await Setting.findOne({ key });
const setSetting = async (key: string, value: string) => await Setting.findOneAndUpdate({ key }, { value }, { upsert: true, new: true });
const getTopicCount = async () => await Topic.countDocuments();
const getTodayTopicCount = async () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return await Topic.countDocuments({ created_at: { $gte: startOfDay } });
};
const logTopic = async (topicId: number, name: string) => {
  try {
    await Topic.create({ telegram_topic_id: topicId, name });
  } catch (err) {}
};

const saveLog = async (message: string, level: 'info' | 'error' | 'warn' = 'info', route?: string, details?: any) => {
  try {
    await Log.create({
      message,
      level,
      route,
      details: details ? (typeof details === 'string' ? details : JSON.stringify(details, null, 2)) : undefined
    });
  } catch (err) {
    console.error("Failed to save log to DB:", err);
  }
};

// Helper function for topic renaming
const handleTopicRenaming = async (client: TelegramClient, message: any, topicId: number, topicIcon: string, renameKeywordsStr: string, renameMatchMode: string, bypassKeywordCheck: boolean = false) => {
  if (!topicId) return "Unknown Topic";

  // Fetch Topic Name
  let topicName = "Unknown Topic";
  
  // 1. Try DB
  const topic = await Topic.findOne({ telegram_topic_id: topicId });
  if (topic && topic.name) {
    topicName = topic.name;
  } 
  
  // 2. Try fetching the topic creation message
  if (topicName === "Unknown Topic") {
    try {
      const messages = await client.getMessages(message.peerId, { ids: [topicId] });
      if (messages && messages.length > 0) {
        const topicMsg = messages[0];
        if (topicMsg.action && topicMsg.action instanceof Api.MessageActionTopicCreate) {
          topicName = topicMsg.action.title;
          await logTopic(topicId, topicName);
        }
      }
    } catch (e) {
      console.error("Failed to fetch topic info from message", e);
    }
  }

  // 3. Try fetching from Forum Topics list (most reliable for existing topics)
  if (topicName === "Unknown Topic") {
    try {
      console.log(`Fetching forum topics to find name for ${topicId}...`);
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
              { telegram_topic_id: t.id },
              { name: t.title },
              { upsert: true }
            );
            
            if (t.id === topicId) {
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
       console.log(`Skipping rename for topic ${topicId}: Name is unknown`);
       shouldRename = false;
       topicName = `Topic ${topicId}`; // Use ID as fallback for return value
    }

    topicName = topicName.trim();
    const suffix = `${topicIcon}${topicIcon}`;

    if (shouldRename && !topicName.endsWith(suffix)) {
      let newTopicName = `${topicName} ${suffix}`;
      // Telegram limit is 128 chars
      if (newTopicName.length > 128) {
          newTopicName = newTopicName.substring(0, 128);
      }

      console.log(`Renaming topic ${topicId} to "${newTopicName}"`);
      
      await client.invoke(
        new Api.channels.EditForumTopic({
          channel: await client.getInputEntity(message.peerId),
          topicId: topicId,
          title: newTopicName
        })
      );
      
      // Update DB
      await Topic.findOneAndUpdate(
        { telegram_topic_id: topicId },
        { name: newTopicName },
        { upsert: true }
      );
      
      await saveLog(`Renamed topic ${topicId} to "${newTopicName}"`, 'info', 'USERBOT');
      return newTopicName; // Return the new name
    } else if (shouldRename && topicName.endsWith(suffix)) {
      console.log(`Topic ${topicId} already has suffix "${suffix}". Skipping.`);
    }
  } catch (renameErr: any) {
    console.error("Failed to rename topic:", renameErr);
    await saveLog(`Failed to rename topic ${topicId}: ${renameErr.message}`, 'error', 'USERBOT');
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

let userClient: TelegramClient | null = null;
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

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  const PORT = 3000;

  // Connect to MongoDB
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    await initSettings();
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }

  // Health check endpoint
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

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

  async function getRecentConversationContext(client: TelegramClient, peerId: any, topicId: number | undefined): Promise<string> {
    if (!topicId) return "";
    try {
      const historyMessages = await client.getMessages(peerId, {
        replyTo: topicId,
        limit: 10, // Fetch last 10 messages for context
      });
      
      if (!historyMessages || historyMessages.length === 0) return "";
      
      let contextStr = "--- Recent Conversation History in this Topic ---\n";
      const reversed = [...historyMessages].reverse();
      for (const msg of reversed) {
        if (msg.message) {
          let senderName = "User";
          if (msg.out) {
            senderName = "Bot (You)";
          } else if (msg.sender) {
            senderName = (msg.sender as any).firstName || (msg.sender as any).username || "User";
          }
          contextStr += `[${senderName}]: ${msg.message}\n`;
        }
      }
      contextStr += "-------------------------------------------------\n";
      return contextStr;
    } catch (e) {
      console.error("Failed to fetch conversation context:", e);
      return "";
    }
  }

  function setupUserBotHandlers(client: TelegramClient, targetGroupId: string) {
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
      const normalizedTargetId = targetGroupId.replace("-100", "");
      
      if (normalizedChatId !== normalizedTargetId) {
        return;
      }

      // Check if system is paused
      const isSystemPaused = (await getSetting("system_paused"))?.value === "true";
      
      console.log(`UserBot processing message in ${chatId}: "${message.message || '[No text]'}"`);

      // Check if topic is blocked
      // Important: For forum topics, the 'topicId' is usually the ID of the first message in the thread (the "create topic" message).
      // Incoming messages in a topic have a 'replyTo.replyToMsgId' pointing to that topic ID.
      // However, sometimes (rarely) or for the topic creation message itself, message.id is the topic ID.
      // We must check BOTH to be safe, because sometimes `replyToMsgId` might be missing or different in edge cases.
      
      const replyToId = message.replyTo?.replyToMsgId;
      const replyToTopId = message.replyTo?.replyToTopId;
      const messageId = message.id;
      
      // The forumTopicId is the root of the thread/topic. 
      // In forums, replyToTopId is the topic's starting message ID.
      const forumTopicId = replyToTopId || replyToId || messageId;

      // Check if the topic ID is blocked
      if (forumTopicId) {
        const isBlocked = await BlockedTopic.findOne({ telegram_topic_id: forumTopicId });
        if (isBlocked) {
          console.log(`Topic ${forumTopicId} is blocked. Skipping processing.`);
          return;
        }
      }

      // Also check if the message ID itself is blocked
      const isMessageBlocked = await BlockedTopic.findOne({ telegram_topic_id: messageId });
      if (isMessageBlocked) {
        console.log(`Message ID ${messageId} is blocked. Skipping processing.`);
        return;
      }

      // Use forumTopicId for grouping/logic, but replyTo should be the message itself to stay in context
      const topicId = forumTopicId;
      const replyInGeneral = (await getSetting("reply_in_general"))?.value === "true";
      const replyTo = replyInGeneral ? undefined : messageId;

      // Check keyword reset logic
      const autoResetEnabled = (await getSetting("auto_reset_keywords"))?.value === "true";

      // Auto-Block Keywords Logic
      const autoBlockKeywordsStr = (await getSetting("auto_block_keywords"))?.value || "[]";
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
          console.log(`Auto-blocking topic ${topicId} due to keyword match.`);
          
          // Get topic name
          const topicInfo = await Topic.findOne({ telegram_topic_id: topicId });
          const name = topicInfo ? topicInfo.name : "Unknown Topic";
          const link = `https://t.me/c/${targetGroupId.replace("-100", "")}/${topicId}`;

          await BlockedTopic.findOneAndUpdate(
            { telegram_topic_id: topicId },
            { name, link },
            { upsert: true }
          );

          await saveLog(`Topic ${topicId} auto-blocked due to keyword match`, 'warn', 'USERBOT', { topicName: name });
          
          // Notify frontend
          sendSseEvent('topic_blocked', {
            message: `Topic "${name}" auto-blocked`,
            topicName: name,
            timestamp: new Date()
          });

          return; // Stop processing this message
        }
      }

      // 0. Photo Handler
      if (!message.out && message.media && (message.media.photo || (message.media.document && message.media.document.mimeType.startsWith('image/')))) {
        const photoReplyEnabledSetting = (await getSetting("photo_reply_enabled"))?.value === "true";
        
        // Always handle topic renaming for photos, even if auto-reply is disabled
        try {
          // Fetch Topic Name & Rename if needed
          const topicIcon = (await getSetting("topic_icon"))?.value || "🛑";
          const renameKeywordsStr = (await getSetting("topic_rename_keywords"))?.value || "";
          const renameMatchMode = (await getSetting("topic_rename_match_mode"))?.value || "exact";

          // Pass true to bypass keyword check for photos
          const topicName = await handleTopicRenaming(client, message, topicId, topicIcon, renameKeywordsStr, renameMatchMode, true);
          
          // Notify frontend
          sendSseEvent('photo_received', {
            message: `${topicName} sent a photo`,
            topicName: topicName,
            timestamp: new Date()
          });

          if (photoReplyEnabledSetting) {
            const photoReplyMax = parseInt((await getSetting("photo_reply_max"))?.value || "2", 10);

            // Check photo reply history for this topic
            let history = await PhotoReplyHistory.findOne({ topic_id: topicId });
            if (history && history.count >= photoReplyMax) {
              console.log(`Photo reply limit reached for topic ${topicId} (${history.count}/${photoReplyMax}). Skipping.`);
            } else {
              const photoReplyMessage = (await getSetting("photo_reply_message"))?.value || "ok wait";
              console.log(`Photo detected. Sending auto-reply: "${photoReplyMessage}"`);
              
              await client.sendMessage(message.peerId, {
                message: photoReplyMessage,
                replyTo: replyTo,
              });

              // Update history
              if (!history) {
                await PhotoReplyHistory.create({ topic_id: topicId, count: 1 });
              } else {
                history.count += 1;
                history.last_updated = new Date();
                await history.save();
              }
              
              await saveLog(`Photo auto-reply sent to ${topicName}: "${photoReplyMessage}" (Count: ${history ? history.count : 1}/${photoReplyMax})`, 'info', 'USERBOT');
            }
          }
        } catch (err: any) {
          console.error("Failed to process photo message:", err);
          await saveLog(`Failed to process photo message: ${err.message}`, 'error', 'USERBOT');
        }
      }

      // 1. Topic Creation Handler
      if (message.action instanceof Api.MessageActionTopicCreate) {
        const topicName = message.action.title;
        const topicId = message.id;
        await logTopic(topicId, topicName);
        
        const autoReply = (await getSetting("auto_reply"))?.value || "Welcome!";
        const delaySeconds = parseInt((await getSetting("delay_seconds"))?.value || "0", 10);
        
        setTimeout(async () => {
          try {
            const replyInGeneral = (await getSetting("reply_in_general"))?.value === "true";
            await client.sendMessage(message.peerId, {
              message: autoReply,
              replyTo: replyInGeneral ? undefined : topicId,
            });
          } catch (err) {
            console.error("UserBot failed to send auto-reply:", err);
          }
        }, delaySeconds * 1000);
      }

      // 2. Keyword Handler
      let keywordMatched = false;
      if (message.message && !message.out) {
        const text = message.message.toLowerCase().trim();
        const matches: { kw: any, index: number, matchedWord: string }[] = [];
        
        console.log(`Checking keywords for: "${text}"`);
        
        for (const kw of cachedKeywords) {
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
            
            if (processedRuleIds.has(kw._id.toString())) {
              console.log(`Skipping duplicate match for rule ${kw._id} (word: ${match.matchedWord})`);
              continue;
            }
            processedRuleIds.add(kw._id.toString());
            
            console.log(`DEBUG: Processing matched keyword: ${match.matchedWord} (Rule ID: ${kw._id}) at index ${match.index}`);
            
            // Normalize links
            const linksToProcess = [...(kw.message_links || [])];
            if (kw.message_link && !linksToProcess.includes(kw.message_link)) {
              linksToProcess.push(kw.message_link);
            }
            const normalizedLinks = linksToProcess.map(l => l.trim()).filter(l => l).sort();

            try {
              const replyToMsgId = message.id;
              let replySent = false;
              
              console.log(`DEBUG: Attempting to send reply for keyword: ${match.matchedWord}. replyInGeneral: ${replyInGeneral}, topicId: ${topicId}, replyTo: ${replyTo}`);

              // If system is paused, save as missed trigger and skip reply
              if (isSystemPaused) {
                await MissedTrigger.create({
                  message_id: message.id,
                  chat_id: chatId,
                  topic_id: topicId,
                  text: message.message,
                  matched_keyword: match.matchedWord,
                  rule_id: kw._id
                });
                console.log(`Saved missed trigger for keyword "${match.matchedWord}" while paused.`);
                continue;
              }

              // Rate limiting check: Max replies per keyword rule per topic
              if (topicId) {
                const history = await ReplyHistory.findOne({ topic_id: topicId, keyword_id: kw._id });
                const maxReplies = kw.max_replies !== undefined ? kw.max_replies : 0; // 0 means unlimited
                
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

                if (maxReplies > 0 && currentCount >= maxReplies) {
                  console.log(`Skipping reply for keyword "${match.matchedWord}" in topic ${topicId}: limit reached (${currentCount}/${maxReplies}).`);
                  continue;
                }
              }

              // Add a small delay between replies
              await new Promise(resolve => setTimeout(resolve, 1000));

              // 1. AI Reply (if enabled)
              if (kw.ai_reply_enabled) {
                console.log(`Triggering AI reply for keyword: ${match.matchedWord}`);
                const aiModeEnabled = (await getSetting("ai_mode_enabled"))?.value === "true";
                
                // Only proceed if global AI mode is also enabled? 
                // The user request implies this is a specific override/feature.
                // Let's assume it works even if global AI mode is disabled, OR we check global mode.
                // Usually "AI Mode" toggle is a master switch. Let's respect it.
                if (aiModeEnabled) {
                   const geminiApiKeysSetting = await getSetting("gemini_api_keys");
                   let apiKeys: string[] = [];
                   try {
                     apiKeys = JSON.parse(geminiApiKeysSetting?.value || "[]");
                   } catch (e) {}
                   
                   const envKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
                   if (envKey && !apiKeys.includes(envKey)) apiKeys.push(envKey);
                   
                   if (apiKeys.length > 0) {
                     const aiPersona = (await getSetting("ai_persona"))?.value || DEFAULT_AI_PERSONA;
                     const conversationContext = await getRecentConversationContext(client, message.peerId, topicId);
                     
                     for (const apiKey of apiKeys) {
                       try {
                         const genAI = new GoogleGenAI({ apiKey });
                         const response = await genAI.models.generateContent({
                           model: "gemini-3-flash-preview",
                           contents: [
                             {
                               role: "user",
                               parts: [
                                 { text: `System Instruction: ${aiPersona}` },
                                 { text: conversationContext },
                                 { text: `User Message: "${message.message}"` },
                                 { text: `Context: The user triggered a keyword "${match.matchedWord}". Reply naturally to their query considering the recent conversation history. If the message is short, generic, or doesn't need a reply, output 'NO_REPLY'.` }
                               ]
                             }
                           ]
                         });
                         
                         const aiReply = response.text.trim();
                         if (aiReply && aiReply !== "NO_REPLY") {
                           console.log(`AI Reply (Keyword Triggered): "${aiReply}"`);
                           await client.sendMessage(message.peerId, {
                             message: aiReply,
                             replyTo: replyTo,
                           });
                           await saveLog(`AI Auto-Reply (Keyword: ${match.matchedWord}): "${aiReply}"`, 'info', 'USERBOT');
                           replySent = true;
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
                    replyTo: replyTo,
                  });
                  replySent = true;
                }

                for (const link of linksToProcess) {
                  const parts = link.split("/").filter(p => p.length > 0);
                  const messageId = parseInt(parts[parts.length - 1], 10);
                  
                  if (!isNaN(messageId)) {
                    let fromPeer: any = targetGroupId;
                    
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

                    const topMsgId = topicId;
                    
                    try {
                      let inputPeer;
                      try {
                        inputPeer = await client.getInputEntity(fromPeer);
                      } catch (e: any) {
                        console.warn(`Could not resolve entity for ${fromPeer}: ${e.message}`);
                        // If resolution fails, we can't proceed with this peer.
                        // However, if it's a public username, maybe it works?
                        // But for private channels (IDs), this is fatal.
                        throw e;
                      }

                      await client.invoke(
                        new Api.messages.ForwardMessages({
                          fromPeer: inputPeer,
                          id: [messageId],
                          randomId: [BigInt(Math.floor(Math.random() * 1e15)) as any],
                          toPeer: message.peerId,
                          topMsgId: replyInGeneral ? undefined : topMsgId,
                        }) as any
                      );
                      console.log(`Forwarded message ${messageId} for keyword: ${kw.keyword}`);
                      replySent = true;
                    } catch (forwardErr: any) {
                      console.error("Forwarding failed, trying fallback:", forwardErr.message);
                      try {
                        // Fallback: Try forwarding from the target group itself if the message is there?
                        // Or maybe just try standard forwardMessages method which handles some resolution internally
                        await client.forwardMessages(message.peerId, {
                          messages: [messageId],
                          fromPeer: fromPeer, // Try with original peer string
                          topMsgId: replyInGeneral ? undefined : topMsgId,
                        } as any);
                        replySent = true;
                      } catch (fallbackErr: any) {
                         console.error("Fallback forwarding also failed:", fallbackErr.message);
                      }
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
                  replyTo: replyTo,
                  forceDocument: false,
                });
                replySent = true;
              } else if (kw.reply) {
                console.log(`Sending text reply for keyword: ${kw.keyword}`);
                await client.sendMessage(message.peerId, {
                  message: kw.reply,
                  replyTo: replyTo,
                });
                replySent = true;
              }
              
              // Update reply history count and save log asynchronously (fire-and-forget)
              (async () => {
                try {
                  if (topicId) {
                    const today = new Date();
                    const history = await ReplyHistory.findOne({ topic_id: topicId, keyword_id: kw._id });
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
                       await ReplyHistory.findOneAndUpdate(
                          { topic_id: topicId, keyword_id: kw._id },
                          { count: 1, last_updated: today },
                          { upsert: true }
                       );
                    }
                  }
                  
                  await saveLog(`Keyword matched: ${match.matchedWord}`, 'info', 'USERBOT');
                } catch (err) {
                  console.error("Async log/history update failed:", err);
                }
              })();
              
              // If a reply was sent, we continue to the next keyword match
              if (replySent) {
                console.log("Reply sent for keyword. Continuing to next match.");
              }

              // Add a small delay between replies to avoid spamming/rate limits
              if (matches.length > 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            } catch (err: any) {
              console.error(`UserBot failed to reply to keyword "${kw.keyword}":`, err);
              await saveLog(`Failed to reply to keyword ${kw.keyword}: ${err.message}`, 'error', 'USERBOT');
            }
          }
        }
      }

      // 3. AI Smart Reply (Fallback)
      if (!keywordMatched && message.message && !message.out) {
        const aiModeEnabled = (await getSetting("ai_mode_enabled"))?.value === "true";
        if (aiModeEnabled) {
          // Fetch keys from settings
          const geminiApiKeysSetting = await getSetting("gemini_api_keys");
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
            console.warn("AI Mode is enabled but no Gemini API Keys found (neither in settings nor environment).");
            return;
          }

          const aiPersona = (await getSetting("ai_persona"))?.value || DEFAULT_AI_PERSONA;
          const conversationContext = await getRecentConversationContext(client, message.peerId, topicId);
          
          let aiReply = null;
          let success = false;

          // Try keys one by one
          for (const apiKey of apiKeys) {
            try {
              console.log(`Attempting AI reply with key ending in ...${apiKey.slice(-4)}`);
              const genAI = new GoogleGenAI({ apiKey });
              const response = await genAI.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: [
                  {
                    role: "user",
                    parts: [
                      { text: `System Instruction: ${aiPersona}` },
                      { text: conversationContext },
                      { text: `User Message: "${message.message}"` },
                      { text: `Context: This is a Telegram group chat. Reply naturally considering the recent conversation history. If the message is short, generic, or doesn't need a reply, output 'NO_REPLY'.` }
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
              if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("Resource has been exhausted")) {
                await saveLog(`Quota Exceeded for API Key (...${apiKey.slice(-4)}). Please wait or add more keys.`, 'warn', 'AI_SYSTEM');
                // Continue to next key if available
              } else if (errorMsg.includes("leaked") || errorMsg.includes("not valid") || errorMsg.includes("API_KEY_INVALID")) {
                await saveLog(`Invalid API Key (...${apiKey.slice(-4)}): ${errorMsg}`, 'error', 'AI_SYSTEM');
              }
            }
          }

          if (success) {
            if (aiReply && aiReply !== "NO_REPLY") {
              console.log(`AI Reply generated: "${aiReply}"`);
              await client.sendMessage(message.peerId, {
                message: aiReply,
                replyTo: replyTo,
              });
              await saveLog(`AI Auto-Reply: "${aiReply}"`, 'info', 'USERBOT');
              
              // Notify frontend
              sendSseEvent('ai_reply', {
                message: `AI Replied: ${aiReply}`,
                originalMessage: message.message,
                timestamp: new Date()
              });
            } else {
              console.log("AI decided not to reply (NO_REPLY).");
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

    if (msg.forum_topic_created) {
      const topicName = msg.forum_topic_created.name;
      const topicId = msg.message_thread_id;

      if (topicId) {
        await logTopic(topicId, topicName);
      }
    }
  });

  // SSE Endpoint
  app.get("/api/notifications", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    sseClients.push(newClient);

    req.on("close", () => {
      sseClients = sseClients.filter(client => client.id !== clientId);
    });
  });

  // API Routes
  app.delete("/api/data/clear", async (req, res) => {
    try {
      await Keyword.deleteMany({});
      await Log.deleteMany({});
      await BlockedTopic.deleteMany({});
      await PhotoReplyHistory.deleteMany({});
      await ReplyHistory.deleteMany({});
      await MissedTrigger.deleteMany({});
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/data/last-import", async (req, res) => {
    try {
      const lastKeyword = await Keyword.findOne().sort({ _id: -1 });
      if (lastKeyword) {
        await Keyword.deleteOne({ _id: lastKeyword._id });
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "No keywords found" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const topicCount = await getTopicCount();
      const todayTopicCount = await getTodayTopicCount();
      const autoReply = (await getSetting("auto_reply"))?.value || "";
      const delaySeconds = parseInt((await getSetting("delay_seconds"))?.value || "0", 10);
      const isSystemPaused = (await getSetting("system_paused"))?.value === "true";
      const photoReplyEnabled = (await getSetting("photo_reply_enabled"))?.value === "true";
      const photoReplyMessage = (await getSetting("photo_reply_message"))?.value || "ok wait";
      const photoReplyMax = parseInt((await getSetting("photo_reply_max"))?.value || "2", 10);
      const notificationSoundEnabled = (await getSetting("notification_sound_enabled"))?.value === "true";
      const notificationSoundType = (await getSetting("notification_sound_type"))?.value || "default";
      const topicIcon = (await getSetting("topic_icon"))?.value || "🛑";
      const topicRenameKeywords = (await getSetting("topic_rename_keywords"))?.value || "";
      const topicRenameMatchMode = (await getSetting("topic_rename_match_mode"))?.value || "exact";
      const autoResetKeywords = (await getSetting("auto_reset_keywords"))?.value === "true";
      const autoBlockKeywords = (await getSetting("auto_block_keywords"))?.value || "";
      const aiModeEnabled = (await getSetting("ai_mode_enabled"))?.value === "true";
      const aiPersona = (await getSetting("ai_persona"))?.value || "";
      const geminiApiKeys = (await getSetting("gemini_api_keys"))?.value || "[]";
      const replyInGeneral = (await getSetting("reply_in_general"))?.value === "true";
      
      let isUserBotConnected = !!userClient && userClient.connected;
      
      // Auto-reconnect attempt if disconnected but we have a session
      if (!isUserBotConnected) {
        const sessionString = (await getSetting("session_string"))?.value;
        const apiIdRaw = (await getSetting("api_id"))?.value || "34669075";
        const apiHash = ((await getSetting("api_hash"))?.value || "b0f0ffda80d58bea235b2d232fbcbc79").trim();
        const apiId = parseInt(apiIdRaw.trim(), 10);

        if (sessionString && !isNaN(apiId) && apiId > 0 && apiHash) {
          try {
            console.log("Auto-reconnecting UserBot during stats check...");
            if (userClient) {
              try {
                if (userClient.connected) {
                  console.log("UserBot already connected, skipping reconnect.");
                  return;
                }
                await userClient.disconnect();
              } catch (e) {
                console.error("Error disconnecting existing client:", e);
              }
            }
            userClient = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
              connectionRetries: 3,
            });
            await userClient.connect();
            setupUserBotHandlers(userClient, groupId);
            isUserBotConnected = true;
            await saveLog("UserBot auto-reconnected during stats check", "info", "/api/stats");
          } catch (connErr: any) {
            console.error("Auto-reconnect failed:", connErr.message);
          }
        }
      }

      const apiId = (await getSetting("api_id"))?.value || "";
      const apiHash = (await getSetting("api_hash"))?.value || "";
      const defaultPhone = (await getSetting("default_phone"))?.value || "";

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
        replyInGeneral,
        isUserBotConnected,
        apiId,
        apiHash,
        defaultPhone,
      });
    } catch (err: any) {
      console.error("Error in /api/stats:", err);
      await saveLog(err.message, 'error', '/api/stats');
      res.status(500).json({ error: `[GET /api/stats] ${err.message}` });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const { autoReply, delaySeconds, apiId, apiHash, systemPaused, photoReplyEnabled, photoReplyMessage, photoReplyMax, notificationSoundEnabled, notificationSoundType, topicIcon, topicRenameKeywords, topicRenameMatchMode, autoResetKeywords, autoBlockKeywords, aiModeEnabled, aiPersona, geminiApiKeys, replyInGeneral } = req.body;
      if (typeof autoReply === "string") await setSetting("auto_reply", autoReply);
      if (typeof delaySeconds !== "undefined") await setSetting("delay_seconds", String(delaySeconds));
      if (typeof apiId !== "undefined") await setSetting("api_id", String(apiId));
      if (typeof apiHash !== "undefined") await setSetting("api_hash", String(apiHash));
      if (typeof systemPaused !== "undefined") await setSetting("system_paused", String(systemPaused));
      if (typeof photoReplyEnabled !== "undefined") await setSetting("photo_reply_enabled", String(photoReplyEnabled));
      if (typeof photoReplyMessage !== "undefined") await setSetting("photo_reply_message", String(photoReplyMessage));
      if (typeof photoReplyMax !== "undefined") await setSetting("photo_reply_max", String(photoReplyMax));
      if (typeof notificationSoundEnabled !== "undefined") await setSetting("notification_sound_enabled", String(notificationSoundEnabled));
      if (typeof notificationSoundType !== "undefined") await setSetting("notification_sound_type", String(notificationSoundType));
      if (typeof topicIcon !== "undefined") await setSetting("topic_icon", String(topicIcon));
      if (typeof topicRenameKeywords !== "undefined") await setSetting("topic_rename_keywords", String(topicRenameKeywords));
      if (typeof topicRenameMatchMode !== "undefined") await setSetting("topic_rename_match_mode", String(topicRenameMatchMode));
      if (typeof autoResetKeywords !== "undefined") await setSetting("auto_reset_keywords", String(autoResetKeywords));
      if (typeof autoBlockKeywords !== "undefined") await setSetting("auto_block_keywords", String(autoBlockKeywords));
      if (typeof aiModeEnabled !== "undefined") await setSetting("ai_mode_enabled", String(aiModeEnabled));
      if (typeof aiPersona !== "undefined") await setSetting("ai_persona", String(aiPersona));
      if (typeof geminiApiKeys !== "undefined") await setSetting("gemini_api_keys", String(geminiApiKeys));
      if (typeof replyInGeneral !== "undefined") await setSetting("reply_in_general", String(replyInGeneral));
      
      await saveLog("Settings updated", 'info', '/api/settings', { autoReply, delaySeconds, apiId, systemPaused, photoReplyEnabled, photoReplyMax, notificationSoundEnabled, notificationSoundType, topicIcon, topicRenameKeywords, topicRenameMatchMode, autoResetKeywords, autoBlockKeywords, aiModeEnabled, replyInGeneral });
      res.json({ success: true });
    } catch (err: any) {
      console.error("Error in /api/settings:", err);
      await saveLog(err.message, 'error', '/api/settings', req.body);
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
        model: "gemini-3-flash-preview",
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
    try {
      const keywords = await Keyword.find();
      res.json(keywords);
    } catch (err: any) {
      res.status(500).json({ error: `[GET /api/keywords] ${err.message}` });
    }
  });

  app.post("/api/keywords", async (req, res) => {
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
        max_replies: typeof max_replies === 'number' ? max_replies : 0,
        match_mode: match_mode || 'exact',
        ai_reply_enabled: !!ai_reply_enabled
      };
      
      if (id) {
        await Keyword.findByIdAndUpdate(id, updateData);
      } else {
        // For new entries, we can't rely on unique 'keyword' anymore if we use arrays
        // But we can check if a document with the same primary keyword exists?
        // Or just create new. Let's just create/update.
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
    try {
      await Keyword.findByIdAndDelete(req.params.id);
      refreshKeywordCache().catch(err => console.error("Background cache refresh failed:", err));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: `[DELETE /api/keywords] ${err.message}` });
    }
  });

  // Export/Import Routes
  app.get("/api/data/export", async (req, res) => {
    try {
      const keywords = await Keyword.find();
      const settings = await Setting.find({ key: { $ne: "session_string" } }); // Don't export session string
      res.json({ keywords, settings });
    } catch (err: any) {
      res.status(500).json({ error: `[GET /api/data/export] ${err.message}` });
    }
  });

  app.post("/api/data/import", express.json({ limit: '10mb' }), async (req, res) => {
    try {
      const { keywords, settings } = req.body;
      
      if (keywords && Array.isArray(keywords)) {
        for (const kw of keywords) {
          await Keyword.findOneAndUpdate(
            { keyword: kw.keyword },
            { 
              keywords: kw.keywords || [kw.keyword],
              reply: kw.reply, 
              photo: kw.photo, 
              message_link: kw.message_link,
              message_links: kw.message_links || [],
              max_replies: kw.max_replies !== undefined ? kw.max_replies : 0,
              match_mode: kw.match_mode || 'exact'
            },
            { upsert: true }
          );
        }
      }

      if (settings && Array.isArray(settings)) {
        for (const s of settings) {
          if (s.key !== "session_string") {
            await Setting.findOneAndUpdate(
              { key: s.key },
              { value: s.value },
              { upsert: true }
            );
          }
        }
      }

      await refreshKeywordCache();
      await saveLog("Data imported", 'info', '/api/data/import');
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: `[POST /api/data/import] ${err.message}` });
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
      if (userClient) {
        await userClient.disconnect();
      }
      userClient = new TelegramClient(new StringSession(""), apiId, apiHash, {
        connectionRetries: 5,
      });
      await userClient.connect();
      const result = await userClient.sendCode({ apiId, apiHash }, phone);
      phoneCodeHash = result.phoneCodeHash;
      phoneNumber = phone;
      await saveLog(`Auth code sent to ${phone}`, 'info', '/api/auth/send-code');
      res.json({ success: true });
    } catch (err: any) {
      console.error("SendCode error:", err);
      await saveLog(err.message, 'error', '/api/auth/send-code', { phone, apiId });
      res.status(500).json({ error: `[POST /api/auth/send-code] ${err.message}` });
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
      await saveLog(`UserBot signed in: ${phoneNumber}`, 'info', '/api/auth/signin');
      res.json({ success: true });
    } catch (err: any) {
      await saveLog(err.message, 'error', '/api/auth/signin', { phoneNumber });
      res.status(500).json({ error: `[POST /api/auth/signin] ${err.message}` });
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
      res.status(500).json({ error: `[POST /api/auth/logout] ${err.message}` });
    }
  });

  app.get("/api/topics", async (req, res) => {
    try {
      const topics = await Topic.find().sort({ created_at: -1 });
      res.json(topics);
    } catch (err: any) {
      res.status(500).json({ error: `[GET /api/topics] ${err.message}` });
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
      res.status(500).json({ error: `[GET /api/group/messages] ${err.message}` });
    }
  });

  app.post("/api/broadcast", async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    try {
      if (userClient && userClient.connected) {
        await userClient.sendMessage(groupId, { message });
        await saveLog("Broadcast sent", 'info', '/api/broadcast', { messageLength: message.length });
        res.json({ success: true });
      } else {
        res.status(400).json({ error: "Telegram ID not logged in. Please login first." });
      }
    } catch (err: any) {
      await saveLog(err.message, 'error', '/api/broadcast');
      res.status(500).json({ error: `[POST /api/broadcast] ${err.message}` });
    }
  });

  app.get("/api/missed-count", async (req, res) => {
    try {
      const count = await MissedTrigger.countDocuments({ processed: false });
      res.json({ count });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/catchup", async (req, res) => {
    try {
      if (!userClient || !userClient.connected) {
        return res.status(400).json({ error: "Telegram client not connected" });
      }

      const isSystemPaused = (await getSetting("system_paused"))?.value === "true";
      if (isSystemPaused) {
        return res.status(400).json({ error: "Bot is paused. Unpause first to catch up." });
      }

      const replyInGeneral = (await getSetting("reply_in_general"))?.value === "true";

      const missed = await MissedTrigger.find({ processed: false }).sort({ timestamp: 1 }).limit(20);
      if (missed.length === 0) {
        return res.json({ success: true, count: 0 });
      }

      let processedCount = 0;
      for (const trigger of missed) {
        try {
          const kw = await Keyword.findById(trigger.rule_id);
          if (!kw) {
            trigger.processed = true;
            await trigger.save();
            continue;
          }

          const peerId = trigger.chat_id;
          const replyToMsgId = trigger.message_id;
          const topMsgId = trigger.topic_id;
          const replyTo = replyInGeneral ? undefined : (topMsgId || replyToMsgId);
          
          console.log(`Catchup: Processing trigger ${trigger._id} for peer ${peerId}, replyToMsgId ${replyToMsgId}, topMsgId ${topMsgId}, final replyTo ${replyTo}`);

          // Handle message links (forwarding)
          const linksToProcess = [...(kw.message_links || [])];
          if (kw.message_link && !linksToProcess.includes(kw.message_link)) {
            linksToProcess.push(kw.message_link);
          }

          if (linksToProcess.length > 0) {
            if (kw.reply) {
              await userClient.sendMessage(peerId, {
                message: kw.reply,
                replyTo: replyTo,
              });
            }

            for (const link of linksToProcess) {
              const parts = link.split("/").filter(p => p.length > 0);
              const messageId = parseInt(parts[parts.length - 1], 10);
              if (!isNaN(messageId)) {
                let fromPeer: any = (await getSetting("target_group_id"))?.value;
                if (link.includes("/c/")) {
                  const cIndex = parts.indexOf("c");
                  if (cIndex !== -1 && parts[cIndex + 1]) fromPeer = `-100${parts[cIndex + 1]}`;
                } else {
                  const tmeIndex = parts.indexOf("t.me");
                  if (tmeIndex !== -1 && parts[tmeIndex + 1]) fromPeer = parts[tmeIndex + 1];
                }

                try {
                  await userClient.forwardMessages(peerId, {
                    messages: [messageId],
                    fromPeer: fromPeer,
                    topMsgId: replyInGeneral ? undefined : topMsgId,
                  } as any);
                } catch (e) {
                  console.error("Catchup forward failed:", e);
                }
              }
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } else if (kw.photo) {
            const base64Data = kw.photo.includes(",") ? kw.photo.split(",")[1] : kw.photo;
            const buffer = Buffer.from(base64Data, "base64");
            const fileToUpload = new CustomFile("photo.jpg", buffer.length, "", buffer);
            const toUpload = await userClient.uploadFile({ file: fileToUpload, workers: 1 });
            await userClient.sendFile(peerId, {
              file: toUpload,
              caption: kw.reply || "",
              replyTo: replyTo,
            });
          } else if (kw.reply) {
            await userClient.sendMessage(peerId, {
              message: kw.reply,
              replyTo: replyTo,
            });
          }

          trigger.processed = true;
          await trigger.save();
          processedCount++;
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
          console.error("Catchup failed for trigger:", trigger._id, e);
        }
      }

      res.json({ success: true, count: processedCount });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/logs", async (req, res) => {
    try {
      const logs = await Log.find().sort({ timestamp: -1 }).limit(100);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Blocked Topics Routes
  app.get("/api/blocked-topics", async (req, res) => {
    try {
      const blocked = await BlockedTopic.find().sort({ created_at: -1 });
      res.json(blocked);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/blocked-topics", async (req, res) => {
    const { link } = req.body;
    if (!link) return res.status(400).json({ error: "Link required" });

    try {
      const parts = link.split("/").filter((p: string) => p.length > 0);
      const topicId = parseInt(parts[parts.length - 1], 10);

      if (isNaN(topicId)) {
        return res.status(400).json({ error: "Invalid topic link" });
      }

      // Toggle behavior: If already blocked, unblock it
      const existing = await BlockedTopic.findOne({ telegram_topic_id: topicId });
      if (existing) {
        await BlockedTopic.findByIdAndDelete(existing._id);
        await saveLog(`Topic ${topicId} unblocked via link`, 'info', '/api/blocked-topics', { link });
        return res.json({ success: true, action: 'unblocked' });
      }

      // Try to find topic name from our Topic collection
      const topicInfo = await Topic.findOne({ telegram_topic_id: topicId });
      const name = topicInfo ? topicInfo.name : "Unknown Topic";

      await BlockedTopic.create({
        telegram_topic_id: topicId,
        name,
        link
      });
      
      await saveLog(`Topic ${topicId} blocked`, 'info', '/api/blocked-topics', { link, name });
      res.json({ success: true, action: 'blocked', name });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/blocked-topics/:id", async (req, res) => {
    try {
      await BlockedTopic.findByIdAndDelete(req.params.id);
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

  app.get("/api/analytics", async (req, res) => {
    try {
      // Get top 5 keywords triggered
      const topKeywords = await ReplyHistory.aggregate([
        { $group: { _id: "$keyword_id", total: { $sum: "$count" } } },
        { $sort: { total: -1 } },
        { $limit: 5 }
      ]);
      
      const keywordIds = topKeywords.map(k => k._id);
      const keywords = await Keyword.find({ _id: { $in: keywordIds } });
      const keywordMap = keywords.reduce((acc, kw) => {
        acc[kw._id.toString()] = kw.keyword || kw.keywords?.[0] || 'Unknown';
        return acc;
      }, {} as any);

      const keywordData = topKeywords.map(k => ({
        name: keywordMap[k._id.toString()] || 'Unknown',
        value: k.total
      }));

      // Get top 5 active topics
      const topTopics = await ReplyHistory.aggregate([
        { $group: { _id: "$topic_id", total: { $sum: "$count" } } },
        { $sort: { total: -1 } },
        { $limit: 5 }
      ]);

      const topicIds = topTopics.map(t => t._id);
      const topics = await Topic.find({ telegram_topic_id: { $in: topicIds } });
      const topicMap = topics.reduce((acc, t) => {
        acc[t.telegram_topic_id] = t.name;
        return acc;
      }, {} as any);

      const topicData = topTopics.map(t => ({
        name: topicMap[t._id] || `Topic ${t._id}`,
        value: t.total
      }));

      res.json({ keywordData, topicData });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/test-persona", async (req, res) => {
    const { message, persona, apiKey } = req.body;
    if (!message || !apiKey) return res.status(400).json({ error: "Message and API Key required" });
    
    try {
      const genAI = new GoogleGenAI({ apiKey });
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              { text: `System Instruction: ${persona || 'You are a helpful assistant.'}` },
              { text: `User Message: "${message}"` },
              { text: `Context: This is a test from the dashboard. Reply naturally.` }
            ]
          }
        ]
      });
      res.json({ reply: response.text.trim() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API 404 Handler
  app.use("/api/*", (req, res) => {
    console.log(`API endpoint not found: ${req.originalUrl}`);
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
    
    // Connect UserBot in background
    (async () => {
      try {
        const hardcodedSession = "1BVtsOLsBu4z-XGtiex0hcJq9jT7MVdWGy-R81CkXbB07-Edv2z9-2RtT2DL7tbtlMz07AHw309eD962CNHi7dFcOc8TGfFvowvxyHou-X26X9Qi1Ivw85kMnnYfHoLG-DQzi44wnNtWw-JImQXVP-8l_xvuH9NYjOKhHLFSyYcn5fxph_k4Ljtwh0cFHJ9K5GOoiMRHptPFT5YFbGVC-M8md0qab9Ei6mrHqz0PkFtcOf5Y491xXMosDiHdnOCRvc5Ou2UqHRQEfiSzW_yjsXNTfeZKH3pGQd1QkGja-no7xVxURNsuMd5n_PFxemy1JDSDeC5jIW8RyRqoYGmRZ2g16ib_T6A0=";
        let sessionString = (await getSetting("session_string"))?.value;
        
        // Use hardcoded session if database session is missing
        if (!sessionString) {
          sessionString = hardcodedSession;
          await setSetting("session_string", hardcodedSession);
          console.log("Using hardcoded Telegram session.");
        }

        const apiIdRaw = (await getSetting("api_id"))?.value || "34669075";
        const apiHash = ((await getSetting("api_hash"))?.value || "b0f0ffda80d58bea235b2d232fbcbc79").trim();
        const apiId = parseInt(apiIdRaw.trim(), 10);

        if (sessionString && !isNaN(apiId) && apiId > 0 && apiHash) {
          console.log("Attempting to connect UserBot...");
          userClient = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
            connectionRetries: 5,
          });
          await userClient.connect();
          console.log("UserBot connected successfully.");
          setupUserBotHandlers(userClient, groupId);
          await saveLog("UserBot connected automatically on startup", "info", "SYSTEM");
        }
      } catch (err: any) {
        console.error("Failed to connect UserBot on startup:", err);
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
    if (userClient) {
      await userClient.disconnect();
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer();
