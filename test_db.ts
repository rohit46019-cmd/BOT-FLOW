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
  const keywords = await Keyword.find();
  console.log(JSON.stringify(keywords, null, 2));
  process.exit(0);
}
run();
