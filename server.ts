import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import TelegramBot from "node-telegram-bot-api";
import { TelegramClient, Api } from "telegram";
import webpush from "web-push";
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

// VAPID keys setup
let vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

async function setupVapid() {
  try {
    const pubKeySetting = await getSetting("vapid_public_key");
    const privKeySetting = await getSetting("vapid_private_key");

    if (pubKeySetting && privKeySetting) {
      vapidPublicKey = pubKeySetting.value;
      vapidPrivateKey = privKeySetting.value;
    } else if (!vapidPublicKey || !vapidPrivateKey) {
      const generated = webpush.generateVAPIDKeys();
      vapidPublicKey = generated.publicKey;
      vapidPrivateKey = generated.privateKey;
      
      await setSetting("vapid_public_key", vapidPublicKey);
      await setSetting("vapid_private_key", vapidPrivateKey);
      
      console.log("Generated and stored new VAPID keys.");
    }

    if (vapidPublicKey && vapidPrivateKey) {
      console.log("Setting up VAPID details with public key length:", vapidPublicKey.length, "and private key length:", vapidPrivateKey.length);
      webpush.setVapidDetails(
        "mailto:rohit37816@gmail.com",
        vapidPublicKey,
        vapidPrivateKey
      );
    }
  } catch (err) {
    console.error("Error setting up VAPID keys:", err);
  }
}

const DEFAULT_AI_PERSONA = `You are a smart assistant for a Telegram store selling paid study batches (SSC, Railway, etc.) for 87rs each. You have leaked batches from many top teachers. Your goal is to answer user queries about price, availability, and payment.
- Context: Users are students preparing for exams.
- Language: Reply in the same language as the user (Hindi, English, or Hinglish).
- Robustness: Users may use slang or misspell words; interpret their intent correctly.
- Pricing: Each batch is 87rs.
- Behavior: Be helpful, concise, and polite.
- Constraint: If the message is generic (e.g., 'ok', 'hmm') or doesn't need a reply, strictly output 'NO_REPLY'.`;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in environment variables.");
  process.exit(1);
}

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
  ai_reply_enabled: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true }
});
const Keyword = mongoose.model("Keyword", KeywordSchema);

const LogSchema = new mongoose.Schema({
  level: { type: String, enum: ['info', 'error', 'warn'], default: 'info' },
  category: { type: String, default: 'SYSTEM' },
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

const PhotoSentLogSchema = new mongoose.Schema({
  topic_id: { type: Number, required: true },
  topic_name: { type: String },
  topic_link: { type: String },
  sent_at: { type: Date, default: Date.now }
});
const PhotoSentLog = mongoose.model("PhotoSentLog", PhotoSentLogSchema);

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

const PushSubscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  created_at: { type: Date, default: Date.now }
});
const PushSubscription = mongoose.model("PushSubscription", PushSubscriptionSchema);

// Helper functions
const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let settingsCache: Record<string, string> = {};
let blockedTopicsCache: Set<number> = new Set();
let topicNamesCache: Record<number, string> = {};

async function refreshSettingsCache() {
  try {
    const settings = await Setting.find();
    settingsCache = {};
    for (const s of settings) {
      settingsCache[s.key] = s.value;
    }
    
    const blockedTopics = await BlockedTopic.find();
    blockedTopicsCache = new Set(blockedTopics.map(t => t.telegram_topic_id));
    
    const topics = await Topic.find();
    topicNamesCache = {};
    for (const t of topics) {
      topicNamesCache[t.telegram_topic_id] = t.name;
    }
  } catch (err) {
    console.error("Failed to refresh settings cache:", err);
  }
}

const getSetting = async (key: string) => {
  if (settingsCache[key] !== undefined) {
    return { value: settingsCache[key] };
  }
  const setting = await Setting.findOne({ key });
  if (setting) {
    settingsCache[key] = setting.value;
  }
  return setting;
};

const setSetting = async (key: string, value: string) => {
  settingsCache[key] = value;
  return await Setting.findOneAndUpdate({ key }, { value }, { upsert: true, new: true });
};

const deleteSetting = async (key: string) => {
  delete settingsCache[key];
  return await Setting.deleteOne({ key });
};

const getTopicCount = async () => await Topic.countDocuments();
const getTodayTopicCount = async () => {
  const now = new Date();
  // Get start of today in IST (Asia/Kolkata)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const nowIST = now.getTime() + istOffset;
  const startOfTodayIST_ms = Math.floor(nowIST / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000);
  const startOfTodayUTC = new Date(startOfTodayIST_ms - istOffset);
  
  return await Topic.countDocuments({ created_at: { $gte: startOfTodayUTC } });
};

const getTodayPhotoSentStats = async () => {
  const now = new Date();
  // Get start of today in IST (Asia/Kolkata)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const nowIST = now.getTime() + istOffset;
  const startOfTodayIST_ms = Math.floor(nowIST / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000);
  const startOfTodayUTC = new Date(startOfTodayIST_ms - istOffset);
  
  const logs = await PhotoSentLog.find({ sent_at: { $gte: startOfTodayUTC } }).sort({ sent_at: -1 });
  return {
    count: logs.length,
    topics: logs.map(log => ({
      name: log.topic_name,
      link: log.topic_link,
      time: new Date(log.sent_at.getTime() + istOffset).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }))
  };
};

const getPast24hPhotoSentStats = async () => {
  const now = new Date();
  const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const istOffset = 5.5 * 60 * 60 * 1000;
  
  const logs = await PhotoSentLog.find({ sent_at: { $gte: past24h } }).sort({ sent_at: -1 });
  return {
    count: logs.length,
    topics: logs.map(log => ({
      name: log.topic_name,
      link: log.topic_link,
      time: new Date(log.sent_at.getTime() + istOffset).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }))
  };
};
const logTopic = async (topicId: number, name: string, date?: Date) => {
  try {
    topicNamesCache[topicId] = name;
    await Topic.findOneAndUpdate(
      { telegram_topic_id: topicId },
      { 
        $set: { name },
        $setOnInsert: { created_at: date || new Date() }
      },
      { upsert: true }
    );
  } catch (err) {}
};

const saveLog = async (message: string, level: 'info' | 'error' | 'warn' = 'info', category: string = 'SYSTEM', route?: string, details?: any) => {
  try {
    await Log.create({
      message,
      level,
      category,
      route,
      details: details ? (typeof details === 'string' ? details : JSON.stringify(details, null, 2)) : undefined
    });
  } catch (err) {
    console.error("Failed to save log to DB:", err);
  }
};

const DEFAULT_TOPIC_ICONS: Record<string, bigint> = {
  "📰": 5434144690511290129n,
  "💡": 5312536423851630001n,
  "⚡️": 5312016608254762256n,
  "🎙": 5377544228505134960n,
  "🔝": 5418085807791545980n,
  "🗣": 5370870893004203704n,
  "🆒": 5420216386448270341n,
  "❗️": 5379748062124056162n,
  "📝": 5373251851074415873n,
  "📆": 5433614043006903194n,
  "📁": 5357315181649076022n,
  "🔎": 5309965701241379366n,
  "📣": 5309984423003823246n,
  "🔥": 5312241539987020022n,
  "❤️": 5312138559556164615n,
  "❓": 5377316857231450742n,
  "📈": 5350305691942788490n,
  "📉": 5350713563512052787n,
  "💎": 5309958691854754293n,
  "💰": 5350452584119279096n,
  "💸": 5309929258443874898n,
  "🪙": 5377690785674175481n,
  "💱": 5310107765874632305n,
  "⁉️": 5377438129928020693n,
  "🎮": 5309950797704865693n,
  "💻": 5350554349074391003n,
  "📱": 5409357944619802453n,
  "🚗": 5312322066328853156n,
  "🏠": 5312486108309757006n,
  "💘": 5310029292527164639n,
  "🎉": 5310228579009699834n,
  "‼️": 5377498341074542641n,
  "🏆": 5312315739842026755n,
  "🏁": 5408906741125490282n,
  "🎬": 5368653135101310687n,
  "🎵": 5310045076531978942n,
  "🔞": 5420331611830886484n,
  "📚": 5350481781306958339n,
  "👑": 5357107601584693888n,
  "⚽️": 5375159220280762629n,
  "🏀": 5384327463629233871n,
  "📺": 5350513667144163474n,
  "👀": 5357121491508928442n,
  "🫦": 5357185426392096577n,
  "🍓": 5310157398516703416n,
  "💄": 5310262535021142850n,
  "👠": 5368741306484925109n,
  "✈️": 5348436127038579546n,
  "🧳": 5357120306097956843n,
  "🏖": 5310303848311562896n,
  "⛅️": 5350424168615649565n,
  "🦄": 5413625003218313783n,
  "🛍": 5350699789551935589n,
  "👜": 5377478880577724584n,
  "🛒": 5431492767249342908n,
  "🚂": 5350497316203668441n,
  "🛥": 5350422527938141909n,
  "🏔": 5418196338774907917n,
  "🏕": 5350648297189023928n,
  "🤖": 5309832892262654231n,
  "🪩": 5350751634102166060n,
  "🎟": 5377624166436445368n,
  "🏴‍☠️": 5386395194029515402n,
  "🗳": 5350387571199319521n,
  "🎓": 5357419403325481346n,
  "🔭": 5368585403467048206n,
  "🔬": 5377580546748588396n,
  "🎶": 5377317729109811382n,
  "🎤": 5382003830487523366n,
  "🕺": 5357298525765902091n,
  "💃": 5357370526597653193n,
  "🪖": 5357188789351490453n,
  "💼": 5348227245599105972n,
  "🧪": 5411138633765757782n,
  "👨‍👩‍👧‍👦": 5386435923204382258n,
  "👶": 5377675010259297233n,
  "🤰": 5386609083400856174n,
  "💅": 5368808634392257474n,
  "🏛": 5350548830041415279n,
  "🧮": 5355127101970194557n,
  "🖨": 5386379624773066504n,
  "👮‍♂️": 5377494501373780436n,
  "🩺": 5350307998340226571n,
  "💊": 5310094636159607472n,
  "💉": 5310139157790596888n,
  "🧼": 5377468357907849200n,
  "🪪": 5418115271267197333n,
  "🛃": 5372819184658949787n,
  "🍽": 5350344462612570293n,
  "🐟": 5384574037701696503n,
  "🎨": 5310039132297242441n,
  "🎭": 5350658016700013471n,
  "🎩": 5357504778685392027n,
  "🔮": 5350367161514732241n,
  "🍹": 5350520238444126134n,
  "🎂": 5310132165583840589n,
  "☕️": 5350392020785437399n,
  "🍣": 5350406176997646350n,
  "🍔": 5350403544182694064n,
  "🍕": 5350444672789519765n,
  "🦠": 5312424913615723286n,
  "💬": 5417915203100613993n,
  "🎄": 5312054580060625569n,
  "🎃": 5309744892677727325n,
  "✍️": 5238156910363950406n,
  "⭐️": 5235579393115438657n,
  "✅": 5237699328843200968n,
  "🎖": 5238027455754680851n,
  "🤡": 5238234236955148254n,
  "🧠": 5237889595894414384n,
  "🦮": 5237999392438371490n,
  "🐈": 5235912661102773458n
};

