import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const KeywordSchema = new mongoose.Schema({
  keyword: { type: String },
  keywords: { type: [String], default: [] },
  reply: { type: String },
  photo: { type: String },
  message_link: { type: String },
  message_links: { type: [String], default: [] },
  max_replies: { type: Number, default: 2 },
  match_mode: { type: String, enum: ['exact', 'partial'], default: 'exact' },
  ai_reply_enabled: { type: Boolean, default: false }
});
const Keyword = mongoose.model("Keyword", KeywordSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  // Create a test keyword
  const kw = await Keyword.create({
    keyword: "test_kw",
    message_link: "old_link",
    message_links: ["old_link"]
  });
  console.log("Created:", kw);

  // Update it like the API does
  const reqBody = {
    id: kw._id,
    keyword: "test_kw",
    keywords: ["test_kw"],
    reply: "",
    photo: "",
    message_links: [],
    max_replies: 2,
    match_mode: "exact",
    ai_reply_enabled: false
  };

  const updateData = { 
    keyword: reqBody.keyword,
    keywords: reqBody.keywords, 
    reply: reqBody.reply, 
    photo: reqBody.photo || "", 
    message_link: (reqBody as any).message_link || "", 
    message_links: reqBody.message_links,
    max_replies: typeof reqBody.max_replies === 'number' ? reqBody.max_replies : 0,
    match_mode: reqBody.match_mode || 'exact',
    ai_reply_enabled: !!reqBody.ai_reply_enabled
  };

  await Keyword.findByIdAndUpdate(kw._id, updateData);
  
  const updatedKw = await Keyword.findById(kw._id);
  console.log("Updated:", updatedKw);
  
  await Keyword.findByIdAndDelete(kw._id);
  process.exit(0);
}
run();