// Helper function for topic renaming
const handleTopicRenaming = async (client: TelegramClient, message: any, topicId: number, topicIcon: string, topicRenameEmoji: string, renameKeywordsStr: string, renameMatchMode: string, bypassKeywordCheck: boolean = false) => {
  if (!topicId) return "Unknown Topic";

  // Fetch Topic Name
  let topicName = "Unknown Topic";
  
  // 1. Try Cache
  if (topicNamesCache[topicId]) {
    topicName = topicNamesCache[topicId];
  } 
  
  // 2. Try fetching the topic creation message
  if (topicName === "Unknown Topic") {
    try {
      const messages = await client.getMessages(message.peerId, { ids: [topicId] });
      if (messages && messages.length > 0) {
        const topicMsg = messages[0];
        if (topicMsg.action && topicMsg.action instanceof Api.MessageActionTopicCreate) {
          topicName = topicMsg.action.title;
          await logTopic(topicId, topicName, topicMsg.date ? new Date(topicMsg.date * 1000) : undefined);
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
            await logTopic(t.id, t.title);
            
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
    const prefix = `${topicRenameEmoji}${topicRenameEmoji}`;

    if (shouldRename) {
      let newTopicName = topicName;
      let nameChanged = false;
      
      if (!topicName.startsWith(prefix)) {
        newTopicName = `${prefix} ${topicName}`;
        if (newTopicName.length > 128) {
            newTopicName = newTopicName.substring(0, 128);
        }
        nameChanged = true;
      }

      const editParams: any = {
        channel: await client.getInputEntity(message.peerId),
        topicId: topicId,
      };

      if (nameChanged) {
        editParams.title = newTopicName;
      }

      let iconChanged = false;
      console.log(`DEBUG: topicIcon: '${topicIcon}', DEFAULT_TOPIC_ICONS[topicIcon]: ${DEFAULT_TOPIC_ICONS[topicIcon]}`);
      if (DEFAULT_TOPIC_ICONS[topicIcon]) {
        editParams.iconEmojiId = DEFAULT_TOPIC_ICONS[topicIcon];
        iconChanged = true;
      } else {
        console.log(`DEBUG: Icon '${topicIcon}' not found in DEFAULT_TOPIC_ICONS`);
      }

      if (nameChanged || iconChanged) {
        console.log(`Updating topic ${topicId}. Name changed: ${nameChanged}, Icon changed: ${iconChanged}`);
        await client.invoke(
          new Api.channels.EditForumTopic(editParams)
        );
        
        if (nameChanged) {
          // Update DB
          await logTopic(topicId, newTopicName);
          await saveLog(`Renamed topic ${topicId} to "${newTopicName}"`, 'info', 'USERBOT');
        } else {
          await saveLog(`Updated topic icon for ${topicId}`, 'info', 'USERBOT');
        }
        return newTopicName;
      } else {
        console.log(`Topic ${topicId} already has prefix "${prefix}" and no icon to update. Skipping.`);
      }
    }
  } catch (renameErr: any) {
    if (renameErr.message && (renameErr.message.includes('CHAT_NOT_MODIFIED') || renameErr.message.includes('NOT_MODIFIED'))) {
      console.log(`Topic ${topicId} already has the correct name and icon. Skipping.`);
    } else {
      console.error("Failed to rename topic:", renameErr);
      await saveLog(`Failed to rename topic ${topicId}: ${renameErr.message}`, 'error', 'USERBOT');
    }
  }
  
  return topicName;
};

// SSE Clients
let sseClients: any[] = [];
let broadcastCancelled = false;
let broadcastInProgress = false;
let broadcastStatus = {
  total: 0,
  current: 0,
  status: 'idle'
};

function sendSseEvent(type: string, data: any) {
  const payload = JSON.stringify({ type, data });
  sseClients.forEach(client => {
    client.res.write(`event: ${type}\ndata: ${payload}\n\n`);
    client.res.write(`data: ${payload}\n\n`);
  });

  // Send push notification for photo_received or other important events
  if (type === 'photo_received') {
    sendPushNotification("New Photo Received", data.message || "A new photo has been received.", { url: data.url || '/' });
  }
}

// Helper to send push notifications to all subscribers
async function sendPushNotification(title: string, body: string, data: any = {}) {
  try {
    const subscriptions = await PushSubscription.find();
    console.log(`Sending push notification to ${subscriptions.length} subscribers.`);
    subscriptions.forEach(sub => console.log(`- Subscriber endpoint: ${sub.endpoint.substring(0, 30)}...`));
    const payload = JSON.stringify({ title, body, ...data });
    
    const promises = subscriptions.map(sub => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth
        }
      };
      
      return webpush.sendNotification(subscription, payload).catch(async (err) => {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription expired or no longer valid
          await PushSubscription.deleteOne({ endpoint: sub.endpoint });
          console.log(`Deleted expired push subscription: ${sub.endpoint}`);
        } else {
          console.error(`Error sending push notification to ${sub.endpoint}:`, err.message);
        }
      });
    });
    
    await Promise.all(promises);
  } catch (err) {
    console.error("Error in sendPushNotification:", err);
  }
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

  const topicRenameEmoji = await getSetting("topic_rename_emoji");
  if (!topicRenameEmoji) await setSetting("topic_rename_emoji", "🛑");

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
let isConnecting = false;
let cancelCatchupFlag = false;
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

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const groupId = process.env.TELEGRAM_GROUP_ID;

  if (!token || !groupId) {
    console.error("TELEGRAM_BOT_TOKEN or TELEGRAM_GROUP_ID is not defined in environment variables.");
    // We don't exit here to allow the server to start for other features, but bot won't work
  }

  const startApp = () => {
    app.listen(PORT, "0.0.0.0", async () => {
      console.log(`Server running on http://localhost:${PORT}`);
      
      // Initial keyword cache load
      await refreshKeywordCache();
      
      // Connect UserBot in background
      (async () => {
        if (isConnecting) return;
        try {
          isConnecting = true;
          let sessionString = (await getSetting("session_string"))?.value;
          
          const apiIdRaw = (await getSetting("api_id"))?.value || "";
          const apiHash = ((await getSetting("api_hash"))?.value || "").trim();
          const apiId = parseInt(apiIdRaw.trim(), 10);

          if (sessionString && !isNaN(apiId) && apiId > 0 && apiHash) {
            console.log("Attempting to connect UserBot...");
            userClient = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
              connectionRetries: 5,
              requestRetries: 5,
              deviceModel: "Desktop",
              systemVersion: "Windows 10",
              appVersion: "1.0.0",
            });
            await userClient.connect();
            
            const newSessionString = (userClient.session as StringSession).save();
            if (newSessionString && newSessionString !== sessionString) {
              await setSetting("session_string", newSessionString);
            }
            
            if (await userClient.isUserAuthorized()) {
              console.log("UserBot connected successfully.");
              sessionStartTime = Date.now();
              setupUserBotHandlers(userClient, groupId);
              await saveLog("UserBot connected automatically on startup", "info", "SYSTEM");
            } else {
              console.log("UserBot connected but session is invalid/expired.");
              await userClient.disconnect();
              userClient = null;
            }
          }
        } catch (err: any) {
          console.error("Failed to connect UserBot on startup:", err);
          await saveLog(`Startup connection failed: ${err.message}`, "error", "SYSTEM");
          if (err.message?.includes("AUTH_KEY_UNREGISTERED") || 
              err.message?.includes("AUTH_KEY_DUPLICATED")) {
            console.log(`Session invalid or duplicated (${err.message}) on startup. Clearing session string.`);
            await deleteSetting("session_string");
            if (userClient) {
              try { await userClient.disconnect(); } catch (e) {}
            }
            userClient = null;
          } else if (err.message?.includes("TIMEOUT")) {
            console.log(`Connection timed out (${err.message}) on startup. Will retry later.`);
          }
        } finally {
          isConnecting = false;
        }
      })();
    });
  };

  // Connect to MongoDB
  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log("Connected to MongoDB");
      await refreshSettingsCache();
      await initSettings();
      await setupVapid();
      startApp();
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err);
    });

  // Health check endpoint
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  const bot = token ? new TelegramBot(token, { polling: true }) : null;

  // Handle polling errors to prevent crash and clean up logs
  if (bot) {
    bot.on("polling_error", (error: any) => {
      if (error.message && error.message.includes("409 Conflict")) {
        // This is expected during rapid restarts in this environment
        return;
      }
      console.error("Telegram Bot Polling Error:", error);
    });
  }

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
      try {
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
      
      await saveLog(`DEBUG: message.replyTo: ${JSON.stringify(message.replyTo)}`, 'info', 'SYSTEM');
      
      // The forumTopicId is the root of the thread/topic. 
      // In forums, replyToTopId is the topic's starting message ID.
      let forumTopicId: number;
      if (message.action instanceof Api.MessageActionTopicCreate) {
        forumTopicId = Number(messageId);
      } else if (message.replyTo) {
        forumTopicId = Number(replyToTopId || replyToId);
      } else {
        // General topic or non-forum group
        forumTopicId = 1;
      }

      // Check if the entire group is blocked
      const groupIdNum = Number(normalizedChatId);
      if (blockedTopicsCache.has(groupIdNum)) {
        console.log(`Group ${groupIdNum} is blocked. Skipping processing.`);
        await saveLog(`Group ${groupIdNum} is blocked. Skipping processing.`, 'info', 'SYSTEM');
        return;
      }

      // Check if the topic ID is blocked
      if (forumTopicId) {
        console.log(`DEBUG: Checking if forumTopicId ${forumTopicId} is blocked. Cache size: ${blockedTopicsCache.size}. Has: ${blockedTopicsCache.has(forumTopicId)}`);
        await saveLog(`DEBUG: Checking if forumTopicId ${forumTopicId} is blocked. Cache size: ${blockedTopicsCache.size}. Has: ${blockedTopicsCache.has(forumTopicId)}`, 'info', 'SYSTEM');
        if (blockedTopicsCache.has(forumTopicId)) {
          console.log(`Topic ${forumTopicId} is blocked. Skipping processing.`);
          return;
        }
      }

      // Also check if the message ID itself is blocked
      if (blockedTopicsCache.has(Number(messageId))) {
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
        let matchedKeyword = "";

        for (const item of blockKeywords) {
          const kw = item.keyword.toLowerCase();
          if (item.matchMode === 'exact') {
            // Exact match (case insensitive)
            if (msgText === kw) {
              shouldBlock = true;
              matchedKeyword = item.keyword;
              break;
            }
          } else {
            // Partial match
            if (msgText.includes(kw)) {
              shouldBlock = true;
              matchedKeyword = item.keyword;
              break;
            }
          }
        }

        if (shouldBlock) {
          console.log(`Auto-blocking topic ${topicId} due to keyword match: "${matchedKeyword}"`);
          
          // Get topic name
          const name = topicNamesCache[topicId] || "Unknown Topic";
          const link = `https://t.me/c/${targetGroupId.replace("-100", "")}/${topicId}`;

          await BlockedTopic.findOneAndUpdate(
            { telegram_topic_id: topicId },
            { name, link },
            { upsert: true }
          );
          blockedTopicsCache.add(topicId);

          await saveLog(`Topic ${topicId} auto-blocked due to keyword match: "${matchedKeyword}"`, 'warn', 'USERBOT', undefined, { topicName: name, link, keyword: matchedKeyword });
          
          // Notify frontend
          sendSseEvent('topic_blocked', {
            message: `Topic "${name}" auto-blocked (Keyword: ${matchedKeyword})`,
            topicName: name,
            keyword: matchedKeyword,
            timestamp: new Date()
          });

          return; // Stop processing this message
        }
      }

      // 0. Photo Handler
      if (!message.out && message.media && (message.media.photo || (message.media.document && message.media.document.mimeType && message.media.document.mimeType.startsWith('image/')))) {
        const photoReplyEnabledSetting = (await getSetting("photo_reply_enabled"))?.value === "true";
        
        // Always handle topic renaming for photos, even if auto-reply is disabled
        try {
          // Fetch Topic Name & Rename if needed
          const topicIcon = (await getSetting("topic_icon"))?.value || "✅";
          const topicRenameEmoji = (await getSetting("topic_rename_emoji"))?.value || "🛑";
          const renameKeywordsStr = (await getSetting("topic_rename_keywords"))?.value || "";
          const renameMatchMode = (await getSetting("topic_rename_match_mode"))?.value || "exact";

          // Pass true to bypass keyword check for photos
          const topicName = await handleTopicRenaming(client, message, topicId, topicIcon, topicRenameEmoji, renameKeywordsStr, renameMatchMode, true);
          
          const cleanGroupId = targetGroupId.toString().replace("-100", "").replace("-", "");
          const link = topicId 
            ? `https://t.me/c/${cleanGroupId}/${topicId}`
            : `https://t.me/c/${cleanGroupId}`;
          
          console.log(`Photo detected in topic: ${topicName} (${topicId})`);
          
          // Notify frontend
          sendSseEvent('photo_received', {
            message: `${topicName} sent a photo`,
            topicName: topicName,
            timestamp: new Date(),
            url: link
          });

          await saveLog(`Photo received from ${topicName}`, 'info', 'USERBOT', undefined, { topicId });

          // Log the photo sent event for today's stats (count all photos sent by users)
          await PhotoSentLog.create({
            topic_id: topicId,
            topic_name: topicName,
            topic_link: link,
            sent_at: new Date()
          });
          
          // Notify frontend to update stats
          sendSseEvent('photo_sent', {
            topicName: topicName,
            timestamp: new Date()
          });

          if (photoReplyEnabledSetting) {
            const photoReplyMax = parseInt((await getSetting("photo_reply_max"))?.value || "2", 10);

            // Check photo reply history for this topic
            let history = await PhotoReplyHistory.findOne({ topic_id: topicId });
            
            // Daily reset logic for photo replies
            if (history && autoResetEnabled) {
              const lastUpdated = new Date(history.last_updated);
              const today = new Date();
              const lastUpdatedIST = lastUpdated.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
              const todayIST = today.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
              
              if (lastUpdatedIST !== todayIST) {
                console.log(`Resetting photo reply count for topic ${topicId} (New Day)`);
                history.count = 0;
                history.last_updated = today;
                await history.save();
              }
            }

            if (history && history.count >= photoReplyMax) {
              console.log(`Photo reply limit reached for topic ${topicId} (${history.count}/${photoReplyMax}). Skipping.`);
            } else {
              const photoReplyMessage = (await getSetting("photo_reply_message"))?.value || "ok wait";
              const photoReplyMessage2Enabled = (await getSetting("photo_reply_message_2_enabled"))?.value === "true";
              const photoReplyMessage2 = (await getSetting("photo_reply_message_2"))?.value || "second message";
              
              console.log(`Sending Global Photo Auto-Reply: "${photoReplyMessage}" to topic ${topicId}`);
              
              await client.sendMessage(message.peerId, {
                message: photoReplyMessage,
                replyTo: replyTo,
              });

              if (photoReplyMessage2Enabled && photoReplyMessage2) {
                const startTime = (await getSetting("photo_reply_message_2_start_time"))?.value || "";
                const endTime = (await getSetting("photo_reply_message_2_end_time"))?.value || "";
                
                let shouldSend = true;
                if (startTime && endTime) {
                  const now = new Date();
                  const istOffset = 5.5 * 60 * 60 * 1000;
                  const istTime = new Date(now.getTime() + istOffset);
                  const currentHour = istTime.getUTCHours();
                  const currentMinute = istTime.getUTCMinutes();
                  const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
                  
                  if (startTime <= endTime) {
                    shouldSend = currentTimeStr >= startTime && currentTimeStr <= endTime;
                  } else {
                    shouldSend = currentTimeStr >= startTime || currentTimeStr <= endTime;
                  }
                }

                if (shouldSend) {
                  console.log(`Sending second photo auto-reply: "${photoReplyMessage2}"`);
                  await client.sendMessage(message.peerId, {
                    message: photoReplyMessage2,
                    replyTo: replyTo,
                  });
                }
              }

              // Update history
              if (!history) {
                await PhotoReplyHistory.create({ topic_id: topicId, count: 1, last_updated: new Date() });
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
        console.log(`DEBUG: autoReply value: '${autoReply}'`);
        const autoReply2Enabled = (await getSetting("auto_reply_2_enabled"))?.value === "true";
        const autoReply2 = (await getSetting("auto_reply_2"))?.value || "";
        console.log(`DEBUG: autoReply2Enabled: ${autoReply2Enabled}, autoReply2: '${autoReply2}'`);
        const autoReply2Delay = parseInt((await getSetting("auto_reply_2_delay"))?.value || "1", 10);
        const delaySeconds = parseInt((await getSetting("delay_seconds"))?.value || "0", 10);
        
        setTimeout(async () => {
          try {
            if (blockedTopicsCache.has(topicId)) {
              console.log(`Topic ${topicId} was blocked during auto-reply delay. Skipping.`);
              return;
            }
            const replyInGeneral = (await getSetting("reply_in_general"))?.value === "true";
            console.log(`DEBUG: Sending autoReply: '${autoReply}'`);
            await client.sendMessage(message.peerId, {
              message: autoReply,
              replyTo: replyInGeneral ? undefined : topicId,
            });

            if (autoReply2Enabled && autoReply2) {
              // Configurable delay between messages
              setTimeout(async () => {
                try {
                  if (blockedTopicsCache.has(topicId)) {
                    console.log(`Topic ${topicId} was blocked during auto-reply-2 delay. Skipping.`);
                    return;
                  }
                  console.log(`DEBUG: Sending autoReply2: '${autoReply2}'`);
                  await client.sendMessage(message.peerId, {
                    message: autoReply2,
                    replyTo: replyInGeneral ? undefined : topicId,
                  });
                } catch (err) {
                  console.error("UserBot failed to send second auto-reply:", err);
                }
              }, autoReply2Delay * 1000);
            }
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
          if (kw.enabled === false) continue;
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
              // Improved regex to handle non-word characters better
              regex = new RegExp(`(^|[^\\p{L}\\p{N}])${escapedWord}($|[^\\p{L}\\p{N}])`, 'gui');
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

              if (kw.photo) {
                console.log(`Sending photo reply for Keyword Rule: "${match.matchedWord}" (Rule ID: ${kw._id})`);
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
                console.log(`Sending text reply for Keyword Rule: "${match.matchedWord}" (Rule ID: ${kw._id})`);
                await client.sendMessage(message.peerId, {
                  message: kw.reply,
                  replyTo: replyTo,
                });
                replySent = true;
              }

              if (normalizedLinks.length > 0) {
                console.log(`Handling ${normalizedLinks.length} message links for keyword: ${match.matchedWord}`);

                for (const link of normalizedLinks) {
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
                        await client.forwardMessages(message.peerId, {
                          messages: [messageId],
                          fromPeer: fromPeer,
                          topMsgId: replyInGeneral ? undefined : topMsgId,
                        } as any);
                        replySent = true;
                      } catch (fallbackErr: any) {
                         console.error("Fallback forwarding also failed:", fallbackErr.message);
                      }
                    }
                  }
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
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
      } catch (globalErr: any) {
        console.error("Global error in UserBot event handler:", globalErr);
        if (globalErr.message?.includes("AUTH_KEY_UNREGISTERED")) {
          console.log("Session invalid in event handler. Clearing session string.");
          await deleteSetting("session_string");
          if (userClient) {
            try { await userClient.disconnect(); } catch (e) {}
          }
          userClient = null;
        } else if (globalErr.message?.includes("TIMEOUT")) {
          console.log("Connection timed out in event handler. Will retry later.");
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

  app.delete("/api/missed-triggers", async (req, res) => {
    try {
      await MissedTrigger.deleteMany({});
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
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
      blockedTopicsCache.clear();
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

  app.get("/api/push/vapid-public-key", (req, res) => {
    console.log(`Serving VAPID public key: ${vapidPublicKey ? vapidPublicKey.substring(0, 10) + "..." : "NULL"}`);
    res.json({ publicKey: vapidPublicKey });
  });

  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const subscription = req.body;
      console.log(`Received push subscription request for endpoint: ${subscription.endpoint}`);
      await PushSubscription.findOneAndUpdate(
        { endpoint: subscription.endpoint },
        subscription,
        { upsert: true }
      );
      res.status(201).json({ status: "success" });
    } catch (err: any) {
      console.error("Error in /api/push/subscribe:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/push/unsubscribe", async (req, res) => {
    try {
      const { endpoint } = req.body;
      await PushSubscription.deleteOne({ endpoint });
      res.json({ status: "success" });
    } catch (err: any) {
      console.error("Error in /api/push/unsubscribe:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/push/test", async (req, res) => {
    try {
      await sendPushNotification("Test Notification", "This is a test notification from your bot!");
      res.json({ status: "success" });
    } catch (err: any) {
      console.error("Error in /api/push/test:", err);
      res.status(500).json({ error: err.message });
    }
  });

  let lastAuthCheck = 0;
  let cachedAuthStatus = false;
  let sessionStartTime: number | null = null;

  app.get("/api/stats", async (req, res) => {
    try {
      const topicCount = await getTopicCount();
      const todayTopicCount = await getTodayTopicCount();
      const todayPhotoSentStats = await getTodayPhotoSentStats();
      const past24hPhotoSentStats = await getPast24hPhotoSentStats();
      const keywordCount = await Keyword.countDocuments();
      const autoReply = (await getSetting("auto_reply"))?.value || "";
      const autoReply2Enabled = (await getSetting("auto_reply_2_enabled"))?.value === "true";
      const autoReply2 = (await getSetting("auto_reply_2"))?.value || "";
      const autoReply2Delay = parseInt((await getSetting("auto_reply_2_delay"))?.value || "1", 10);
      const delaySeconds = parseInt((await getSetting("delay_seconds"))?.value || "0", 10);
      const isSystemPaused = (await getSetting("system_paused"))?.value === "true";
      const photoReplyEnabled = (await getSetting("photo_reply_enabled"))?.value === "true";
      const photoReplyMessage = (await getSetting("photo_reply_message"))?.value || "ok wait";
      const photoReplyMessage2Enabled = (await getSetting("photo_reply_message_2_enabled"))?.value === "true";
      const photoReplyMessage2 = (await getSetting("photo_reply_message_2"))?.value || "second message";
      const photoReplyMessage2StartTime = (await getSetting("photo_reply_message_2_start_time"))?.value || "";
      const photoReplyMessage2EndTime = (await getSetting("photo_reply_message_2_end_time"))?.value || "";
      const photoReplyMax = parseInt((await getSetting("photo_reply_max"))?.value || "2", 10);
      const notificationSoundEnabled = (await getSetting("notification_sound_enabled"))?.value === "true";
      const notificationSoundType = (await getSetting("notification_sound_type"))?.value || "default";
      const topicIcon = (await getSetting("topic_icon"))?.value || "✅";
      const topicRenameEmoji = (await getSetting("topic_rename_emoji"))?.value || "🛑";
      const topicRenameKeywords = (await getSetting("topic_rename_keywords"))?.value || "";
      const topicRenameMatchMode = (await getSetting("topic_rename_match_mode"))?.value || "exact";
      const autoResetKeywords = (await getSetting("auto_reset_keywords"))?.value === "true";
      const autoBlockKeywords = (await getSetting("auto_block_keywords"))?.value || "";
      const aiModeEnabled = (await getSetting("ai_mode_enabled"))?.value === "true";
      const aiPersona = (await getSetting("ai_persona"))?.value || "";
      const geminiApiKeys = (await getSetting("gemini_api_keys"))?.value || "[]";
      const replyInGeneral = (await getSetting("reply_in_general"))?.value === "true";
      const lastLoginTime = (await getSetting("last_login_time"))?.value || "";
      
      let isUserBotConnected = !!userClient && userClient.connected;
      
      // Check if actually authorized, not just connected (with 1-minute cache to avoid rate limits)
      if (isUserBotConnected && userClient) {
        const now = Date.now();
        if (now - lastAuthCheck > 60000) {
          try {
            cachedAuthStatus = await userClient.isUserAuthorized();
            lastAuthCheck = now;
            if (!cachedAuthStatus) {
              console.log("UserBot connected but not authorized. Marking as disconnected.");
              isUserBotConnected = false;
            }
          } catch (e) {
            console.error("Error checking authorization:", e);
            isUserBotConnected = false;
          }
        } else {
          isUserBotConnected = cachedAuthStatus;
        }
      }
      
      // Auto-reconnect attempt if disconnected but we have a session
      if (!isUserBotConnected && !isConnecting) {
        const sessionString = (await getSetting("session_string"))?.value;
        const apiIdRaw = (await getSetting("api_id"))?.value || "";
        const apiHash = ((await getSetting("api_hash"))?.value || "").trim();
        const apiId = parseInt(apiIdRaw.trim(), 10);

        if (sessionString && !isNaN(apiId) && apiId > 0 && apiHash) {
          try {
            isConnecting = true;
            console.log("Auto-reconnecting UserBot during stats check...");
            if (userClient) {
              try {
                await userClient.disconnect();
              } catch (e) {
                console.error("Error disconnecting existing client:", e);
              }
            }
            userClient = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
              connectionRetries: 5,
              requestRetries: 5,
              deviceModel: "Desktop",
              systemVersion: "Windows 10",
              appVersion: "1.0.0",
            });
            await userClient.connect();
            
            const newSessionString = (userClient.session as StringSession).save();
            if (newSessionString && newSessionString !== sessionString) {
              await setSetting("session_string", newSessionString);
            }
            
            // Re-verify authorization after connect
            const authorized = await userClient.isUserAuthorized();
            if (authorized) {
              setupUserBotHandlers(userClient, groupId);
              isUserBotConnected = true;
              await saveLog("UserBot auto-reconnected during stats check", "info", "API", "/api/stats");
            } else {
              console.log("Auto-reconnect successful but session is unauthorized/expired.");
              await userClient.disconnect();
              userClient = null;
            }
          } catch (connErr: any) {
            console.error("Auto-reconnect failed:", connErr.message);
            if (connErr.message?.includes("AUTH_KEY_UNREGISTERED") || 
                connErr.message?.includes("AUTH_KEY_DUPLICATED")) {
              console.log(`Session invalid or duplicated (${connErr.message}). Clearing session string.`);
              await deleteSetting("session_string");
              if (userClient) {
                try { await userClient.disconnect(); } catch (e) {}
              }
              userClient = null;
            } else if (connErr.message?.includes("TIMEOUT")) {
              console.log(`Connection timed out (${connErr.message}). Will retry later.`);
            }
          } finally {
            isConnecting = false;
          }
        }
      }

      const apiId = (await getSetting("api_id"))?.value || "";
      const apiHash = (await getSetting("api_hash"))?.value || "";
      const defaultPhone = (await getSetting("default_phone"))?.value || "";

      let loginUser = null;
      if (isUserBotConnected && userClient) {
        try {
          const me = await userClient.getMe();
          loginUser = {
            id: me.id.toString(),
            firstName: me.firstName,
            lastName: me.lastName,
            username: me.username,
            phone: me.phone
          };
        } catch (e) {
          console.error("Error getting user info:", e);
        }
      }

      res.json({
        topicCount,
        todayTopicCount,
        todayPhotoSentStats,
        past24hPhotoSentStats,
        keywordCount,
        autoReply,
        autoReply2Enabled,
        autoReply2,
        autoReply2Delay,
        delaySeconds,
        isSystemPaused,
        photoReplyEnabled,
        photoReplyMessage,
        photoReplyMessage2Enabled,
        photoReplyMessage2,
        photoReplyMessage2StartTime,
        photoReplyMessage2EndTime,
        photoReplyMax,
        notificationSoundEnabled,
        notificationSoundType,
        topicIcon,
        topicRenameEmoji,
        topicRenameKeywords,
        topicRenameMatchMode,
        autoResetKeywords,
        autoBlockKeywords,
        aiModeEnabled,
        aiPersona,
        geminiApiKeys,
        replyInGeneral,
        isUserBotConnected,
        sessionStartTime,
        lastLoginTime,
        apiId,
        apiHash,
        defaultPhone,
        loginUser,
      });
    } catch (err: any) {
      console.error("Error in /api/stats:", err);
      await saveLog(err.message, 'error', 'API', '/api/stats');
      res.status(500).json({ error: `[GET /api/stats] ${err.message}` });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const { 
        autoReply, 
        autoReply2Enabled,
        autoReply2,
        autoReply2Delay,
        delaySeconds, 
        apiId, 
        apiHash, 
        systemPaused, 
        photoReplyEnabled, 
        photoReplyMessage, 
        photoReplyMessage2Enabled, 
        photoReplyMessage2, 
        photoReplyMax, 
        notificationSoundEnabled, 
        notificationSoundType, 
        topicIcon, 
        topicRenameEmoji,
        topicRenameKeywords, 
        topicRenameMatchMode, 
        autoResetKeywords, 
        autoBlockKeywords, 
        aiModeEnabled, 
        aiPersona, 
        geminiApiKeys, 
        replyInGeneral,
        photoReplyMessage2StartTime,
        photoReplyMessage2EndTime
      } = req.body;
      if (typeof autoReply === "string") await setSetting("auto_reply", autoReply);
      if (typeof autoReply2Enabled !== "undefined") await setSetting("auto_reply_2_enabled", String(autoReply2Enabled));
      if (typeof autoReply2 === "string") await setSetting("auto_reply_2", autoReply2);
      if (typeof autoReply2Delay !== "undefined") await setSetting("auto_reply_2_delay", String(autoReply2Delay));
      if (typeof delaySeconds !== "undefined") await setSetting("delay_seconds", String(delaySeconds));
      if (typeof apiId !== "undefined") await setSetting("api_id", String(apiId));
      if (typeof apiHash !== "undefined") await setSetting("api_hash", String(apiHash));
      if (typeof systemPaused !== "undefined") await setSetting("system_paused", String(systemPaused));
      if (typeof photoReplyEnabled !== "undefined") await setSetting("photo_reply_enabled", String(photoReplyEnabled));
      if (typeof photoReplyMessage !== "undefined") await setSetting("photo_reply_message", String(photoReplyMessage));
      if (typeof photoReplyMessage2Enabled !== "undefined") await setSetting("photo_reply_message_2_enabled", String(photoReplyMessage2Enabled));
      if (typeof photoReplyMessage2 !== "undefined") await setSetting("photo_reply_message_2", String(photoReplyMessage2));
      if (typeof photoReplyMax !== "undefined") await setSetting("photo_reply_max", String(photoReplyMax));
      if (typeof notificationSoundEnabled !== "undefined") await setSetting("notification_sound_enabled", String(notificationSoundEnabled));
      if (typeof notificationSoundType !== "undefined") await setSetting("notification_sound_type", String(notificationSoundType));
      if (typeof topicIcon !== "undefined") await setSetting("topic_icon", String(topicIcon));
      if (typeof topicRenameEmoji !== "undefined") await setSetting("topic_rename_emoji", String(topicRenameEmoji));
      if (typeof topicRenameKeywords !== "undefined") await setSetting("topic_rename_keywords", String(topicRenameKeywords));
      if (typeof topicRenameMatchMode !== "undefined") await setSetting("topic_rename_match_mode", String(topicRenameMatchMode));
      if (typeof autoResetKeywords !== "undefined") await setSetting("auto_reset_keywords", String(autoResetKeywords));
      if (typeof autoBlockKeywords !== "undefined") await setSetting("auto_block_keywords", String(autoBlockKeywords));
      if (typeof aiModeEnabled !== "undefined") await setSetting("ai_mode_enabled", String(aiModeEnabled));
      if (typeof aiPersona !== "undefined") await setSetting("ai_persona", String(aiPersona));
      if (typeof geminiApiKeys !== "undefined") await setSetting("gemini_api_keys", String(geminiApiKeys));
      if (typeof replyInGeneral !== "undefined") await setSetting("reply_in_general", String(replyInGeneral));
      if (typeof photoReplyMessage2StartTime === "string") await setSetting("photo_reply_message_2_start_time", photoReplyMessage2StartTime);
      if (typeof photoReplyMessage2EndTime === "string") await setSetting("photo_reply_message_2_end_time", photoReplyMessage2EndTime);
      
      await saveLog("Settings updated", 'info', 'API', '/api/settings', { autoReply, delaySeconds, apiId, systemPaused, photoReplyEnabled, photoReplyMessage2Enabled, photoReplyMax, notificationSoundEnabled, notificationSoundType, topicIcon, topicRenameEmoji, topicRenameKeywords, topicRenameMatchMode, autoResetKeywords, autoBlockKeywords, aiModeEnabled, replyInGeneral, photoReplyMessage2StartTime, photoReplyMessage2EndTime });
      res.json({ success: true });
    } catch (err: any) {
      console.error("Error in /api/settings:", err);
      await saveLog(err.message, 'error', 'API', '/api/settings', req.body);
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
        photo: photo || "", 
        message_link: message_link || "", 
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
      
      // Refresh cache before responding to ensure next message uses updated rules
      await refreshKeywordCache();
      
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: `[POST /api/keywords] ${err.message}` });
    }
  });

  app.delete("/api/keywords/:id", async (req, res) => {
    try {
      await Keyword.findByIdAndDelete(req.params.id);
      await refreshKeywordCache();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: `[DELETE /api/keywords] ${err.message}` });
    }
  });

  app.put("/api/keywords/:id", async (req, res) => {
    try {
      const { enabled } = req.body;
      await Keyword.findByIdAndUpdate(req.params.id, { enabled });
      await refreshKeywordCache();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: `[PUT /api/keywords] ${err.message}` });
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
            await setSetting(s.key, s.value);
          }
        }
      }

      await refreshKeywordCache();
      await saveLog("Data imported", 'info', 'API', '/api/data/import');
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

    if (isConnecting) return res.status(429).json({ error: "Connection already in progress. Please wait." });

    try {
      isConnecting = true;
      if (userClient) {
        await userClient.disconnect();
      }
      userClient = new TelegramClient(new StringSession(""), apiId, apiHash, {
        connectionRetries: 5,
        deviceModel: "Desktop",
        systemVersion: "Windows 10",
        appVersion: "1.0.0",
      });
      await userClient.connect();
      const result = await userClient.sendCode({ apiId, apiHash }, phone);
      phoneCodeHash = result.phoneCodeHash;
      phoneNumber = phone;
      await saveLog(`Auth code sent to ${phone}`, 'info', 'API', '/api/auth/send-code');
      res.json({ success: true });
    } catch (err: any) {
      console.error("SendCode error:", err);
      await saveLog(err.message, 'error', 'API', '/api/auth/send-code', { phone, apiId });
      res.status(500).json({ error: `[POST /api/auth/send-code] ${err.message}` });
    } finally {
      isConnecting = false;
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
      const now = new Date().toISOString();
      await setSetting("last_login_time", now);
      sessionStartTime = Date.now();
      setupUserBotHandlers(userClient, groupId);
      await saveLog(`UserBot signed in: ${phoneNumber}`, 'info', 'API', '/api/auth/signin');
      res.json({ success: true });
    } catch (err: any) {
      await saveLog(err.message, 'error', 'API', '/api/auth/signin', { phoneNumber });
      res.status(500).json({ error: `[POST /api/auth/signin] ${err.message}` });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      if (userClient) {
        await userClient.disconnect();
        userClient = null;
      }
      sessionStartTime = null;
      await deleteSetting("session_string");
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
      if (err.message?.includes("AUTH_KEY_UNREGISTERED")) {
        await deleteSetting("session_string");
        if (userClient) { try { await userClient.disconnect(); } catch (e) {} }
        userClient = null;
      } else if (err.message?.includes("TIMEOUT")) {
        console.log("Connection timed out. Will retry later.");
      }
      res.status(500).json({ error: `[GET /api/group/messages] ${err.message}` });
    }
  });

  app.get("/api/broadcast/status", (req, res) => {
    res.json(broadcastStatus);
  });

  app.post("/api/broadcast/cancel", (req, res) => {
    if (broadcastInProgress) {
      broadcastCancelled = true;
      res.json({ success: true, message: "Broadcast cancellation requested" });
    } else {
      res.status(400).json({ error: "No broadcast in progress" });
    }
  });

  app.post("/api/broadcast", async (req, res) => {
    const { message, target } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    if (broadcastInProgress) {
      return res.status(400).json({ error: "A broadcast is already in progress" });
    }

    try {
      if (userClient && userClient.connected) {
        if (target === 'general') {
          // Send only to general section (no topic ID)
          await userClient.sendMessage(groupId, { message });
          await saveLog("Broadcast sent to general section", 'info', 'API', '/api/broadcast', { messageLength: message.length });
          return res.json({ success: true, message: "Broadcast sent to general section" });
        }

        const topics = await Topic.find({});
        console.log(`Broadcast: Found ${topics.length} total topics.`);
        const filteredTopics = topics.filter(topic => !blockedTopicsCache.has(topic.telegram_topic_id));
        console.log(`Broadcast: Found ${filteredTopics.length} topics after filtering blocked topics.`);

        if (filteredTopics.length === 0) {
          // If no topics, just send to the main group
          await userClient.sendMessage(groupId, { message });
          await saveLog("Broadcast sent to main group (no topics found)", 'info', 'API', '/api/broadcast', { messageLength: message.length });
          return res.json({ success: true, message: "Sent to main group (no topics found)" });
        }

        broadcastInProgress = true;
        broadcastCancelled = false;
        broadcastStatus = {
          total: filteredTopics.length,
          current: 0,
          status: 'running'
        };

        // Start broadcast in background
        (async () => {
          try {
            for (let i = 0; i < filteredTopics.length; i++) {
              if (broadcastCancelled) {
                broadcastStatus.status = 'cancelled';
                sendSseEvent('broadcast_update', broadcastStatus);
                await saveLog("Broadcast cancelled", 'warn', 'API', '/api/broadcast', { processed: i, total: filteredTopics.length });
                break;
              }

              const topic = filteredTopics[i];
              try {
                await userClient.sendMessage(groupId, {
                  message,
                  replyTo: topic.telegram_topic_id
                });
                broadcastStatus.current = i + 1;
                sendSseEvent('broadcast_update', broadcastStatus);
              } catch (err: any) {
                const waitMatch = err.message.match(/A wait of (\d+) seconds is required/);
                if (waitMatch) {
                  const waitTime = parseInt(waitMatch[1], 10);
                  console.warn(`Flood wait: Waiting for ${waitTime} seconds for topic ${topic.telegram_topic_id}...`);
                  await saveLog(`Flood wait: Waiting for ${waitTime} seconds for topic ${topic.telegram_topic_id}`, 'warn', 'API', '/api/broadcast');
                  await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                  
                  // Retry once after waiting
                  try {
                    await userClient.sendMessage(groupId, {
                      message,
                      replyTo: topic.telegram_topic_id
                    });
                    broadcastStatus.current = i + 1;
                    sendSseEvent('broadcast_update', broadcastStatus);
                  } catch (retryErr: any) {
                    console.error(`Failed to send broadcast to topic ${topic.telegram_topic_id} after retry:`, retryErr.message);
                    await saveLog(`Broadcast failed for topic ${topic.telegram_topic_id} after retry: ${retryErr.message}`, 'error', 'API', '/api/broadcast');
                  }
                } else {
                  console.error(`Failed to send broadcast to topic ${topic.telegram_topic_id}:`, err.message);
                  await saveLog(`Broadcast failed for topic ${topic.telegram_topic_id}: ${err.message}`, 'error', 'API', '/api/broadcast');
                }
              }

              // Rate limiting delay (reduced to 50ms for faster broadcast)
              await new Promise(resolve => setTimeout(resolve, 50));
            }

            if (!broadcastCancelled) {
              broadcastStatus.status = 'completed';
              sendSseEvent('broadcast_update', broadcastStatus);
              await saveLog("Broadcast completed", 'info', 'API', '/api/broadcast', { total: filteredTopics.length });
            }
          } catch (err: any) {
            console.error("Broadcast error:", err.message);
            broadcastStatus.status = 'error';
            sendSseEvent('broadcast_update', broadcastStatus);
          } finally {
            broadcastInProgress = false;
          }
        })();

        res.json({ success: true, message: "Broadcast started" });
      } else {
        res.status(400).json({ error: "Telegram ID not logged in. Please login first." });
      }
    } catch (err: any) {
      await saveLog(err.message, 'error', 'API', '/api/broadcast');
      res.status(500).json({ error: `[POST /api/broadcast] ${err.message}` });
    }
  });

  app.get("/api/missed-list", async (req, res) => {
    try {
      const missed = await MissedTrigger.find({ processed: false }).sort({ timestamp: -1 });
      res.json({ missed });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/missed-skip", async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "ID is required" });
      await MissedTrigger.findByIdAndUpdate(id, { processed: true });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/missed-skip-all", async (req, res) => {
    try {
      await MissedTrigger.updateMany({ processed: false }, { processed: true });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
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

  app.post("/api/cancel-catchup", (req, res) => {
    cancelCatchupFlag = true;
    res.json({ success: true });
  });

  app.post("/api/scan-missed", async (req, res) => {
    try {
      const isSystemPaused = (await getSetting("system_paused"))?.value === "true";
      if (isSystemPaused) {
        return res.status(400).json({ error: "System is paused. Cannot scan for missed items." });
      }

      if (!userClient || !userClient.connected) {
        return res.status(400).json({ error: "Telegram client not connected" });
      }

      console.log("Scanning first 50 topics for missed keywords...");
      const result = await userClient.invoke(
        new Api.channels.GetForumTopics({
          channel: await userClient.getInputEntity(groupId),
          q: "",
          offsetDate: 0,
          offsetId: 0,
          offsetTopic: 0,
          limit: 50,
        })
      );

      const topics = (result as any).topics || [];
      const missedItems = [];
      let newMissedCount = 0;

      // Use cached blocked topics
      const blockedTopicIds = blockedTopicsCache;

      const normalizedGroupId = groupId.replace("-100", "");
      if (blockedTopicIds.has(Number(normalizedGroupId))) {
        return res.json({ success: true, count: 0, message: "Group is blocked" });
      }

      for (const topic of topics) {
        const topicId = topic.id;
        const topicName = topic.title;
        const topicDate = topic.date ? new Date(topic.date * 1000) : undefined;

        // Log topic to database to ensure it's counted in today's topics if created today
        await logTopic(topicId, topicName, topicDate);

        if (blockedTopicIds.has(topicId)) {
          console.log(`Skipping blocked topic: ${topicId}`);
          continue;
        }

        // Fetch last 30 messages for this topic
        const messages = await userClient.getMessages(groupId, {
          replyTo: topicId,
          limit: 30,
        });

        if (!messages || messages.length === 0) continue;

        const botReplyMessageIds = new Set(
          messages.filter(m => m.out && m.replyTo?.replyToMsgId).map(m => m.replyTo!.replyToMsgId)
        );
        const latestBotReplyDate = Math.max(0, ...messages.filter(m => m.out).map(m => m.date));

        for (const msg of messages) {
          if (msg.out) continue;

          // Check if bot replied directly to this message, or replied generally after this message
          const isRepliedDirectly = botReplyMessageIds.has(msg.id);
          const isRepliedGenerally = latestBotReplyDate > msg.date;

          if (isRepliedDirectly || isRepliedGenerally) {
            continue; // Skip, already replied
          }

          if (msg.message) {
            const text = msg.message.toLowerCase().trim();
            const matches: { kw: any, index: number, matchedWord: string }[] = [];

            for (const kw of cachedKeywords) {
              if (kw.enabled === false) continue;
              const triggerWords = [...(kw.keywords || [])];
              if (kw.keyword && !triggerWords.includes(kw.keyword)) {
                triggerWords.push(kw.keyword);
              }

              for (const word of triggerWords) {
                const wordLower = word.toLowerCase().trim();
                if (!wordLower) continue;

                const escapedWord = escapeRegExp(wordLower);
                let regex: RegExp;
                
                if (kw.match_mode === 'partial') {
                  regex = new RegExp(escapedWord, 'gi');
                } else {
                  regex = new RegExp(`(?<=^|[^\\p{L}\\p{N}])${escapedWord}(?=$|[^\\p{L}\\p{N}])`, 'gui');
                }
                
                let match;
                while ((match = regex.exec(text)) !== null) {
                  matches.push({ kw, index: match.index, matchedWord: wordLower });
                  break; // Only match this specific word once per message
                }
              }
            }

            matches.sort((a, b) => a.index - b.index);

            if (matches.length > 0) {
              const processedRuleIds = new Set<string>();

              for (const match of matches) {
                const kw = match.kw;
                if (processedRuleIds.has(kw._id.toString())) continue;
                processedRuleIds.add(kw._id.toString());

                // Check if already in MissedTrigger for this specific rule
                const existing = await MissedTrigger.findOne({ message_id: msg.id, chat_id: groupId, rule_id: kw._id });
                if (!existing) {
                  const newTrigger = await MissedTrigger.create({
                    message_id: msg.id,
                    chat_id: groupId,
                    topic_id: topicId,
                    text: msg.message,
                    matched_keyword: match.matchedWord,
                    rule_id: kw._id,
                    timestamp: new Date(msg.date * 1000),
                    processed: false
                  });
                  newMissedCount++;
                  missedItems.push({
                    _id: newTrigger._id,
                    topicName,
                    topicId,
                    keyword: match.matchedWord,
                    text: msg.message,
                    date: new Date(msg.date * 1000)
                  });
                }
              }
            }
          }
        }
        
        // Add a small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      res.json({ success: true, count: newMissedCount, items: missedItems });
    } catch (err: any) {
      console.error("Scan missed error:", err);
      if (err.message?.includes("AUTH_KEY_UNREGISTERED")) {
        await deleteSetting("session_string");
        if (userClient) { try { await userClient.disconnect(); } catch (e) {} }
        userClient = null;
      } else if (err.message?.includes("TIMEOUT")) {
        console.log("Connection timed out. Will retry later.");
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/reply-single-missed", async (req, res) => {
    try {
      if (!userClient || !userClient.connected) {
        return res.status(400).json({ error: "Telegram client not connected" });
      }

      const { triggerId } = req.body;
      if (!triggerId) {
        return res.status(400).json({ error: "Trigger ID is required" });
      }

      const trigger = await MissedTrigger.findById(triggerId);
      if (!trigger || trigger.processed) {
        return res.status(404).json({ error: "Trigger not found or already processed" });
      }

      const kw = await Keyword.findById(trigger.rule_id);
      if (!kw) {
        trigger.processed = true;
        await trigger.save();
        return res.status(404).json({ error: "Keyword rule not found" });
      }

      const isSystemPaused = (await getSetting("system_paused"))?.value === "true";
      if (isSystemPaused) {
        return res.status(400).json({ error: "Bot is paused. Unpause first to reply." });
      }

      const replyInGeneral = (await getSetting("reply_in_general"))?.value === "true";
      const topMsgId = trigger.topic_id;
      const replyToMsgId = trigger.message_id;
      const replyTo = replyInGeneral ? undefined : (topMsgId || replyToMsgId);

      if (topMsgId && blockedTopicsCache.has(topMsgId)) {
        return res.status(400).json({ error: "Cannot reply to a blocked topic." });
      }

      // Send reply
      const linksToProcess = [...(kw.message_links || [])];
      if (kw.message_link && !linksToProcess.includes(kw.message_link)) {
        linksToProcess.push(kw.message_link);
      }
      const normalizedLinks = linksToProcess.map(l => l.trim()).filter(l => l).sort();

      let replySent = false;
      if (normalizedLinks.length > 0) {
        for (const link of normalizedLinks) {
          try {
            const peer = await userClient.getInputEntity(trigger.chat_id);
            await userClient.invoke(new Api.messages.ForwardMessages({
              fromPeer: peer,
              id: [trigger.message_id],
              toPeer: peer,
              randomId: [BigInt(Math.floor(Math.random() * 1e15)) as any],
            }));
            replySent = true;
          } catch (err) {
            console.error("Failed to forward message:", err);
          }
        }
      } else if (kw.reply) {
        try {
          await userClient.sendMessage(trigger.chat_id, {
            message: kw.reply,
            replyTo: replyTo,
          });
          replySent = true;
        } catch (err) {
          console.error("Failed to send text reply:", err);
        }
      }

      if (replySent) {
        trigger.processed = true;
        await trigger.save();
        
        // Update ReplyHistory
        if (topMsgId) {
          let history = await ReplyHistory.findOne({ topic_id: topMsgId, keyword_id: kw._id });
          if (!history) {
            await ReplyHistory.create({ topic_id: topMsgId, keyword_id: kw._id, count: 1 });
          } else {
            history.count += 1;
            history.last_updated = new Date();
            await history.save();
          }
        }
        
        await saveLog(`Manual catchup reply sent to topic ${topMsgId} for keyword "${trigger.matched_keyword}"`, 'info', 'USERBOT');
        return res.json({ success: true });
      } else {
        return res.status(500).json({ error: "Failed to send reply" });
      }
    } catch (err: any) {
      console.error("Error in /api/reply-single-missed:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/catchup", async (req, res) => {
    try {
      cancelCatchupFlag = false;
      if (!userClient || !userClient.connected) {
        return res.status(400).json({ error: "Telegram client not connected" });
      }

      const isSystemPaused = (await getSetting("system_paused"))?.value === "true";
      if (isSystemPaused) {
        return res.status(400).json({ error: "Bot is paused. Unpause first to catch up." });
      }

      const replyInGeneral = (await getSetting("reply_in_general"))?.value === "true";
      const autoResetEnabled = (await getSetting("auto_reset_enabled"))?.value !== "false";

      const { triggerIds } = req.body || {};
      let missed = [];
      
      if (triggerIds && Array.isArray(triggerIds) && triggerIds.length > 0) {
        missed = await MissedTrigger.find({ _id: { $in: triggerIds }, processed: false }).sort({ timestamp: 1 });
      } else {
        missed = await MissedTrigger.find({ processed: false }).sort({ timestamp: 1 }).limit(20);
      }

      if (missed.length === 0) {
        return res.json({ success: true, count: 0 });
      }

      let processedCount = 0;
      for (const trigger of missed) {
        if (cancelCatchupFlag) {
          console.log("Catchup cancelled by user.");
          break;
        }

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
          
          const normalizedPeerId = peerId.replace("-100", "");
          if (blockedTopicsCache.has(Number(normalizedPeerId))) {
            console.log(`Skipping missed trigger for blocked group ${normalizedPeerId}`);
            trigger.processed = true;
            await trigger.save();
            continue;
          }

          if (topMsgId && blockedTopicsCache.has(topMsgId)) {
            console.log(`Skipping missed trigger for blocked topic ${topMsgId}`);
            trigger.processed = true;
            await trigger.save();
            continue;
          }

          // Rate limiting check: Max replies per keyword rule per topic
          if (topMsgId) {
            const history = await ReplyHistory.findOne({ topic_id: topMsgId, keyword_id: kw._id });
            const maxReplies = kw.max_replies !== undefined ? kw.max_replies : 0; // 0 means unlimited
            
            let currentCount = 0;
            if (history) {
              const lastUpdated = new Date(history.last_updated);
              const today = new Date();
              
              const lastUpdatedIST = lastUpdated.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
              const todayIST = today.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
              
              if (lastUpdatedIST === todayIST || !autoResetEnabled) {
                currentCount = history.count;
              } else {
                currentCount = 0;
              }
            }

            if (maxReplies > 0 && currentCount >= maxReplies) {
              console.log(`Catchup skipped: Max replies reached for rule ${kw._id} in topic ${topMsgId}`);
              trigger.processed = true;
              await trigger.save();
              continue;
            }
          }

          console.log(`Catchup: Processing trigger ${trigger._id} for peer ${peerId}, replyToMsgId ${replyToMsgId}, topMsgId ${topMsgId}, final replyTo ${replyTo}`);

          // Handle message links (forwarding)
          const linksToProcess = [...(kw.message_links || [])];
          if (kw.message_link && !linksToProcess.includes(kw.message_link)) {
            linksToProcess.push(kw.message_link);
          }
          const normalizedLinks = linksToProcess.map(l => l.trim()).filter(l => l).sort();

          let replySent = false;

          if (kw.photo) {
            console.log(`Catchup: Sending photo reply for keyword: ${kw.keyword}`);
            const base64Data = kw.photo.includes(",") ? kw.photo.split(",")[1] : kw.photo;
            const buffer = Buffer.from(base64Data, "base64");
            const fileToUpload = new CustomFile("photo.jpg", buffer.length, "", buffer);
            const toUpload = await userClient.uploadFile({ file: fileToUpload, workers: 1 });
            await userClient.sendFile(peerId, {
              file: toUpload,
              caption: kw.reply || "",
              replyTo: replyTo,
            });
            replySent = true;
          } else if (kw.reply) {
            console.log(`Catchup: Sending text reply for keyword: ${kw.keyword}`);
            await userClient.sendMessage(peerId, {
              message: kw.reply,
              replyTo: replyTo,
            });
            replySent = true;
          }

          if (normalizedLinks.length > 0) {
            console.log(`Catchup: Handling ${normalizedLinks.length} message links for keyword: ${kw.keyword}`);
            for (const link of normalizedLinks) {
              const parts = link.split("/").filter(p => p.length > 0);
              const messageId = parseInt(parts[parts.length - 1], 10);
              if (!isNaN(messageId)) {
                let fromPeer: any = (await getSetting("target_group_id"))?.value;
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

                try {
                  let inputPeer;
                  try {
                    inputPeer = await userClient.getInputEntity(fromPeer);
                  } catch (e: any) {
                    console.warn(`Could not resolve entity for ${fromPeer}: ${e.message}`);
                    throw e;
                  }

                  await userClient.invoke(
                    new Api.messages.ForwardMessages({
                      fromPeer: inputPeer,
                      id: [messageId],
                      randomId: [BigInt(Math.floor(Math.random() * 1e15)) as any],
                      toPeer: peerId,
                      topMsgId: replyInGeneral ? undefined : topMsgId,
                    }) as any
                  );
                  console.log(`Catchup: Forwarded message ${messageId} for keyword: ${kw.keyword}`);
                  replySent = true;
                } catch (forwardErr: any) {
                  console.error("Catchup forward failed, trying fallback:", forwardErr.message);
                  try {
                    await userClient.forwardMessages(peerId, {
                      messages: [messageId],
                      fromPeer: fromPeer,
                      topMsgId: replyInGeneral ? undefined : topMsgId,
                    } as any);
                    replySent = true;
                  } catch (fallbackErr) {
                    console.error("Catchup fallback forward failed:", fallbackErr);
                  }
                }
              }
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          // Update ReplyHistory
          if (replySent && topMsgId) {
            const today = new Date();
            const history = await ReplyHistory.findOne({ topic_id: topMsgId, keyword_id: kw._id });
            let isSameDay = false;
            
            if (history) {
              const lastUpdated = new Date(history.last_updated);
              const lastUpdatedIST = lastUpdated.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
              const todayIST = today.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
              if (lastUpdatedIST === todayIST) isSameDay = true;
            }

            if (history && isSameDay) {
               await ReplyHistory.findByIdAndUpdate(history._id, { $inc: { count: 1 }, last_updated: today });
            } else {
               await ReplyHistory.findOneAndUpdate(
                  { topic_id: topMsgId, keyword_id: kw._id },
                  { count: 1, last_updated: today },
                  { upsert: true }
               );
            }
          }

          trigger.processed = true;
          await trigger.save();
          processedCount++;
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
          console.error("Catchup failed for trigger:", trigger._id, e);
        }
      }

      res.json({ success: true, count: processedCount, cancelled: cancelCatchupFlag });
    } catch (err: any) {
      if (err.message?.includes("AUTH_KEY_UNREGISTERED")) {
        await deleteSetting("session_string");
        if (userClient) { try { await userClient.disconnect(); } catch (e) {} }
        userClient = null;
      } else if (err.message?.includes("TIMEOUT")) {
        console.log("Connection timed out. Will retry later.");
      }
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
      let topicId = NaN;
      
      const cIndex = parts.indexOf('c');
      if (cIndex !== -1 && parts.length > cIndex + 2) {
        // Format: https://t.me/c/groupId/topicId[/messageId]
        topicId = parseInt(parts[cIndex + 2], 10);
      } else {
        const tmeIndex = parts.findIndex(p => p === 't.me' || p === 'telegram.me');
        if (tmeIndex !== -1 && parts.length > tmeIndex + 2) {
          // Format: https://t.me/groupname/topicId[/messageId]
          topicId = parseInt(parts[tmeIndex + 2], 10);
        } else {
          // Fallback
          topicId = parseInt(parts[parts.length - 1], 10);
        }
      }

      if (isNaN(topicId)) {
        return res.status(400).json({ error: "Invalid topic link" });
      }

      // Toggle behavior: If already blocked, unblock it
      const existing = await BlockedTopic.findOne({ telegram_topic_id: topicId });
      if (existing) {
        await BlockedTopic.findByIdAndDelete(existing._id);
        blockedTopicsCache.delete(topicId);
        await saveLog(`Topic ${topicId} unblocked via link`, 'info', 'API', '/api/blocked-topics', { link });
        return res.json({ success: true, action: 'unblocked' });
      }

      // Try to find topic name from our Topic collection
      const name = topicNamesCache[topicId] || "Unknown Topic";

      await BlockedTopic.create({
        telegram_topic_id: topicId,
        name,
        link
      });
      blockedTopicsCache.add(topicId);
      
      await saveLog(`Topic ${topicId} blocked`, 'info', 'API', '/api/blocked-topics', { link, name });
      res.json({ success: true, action: 'blocked', name });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/blocked-topics/:id", async (req, res) => {
    try {
      const deleted = await BlockedTopic.findByIdAndDelete(req.params.id);
      if (deleted) {
        blockedTopicsCache.delete(deleted.telegram_topic_id);
      }
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

  app.get("/api/logs/export", async (req, res) => {
    try {
      const logs = await Log.find().sort({ timestamp: -1 });
      const format = req.query.format || 'json';
      
      if (format === 'csv') {
        let csv = 'Timestamp,Level,Category,Message,Route,Details\n';
        logs.forEach(log => {
          const details = log.details ? log.details.replace(/"/g, '""') : '';
          csv += `"${log.timestamp.toISOString()}","${log.level}","${log.category || ''}","${log.message.replace(/"/g, '""')}","${log.route || ''}","${details}"\n`;
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=logs.csv');
        return res.send(csv);
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=logs.json');
      res.json(logs);
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

      const topicData = topTopics.map(t => ({
        name: topicNamesCache[t._id] || `Topic ${t._id}`,
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
    createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then(vite => {
      app.use(vite.middlewares);
      console.log("Vite middleware initialized");
    }).catch(err => {
      console.error("Vite server error:", err);
    });
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

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
