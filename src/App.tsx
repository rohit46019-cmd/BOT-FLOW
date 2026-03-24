import React, { useState, useEffect, useRef, useDeferredValue, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from 'react-hot-toast';
import { Skeleton } from './components/Skeleton';
import { 
  MessageSquare, 
  Send, 
  Settings, 
  BarChart3, 
  Bell, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  User,
  Key,
  Smartphone,
  Lock,
  Hash,
  Plus,
  Trash2,
  LayoutDashboard,
  Sun,
  Moon,
  Image as ImageIcon,
  X,
  Search,
  Folder,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  FileText,
  Download,
  Upload,
  Play,
  Pause,
  ShieldAlert,
  ShieldCheck,
  Link,
  RotateCcw,
  Copy,
  ChevronDown,
  ChevronUp,
  PieChart,
  Bot,
  MessageCircle,
  MoreVertical,
  Calendar,
  Users,
  Database,
  Library,
  Trash,
  Sparkles,
  Zap,
  Check,
  Grip,
  Menu,
  Save,
  LogOut,
  ExternalLink
} from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

interface Stats {
  topicCount: number;
  todayTopicCount: number;
  keywordCount: number;
  autoReply: string;
  delaySeconds: number;
  isSystemPaused: boolean;
  photoReplyEnabled: boolean;
  photoReplyMessage: string;
  photoReplyMax: number;
  notificationSoundEnabled: boolean;
  notificationSoundType: string;
  isUserBotConnected: boolean;
  apiId: string;
  apiHash: string;
  defaultPhone: string;
  topicIcon: string;
  topicRenameKeywords: string;
  topicRenameMatchMode: 'exact' | 'partial';
  autoResetKeywords: boolean;
  autoBlockKeywords: string; // JSON string
  aiModeEnabled: boolean;
  aiPersona: string;
  geminiApiKeys: string; // JSON string
  replyInGeneral: boolean;
  loginUser?: {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    phone?: string;
  };
}

interface AutoBlockKeyword {
  keyword: string;
  matchMode: 'exact' | 'partial';
}

interface Keyword {
  _id: string;
  keyword: string; // Legacy
  keywords?: string[]; // New array
  reply: string;
  photo?: string;
  message_link?: string;
  message_links?: string[];
  max_replies?: number;
  match_mode?: 'exact' | 'partial';
  ai_reply_enabled?: boolean;
}

interface Topic {
  _id: string;
  telegram_topic_id: number;
  name: string;
  created_at: string;
}

interface AppLog {
  _id: string;
  level: 'info' | 'error' | 'warn';
  category?: string;
  message: string;
  details?: string;
  route?: string;
  timestamp: string;
}

interface MediaItem {
  _id: string;
  url: string;
  name: string;
  type: string;
  created_at: string;
}

interface LeaderboardItem {
  username: string;
  count: number;
  avatar?: string;
}

interface HeatmapItem {
  day: string;
  hour: number;
  value: number;
}

const TABS = ['dashboard', 'analytics', 'keywords', 'broadcast', 'settings', 'tester', 'user', 'logs', 'media', 'insights'] as const;
type TabType = typeof TABS[number];

const TabButton = ({ 
  id, 
  icon: Icon, 
  label, 
  activeTab, 
  setActiveTab, 
  setDirection, 
  darkMode 
}: { 
  id: TabType, 
  icon: any, 
  label: string,
  activeTab: TabType,
  setActiveTab: (id: TabType) => void,
  setDirection: (dir: number) => void,
  darkMode: boolean
}) => {
  const isActive = activeTab === id;
  const colors = {
    dashboard: 'from-emerald-400 to-emerald-600',
    analytics: 'from-cyan-400 to-cyan-600',
    keywords: 'from-blue-400 to-blue-600',
    broadcast: 'from-purple-400 to-purple-600',
    settings: 'from-amber-400 to-amber-600',
    tester: 'from-orange-400 to-orange-600',
    user: 'from-pink-400 to-pink-600',
    logs: 'from-slate-400 to-slate-600',
    media: 'from-indigo-400 to-indigo-600',
    insights: 'from-rose-400 to-rose-600'
  };

  return (
    <button
      onClick={() => {
        const currentIndex = TABS.indexOf(activeTab);
        const newIndex = TABS.indexOf(id);
        if (currentIndex !== newIndex) {
          setDirection(newIndex > currentIndex ? 1 : -1);
          setActiveTab(id);
        }
      }}
      className={`flex flex-col items-center justify-center py-2 px-1 sm:px-4 rounded-2xl transition-all duration-300 relative group ${
        isActive ? (darkMode ? "text-white" : "text-slate-900") : (darkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-700")
      }`}
    >
      <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? `bg-gradient-to-tr ${colors[id]} shadow-lg shadow-emerald-500/20` : "group-hover:bg-slate-500/5"}`}>
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${isActive ? "scale-110 text-white" : "group-hover:scale-110"}`} />
      </div>
      <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest mt-1 transition-all ${isActive ? "opacity-100" : "opacity-60"}`}>{label}</span>
      {isActive && (
        <motion.div 
          layoutId="activeTab"
          className={`absolute -bottom-1 w-6 h-1 bg-gradient-to-r ${colors[id]} rounded-full`}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </button>
  );
};

const KeywordInput = ({ value, onChange, onRemove, showRemove, darkMode, index }: any) => {
  const [localValue, setLocalValue] = useState(value);
  const colors = ['emerald', 'blue', 'rose', 'amber', 'purple', 'indigo'];
  const color = colors[(index || 0) % 6];

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  return (
    <div className="flex items-center space-x-2 group">
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="e.g. hello"
        className={`flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-${color}-500 outline-none text-sm transition-all ${darkMode ? `bg-${color}-500/10 border-${color}-500/30 text-white placeholder-white/20` : `bg-${color}-50 border-${color}-200 text-slate-900 placeholder-slate-400`}`}
      />
      {showRemove && (
        <button 
          onClick={onRemove}
          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
};

const ReplyInput = ({ value, onChange, darkMode }: any) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  return (
    <textarea
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      placeholder="What should I reply?"
      rows={4}
      className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm transition-all resize-none ${darkMode ? 'bg-purple-500/10 border-purple-500/30 text-white placeholder-white/20' : 'bg-purple-50 border-purple-200 text-slate-900 placeholder-slate-400'}`}
    />
  );
};

const AddKeywordSection = ({ 
  editingKeyword, 
  onSave, 
  onCancel, 
  darkMode, 
  keywordsTopRef 
}: any) => {
  const [newKeywords, setNewKeywords] = useState<string[]>([""]);
  const [newReply, setNewReply] = useState("");
  const [newMatchMode, setNewMatchMode] = useState<'exact' | 'partial'>('exact');
  const [newMessageLinks, setNewMessageLinks] = useState<string[]>([""]);
  const [newMaxReplies, setNewMaxReplies] = useState<number | string>(0);
  const [newAiReplyEnabled, setNewAiReplyEnabled] = useState(false);

  useEffect(() => {
    if (editingKeyword) {
      const kws = editingKeyword.keywords && editingKeyword.keywords.length > 0 
        ? [...editingKeyword.keywords] 
        : (editingKeyword.keyword ? [editingKeyword.keyword] : [""]);
      setNewKeywords(kws);
      setNewReply(editingKeyword.reply || "");
      const links = editingKeyword.message_links && editingKeyword.message_links.length > 0 
        ? [...editingKeyword.message_links] 
        : (editingKeyword.message_link ? [editingKeyword.message_link] : [""]);
      setNewMessageLinks(links);
      setNewMaxReplies(editingKeyword.max_replies !== undefined ? editingKeyword.max_replies : 0);
      setNewMatchMode(editingKeyword.match_mode || 'exact');
      setNewAiReplyEnabled(!!editingKeyword.ai_reply_enabled);
    } else {
      setNewKeywords([""]);
      setNewReply("");
      setNewMessageLinks([""]);
      setNewMaxReplies(0);
      setNewMatchMode('exact');
      setNewAiReplyEnabled(false);
    }
  }, [editingKeyword]);

  const addKeywordField = () => setNewKeywords([...newKeywords, ""]);
  const updateKeywordField = (index: number, value: string) => {
    const updated = [...newKeywords];
    updated[index] = value;
    setNewKeywords(updated);
  };
  const removeKeywordField = (index: number) => {
    if (newKeywords.length > 1) {
      setNewKeywords(newKeywords.filter((_, i) => i !== index));
    }
  };

  const addMessageLinkField = () => setNewMessageLinks([...newMessageLinks, ""]);
  const updateMessageLinkField = (index: number, value: string) => {
    const updated = [...newMessageLinks];
    updated[index] = value;
    setNewMessageLinks(updated);
  };
  const removeMessageLinkField = (index: number) => {
    if (newMessageLinks.length > 1) {
      setNewMessageLinks(newMessageLinks.filter((_, i) => i !== index));
    }
  };

  const handleSave = () => {
    onSave({
      keywords: newKeywords,
      reply: newReply,
      match_mode: newMatchMode,
      message_links: newMessageLinks,
      max_replies: newMaxReplies,
      ai_reply_enabled: newAiReplyEnabled
    });
  };

  return (
    <div ref={keywordsTopRef} className={`p-6 rounded-3xl border transition-all duration-500 ${darkMode ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-2xl ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
            <Plus className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h2 className={`text-xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {editingKeyword ? "Edit Rule" : "Create New Rule"}
            </h2>
            <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {editingKeyword ? "Update your existing auto-reply rule" : "Set up a new automated response"}
            </p>
          </div>
        </div>
        {editingKeyword && (
          <button onClick={onCancel} className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <X size={20} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Keywords to Match
            </label>
            <div className="space-y-3">
              {newKeywords.map((kw, index) => (
                <KeywordInput 
                  key={index}
                  index={index}
                  value={kw}
                  onChange={(val: string) => updateKeywordField(index, val)}
                  onRemove={() => removeKeywordField(index)}
                  showRemove={newKeywords.length > 1}
                  darkMode={darkMode}
                />
              ))}
              <button 
                onClick={addKeywordField}
                className={`w-full p-3 border-2 border-dashed rounded-xl text-sm font-bold transition-all flex items-center justify-center space-x-2 ${darkMode ? 'border-white/10 text-slate-400 hover:border-blue-500/50 hover:text-blue-400' : 'border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-500'}`}
              >
                <Plus size={16} />
                <span>Add Another Keyword</span>
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Auto-Reply Message
            </label>
            <ReplyInput 
              value={newReply}
              onChange={setNewReply}
              darkMode={darkMode}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Match Mode
              </label>
              <div className={`p-1 rounded-xl flex ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                <button 
                  onClick={() => setNewMatchMode('exact')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${newMatchMode === 'exact' ? (darkMode ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white text-blue-600 shadow-md') : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}
                >
                  Exact
                </button>
                <button 
                  onClick={() => setNewMatchMode('partial')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${newMatchMode === 'partial' ? (darkMode ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white text-blue-600 shadow-md') : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}
                >
                  Partial
                </button>
              </div>
            </div>

            <div>
              <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Max Replies
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  value={newMaxReplies}
                  onChange={(e) => setNewMaxReplies(e.target.value)}
                  placeholder="0 = Unlimited"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                />
              </div>
            </div>
          </div>

          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Message Links (Optional)
            </label>
            <div className="space-y-3">
              {newMessageLinks.map((link, index) => {
                const colors = ['emerald', 'blue', 'rose', 'amber', 'purple', 'indigo'];
                const color = colors[index % 6];
                return (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Link className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-${color}-500`} />
                      <input
                        type="text"
                        value={link}
                        onChange={(e) => updateMessageLinkField(index, e.target.value)}
                        placeholder="https://t.me/..."
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-${color}-500 outline-none text-sm transition-all ${darkMode ? `bg-${color}-500/10 border-${color}-500/30 text-white placeholder-white/20` : `bg-${color}-50 border-${color}-200 text-slate-900 placeholder-slate-400`}`}
                      />
                    </div>
                    {newMessageLinks.length > 1 && (
                      <button onClick={() => removeMessageLinkField(index)} className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                );
              })}
              <button 
                onClick={addMessageLinkField}
                className={`w-full p-2.5 border-2 border-dashed rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${darkMode ? 'border-white/10 text-slate-400 hover:border-blue-500/50 hover:text-blue-400' : 'border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-500'}`}
              >
                <Plus size={14} />
                <span>Add Another Link</span>
              </button>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border transition-all ${newAiReplyEnabled ? (darkMode ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200') : (darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${newAiReplyEnabled ? 'bg-blue-500 text-white' : (darkMode ? 'bg-white/10 text-slate-400' : 'bg-white text-slate-400')}`}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>AI Smart Reply</p>
                  <p className={`text-[10px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Use Gemini AI to enhance responses</p>
                </div>
              </div>
              <button 
                onClick={() => setNewAiReplyEnabled(!newAiReplyEnabled)}
                className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${newAiReplyEnabled ? 'bg-blue-500' : (darkMode ? 'bg-white/10' : 'bg-slate-300')}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 ${newAiReplyEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex space-x-4">
        <button 
          onClick={handleSave}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3"
        >
          <Zap size={20} />
          <span>{editingKeyword ? "Update Rule" : "Create Rule"}</span>
        </button>
        {editingKeyword && (
          <button 
            onClick={onCancel}
            className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all ${darkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

const NotificationPanel = ({ isOpen, onClose, logs, darkMode }: any) => {
  const notificationLogs = logs.filter((l: any) => 
    l.message.toLowerCase().includes('photo') || 
    l.message.toLowerCase().includes('block')
  );
  
  // Extract unique senders (only for photo logs)
  const recentSenders = Array.from(new Set(notificationLogs.filter((l: any) => l.message.toLowerCase().includes('photo')).map((l: any) => {
    try {
      const details = l.details ? JSON.parse(l.details) : {};
      const topicId = details.topicId || l.message.match(/topic (\d+)/)?.[1];
      const topicName = l.message.replace('Photo received from ', '').replace('Photo auto-reply sent to ', '').split(':')[0];
      return JSON.stringify({ name: topicName, id: topicId });
    } catch (e) {
      return null;
    }
  }).filter(Boolean))).map(s => JSON.parse(s as string));

  const [activeSubTab, setActiveSubTab] = useState<'senders' | 'alerts'>('senders');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 right-0 bottom-0 w-80 z-[101] shadow-2xl flex flex-col ${darkMode ? 'bg-slate-950 border-l border-white/10' : 'bg-white border-l border-slate-200'}`}
          >
            <div className={`p-6 border-b flex items-center justify-between ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
              <div className="flex items-center space-x-2">
                <Bell className="text-blue-500" size={18} />
                <h2 className={`font-black text-sm uppercase tracking-widest ${darkMode ? 'text-white' : 'text-slate-900'}`}>Notifications</h2>
              </div>
              <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <X size={20} />
              </button>
            </div>

            <div className={`flex border-b ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
              <button 
                onClick={() => setActiveSubTab('senders')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeSubTab === 'senders' ? (darkMode ? 'text-blue-400' : 'text-blue-600') : (darkMode ? 'text-slate-500' : 'text-slate-400')}`}
              >
                Recent Senders
                {activeSubTab === 'senders' && <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
              </button>
              <button 
                onClick={() => setActiveSubTab('alerts')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeSubTab === 'alerts' ? (darkMode ? 'text-blue-400' : 'text-blue-600') : (darkMode ? 'text-slate-500' : 'text-slate-400')}`}
              >
                All Alerts
                {activeSubTab === 'alerts' && <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeSubTab === 'senders' ? (
                recentSenders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-50">
                    <User size={40} className="mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">No recent senders</p>
                  </div>
                ) : (
                  recentSenders.map((sender, i) => (
                    <div 
                      key={i} 
                      onClick={() => {
                        navigator.clipboard.writeText(sender.id);
                        toast.success(`Copied Topic ID: ${sender.id}`);
                      }}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer group ${darkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-500/20 flex items-center justify-center border border-blue-500/30 group-hover:scale-105 transition-transform">
                          <img 
                            src={`https://picsum.photos/seed/${sender.id}/100`} 
                            alt={sender.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-xs font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{sender.name}</span>
                          <span className={`text-[9px] font-mono opacity-50 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Topic ID: {sender.id}</span>
                        </div>
                      </div>
                      <div className={`p-2 rounded-lg transition-all ${darkMode ? 'text-blue-400 group-hover:bg-blue-500/20' : 'text-blue-600 group-hover:bg-blue-500/10'}`}>
                        <Grip size={16} />
                      </div>
                    </div>
                  ))
                )
              ) : (
                notificationLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-50">
                    <Bell size={40} className="mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">No notifications</p>
                  </div>
                ) : (
                  notificationLogs.slice(0, 50).map((log: any, i: number) => {
                    let topicId = null;
                    let topicName = null;
                    let topicLink = null;
                    try {
                      const details = log.details ? JSON.parse(log.details) : {};
                      topicId = details.topicId;
                      topicName = details.topicName || details.name;
                      topicLink = details.link;
                    } catch(e) {}

                    const isBlockLog = log.message.toLowerCase().includes('block');

                    return (
                      <div key={i} className={`p-4 rounded-2xl border transition-all ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? (isBlockLog ? 'text-rose-400' : 'text-blue-400') : (isBlockLog ? 'text-rose-600' : 'text-blue-600')}`}>{log.type || (isBlockLog ? 'BLOCK' : 'PHOTO')}</span>
                          <span className="text-[8px] opacity-40 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{log.message}</p>
                        
                        {(topicName || topicLink) && isBlockLog && (
                          <div className="mt-2 pt-2 border-t border-white/5 flex flex-col gap-1">
                            {topicName && (
                              <p className={`text-[10px] font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Topic: <span className={darkMode ? 'text-slate-200' : 'text-slate-800'}>{topicName}</span>
                              </p>
                            )}
                            {topicLink && (
                              <a 
                                href={topicLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[9px] font-black uppercase tracking-widest text-blue-500 hover:underline inline-flex items-center gap-1"
                              >
                                View Topic <ExternalLink size={8} />
                              </a>
                            )}
                          </div>
                        )}

                        {topicId && !isBlockLog && (
                          <div className="mt-2 pt-2 border-t border-white/5 flex justify-end">
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(topicId);
                                toast.success(`Copied ID: ${topicId}`);
                              }}
                              className="text-[9px] font-black uppercase tracking-widest text-blue-500 hover:underline"
                            >
                              Copy Topic ID: {topicId}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )
              )}
            </div>
            
            <div className={`p-4 border-t ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
              <button 
                onClick={onClose}
                className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Close Panel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [autoReplyInput, setAutoReplyInput] = useState("");
  const [delaySecondsInput, setDelaySecondsInput] = useState(0);
  const [apiIdInput, setApiIdInput] = useState("");
  const [apiHashInput, setApiHashInput] = useState("");
  const [photoReplyEnabled, setPhotoReplyEnabled] = useState(false);
  const [photoReplyMessage, setPhotoReplyMessage] = useState("");
  const [photoReplyMessage2Enabled, setPhotoReplyMessage2Enabled] = useState(false);
  const [photoReplyMessage2, setPhotoReplyMessage2] = useState("");
  const [photoReplyMax, setPhotoReplyMax] = useState<number | string>(2);
  const [topicIcon, setTopicIcon] = useState("🛑");
  const [topicRenameKeywords, setTopicRenameKeywords] = useState("");
  const [topicRenameMatchMode, setTopicRenameMatchMode] = useState<'exact' | 'partial'>('exact');
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(true);
  const [notificationSoundType, setNotificationSoundType] = useState("default");
  const [autoResetKeywords, setAutoResetKeywords] = useState(true);
  const [autoBlockKeywords, setAutoBlockKeywords] = useState<AutoBlockKeyword[]>([]);
  const [autoBlockKeywordsExpanded, setAutoBlockKeywordsExpanded] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [logSearch, setLogSearch] = useState("");
  const [logLevelFilter, setLogLevelFilter] = useState<string>("all");
  const [logCategoryFilter, setLogCategoryFilter] = useState<string>("all");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isAddingNewRule, setIsAddingNewRule] = useState(false);
  const [keywordSearch, setKeywordSearch] = useState("");
  const [expandedKeywordId, setExpandedKeywordId] = useState<string | null>(null);
  const deferredKeywordSearch = useDeferredValue(keywordSearch);
  const [blockedTopics, setBlockedTopics] = useState<any[]>([]);
  const [newBlockedTopicLink, setNewBlockedTopicLink] = useState("");
  const [blockedTopicSearch, setBlockedTopicSearch] = useState("");
  const [blockingTopic, setBlockingTopic] = useState(false);
  const [aiModeEnabled, setAiModeEnabled] = useState(false);
  const [aiPersona, setAiPersona] = useState("");
  const [geminiApiKeys, setGeminiApiKeys] = useState<string[]>([]);
  const [replyInGeneral, setReplyInGeneral] = useState(false);
  
  const [analyticsData, setAnalyticsData] = useState<{keywordData: any[], topicData: any[]}>({ keywordData: [], topicData: [] });
  const [testMessage, setTestMessage] = useState("");
  const [testReply, setTestReply] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [userLeaderboard, setUserLeaderboard] = useState<LeaderboardItem[]>([]);
  const [activityHeatmap, setActivityHeatmap] = useState<HeatmapItem[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaName, setNewMediaName] = useState("");
  
  const [missedCount, setMissedCount] = useState(0);
  const [isCatchingUp, setIsCatchingUp] = useState(false);
  const [isScanningMissed, setIsScanningMissed] = useState(false);
  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [selectedScannedItems, setSelectedScannedItems] = useState<Set<string>>(new Set());
  const [showScanModal, setShowScanModal] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [direction, setDirection] = useState(0);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const [refreshingLogs, setRefreshingLogs] = useState(false);
  const [editingKeywordId, setEditingKeywordId] = useState<string | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [showPauseConfirmation, setShowPauseConfirmation] = useState(false);
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  const [showDeleteLastKeywordConfirm, setShowDeleteLastKeywordConfirm] = useState(false);
  const [showResetKeywordsConfirm, setShowResetKeywordsConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenLogCount, setLastSeenLogCount] = useState(0);
  const keywordsTopRef = useRef<HTMLDivElement>(null);
  const keywordsBottomRef = useRef<HTMLDivElement>(null);
  const castTopRef = useRef<HTMLDivElement>(null);
  const castBottomRef = useRef<HTMLDivElement>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  useEffect(() => {
    const savedStartTime = localStorage.getItem("sessionStartTime");
    if (savedStartTime) {
      setSessionStartTime(parseInt(savedStartTime));
    } else {
      const now = Date.now();
      setSessionStartTime(now);
      localStorage.setItem("sessionStartTime", now.toString());
    }
  }, []);

  useEffect(() => {
    if (!sessionStartTime) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  useEffect(() => {
    if (isNotificationOpen) {
      setUnreadCount(0);
      setLastSeenLogCount(logs.length);
    }
  }, [isNotificationOpen, logs.length]);

  useEffect(() => {
    if (!isNotificationOpen && logs.length > lastSeenLogCount) {
      const newLogs = logs.slice(lastSeenLogCount);
      const newNotificationLogs = newLogs.filter((l: any) => 
        l.message.toLowerCase().includes('photo') || 
        l.message.toLowerCase().includes('block')
      );
      if (newNotificationLogs.length > 0) {
        setUnreadCount(prev => prev + newNotificationLogs.length);
      }
      setLastSeenLogCount(logs.length);
    }
  }, [logs, isNotificationOpen, lastSeenLogCount]);

  const formatTime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return {
      days: d,
      time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    };
  };

  const timer = formatTime(elapsedTime);

  const scrollToKeywordsTop = () => {
    keywordsTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToKeywordsBottom = () => {
    keywordsBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToCastTop = () => {
    castTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToCastBottom = () => {
    castBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Mock data for insights
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const mockHeatmap: HeatmapItem[] = [];
    days.forEach(day => {
      for (let hour = 0; hour < 24; hour++) {
        mockHeatmap.push({
          day,
          hour,
          value: Math.floor(Math.random() * 10)
        });
      }
    });
    setActivityHeatmap(mockHeatmap);

    setUserLeaderboard([
      { username: 'alex_tg', count: 142 },
      { username: 'sarah_dev', count: 98 },
      { username: 'mike_bot', count: 76 },
      { username: 'julia_q', count: 54 },
      { username: 'ryan_x', count: 32 }
    ]);

    setMediaItems([
      { _id: '1', name: 'Welcome Banner', url: 'https://picsum.photos/seed/welcome/800/400', type: 'image', created_at: new Date().toISOString() },
      { _id: '2', name: 'Price List', url: 'https://picsum.photos/seed/price/800/600', type: 'image', created_at: new Date().toISOString() },
      { _id: '3', name: 'Promo Offer', url: 'https://picsum.photos/seed/promo/800/400', type: 'image', created_at: new Date().toISOString() }
    ]);
  }, []);

  const handleAddMedia = () => {
    if (!newMediaUrl.trim() || !newMediaName.trim()) return;
    const newItem: MediaItem = {
      _id: Date.now().toString(),
      name: newMediaName,
      url: newMediaUrl,
      type: 'image',
      created_at: new Date().toISOString()
    };
    setMediaItems([newItem, ...mediaItems]);
    setNewMediaUrl("");
    setNewMediaName("");
    showNotification('success', 'Media added to library');
  };

  const handleDeleteMedia = (id: string) => {
    setMediaItems(mediaItems.filter(item => item._id !== id));
    showNotification('success', 'Media removed');
  };

  const handleExportConfig = () => {
    const config = {
      keywords,
      settings: stats,
      autoBlockKeywords,
      aiPersona
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `userbot-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showNotification('success', 'Configuration exported');
  };

  const fetchBlockedTopics = React.useCallback(async () => {
    try {
      const response = await fetch('/api/blocked-topics');
      const text = await response.text();
      if (text.includes("Rate exceeded")) return;
      try {
        const data = JSON.parse(text);
        setBlockedTopics(data);
      } catch (e) {
        console.error("Failed to parse blocked topics JSON:", text);
      }
    } catch (err: any) {
      if (err.message !== "Failed to fetch") {
        console.error("Failed to fetch blocked topics:", err);
      }
    }
  }, []);

  const handleBlockTopic = async () => {
    if (!newBlockedTopicLink) return;
    setBlockingTopic(true);
    try {
      const response = await fetch('/api/blocked-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: newBlockedTopicLink }),
      });
      
      const text = await response.text();
      if (text.includes("Rate exceeded")) {
        showNotification('error', 'Rate limit exceeded. Please try again later.');
        return;
      }
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse blocked topics response", e);
        showNotification('error', 'Server error');
        return;
      }
      
      if (response.ok) {
        if (data.action === 'unblocked') {
          showNotification('success', 'Topic unblocked successfully');
        } else {
          showNotification('success', `Topic "${data.name}" blocked successfully`);
        }
        setNewBlockedTopicLink("");
        fetchBlockedTopics();
      } else {
        showNotification('error', data.error || 'Failed to process request');
      }
    } catch (err) {
      showNotification('error', 'Failed to process request');
    } finally {
      setBlockingTopic(false);
    }
  };

  const handleUnblockTopic = async (id: string, name?: string) => {
    if (!confirm(`Are you sure you want to unblock ${name || 'this topic'}?`)) return;
    try {
      const response = await fetch(`/api/blocked-topics/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        showNotification('success', 'Topic unblocked successfully');
        fetchBlockedTopics();
      }
    } catch (err) {
      showNotification('error', 'Failed to unblock topic');
    }
  };

  const showNotification = (type: 'success' | 'error' | 'warn', message: string, duration = 3000) => {
    if (type === 'success') {
      toast.success(message, { duration });
    } else if (type === 'error') {
      toast.error(message, { duration: 6000 });
    } else {
      toast(message, { duration: 6000, icon: '⚠️' });
    }
  };

  // Notification Sound
  const playNotificationSound = (type = notificationSoundType) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const now = audioContext.currentTime;

      switch (type) {
        case 'bell':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(880, now);
          oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.5);
          gainNode.gain.setValueAtTime(0.5, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          oscillator.start(now);
          oscillator.stop(now + 0.5);
          break;
        case 'chime':
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(660, now);
          oscillator.frequency.setValueAtTime(880, now + 0.1);
          oscillator.frequency.setValueAtTime(1100, now + 0.2);
          gainNode.gain.setValueAtTime(0.3, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          oscillator.start(now);
          oscillator.stop(now + 0.4);
          break;
        case 'ping':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(1200, now);
          gainNode.gain.setValueAtTime(0.4, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          oscillator.start(now);
          oscillator.stop(now + 0.2);
          break;
        case 'digital':
          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(400, now);
          oscillator.frequency.setValueAtTime(600, now + 0.05);
          oscillator.frequency.setValueAtTime(400, now + 0.1);
          gainNode.gain.setValueAtTime(0.2, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          oscillator.start(now);
          oscillator.stop(now + 0.2);
          break;
        case 'rising':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(200, now);
          oscillator.frequency.exponentialRampToValueAtTime(1000, now + 0.3);
          gainNode.gain.setValueAtTime(0.4, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          oscillator.start(now);
          oscillator.stop(now + 0.3);
          break;
        case 'double':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(800, now);
          oscillator.frequency.setValueAtTime(800, now + 0.15);
          gainNode.gain.setValueAtTime(0.3, now);
          gainNode.gain.setValueAtTime(0, now + 0.1);
          gainNode.gain.setValueAtTime(0.3, now + 0.15);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          oscillator.start(now);
          oscillator.stop(now + 0.3);
          break;
        case 'low':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(300, now);
          oscillator.frequency.exponentialRampToValueAtTime(150, now + 0.5);
          gainNode.gain.setValueAtTime(0.6, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          oscillator.start(now);
          oscillator.stop(now + 0.5);
          break;
        case 'laser':
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(2000, now);
          oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.2);
          gainNode.gain.setValueAtTime(0.2, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          oscillator.start(now);
          oscillator.stop(now + 0.2);
          break;
        default:
          // Original sound
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(880, now);
          oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.15);
          gainNode.gain.setValueAtTime(0.5, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
          oscillator.start(now);
          oscillator.stop(now + 0.6);
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const subscribeToPush = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Get VAPID public key from server
        const response = await fetch('/api/push/vapid-public-key');
        const text = await response.text();
        
        if (text.includes("Rate exceeded")) {
          console.warn("Push subscription rate limit exceeded");
          return;
        }
        
        let publicKey;
        try {
          const data = JSON.parse(text);
          publicKey = data.publicKey;
        } catch (e) {
          console.error("Failed to parse VAPID public key response", e);
          return;
        }
        
        if (!publicKey) return;

        // Convert base64 public key to Uint8Array
        const padding = '='.repeat((4 - publicKey.length % 4) % 4);
        const base64 = (publicKey + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray
        });

        // Send subscription to server
        const subscriptionJSON = subscription.toJSON();
        console.log('Sending push subscription to server:', subscriptionJSON);
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscriptionJSON)
        });
        
        console.log('Push subscription successful');
      } catch (err) {
        console.error('Push subscription failed:', err);
      }
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        showNotification('success', 'Notifications enabled!');
        playNotificationSound();
        
        // Subscribe to push
        subscribeToPush();
        
        const options = { body: "Test notification successful!", icon: "/logo.svg" };
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(reg => reg.showNotification("Rohit's UserBot Pro", options));
        } else {
          new Notification("Rohit's UserBot Pro", options);
        }
      } else {
        showNotification('error', 'Permission denied');
      }
    }
  };

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    // Register Service Worker for notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        console.log('Service Worker registered', reg);
      }).catch(err => {
        console.error('Service Worker registration failed', err);
      });
    }

    // Request notification permission on mount
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') subscribeToPush();
      });
    } else if ("Notification" in window && Notification.permission === "granted") {
      subscribeToPush();
    }

    // Connect to SSE
    console.log("Connecting to SSE notifications...");
    const eventSource = new EventSource("/api/notifications");
    
    eventSource.onopen = () => {
      console.log("SSE connection established");
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
      // EventSource automatically retries
    };
    
    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        console.log("Received notification event:", parsed);
        if (parsed.type === 'photo_received') {
          const message = parsed.data.message;
          
          // Show in-app notification
          showNotification('success', message);
          
          // Play sound if enabled
          if (notificationSoundEnabled) {
            playNotificationSound();
          }
          
          // Show system notification
          if ("Notification" in window && Notification.permission === "granted") {
            const options = {
              body: message,
              icon: "/logo.svg",
              silent: notificationSoundEnabled,
              requireInteraction: true,
              tag: 'photo-received'
            };

            try {
              // Try Service Worker notification first (required for Android Chrome)
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                  registration.showNotification("Rohit's UserBot Pro", options);
                }).catch(() => {
                  // Fallback to constructor
                  new Notification("Rohit's UserBot Pro", options);
                });
              } else {
                new Notification("Rohit's UserBot Pro", options);
              }
            } catch (e) {
              console.error("Notification creation failed", e);
              // Final fallback attempt
              try {
                if (Notification.permission === "granted") {
                   // Some environments might allow this if the constructor failed
                   navigator.serviceWorker?.ready?.then(reg => reg.showNotification("Rohit's UserBot Pro", options));
                }
              } catch (innerErr) {
                console.error("Final notification fallback failed", innerErr);
              }
            }
          }
        } else if (parsed.type === 'topic_blocked') {
          const message = parsed.data.message;
          showNotification('warn', message);
          if (notificationSoundEnabled) {
            playNotificationSound();
          }
          fetchBlockedTopics();
        }
      } catch (e) {
        console.error("SSE Parse Error", e);
      }
    };

    return () => {
      console.log("Closing SSE connection");
      eventSource.close();
    };
  }, [notificationSoundEnabled, notificationSoundType, fetchBlockedTopics]);

  // Auth State
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [authStep, setAuthStep] = useState<'credentials' | 'phone' | 'code'>('credentials');
  const [authLoading, setAuthLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      const text = await res.text();
      if (text.includes("Rate exceeded")) return;
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      try {
        const data = JSON.parse(text);
        setStats(data);
        setAutoReplyInput(data.autoReply);
        setDelaySecondsInput(data.delaySeconds);
        setApiIdInput(data.apiId);
        setApiHashInput(data.apiHash);
        setPhotoReplyEnabled(data.photoReplyEnabled);
        setPhotoReplyMessage(data.photoReplyMessage);
        setPhotoReplyMessage2Enabled(data.photoReplyMessage2Enabled);
        setPhotoReplyMessage2(data.photoReplyMessage2);
        setPhotoReplyMax(data.photoReplyMax || 2);
        setTopicIcon(data.topicIcon || "🛑");
        setTopicRenameKeywords(data.topicRenameKeywords || "");
        setTopicRenameMatchMode(data.topicRenameMatchMode || "exact");
        setAiModeEnabled(data.aiModeEnabled);
        setAiPersona(data.aiPersona);
        setReplyInGeneral(data.replyInGeneral);
        try {
          const parsedKeys = JSON.parse(data.geminiApiKeys || "[]");
          setGeminiApiKeys(Array.isArray(parsedKeys) ? parsedKeys : []);
        } catch (e) {
          setGeminiApiKeys([]);
        }
        setAutoResetKeywords(data.autoResetKeywords ?? true);
        try {
          const parsed = JSON.parse(data.autoBlockKeywords || "[]");
          setAutoBlockKeywords(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          // Fallback for old comma format
          if (data.autoBlockKeywords) {
            setAutoBlockKeywords(data.autoBlockKeywords.split(",").map((k: string) => ({ keyword: k.trim(), matchMode: 'partial' })).filter((k: any) => k.keyword));
          } else {
            setAutoBlockKeywords([]);
          }
        }
        setNotificationSoundEnabled(data.notificationSoundEnabled);
        setNotificationSoundType(data.notificationSoundType || "default");
        if (!phone) setPhone(data.defaultPhone);
        
        if (data.apiId && data.apiHash && data.apiId !== "0" && data.apiHash !== "") {
          setAuthStep('phone');
        }
      } catch (e) {
        console.error("Failed to parse stats JSON:", text);
      }
    } catch (err: any) {
      if (err.message !== "Failed to fetch") {
        console.error("Failed to fetch stats", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchKeywords = async () => {
    try {
      const res = await fetch("/api/keywords");
      const text = await res.text();
      if (text.includes("Rate exceeded")) return;
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const data = JSON.parse(text);
      setKeywords(data);
    } catch (err: any) {
      if (err.message !== "Failed to fetch") {
        console.error("Failed to fetch keywords", err);
      }
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.message.toLowerCase().includes(logSearch.toLowerCase()) || 
                           (log.details && log.details.toLowerCase().includes(logSearch.toLowerCase()));
      const matchesLevel = logLevelFilter === 'all' || log.level === logLevelFilter;
      const matchesCategory = logCategoryFilter === 'all' || log.category === logCategoryFilter;
      return matchesSearch && matchesLevel && matchesCategory;
    });
  }, [logs, logSearch, logLevelFilter, logCategoryFilter]);

  const logCategories = useMemo(() => {
    const cats = new Set<string>();
    logs.forEach(l => { if (l.category) cats.add(l.category); });
    return Array.from(cats);
  }, [logs]);

  const fetchLogs = async () => {
    setRefreshingLogs(true);
    try {
      const res = await fetch("/api/logs");
      const text = await res.text();
      if (text.includes("Rate exceeded")) return;
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const data = JSON.parse(text);
      setLogs(data);
    } catch (err: any) {
      if (err.message !== "Failed to fetch") {
        console.error("Failed to fetch logs", err);
      }
    } finally {
      // Add a slight delay so the animation is visible even for fast requests
      setTimeout(() => setRefreshingLogs(false), 500);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics");
      const text = await res.text();
      if (text.includes("Rate exceeded")) return;
      if (res.ok) {
        try {
          const data = JSON.parse(text);
          setAnalyticsData(data);
        } catch (e) {
          console.error("Failed to parse analytics JSON:", text);
        }
      }
    } catch (err: any) {
      if (err.message !== "Failed to fetch") {
        console.error("Failed to fetch analytics", err);
      }
    }
  };

  const handleTestPersona = async () => {
    if (!testMessage.trim()) return;
    if (geminiApiKeys.length === 0) {
      showNotification('error', 'Please add a Gemini API Key in settings first.');
      return;
    }
    
    setIsTesting(true);
    setTestReply("");
    try {
      const res = await fetch("/api/test-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: testMessage,
          persona: aiPersona,
          apiKey: geminiApiKeys[0] // Use first key for testing
        }),
      });
      
      const text = await res.text();
      if (text.includes("Rate exceeded")) {
        showNotification('error', 'Rate limit exceeded. Please try again later.');
        return;
      }
      
      const data = text ? JSON.parse(text) : null;
      if (res.ok && data) {
        setTestReply(data.reply);
      } else {
        showNotification('error', data?.error || 'Test failed');
      }
    } catch (err) {
      showNotification('error', 'Connection error');
    } finally {
      setIsTesting(false);
    }
  };

  const clearLogs = async () => {
    if (!isConfirmingClear) {
      setIsConfirmingClear(true);
      return;
    }
    try {
      const res = await fetch("/api/logs", { method: "DELETE" });
      if (res.ok) {
        setLogs([]);
        showNotification('success', 'Logs cleared');
        setIsConfirmingClear(false);
      }
    } catch (err) {
      showNotification('error', 'Failed to clear logs');
      setIsConfirmingClear(false);
    }
  };

  const handleDownloadLogs = async (format: 'json' | 'csv') => {
    try {
      const res = await fetch(`/api/logs/export?format=${format}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      showNotification('error', 'Failed to download logs');
    }
  };

  const fetchMissedCount = async () => {
    try {
      const res = await fetch("/api/missed-count");
      const text = await res.text();
      if (text.includes("Rate exceeded")) return;
      if (!res.ok) return;
      try {
        const data = JSON.parse(text);
        setMissedCount(data.count || 0);
      } catch (e) {
        console.error("Failed to parse missed count JSON:", text);
      }
    } catch (e: any) {
      // Suppress "Failed to fetch" network errors (e.g. during server restart)
      if (e.message !== "Failed to fetch") {
        console.error("Failed to fetch missed count", e);
      }
    }
  };

  const handleCatchUp = async (triggerIds?: string[] | any) => {
    if (isCatchingUp) return;
    setIsCatchingUp(true);
    
    // Ensure triggerIds is an array of strings, or empty (it might be a React event if called from onClick)
    const ids = Array.isArray(triggerIds) ? triggerIds : [];
    
    try {
      const res = await fetch("/api/catchup", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ triggerIds: ids })
      });
      
      const text = await res.text();
      if (text.includes("Rate exceeded")) {
        showNotification('error', 'Rate limit exceeded. Please try again later.');
        return;
      }
      
      const data = text ? JSON.parse(text) : null;
      if (data && data.success) {
        if (data.cancelled) {
          showNotification('warn', `Catch up cancelled. Processed ${data.count} keywords.`);
        } else {
          showNotification('success', `Caught up with ${data.count} missed keywords`);
        }
        setShowScanModal(false);
        fetchMissedCount();
        fetchStats();
      } else {
        showNotification('error', data?.error || 'Catch up failed');
      }
    } catch (e) {
      showNotification('error', 'Failed to catch up');
    } finally {
      setIsCatchingUp(false);
    }
  };

  const handleCancelCatchUp = async () => {
    try {
      await fetch("/api/cancel-catchup", { method: "POST" });
      showNotification('warn', 'Cancelling catch up...');
    } catch (e) {
      console.error("Failed to cancel catch up", e);
    }
  };

  const handleScanMissed = async () => {
    if (isScanningMissed) return;
    setIsScanningMissed(true);
    try {
      const res = await fetch("/api/scan-missed", { method: "POST" });
      const text = await res.text();
      if (text.includes("Rate exceeded")) {
        showNotification('error', 'Rate limit exceeded. Please try again later.');
        return;
      }
      
      const data = text ? JSON.parse(text) : null;
      if (data && data.success) {
        setScannedItems(data.items || []);
        setSelectedScannedItems(new Set((data.items || []).map((i: any) => i._id)));
        setShowScanModal(true);
        fetchMissedCount();
        fetchStats();
        if (data.count > 0) {
          showNotification('success', `Found ${data.count} new missed keywords`);
        } else {
          showNotification('success', 'No new missed keywords found');
        }
      } else {
        showNotification('error', data?.error || 'Scan failed');
      }
    } catch (e) {
      showNotification('error', 'Failed to scan missed topics');
    } finally {
      setIsScanningMissed(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchKeywords();
    fetchLogs();
    fetchBlockedTopics();
    fetchAnalytics();
    fetchMissedCount();

    // Auto-refresh missed count every 30 seconds
    const interval = setInterval(() => {
      fetchMissedCount();
    }, 30000);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    return () => clearInterval(interval);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab]);

  const handleTogglePause = () => {
    setShowPauseConfirmation(true);
  };

  const confirmTogglePause = async () => {
    if (!stats) return;
    const newPausedState = !stats.isSystemPaused;
    setShowPauseConfirmation(false);
    
    // Optimistic update
    setStats({ ...stats, isSystemPaused: newPausedState });
    
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPaused: newPausedState }),
      });
      
      if (res.ok) {
        showNotification('success', newPausedState ? 'System Paused' : 'System Resumed');
        fetchStats();
      } else {
        // Revert on failure
        setStats({ ...stats, isSystemPaused: !newPausedState });
        showNotification('error', 'Failed to update status');
      }
    } catch (err) {
      setStats({ ...stats, isSystemPaused: !newPausedState });
      showNotification('error', 'Connection error');
    }
  };

  const testPush = async () => {
    try {
      const response = await fetch('/api/push/test', { method: 'POST' });
      if (response.ok) {
        showNotification('success', 'Test push sent!');
      } else {
        showNotification('error', 'Failed to send test push.');
      }
    } catch (err) {
      showNotification('error', 'Error sending test push.');
    }
  };

  const handleToggleAutoReset = async () => {
    const newState = !autoResetKeywords;
    setAutoResetKeywords(newState);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoResetKeywords: newState }),
      });
      if (res.ok) {
        showNotification('success', newState ? 'Auto Reset Enabled' : 'Auto Reset Disabled');
        fetchStats();
      } else {
        setAutoResetKeywords(!newState);
        showNotification('error', 'Failed to update setting');
      }
    } catch (err) {
      setAutoResetKeywords(!newState);
      showNotification('error', 'Failed to update setting');
    }
  };

  const handleToggleReplyInGeneral = async () => {
    const newState = !replyInGeneral;
    setReplyInGeneral(newState);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyInGeneral: newState }),
      });
      if (res.ok) {
        showNotification('success', newState ? 'Reply in General Enabled' : 'Reply in General Disabled');
        fetchStats();
      } else {
        setReplyInGeneral(!newState);
        showNotification('error', 'Failed to update setting');
      }
    } catch (err) {
      setReplyInGeneral(!newState);
      showNotification('error', 'Failed to update setting');
    }
  };

  const handleToggleAiMode = async () => {
    const newState = !aiModeEnabled;
    setAiModeEnabled(newState);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiModeEnabled: newState }),
      });
      if (res.ok) {
        showNotification('success', newState ? 'AI Smart Reply Enabled' : 'AI Smart Reply Disabled');
        fetchStats();
      } else {
        setAiModeEnabled(!newState);
        showNotification('error', 'Failed to update setting');
      }
    } catch (err) {
      setAiModeEnabled(!newState);
      showNotification('error', 'Failed to update setting');
    }
  };

  const handleTogglePhotoReply = async () => {
    const newState = !photoReplyEnabled;
    setPhotoReplyEnabled(newState);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoReplyEnabled: newState }),
      });
      if (res.ok) {
        showNotification('success', newState ? 'Photo Reply Enabled' : 'Photo Reply Disabled');
        fetchStats();
      } else {
        setPhotoReplyEnabled(!newState);
        showNotification('error', 'Failed to update setting');
      }
    } catch (err) {
      setPhotoReplyEnabled(!newState);
      showNotification('error', 'Failed to update setting');
    }
  };

  const handleTogglePhotoReplyMessage2 = async () => {
    const newState = !photoReplyMessage2Enabled;
    setPhotoReplyMessage2Enabled(newState);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoReplyMessage2Enabled: newState }),
      });
      if (res.ok) {
        showNotification('success', newState ? 'Second Photo Reply Enabled' : 'Second Photo Reply Disabled');
        fetchStats();
      } else {
        setPhotoReplyMessage2Enabled(!newState);
        showNotification('error', 'Failed to update setting');
      }
    } catch (err) {
      setPhotoReplyMessage2Enabled(!newState);
      showNotification('error', 'Failed to update setting');
    }
  };

  const handleToggleNotificationSound = async () => {
    const newState = !notificationSoundEnabled;
    setNotificationSoundEnabled(newState);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationSoundEnabled: newState }),
      });
      if (res.ok) {
        showNotification('success', newState ? 'Notification Sound Enabled' : 'Notification Sound Disabled');
        fetchStats();
      } else {
        setNotificationSoundEnabled(!newState);
        showNotification('error', 'Failed to update setting');
      }
    } catch (err) {
      setNotificationSoundEnabled(!newState);
      showNotification('error', 'Failed to update setting');
    }
  };

  const handleUpdateNotificationSoundType = async (type: string) => {
    setNotificationSoundType(type);
    playNotificationSound(type);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationSoundType: type }),
      });
      if (res.ok) {
        showNotification('success', `Sound type set to ${type}`);
        fetchStats();
      } else {
        showNotification('error', 'Failed to update sound type');
      }
    } catch (err) {
      showNotification('error', 'Failed to update sound type');
    }
  };

  const handleUpdateAutoBlockKeywords = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoBlockKeywords: JSON.stringify(autoBlockKeywords) }),
      });
      if (res.ok) {
        showNotification('success', 'Auto-block keywords updated');
        fetchStats();
      } else {
        showNotification('error', 'Failed to update keywords');
      }
    } catch (err) {
      showNotification('error', 'Connection error');
    } finally {
      setSaving(false);
    }
  };

  const addAutoBlockKeyword = () => {
    setAutoBlockKeywords([{ keyword: "", matchMode: 'partial' }, ...autoBlockKeywords]);
  };

  const removeAutoBlockKeyword = (index: number) => {
    const newList = [...autoBlockKeywords];
    newList.splice(index, 1);
    setAutoBlockKeywords(newList);
  };

  const updateAutoBlockKeyword = (index: number, field: keyof AutoBlockKeyword, value: string) => {
    const newList = [...autoBlockKeywords];
    newList[index] = { ...newList[index], [field]: value };
    setAutoBlockKeywords(newList);
  };

  const handleUpdateSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          autoReply: autoReplyInput,
          delaySeconds: delaySecondsInput,
          apiId: apiIdInput,
          apiHash: apiHashInput,
          photoReplyEnabled,
          photoReplyMessage,
          photoReplyMessage2Enabled,
          photoReplyMessage2,
          photoReplyMax: Number(photoReplyMax) || 2,
          notificationSoundEnabled,
          notificationSoundType,
          topicIcon,
          topicRenameKeywords,
          topicRenameMatchMode,
          aiModeEnabled,
          aiPersona,
          geminiApiKeys: JSON.stringify(geminiApiKeys)
        }),
      });
      
      const text = await res.text();
      if (text.includes("Rate exceeded")) {
        showNotification('error', 'Rate limit exceeded. Please try again later.');
        return;
      }
      
      const data = text ? JSON.parse(text) : null;
      
      if (res.ok) {
        showNotification('success', 'Settings updated!');
        fetchStats();
      } else {
        showNotification('error', data?.error || `Update failed: ${res.statusText}`);
      }
    } catch (err) {
      console.error(err);
      showNotification('error', 'Connection error: Check console for details');
    } finally {
      setSaving(false);
    }
  };

  const handleAddKeyword = async (data: any) => {
    const validKeywords = data.keywords.filter((k: string) => k.trim().length > 0);
    if (validKeywords.length === 0) {
      showNotification('error', "Please enter at least one keyword");
      return;
    }
    if (!data.reply.trim() && !data.ai_reply_enabled) {
      showNotification('error', "Please enter a reply message or enable AI reply");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: editingKeywordId,
        keyword: validKeywords[0], // Legacy support
        keywords: validKeywords,
        reply: data.reply,
        match_mode: data.match_mode,
        message_links: data.message_links.filter((l: string) => l.trim().length > 0),
        max_replies: parseInt(data.max_replies.toString()) || 0,
        ai_reply_enabled: data.ai_reply_enabled
      };

      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        showNotification('success', editingKeywordId ? 'Rule updated!' : 'Rule created!');
        setEditingKeywordId(null);
        fetchKeywords();
      } else {
        const errData = await res.json();
        showNotification('error', errData?.error || 'Failed to save rule');
      }
    } catch (error) {
      showNotification('error', "Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  const verifyKey = async (key: string) => {
    if (!key) return;
    showNotification('warn', 'Verifying key...');
    try {
      const res = await fetch("/api/verify-gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key }),
      });
      
      const text = await res.text();
      if (text.includes("Rate exceeded")) {
        showNotification('error', 'Rate limit exceeded. Please try again later.');
        return;
      }
      
      const data = text ? JSON.parse(text) : null;
      
      if (data && data.success) {
        showNotification('success', 'API Key is valid and connected!');
      } else {
        showNotification('error', `Invalid Key: ${data.error}`);
      }
    } catch (err) {
      showNotification('error', 'Verification failed: Network error');
    }
  };

  const handleEditKeyword = (kw: Keyword) => {
    setEditingKeywordId(kw._id);
    keywordsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cancelEdit = () => {
    setEditingKeywordId(null);
  };

  const handleDeleteKeyword = (id: string) => {
    setDeleteConfirmationId(id);
  };

  const confirmDeleteKeyword = async () => {
    if (!deleteConfirmationId) return;
    try {
      const res = await fetch(`/api/keywords/${deleteConfirmationId}`, { method: "DELETE" });
      if (res.ok) {
        showNotification('success', 'Keyword deleted');
        fetchKeywords();
      }
    } catch (err) {
      showNotification('error', 'Delete failed');
    } finally {
      setDeleteConfirmationId(null);
    }
  };

  const handleSendCode = async () => {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      
      const text = await res.text();
      if (text.includes("Rate exceeded")) {
        showNotification('error', 'Rate limit exceeded. Please try again later.');
        return;
      }
      
      const data = text ? JSON.parse(text) : null;

      if (res.ok) {
        setAuthStep('code');
        showNotification('success', 'Code sent!');
      } else {
        showNotification('error', data?.error || `Failed to send code: ${res.statusText}`);
      }
    } catch (err) {
      console.error(err);
      showNotification('error', 'Connection error: Check console');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignIn = async () => {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, password }),
      });
      
      const text = await res.text();
      if (text.includes("Rate exceeded")) {
        showNotification('error', 'Rate limit exceeded. Please try again later.');
        return;
      }
      
      const data = text ? JSON.parse(text) : null;

      if (res.ok) {
        showNotification('success', 'Connected!');
        fetchStats();
        setAuthStep('credentials');
        setCode("");
        setPassword("");
      } else {
        showNotification('error', data?.error || `Sign in failed: ${res.statusText}`);
      }
    } catch (err) {
      console.error(err);
      showNotification('error', 'Connection error: Check console');
    } finally {
      setAuthLoading(false);
    }
  };

  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = async () => {
    try {
      const res = await fetch("/api/data/export");
      const text = await res.text();
      if (text.includes("Rate exceeded")) {
        showNotification('error', 'Rate limit exceeded. Please try again later.');
        return;
      }
      if (res.ok) {
        const data = JSON.parse(text);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `userbot_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('success', 'Data exported successfully');
      }
    } catch (err) {
      showNotification('error', 'Export failed');
    }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        const res = await fetch("/api/data/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          showNotification('success', 'Data imported successfully');
          fetchKeywords();
          fetchStats();
        } else {
          showNotification('error', 'Import failed');
        }
      } catch (err) {
        showNotification('error', 'Invalid backup file');
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        localStorage.removeItem("sessionStartTime");
        showNotification('success', 'Logged out');
        fetchStats();
        window.location.reload();
      }
    } catch (err) {
      showNotification('error', 'Logout failed');
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    setBroadcasting(true);
    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: broadcastMessage }),
      });
      if (res.ok) {
        showNotification('success', 'Broadcast sent!');
        setBroadcastMessage("");
      } else {
        showNotification('error', 'Broadcast failed');
      }
    } catch (err) {
      showNotification('error', 'Connection error');
    } finally {
      setBroadcasting(false);
    }
  };

  const SWIPEABLE_TABS = ['dashboard', 'keywords', 'broadcast', 'settings', 'logs'];

  const navigateTab = (newDirection: number) => {
    const currentIndex = SWIPEABLE_TABS.indexOf(activeTab as any);
    if (currentIndex === -1) return; // Do not swipe if currently on a hidden tab

    let newIndex = currentIndex + newDirection;
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= SWIPEABLE_TABS.length) newIndex = SWIPEABLE_TABS.length - 1;
    
    if (newIndex !== currentIndex) {
      setDirection(newDirection);
      setActiveTab(SWIPEABLE_TABS[newIndex] as TabType);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const handleTouchEnd = () => {
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    
    // Only trigger swipe if horizontal movement is greater than vertical movement
    // and the distance is at least 50px
    if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > 50) {
      if (distanceX > 0) navigateTab(1); // Swipe left
      else navigateTab(-1); // Swipe right
    }
  };

  const slideVariants = {
    initial: (direction: number) => ({
      x: direction > 0 ? '20%' : '-20%',
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { 
        type: 'tween', 
        duration: 0.001, 
        ease: 'easeIn'
      }
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-20%' : '20%',
      opacity: 0,
      transition: { 
        type: 'tween', 
        duration: 0.05, 
        ease: 'easeIn'
      }
    })
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`min-h-screen flex flex-col items-center justify-center ${darkMode ? 'bg-black' : 'bg-slate-50'}`}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-20 h-20"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-2xl rotate-3 opacity-40"></div>
          <div className={`relative w-full h-full rounded-2xl overflow-hidden flex items-center justify-center border ${darkMode ? 'bg-neutral-900 border-white/10' : 'bg-white border-black/5'}`}>
            <img src="/logo.svg" alt="Logo" className="w-12 h-12 object-contain" />
          </div>
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-6 text-center"
        >
          <h1 className={`font-black text-3xl tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>ROHIT'S USERBOT</h1>
          <p className="text-emerald-500 font-bold uppercase tracking-widest text-xs mt-1">Management</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-black text-white' : 'bg-slate-50 text-slate-800'} font-sans pb-24 relative overflow-x-hidden`}
    >
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${darkMode ? 'bg-emerald-500' : 'bg-emerald-300'}`} />
        <div className={`absolute top-[20%] -right-[10%] w-[35%] h-[35%] rounded-full blur-[120px] opacity-20 ${darkMode ? 'bg-blue-500' : 'bg-blue-300'}`} />
        <div className={`absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full blur-[120px] opacity-20 ${darkMode ? 'bg-amber-500' : 'bg-amber-300'}`} />
      </div>
      {/* Offline Warning */}
      {!stats?.isUserBotConnected && (
        <div className="bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.2em] py-2 text-center sticky top-0 z-[60] shadow-lg">
          ⚠️ Please login Telegram ID to enable auto-replies
        </div>
      )}

      {/* Header */}
      <header className={`px-6 py-2 flex items-center justify-between fixed top-0 left-0 right-0 z-50 border-b transition-all duration-500 ${darkMode ? 'bg-slate-950 border-white/10' : 'bg-indigo-700 border-white/10 text-white'}`}>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-xl transition-all relative group ${darkMode ? 'text-slate-400 hover:bg-white/5' : 'text-white hover:bg-white/10'}`}
            >
              <div className="relative z-10">
                <Menu size={22} className={isMenuOpen ? 'rotate-90 transition-transform duration-300' : 'transition-transform duration-300'} />
                {isMenuOpen && (
                  <motion.div 
                    layoutId="menu-glow"
                    className="absolute inset-0 bg-blue-500/40 blur-xl rounded-full -z-10"
                  />
                )}
              </div>
              <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            
            <AnimatePresence>
              {isMenuOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMenuOpen(false)}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                  />
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className={`fixed top-0 left-0 bottom-0 w-1/2 min-w-[280px] z-[101] shadow-2xl flex flex-col overflow-hidden ${darkMode ? 'bg-slate-950 border-r border-white/10' : 'bg-white border-r border-slate-200'}`}
                  >
                    <div className={`p-6 border-b flex items-center justify-between ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
                      <div className="flex items-center space-x-3">
                        <div className="relative w-8 h-8">
                          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-lg rotate-3 opacity-40"></div>
                          <div className={`relative w-full h-full rounded-lg overflow-hidden flex items-center justify-center border ${darkMode ? 'bg-neutral-900 border-white/10' : 'bg-white border-black/5'}`}>
                            <img src="/logo.svg" alt="Logo" className="w-5 h-5 object-contain" />
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <h1 className={`font-black text-sm tracking-tight leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>ROHIT'S</h1>
                          <span className="text-[7px] font-black text-emerald-500 tracking-widest uppercase block">UserBot</span>
                          {stats?.loginUser && (
                            <span className={`text-[9px] font-medium mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {stats.loginUser.firstName || ''} {stats.loginUser.lastName || ''} {stats.loginUser.phone ? `(${stats.loginUser.phone})` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => setIsMenuOpen(false)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                        <X size={20} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      <button
                        onClick={() => {
                          setIsNotificationOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all group ${darkMode ? 'text-blue-400 hover:bg-white/5' : 'text-blue-600 hover:bg-black/5'}`}
                      >
                        <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                          <Bell size={20} />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-xs font-black uppercase tracking-widest">Notifications</span>
                          <span className="text-[9px] opacity-50">View recent alerts</span>
                        </div>
                      </button>
                      
                      <div className={`h-px my-2 ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`} />

                      <button
                        onClick={() => {
                          setActiveTab('analytics');
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all ${activeTab === 'analytics' ? (darkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-50 text-cyan-600') : (darkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-black/5')}`}
                      >
                        <PieChart size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Analytics</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('tester');
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all ${activeTab === 'tester' ? (darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-50 text-orange-600') : (darkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-black/5')}`}
                      >
                        <Bot size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">AI Test</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('media');
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all ${activeTab === 'media' ? (darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600') : (darkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-black/5')}`}
                      >
                        <Library size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Media Library</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('insights');
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all ${activeTab === 'insights' ? (darkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-50 text-rose-600') : (darkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-black/5')}`}
                      >
                        <BarChart3 size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Insights</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('user');
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all ${activeTab === 'user' ? (darkMode ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-50 text-pink-600') : (darkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-black/5')}`}
                      >
                        <User size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Profile</span>
                      </button>

                      <div className={`h-px my-2 ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`} />

                      <button
                        onClick={() => {
                          setShowClearDataConfirm(true);
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all ${darkMode ? 'text-rose-400 hover:bg-white/5' : 'text-rose-600 hover:bg-black/5'}`}
                      >
                        <Trash size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Clear All Data</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowDeleteLastKeywordConfirm(true);
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all ${darkMode ? 'text-rose-400 hover:bg-white/5' : 'text-rose-600 hover:bg-black/5'}`}
                      >
                        <Trash2 size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Delete Last Keyword</span>
                      </button>
                    </div>

                    <div className={`p-6 border-t ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Theme</span>
                        <button 
                          onClick={() => setDarkMode(!darkMode)}
                          className={`p-2 rounded-xl transition-all ${darkMode ? 'bg-white/5 text-yellow-400' : 'bg-slate-100 text-slate-600'}`}
                        >
                          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                      </div>
                      <button 
                        onClick={() => setIsMenuOpen(false)}
                        className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        Close Menu
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative w-8 h-8 group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-lg rotate-3 opacity-40 group-hover:rotate-6 transition-transform duration-500"></div>
              <div className={`relative w-full h-full rounded-lg overflow-hidden flex items-center justify-center border transition-colors duration-500 ${darkMode ? 'bg-neutral-900 border-white/10' : 'bg-white border-black/5'}`}>
                <img src="/logo.svg" alt="Logo" className="w-5 h-5 object-contain" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className={`font-black text-lg tracking-tight leading-none transition-colors duration-500 ${darkMode ? 'gradient-text' : 'text-white'}`}>ROHIT'S</h1>
              <span className="text-[8px] font-black text-emerald-500 tracking-widest uppercase block">UserBot</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${stats?.isUserBotConnected ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'}`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-white ${stats?.isUserBotConnected ? 'animate-pulse' : ''}`} />
            <span>{stats?.isUserBotConnected ? 'Connected' : 'Disconnected'}</span>
          </div>

          <button 
            onClick={() => setIsNotificationOpen(true)}
            className={`p-2 rounded-xl transition-all relative group ${darkMode ? 'text-slate-400 hover:bg-white/5' : 'text-white hover:bg-white/10'}`}
          >
            <motion.div
              animate={unreadCount > 0 ? {
                rotate: [0, -15, 15, -15, 15, 0],
                scale: [1, 1.2, 1],
                y: [0, -2, 0]
              } : {}}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5, 
                repeatDelay: 2,
                ease: "easeInOut"
              }}
            >
              <Bell size={22} className={unreadCount > 0 ? 'text-rose-500' : ''} />
            </motion.div>
            {unreadCount > 0 && (
              <motion.span 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-slate-950 shadow-[0_0_15px_rgba(244,63,94,0.8)] group-hover:scale-125 transition-transform"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </button>
        </div>
      </header>

      <NotificationPanel 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)} 
        logs={logs} 
        darkMode={darkMode} 
      />

      {/* Floating Dark Mode Button */}
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className={`fixed bottom-24 right-4 z-50 p-4 rounded-full shadow-xl transition-all ${darkMode ? 'bg-neutral-900 text-yellow-400 hover:bg-neutral-800 border border-neutral-800' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}`}
      >
        {darkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      <main 
        className="p-4 pt-24 max-w-md mx-auto relative z-10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait" custom={direction}>
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 w-full"
            >
              <div className="grid grid-cols-2 gap-4">
                  <motion.div 
                    whileHover={{ y: -8, scale: 1.02 }}
                    initial={{ opacity: 0, y: 30, rotateX: -10 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className={`p-6 rounded-[2.5rem] border transition-all duration-500 card-3d relative overflow-hidden group ${darkMode ? 'bg-emerald-700 border-emerald-600 shadow-lg shadow-emerald-500/50' : 'bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/50'}`}
                  >
                    <div className={`absolute inset-0 pattern-dots opacity-[0.15] pointer-events-none ${darkMode ? 'text-emerald-100' : 'text-emerald-100'}`} />
                    <div className="relative z-10 pointer-events-auto">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 ${darkMode ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-400 text-emerald-50'}`}>
                        <Key size={24} />
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-emerald-100/80' : 'text-emerald-50/80'}`}>Active Keywords</p>
                      {loading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        <h3 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-white'}`}>{stats?.keywordCount || 0}</h3>
                      )}
                    </div>
                  </motion.div>

                  <motion.div 
                    whileHover={{ y: -8, scale: 1.02 }}
                    initial={{ opacity: 0, y: 30, rotateX: -10 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, type: "spring" }}
                    className={`p-6 rounded-[2.5rem] border transition-all duration-500 card-3d relative overflow-hidden group ${darkMode ? 'bg-blue-700 border-blue-600 shadow-lg shadow-blue-500/50' : 'bg-blue-500 border-blue-400 shadow-lg shadow-blue-500/50'}`}
                  >
                    <div className={`absolute inset-0 pattern-grid opacity-[0.15] pointer-events-none ${darkMode ? 'text-blue-100' : 'text-blue-100'}`} />
                    <div className="relative z-10 pointer-events-auto">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 ${darkMode ? 'bg-blue-800 text-blue-100' : 'bg-blue-400 text-blue-50'}`}>
                        <LayoutDashboard size={24} />
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-blue-100/80' : 'text-blue-50/80'}`}>Today / Total Topics</p>
                      {loading ? (
                        <Skeleton className="h-8 w-24" />
                      ) : (
                        <h3 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-white'}`}>
                          {stats?.todayTopicCount || 0} <span className="text-sm font-medium opacity-80 ml-1">/ {stats?.topicCount || 0}</span>
                        </h3>
                      )}
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 30, rotateX: -10 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
                    whileHover={{ y: -8 }}
                    className={`col-span-2 p-8 rounded-[2.5rem] border transition-all duration-500 flex items-center justify-between card-3d relative overflow-hidden group ${darkMode ? 'bg-amber-700 border-amber-600 shadow-lg shadow-amber-500/50' : 'bg-amber-500 border-amber-400 shadow-lg shadow-amber-500/50'}`}
                  >
                    <div className={`absolute inset-0 pattern-lines opacity-[0.15] pointer-events-none ${darkMode ? 'text-amber-100' : 'text-amber-100'}`} />
                    <div className="relative z-10 pointer-events-auto">
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-amber-100/80' : 'text-amber-50/80'}`}>Response Delay</p>
                      <motion.h3 
                        className={`text-6xl font-black tracking-tight text-white`}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        {stats?.delaySeconds || 0}<span className="text-2xl font-medium opacity-80 ml-1 text-white">sec</span>
                      </motion.h3>
                    </div>
                    <div className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-amber-800 text-amber-100' : 'bg-amber-400 text-amber-50'}`}>
                      <RefreshCw size={28} />
                    </div>
                  </motion.div>
                  
                  <motion.div 
                      whileHover={{ y: -8, scale: 1.02 }}
                      initial={{ opacity: 0, y: 30, rotateX: -10 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{ duration: 0.5, type: "spring" }}
                      className="col-span-2 flex flex-col gap-4"
                    >
                      <button
                        onClick={handleCatchUp}
                        disabled={isCatchingUp || stats?.isSystemPaused}
                        className={`w-full p-6 rounded-[2.5rem] border transition-all duration-500 flex items-center justify-between group relative overflow-hidden ${
                          stats?.isSystemPaused 
                            ? (darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed' : 'bg-slate-200 border-slate-300 text-slate-500 cursor-not-allowed')
                            : (darkMode ? 'bg-rose-700 border-rose-600 text-white shadow-lg shadow-rose-500/50 hover:bg-rose-800' : 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/50 hover:bg-rose-600')
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${darkMode ? 'bg-rose-800 text-rose-100' : 'bg-rose-400 text-rose-50'}`}>
                            {isCatchingUp ? <RefreshCw className="animate-spin" size={24} /> : <RotateCcw size={24} />}
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Manual Catch Up</p>
                            <h3 className="text-lg font-black tracking-tight">{missedCount > 0 ? `${missedCount} Missed Keywords` : 'No Missed Keywords'}</h3>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                          stats?.isSystemPaused 
                            ? 'border-slate-700 bg-slate-700/20' 
                            : 'border-rose-400 bg-rose-400/20'
                        }`}>
                          {stats?.isSystemPaused ? 'Unpause to Reply' : 'Reply Now'}
                        </div>
                      </button>

                      <button
                        onClick={handleScanMissed}
                        disabled={isScanningMissed}
                        className={`w-full p-6 rounded-[2.5rem] border transition-all duration-500 flex items-center justify-between group relative overflow-hidden ${
                          darkMode ? 'bg-indigo-700 border-indigo-600 text-white shadow-lg shadow-indigo-500/50 hover:bg-indigo-800' : 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/50 hover:bg-indigo-600'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${darkMode ? 'bg-indigo-800 text-indigo-100' : 'bg-indigo-400 text-indigo-50'}`}>
                            {isScanningMissed ? <RefreshCw className="animate-spin" size={24} /> : <Search size={24} />}
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Scan Missed</p>
                            <h3 className="text-lg font-black tracking-tight">Scan Recent Topics</h3>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-400 bg-indigo-400/20`}>
                          Scan Now
                        </div>
                      </button>
                    </motion.div>
              </div>

              {/* System Pause/Resume Button */}
              <motion.button
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleTogglePause}
                className={`w-full p-8 rounded-[2.5rem] border transition-all duration-500 relative overflow-hidden group ${
                  stats?.isSystemPaused 
                    ? (darkMode ? 'bg-rose-700 border-rose-600 text-white shadow-lg shadow-rose-500/50' : 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/50') 
                    : (darkMode ? 'bg-emerald-700 border-emerald-600 text-white shadow-lg shadow-emerald-500/50' : 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/50')
                }`}
              >
                <div className="flex items-center space-x-4 relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${
                    stats?.isSystemPaused 
                      ? (darkMode ? 'bg-rose-800 border-rose-700 text-rose-100' : 'bg-rose-400 border-rose-300 text-rose-50') 
                      : (darkMode ? 'bg-emerald-800 border-emerald-700 text-emerald-100' : 'bg-emerald-400 border-emerald-300 text-emerald-50')
                  }`}>
                    {stats?.isSystemPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
                  </div>
                  <div className="text-left">
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 opacity-80 text-white`}>Auto Reply System</p>
                    <h3 className="text-xl font-bold tracking-tight text-white">{stats?.isSystemPaused ? 'System Paused' : 'System Active'}</h3>
                  </div>
                </div>
                <div className={`absolute right-8 top-8 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all ${
                  stats?.isSystemPaused 
                    ? (darkMode ? 'bg-rose-800 border-rose-700 text-rose-100' : 'bg-rose-400 border-rose-300 text-rose-50') 
                    : (darkMode ? 'bg-emerald-800 border-emerald-700 text-emerald-100' : 'bg-emerald-400 border-emerald-300 text-emerald-50')
                }`}>
                  {stats?.isSystemPaused ? 'Resume' : 'Pause'}
                </div>
              </motion.button>

              <motion.div 
                whileHover={{ y: -4, scale: 1.01 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className={`p-6 rounded-[2rem] border transition-all duration-500 relative overflow-hidden group ${darkMode ? 'bg-indigo-950/40 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200 shadow-xl shadow-indigo-500/10'}`}
              >
                <div className={`absolute inset-0 pattern-dots opacity-[0.05] pointer-events-none ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <div className="relative z-10 pointer-events-auto">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-500/10 text-indigo-600'}`}>
                      <MessageSquare size={14} />
                    </div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-indigo-300/60' : 'text-indigo-600/60'}`}>Current Auto Reply</p>
                  </div>
                  <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-black/20 border-indigo-500/20' : 'bg-white/60 border-indigo-100'}`}>
                    <p className={`text-sm font-medium leading-relaxed italic ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      "{stats?.autoReply || 'No message set'}"
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 w-full pb-20"
            >
              {/* General Settings Card */}
              <div className={`p-6 rounded-[2rem] border transition-all duration-500 ${darkMode ? 'bg-neutral-900/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`p-2 rounded-xl ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                    <Bot size={18} />
                  </div>
                  <h3 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>General Bot Settings</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Welcome Message</label>
                    <textarea
                      value={autoReplyInput}
                      onChange={(e) => setAutoReplyInput(e.target.value)}
                      placeholder="Message sent to new users..."
                      rows={3}
                      className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all ${darkMode ? 'bg-neutral-950 border-white/5 text-white placeholder-white/10' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400'}`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Reply Delay (Seconds)</label>
                    <input
                      type="number"
                      value={delaySecondsInput}
                      onChange={(e) => setDelaySecondsInput(parseInt(e.target.value) || 0)}
                      className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all ${darkMode ? 'bg-neutral-950 border-white/5 text-white placeholder-white/10' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400'}`}
                    />
                  </div>
                </div>
              </div>

              {/* AI Integration Card */}
              <div className={`p-6 rounded-[2rem] border transition-all duration-500 ${darkMode ? 'bg-neutral-900/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl ${darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                      <Zap size={18} />
                    </div>
                    <h3 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>AI Smart Reply</h3>
                  </div>
                  <button 
                    onClick={handleToggleAiMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${aiModeEnabled ? 'bg-purple-500' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${aiModeEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <AnimatePresence>
                  {aiModeEnabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-6 overflow-hidden"
                    >
                      <div className="space-y-3">
                        <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Gemini API Keys (Rotation)</label>
                        <div className="space-y-2">
                          {geminiApiKeys.map((key, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={key}
                                onChange={(e) => {
                                  const newKeys = [...geminiApiKeys];
                                  newKeys[index] = e.target.value;
                                  setGeminiApiKeys(newKeys);
                                }}
                                placeholder="AIzaSy..."
                                className={`flex-1 p-3 border rounded-xl outline-none text-sm ${darkMode ? 'bg-neutral-950 border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                              />
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => verifyKey(key)}
                                  disabled={!key}
                                  className={`p-3 rounded-xl transition-all ${!key ? 'opacity-30' : (darkMode ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100')}`}
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    const newKeys = [...geminiApiKeys];
                                    newKeys.splice(index, 1);
                                    setGeminiApiKeys(newKeys);
                                  }}
                                  className={`p-3 rounded-xl transition-all ${darkMode ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => setGeminiApiKeys([...geminiApiKeys, ""])}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
                          >
                            <Plus size={14} />
                            <span>Add New Key</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-neutral-800">
                        <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>AI Persona / System Prompt</label>
                        <textarea
                          value={aiPersona}
                          onChange={(e) => setAiPersona(e.target.value)}
                          placeholder="You are a smart assistant..."
                          rows={5}
                          className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm transition-all ${darkMode ? 'bg-neutral-950 border-white/5 text-white placeholder-white/10' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400'}`}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Photo Reply Card */}
              <div className={`p-6 rounded-[2rem] border transition-all duration-500 ${darkMode ? 'bg-neutral-900/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl ${darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                      <ImageIcon size={18} />
                    </div>
                    <h3 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Photo Automation</h3>
                  </div>
                  <button 
                    onClick={handleTogglePhotoReply}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${photoReplyEnabled ? 'bg-amber-500' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${photoReplyEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <AnimatePresence>
                  {photoReplyEnabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-6 overflow-hidden"
                    >
                      <div className="space-y-2">
                        <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Primary Reply Message</label>
                        <textarea
                          value={photoReplyMessage}
                          onChange={(e) => setPhotoReplyMessage(e.target.value)}
                          placeholder="Reply to photos..."
                          rows={2}
                          className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm transition-all ${darkMode ? 'bg-neutral-950 border-white/5 text-white placeholder-white/10' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400'}`}
                        />
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-neutral-800">
                        <div className="flex items-center justify-between">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Second Reply Message</label>
                          <button 
                            onClick={handleTogglePhotoReplyMessage2}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${photoReplyMessage2Enabled ? 'bg-amber-500' : 'bg-slate-300'}`}
                          >
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${photoReplyMessage2Enabled ? 'translate-x-4' : 'translate-x-1'}`} />
                          </button>
                        </div>
                        <AnimatePresence>
                          {photoReplyMessage2Enabled && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <textarea
                                value={photoReplyMessage2}
                                onChange={(e) => setPhotoReplyMessage2(e.target.value)}
                                placeholder="Follow-up message..."
                                rows={2}
                                className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm transition-all ${darkMode ? 'bg-neutral-950 border-white/5 text-white placeholder-white/10' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400'}`}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-neutral-800">
                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Topic Icon</label>
                          <input
                            type="text"
                            value={topicIcon}
                            onChange={(e) => setTopicIcon(e.target.value)}
                            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm transition-all ${darkMode ? 'bg-neutral-950 border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Max Replies</label>
                          <input
                            type="number"
                            value={photoReplyMax}
                            onChange={(e) => setPhotoReplyMax(e.target.value === '' ? '' : parseInt(e.target.value) || 1)}
                            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm transition-all ${darkMode ? 'bg-neutral-950 border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Notifications Card */}
              <div className={`p-6 rounded-[2rem] border transition-all duration-500 ${darkMode ? 'bg-neutral-900/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                      <Bell size={18} />
                    </div>
                    <h3 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Notification Settings</h3>
                  </div>
                  <button 
                    onClick={handleToggleNotificationSound}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notificationSoundEnabled ? 'bg-blue-500' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSoundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <AnimatePresence>
                  {notificationSoundEnabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-6 overflow-hidden"
                    >
                      <div className="grid grid-cols-3 gap-2">
                        {['default', 'bell', 'chime', 'ping', 'digital', 'rising', 'double', 'low', 'laser'].map((type) => (
                          <button
                            key={type}
                            onClick={() => handleUpdateNotificationSoundType(type)}
                            className={`py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                              notificationSoundType === type 
                                ? (darkMode ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600') 
                                : (darkMode ? 'bg-neutral-950 border-white/5 text-slate-500 hover:text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-600 shadow-sm')
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={requestNotificationPermission}
                        className={`w-full flex items-center justify-center space-x-2 py-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${darkMode ? 'bg-neutral-950 border-white/5 text-slate-400 hover:bg-neutral-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
                      >
                        <Bell size={14} />
                        <span>Test Push Notification</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Data & Backup Card */}
              <div className={`p-6 rounded-[2rem] border transition-all duration-500 ${darkMode ? 'bg-neutral-900/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`p-2 rounded-xl ${darkMode ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
                    <Database size={18} />
                  </div>
                  <h3 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Data & Backup</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handleExportData}
                    className={`flex flex-col items-center justify-center space-y-2 p-6 rounded-[1.5rem] border transition-all ${darkMode ? 'bg-neutral-950 border-white/5 text-slate-300 hover:bg-neutral-900' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white shadow-sm'}`}
                  >
                    <Download size={20} className="text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Export Data</span>
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                    className={`flex flex-col items-center justify-center space-y-2 p-6 rounded-[1.5rem] border transition-all ${darkMode ? 'bg-neutral-950 border-white/5 text-slate-300 hover:bg-neutral-900' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white shadow-sm'}`}
                  >
                    <Upload size={20} className="text-purple-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{importing ? 'Importing...' : 'Import Data'}</span>
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleImportData} accept=".json" className="hidden" />
                </div>
              </div>

              {/* Save Button */}
              <div className="fixed bottom-24 left-4 right-4 z-40">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpdateSettings}
                  disabled={saving}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-2xl flex items-center justify-center space-x-3 ${darkMode ? 'bg-emerald-600 text-white shadow-emerald-900/40' : 'bg-emerald-500 text-white shadow-emerald-500/30'}`}
                >
                  {saving ? (
                    <RefreshCw className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  <span>{saving ? 'Saving Changes...' : 'Save All Settings'}</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeTab === 'keywords' && (
            <motion.div
              key="keywords"
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 w-full"
            >
              {keywords.length > 0 && (
                <div className="space-y-2">
                  <motion.div 
                    initial={false}
                    animate={{ 
                      scale: isSearchFocused ? 1.02 : 1,
                      boxShadow: isSearchFocused ? (darkMode ? "0 0 20px rgba(59, 130, 246, 0.2)" : "0 10px 25px -5px rgba(59, 130, 246, 0.1)") : "none"
                    }}
                    className="relative group"
                  >
                    <div className="relative h-14">
                      <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${isSearchFocused ? 'text-blue-500' : (darkMode ? 'text-slate-500' : 'text-slate-400')}`}>
                        <Search size={18} className={`${isSearchFocused ? 'scale-110' : 'scale-100'} transition-transform duration-300`} />
                      </div>
                      <input
                        type="text"
                        value={keywordSearch}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        onChange={(e) => setKeywordSearch(e.target.value)}
                        placeholder="Search keywords or replies..."
                        className={`w-full h-full pl-11 pr-12 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all duration-300 ${darkMode ? 'bg-neutral-900/50 border-white/10 text-white placeholder-white/20' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'}`}
                      />
                      <AnimatePresence>
                        {keywordSearch && (
                          <motion.button 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => setKeywordSearch("")}
                            className={`absolute inset-y-0 right-0 pr-4 flex items-center ${darkMode ? 'text-slate-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'}`}
                          >
                            <X size={18} className="hover:rotate-90 transition-transform duration-300" />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Add/Edit Rule Form - Hidden when searching to bring results closer */}
              <button
                onClick={() => setIsAddingNewRule(!isAddingNewRule)}
                className={`w-full p-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all ${
                  darkMode 
                    ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' 
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                {isAddingNewRule || editingKeywordId ? 'Hide Form' : 'Create New Rule'}
              </button>
              <AnimatePresence>
                {(isAddingNewRule || editingKeywordId) && !keywordSearch && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <AddKeywordSection 
                      editingKeyword={editingKeywordId ? keywords.find(k => k._id === editingKeywordId) : null}
                      onSave={(data: any) => {
                        handleAddKeyword(data);
                        setIsAddingNewRule(false);
                      }}
                      onCancel={() => {
                        cancelEdit();
                        setIsAddingNewRule(false);
                      }}
                      darkMode={darkMode}
                      keywordsTopRef={keywordsTopRef}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {keywords.length > 0 && (
                <div className="space-y-4">

                  <div className="space-y-3">
                    {keywords.filter(kw => {
                      const searchLower = deferredKeywordSearch.toLowerCase();
                      const kws = (kw.keywords && kw.keywords.length > 0 ? kw.keywords : [kw.keyword]);
                      const matchesKeyword = kws.some(k => k?.toLowerCase().includes(searchLower));
                      const matchesReply = kw.reply?.toLowerCase().includes(searchLower);
                      return matchesKeyword || matchesReply;
                    }).map((kw, index) => {
                      const colorName = ['emerald', 'blue', 'rose', 'amber', 'purple', 'indigo'][index % 6];
                      
                      const editButtonClasses = [
                        { dark: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30', light: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
                        { dark: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30', light: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
                        { dark: 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30', light: 'bg-rose-50 text-rose-600 hover:bg-rose-100' },
                        { dark: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30', light: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
                        { dark: 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30', light: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
                        { dark: 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30', light: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' },
                      ][index % 6];

                      return (
                      <motion.div 
                      layout
                      key={kw._id}
                      whileHover={{ scale: 1.01, y: -2 }}
                      className={`p-6 rounded-[2rem] border transition-all duration-500 flex items-start justify-between relative overflow-hidden ${
                        darkMode 
                          ? `bg-neutral-900/40 border-white/5 hover:border-${colorName}-500/30` 
                          : `bg-white border-slate-100 shadow-sm hover:shadow-xl hover:border-${colorName}-200`
                      }`}
                    >
                      <div className={`absolute inset-0 pattern-dots opacity-[0.03] text-${colorName}-500`} />
                      <div className="relative z-10 flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                            #{index + 1}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {(kw.keywords && kw.keywords.length > 0 ? kw.keywords : [kw.keyword]).map((k, i) => (
                              <span key={i} className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${darkMode ? `bg-${colorName}-500/10 text-${colorName}-400` : `bg-${colorName}-500/5 text-${colorName}-600`}`}>
                                {k}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-2 overflow-hidden mt-3">
                          <p className={`text-sm font-medium leading-relaxed ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            {kw.reply || <span className="italic opacity-40">No reply message</span>}
                          </p>
                          
                          <div className="flex items-center gap-3 pt-2">
                            <div className="flex items-center space-x-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                              <RefreshCw size={10} />
                              <span>Max: {kw.max_replies === 0 ? '∞' : kw.max_replies || 0}</span>
                            </div>
                            <div className={`flex items-center space-x-1 text-[10px] font-bold uppercase tracking-widest ${kw.match_mode === 'partial' ? 'text-orange-400' : 'text-blue-400'}`}>
                              <Hash size={10} />
                              <span>{kw.match_mode || 'exact'}</span>
                            </div>
                            {((kw.message_links && kw.message_links.length > 0) || kw.message_link) && (
                              <div className="flex items-center space-x-1 text-[10px] font-bold uppercase tracking-widest text-pink-400">
                                <FileText size={10} />
                                <span>{kw.message_links?.length || 1} Forward</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-4 relative z-10">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditKeyword(kw); }}
                          className={`p-2.5 rounded-xl transition-all ${darkMode ? editButtonClasses.dark : editButtonClasses.light}`}
                        >
                          <Settings size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteKeyword(kw._id); }}
                          className={`p-2.5 rounded-xl transition-all ${darkMode ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                    );
                  })}

                  {keywords.filter(kw => {
                    const searchLower = keywordSearch.toLowerCase();
                    const kws = (kw.keywords && kw.keywords.length > 0 ? kw.keywords : [kw.keyword]);
                    const matchesKeyword = kws.some(k => k?.toLowerCase().includes(searchLower));
                    const matchesReply = kw.reply?.toLowerCase().includes(searchLower);
                    return matchesKeyword || matchesReply;
                  }).length === 0 && keywordSearch && (
                    <div className={`text-center py-12 rounded-[2rem] border border-dashed ${darkMode ? 'border-white/10 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                      <Search size={32} className="mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">No keywords found matching "{keywordSearch}"</p>
                    </div>
                  )}
                </div>
                <div ref={keywordsBottomRef} />
              </div>
              )}

              {keywords.length > 5 && (
                <div className={`fixed bottom-24 left-4 flex flex-col rounded-full shadow-xl border overflow-hidden z-40 ${darkMode ? 'bg-neutral-900 border-white/10' : 'bg-white border-slate-200'}`}>
                  <motion.button
                    whileHover={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={scrollToKeywordsTop}
                    className={`p-3 transition-all ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
                  >
                    <ArrowUp size={20} />
                  </motion.button>
                  <div className={`h-px w-full ${darkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
                  <motion.button
                    whileHover={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={scrollToKeywordsBottom}
                    className={`p-3 transition-all ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
                  >
                    <ArrowDown size={20} />
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'broadcast' && (
            <motion.div
              key="broadcast"
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 w-full"
            >
              <div ref={castTopRef} />
              <div className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-purple relative overflow-hidden group ${darkMode ? 'bg-purple-950/40 border-purple-500/30' : 'bg-purple-50 border-purple-200 shadow-xl shadow-purple-500/10'}`}>
                <div className={`absolute inset-0 pattern-lines opacity-[0.05] pointer-events-none ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <div className="relative z-10 space-y-3 pointer-events-auto">
                  <div className="flex items-center justify-between ml-1">
                    <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Broadcast Message</label>
                    <span className={`text-[10px] font-bold ${broadcastMessage.length > 500 ? 'text-rose-500' : darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      {broadcastMessage.length} / 500
                    </span>
                  </div>
                  <textarea
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Type your announcement here..."
                    className={`w-full h-32 p-5 border rounded-3xl focus:ring-4 focus:ring-purple-500/20 outline-none text-sm transition-all ${darkMode ? 'bg-purple-950/20 border-purple-500/20 text-white placeholder-white/20' : 'bg-white border-purple-100 text-slate-900 placeholder-slate-400 shadow-inner'}`}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBroadcast}
                  disabled={broadcasting || !broadcastMessage.trim() || broadcastMessage.length > 500}
                  className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest text-sm transition-all disabled:opacity-50 flex items-center justify-center space-x-3 shadow-xl ${darkMode ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500' : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-purple-500/20'}`}
                >
                  <Send size={18} />
                  <span>{broadcasting ? 'Sending...' : 'Broadcast Now'}</span>
                </motion.button>
              </div>

              <div className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-amber relative overflow-hidden group ${darkMode ? 'bg-amber-950/40 border-amber-500/30' : 'bg-amber-50 border-amber-200 shadow-xl shadow-amber-500/10'}`}>
                <div className={`absolute inset-0 pattern-grid opacity-[0.05] pointer-events-none ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                <div className="relative z-10 space-y-6 pointer-events-auto">
                  
                  <div className="grid gap-4">
                    <div className={`flex items-center justify-between p-6 rounded-3xl border transition-all duration-300 ${darkMode ? 'bg-neutral-900/40 border-white/5 hover:bg-neutral-900/60' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
                      <div className="space-y-1 pr-4">
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Reply in General</p>
                        <p className={`text-[10px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Redirect bot replies to the general section instead of specific topics.</p>
                      </div>
                      <button
                        onClick={handleToggleReplyInGeneral}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none shadow-inner ${replyInGeneral ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${replyInGeneral ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                    
                    <div className={`h-px w-full ${darkMode ? 'bg-white/5' : 'bg-slate-200/50'}`} />

                    <div className={`flex items-center justify-between p-6 rounded-3xl border transition-all duration-300 ${darkMode ? 'bg-neutral-900/40 border-white/5 hover:bg-neutral-900/60' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
                      <div className="space-y-1 pr-4">
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Push Notifications</p>
                        <p className={`text-[10px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {Notification.permission === 'granted' ? 'Real-time alerts for photo triggers are active.' : 'Enable browser notifications for instant alerts.'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {Notification.permission === 'granted' && (
                          <button
                            onClick={testPush}
                            className={`p-2.5 rounded-xl transition-all ${darkMode ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                            title="Send Test Push"
                          >
                            <Send size={16} />
                          </button>
                        )}
                        <button
                          onClick={requestNotificationPermission}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none shadow-inner ${Notification.permission === 'granted' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${Notification.permission === 'granted' ? 'translate-x-6' : 'translate-x-1'}`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className={`h-px w-full ${darkMode ? 'bg-white/5' : 'bg-slate-200/50'}`} />

                    <div className={`flex items-center justify-between p-5 rounded-3xl border transition-all duration-300 ${darkMode ? 'bg-neutral-900/40 border-white/5 hover:bg-neutral-900/60' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
                      <div className="space-y-1 pr-4">
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Auto Reset Keywords</p>
                        <p className={`text-[10px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Automatically reset all keyword reply limits daily at 12:00 AM IST.</p>
                      </div>
                      <button
                        onClick={handleToggleAutoReset}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${autoResetKeywords ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoResetKeywords ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowResetKeywordsConfirm(true)}
                      className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center space-x-3 border-2 ${darkMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' : 'bg-white border-amber-200 text-amber-600 hover:bg-amber-50 shadow-lg shadow-amber-500/10'}`}
                    >
                      <RotateCcw size={16} />
                      <span>Reset All Keywords Now</span>
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-rose relative overflow-hidden group ${darkMode ? 'bg-rose-950/40 border-rose-500/30' : 'bg-rose-50 border-rose-200 shadow-xl shadow-rose-500/10'}`}>
                <div className={`absolute inset-0 pattern-dots opacity-[0.05] pointer-events-none ${darkMode ? 'text-rose-400' : 'text-rose-600'}`} />
                <div className="relative z-10 space-y-4 pointer-events-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Auto-Block Keywords</label>
                      <ShieldAlert size={16} className="text-rose-500" />
                    </div>
                    <button
                      onClick={() => setAutoBlockKeywordsExpanded(!autoBlockKeywordsExpanded)}
                      className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-black/5 text-slate-500'}`}
                    >
                      {autoBlockKeywordsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={addAutoBlockKeyword}
                          className={`py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center space-x-2 shadow-lg ${darkMode ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/20'}`}
                        >
                          <Plus size={14} />
                          <span>Add Keyword</span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleUpdateAutoBlockKeywords}
                          disabled={saving}
                          className={`py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg ${saving ? 'opacity-50 cursor-not-allowed bg-slate-400' : 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20'}`}
                        >
                          {saving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                          <span>Save Rules</span>
                        </motion.button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {autoBlockKeywordsExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-4 overflow-hidden"
                        >
                          <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>If these keywords are found in a topic, the bot will automatically block it.</p>
                          
                          <div className="space-y-3">
                            {autoBlockKeywords.map((item, index) => (
                              <div key={index} className={`p-4 rounded-2xl border space-y-3 ${darkMode ? 'bg-neutral-900/50 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                                <div className="flex items-center space-x-2 w-full">
                                  <input
                                    type="text"
                                    value={item.keyword}
                                    onChange={(e) => updateAutoBlockKeyword(index, 'keyword', e.target.value)}
                                    placeholder="Keyword..."
                                    className={`flex-1 min-w-0 p-2 border rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm transition-all ${darkMode ? 'bg-rose-500/5 border-rose-500/20 text-white placeholder-white/20' : 'bg-rose-50 border-rose-200 text-slate-900 placeholder-slate-400'}`}
                                  />
                                  <button
                                    onClick={() => removeAutoBlockKeyword(index)}
                                    className={`flex-shrink-0 p-2.5 rounded-xl transition-all ${darkMode ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'}`}
                                    title="Delete Keyword"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Match:</span>
                                  <div className="flex bg-slate-100 dark:bg-neutral-900 rounded-lg p-1">
                                    <button
                                      onClick={() => updateAutoBlockKeyword(index, 'matchMode', 'exact')}
                                      className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${item.matchMode === 'exact' ? (darkMode ? 'bg-rose-500 text-white' : 'bg-white shadow-sm text-slate-900') : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}
                                    >
                                      Exact
                                    </button>
                                    <button
                                      onClick={() => updateAutoBlockKeyword(index, 'matchMode', 'partial')}
                                      className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${item.matchMode === 'partial' ? (darkMode ? 'bg-rose-500 text-white' : 'bg-white shadow-sm text-slate-900') : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}
                                    >
                                      Partial
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-rose relative overflow-hidden group ${darkMode ? 'bg-rose-950/40 border-rose-500/30' : 'bg-rose-50 border-rose-200 shadow-xl shadow-rose-500/10'}`}>
                <div className={`absolute inset-0 pattern-dots opacity-[0.05] pointer-events-none ${darkMode ? 'text-rose-400' : 'text-rose-600'}`} />
                <div className="relative z-10 space-y-4 pointer-events-auto">
                  <div className="flex items-center justify-between">
                    <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Block Topics (No Auto-Reply)</label>
                    <ShieldAlert size={16} className="text-rose-500" />
                  </div>
                  
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        <Link size={14} />
                      </div>
                      <input
                        type="text"
                        value={newBlockedTopicLink}
                        onChange={(e) => setNewBlockedTopicLink(e.target.value)}
                        placeholder="Paste topic link here..."
                        className={`w-full pl-9 p-3 border rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm transition-all ${darkMode ? 'bg-rose-500/5 border-rose-500/20 text-white placeholder-white/20' : 'bg-rose-50 border-rose-200 text-slate-900 placeholder-slate-400'}`}
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBlockTopic}
                      disabled={blockingTopic || !newBlockedTopicLink.trim()}
                      className={`px-6 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center space-x-2 ${blockingTopic || !newBlockedTopicLink.trim() ? 'opacity-50 cursor-not-allowed bg-slate-400' : 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20'}`}
                    >
                      {blockingTopic ? <RefreshCw size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
                      <span>{blockedTopics.some(t => t.link === newBlockedTopicLink) ? 'Unblock' : 'Block'}</span>
                    </motion.button>
                  </div>

                  {blockedTopics.length > 0 && (
                    <div className="space-y-4 pt-2">
                      <div className="relative">
                        <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          <Search size={14} />
                        </div>
                        <input
                          type="text"
                          value={blockedTopicSearch}
                          onChange={(e) => setBlockedTopicSearch(e.target.value)}
                          placeholder="Search blocked topics..."
                          className={`w-full pl-9 p-2 border rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-[10px] transition-all ${darkMode ? 'bg-neutral-900/50 border-white/10 text-white placeholder-white/20' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Blocked Topics List</label>
                        <div className="grid gap-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                          {blockedTopics.filter(t => 
                            t.name?.toLowerCase().includes(blockedTopicSearch.toLowerCase()) || 
                            t.telegram_topic_id.toString().includes(blockedTopicSearch) ||
                            t.link?.toLowerCase().includes(blockedTopicSearch.toLowerCase())
                          ).map((topic) => (
                            <div key={topic._id} className={`flex items-center justify-between p-3 rounded-xl border ${darkMode ? 'bg-neutral-900/50 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                              <div className="flex items-center space-x-3 min-w-0">
                                <div className={`p-2 rounded-lg ${darkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-500'}`}>
                                  <ShieldAlert size={14} />
                                </div>
                                <div className="min-w-0">
                                  <p className={`text-xs font-bold truncate ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{topic.name && topic.name !== "Unknown Topic" ? topic.name : `Topic ID: ${topic.telegram_topic_id}`}</p>
                                  <p className={`text-[10px] truncate opacity-50 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{topic.link}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleUnblockTopic(topic._id, topic.name)}
                                className={`p-2 rounded-lg transition-all ${darkMode ? 'hover:bg-emerald-500/10 text-slate-500 hover:text-emerald-400' : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'}`}
                                title="Unblock Topic"
                              >
                                <ShieldCheck size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div ref={castBottomRef} />

              <div className={`fixed bottom-24 left-4 flex flex-col rounded-full shadow-xl border overflow-hidden z-40 ${darkMode ? 'bg-neutral-900 border-white/10' : 'bg-white border-slate-200'}`}>
                <motion.button
                  whileHover={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={scrollToCastTop}
                  className={`p-3 transition-all ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}
                >
                  <ArrowUp size={20} />
                </motion.button>
                <div className={`h-px w-full ${darkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
                <motion.button
                  whileHover={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={scrollToCastBottom}
                  className={`p-3 transition-all ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}
                >
                  <ArrowDown size={20} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeTab === 'user' && (
            <motion.div
              key="user"
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 w-full"
            >
              <div className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-pink relative overflow-hidden group ${darkMode ? 'bg-pink-950/40 border-pink-500/30' : 'bg-pink-50 border-pink-200 shadow-xl shadow-pink-500/10'}`}>
                <div className={`absolute inset-0 pattern-lines opacity-[0.05] pointer-events-none ${darkMode ? 'text-pink-400' : 'text-pink-600'}`} />
                <div className="relative z-10 pointer-events-auto">
                  {stats?.isUserBotConnected ? (
                    <div className="text-center py-8 space-y-6">
                    <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto border transition-all ${darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600'}`}>
                      <CheckCircle2 size={48} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold tracking-tight mb-2 transition-colors duration-500 ${darkMode ? 'text-white' : 'text-slate-900'}`}>System Connected</h3>
                      <p className={`text-sm max-w-[200px] mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Your Telegram session is active and ready for auto-replies.</p>
                    </div>
                    
                    <div className="pt-4 flex flex-col space-y-3">
                      <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Session Running:
                        <motion.div 
                          className="flex items-center space-x-3 mt-2"
                          animate={{ opacity: [0.8, 1, 0.8] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <motion.div 
                            key={timer.days}
                            initial={{ scale: 0.8, color: "#10b981" }}
                            animate={{ scale: 1, color: "#059669" }}
                            className="font-black text-4xl text-emerald-500"
                          >
                            {timer.days}d
                          </motion.div>
                          <motion.span 
                            className="text-2xl font-mono font-bold text-slate-700 dark:text-slate-300"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                          >
                            {timer.time}
                          </motion.span>
                        </motion.div>
                      </div>
                      <button 
                        onClick={fetchStats}
                        className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest hover:underline"
                      >
                        Refresh Status
                      </button>
                      <button 
                        onClick={() => setShowLogoutConfirm(true)}
                        className={`text-[9px] font-bold uppercase tracking-widest transition-colors pt-4 opacity-40 hover:opacity-100 ${darkMode ? 'text-slate-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'}`}
                      >
                        Logout Session
                      </button>
                    </div>
                    
                    {deferredPrompt && (
                      <div className={`pt-8 border-t transition-colors duration-500 ${darkMode ? 'border-neutral-800' : 'border-slate-100'}`}>
                        <button
                          onClick={handleInstallApp}
                          className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center space-x-2 border ${darkMode ? 'bg-neutral-950 border-neutral-800 text-slate-300 hover:bg-neutral-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                        >
                          <Smartphone size={16} />
                          <span>Install Application</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {authStep === 'credentials' && (
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>API ID</label>
                          <input
                            type="text"
                            value={apiIdInput}
                            onChange={(e) => setApiIdInput(e.target.value)}
                            placeholder="Enter API ID"
                            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm transition-all ${darkMode ? 'bg-pink-500/5 border-pink-500/20 text-white placeholder-white/20' : 'bg-pink-50 border-pink-200 text-slate-900 placeholder-slate-400'}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>API Hash</label>
                          <input
                            type="text"
                            value={apiHashInput}
                            onChange={(e) => setApiHashInput(e.target.value)}
                            placeholder="Enter API Hash"
                            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm transition-all ${darkMode ? 'bg-pink-500/5 border-pink-500/20 text-white placeholder-white/20' : 'bg-pink-50 border-pink-200 text-slate-900 placeholder-slate-400'}`}
                          />
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => { handleUpdateSettings(); setAuthStep('phone'); }}
                          className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${darkMode ? 'bg-pink-600 text-white shadow-pink-900/20 hover:bg-pink-500' : 'bg-pink-500 text-white shadow-pink-500/20 hover:bg-pink-600'}`}
                        >
                          Continue
                        </motion.button>
                      </div>
                    )}

                    {authStep === 'phone' && (
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Phone Number</label>
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 234 567 8900"
                            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm transition-all ${darkMode ? 'bg-pink-500/5 border-pink-500/20 text-white placeholder-white/20' : 'bg-pink-50 border-pink-200 text-slate-900 placeholder-slate-400'}`}
                          />
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleSendCode}
                          disabled={authLoading}
                          className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center space-x-2 shadow-lg ${darkMode ? 'bg-pink-600 text-white shadow-pink-900/20 hover:bg-pink-500' : 'bg-pink-500 text-white shadow-pink-500/20 hover:bg-pink-600'}`}
                        >
                          {authLoading ? <RefreshCw className="animate-spin" size={16} /> : null}
                          <span>Request Code</span>
                        </motion.button>
                        <button onClick={() => setAuthStep('credentials')} className="w-full text-slate-500 text-[10px] font-black uppercase tracking-widest hover:underline">Back to API Info</button>
                      </div>
                    )}

                    {authStep === 'code' && (
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Login Code</label>
                          <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Enter 5-digit code"
                            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm transition-all ${darkMode ? 'bg-pink-500/5 border-pink-500/20 text-white placeholder-white/20' : 'bg-pink-50 border-pink-200 text-slate-900 placeholder-slate-400'}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>2FA Password (Optional)</label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="If enabled"
                            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm transition-all ${darkMode ? 'bg-pink-500/5 border-pink-500/20 text-white placeholder-white/20' : 'bg-pink-50 border-pink-200 text-slate-900 placeholder-slate-400'}`}
                          />
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleSignIn}
                          disabled={authLoading}
                          className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center space-x-2 shadow-lg ${darkMode ? 'bg-pink-600 text-white shadow-pink-900/20 hover:bg-pink-500' : 'bg-pink-500 text-white shadow-pink-500/20 hover:bg-pink-600'}`}
                        >
                          {authLoading ? <RefreshCw className="animate-spin" size={16} /> : null}
                          <span>Verify & Connect</span>
                        </motion.button>
                        <button onClick={() => setAuthStep('phone')} className="w-full text-slate-500 text-[10px] font-black uppercase tracking-widest hover:underline">Back</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 w-full"
            >
              <div className={`border p-6 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-cyan relative overflow-hidden group ${darkMode ? 'bg-cyan-950/40 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200 shadow-xl shadow-cyan-500/10'}`}>
                <div className={`absolute inset-0 pattern-dots opacity-[0.05] pointer-events-none ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                <div className="relative z-10 space-y-6 pointer-events-auto">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-500/10 text-cyan-600'}`}>
                      <PieChart size={14} />
                    </div>
                    <h3 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>Top Keywords Triggered</h3>
                  </div>
                  
                  <div className="h-64 w-full">
                    {analyticsData.keywordData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={analyticsData.keywordData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {analyticsData.keywordData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: darkMode ? '#171717' : '#ffffff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                            itemStyle={{ color: darkMode ? '#e5e5e5' : '#171717' }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full opacity-50 text-sm">No data available yet</div>
                    )}
                  </div>
                </div>
              </div>

              <div className={`border p-6 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-blue relative overflow-hidden group ${darkMode ? 'bg-blue-950/40 border-blue-500/30' : 'bg-blue-50 border-blue-200 shadow-xl shadow-blue-500/10'}`}>
                <div className={`absolute inset-0 pattern-grid opacity-[0.05] pointer-events-none ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <div className="relative z-10 space-y-6 pointer-events-auto">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600'}`}>
                      <BarChart3 size={14} />
                    </div>
                    <h3 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Most Active Topics</h3>
                  </div>
                  
                  <div className="h-64 w-full">
                    {analyticsData.topicData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.topicData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                          <YAxis tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                          <Tooltip 
                            cursor={{ fill: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                            contentStyle={{ backgroundColor: darkMode ? '#171717' : '#ffffff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                          />
                          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full opacity-50 text-sm">No data available yet</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'tester' && (
            <motion.div
              key="tester"
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 w-full"
            >
              <div className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-orange relative overflow-hidden group ${darkMode ? 'bg-orange-950/40 border-orange-500/30' : 'bg-orange-50 border-orange-200 shadow-xl shadow-orange-500/10'}`}>
                <div className={`absolute inset-0 pattern-dots opacity-[0.05] pointer-events-none ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                <div className="relative z-10 space-y-6 pointer-events-auto">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-500/10 text-orange-600'}`}>
                      <Bot size={14} />
                    </div>
                    <h3 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>AI Persona Tester</h3>
                  </div>
                  
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Test your current AI Persona settings before they go live. This uses the persona defined in Settings.
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Test Message</label>
                      <textarea
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        placeholder="Type a message a user might send..."
                        rows={3}
                        className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all ${darkMode ? 'bg-orange-500/5 border-orange-500/20 text-white placeholder-white/20' : 'bg-orange-50 border-orange-200 text-slate-900 placeholder-slate-400'}`}
                      />
                    </div>
                    
                    <button
                      onClick={handleTestPersona}
                      disabled={isTesting || !testMessage.trim()}
                      className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center space-x-2 shadow-lg ${
                        isTesting || !testMessage.trim() 
                          ? (darkMode ? 'bg-neutral-800 text-neutral-500' : 'bg-slate-200 text-slate-400') 
                          : 'bg-orange-500 text-white shadow-orange-500/20 hover:bg-orange-600'
                      }`}
                    >
                      {isTesting ? <RefreshCw className="animate-spin" size={16} /> : <MessageCircle size={16} />}
                      <span>Test AI Response</span>
                    </button>
                  </div>

                  <AnimatePresence>
                    {testReply && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-2xl border ${darkMode ? 'bg-black/40 border-orange-500/20' : 'bg-white/60 border-orange-200'}`}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <Bot size={14} className={darkMode ? 'text-orange-400' : 'text-orange-600'} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>AI Reply</span>
                        </div>
                        <p className={`text-sm whitespace-pre-wrap ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          {testReply}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 w-full"
            >
              <div className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-rose relative overflow-hidden group ${darkMode ? 'bg-rose-950/40 border-rose-500/30' : 'bg-rose-50 border-rose-200 shadow-xl shadow-rose-500/10'}`}>
                <div className={`absolute inset-0 pattern-dots opacity-[0.05] pointer-events-none ${darkMode ? 'text-rose-400' : 'text-rose-600'}`} />
                <div className="relative z-10 space-y-6 pointer-events-auto">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-500/10 text-rose-600'}`}>
                      <Calendar size={14} />
                    </div>
                    <h3 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-rose-400' : 'text-rose-600'}`}>Activity Heatmap</h3>
                  </div>
                  
                  <div className="overflow-x-auto pb-2 custom-scrollbar">
                    <div className="flex space-x-1 min-w-max">
                      <div className="flex flex-col space-y-1 pr-2">
                        {['Mon', 'Wed', 'Fri', 'Sun'].map(day => (
                          <span key={day} className="text-[8px] h-3 flex items-center text-slate-500 font-bold uppercase">{day}</span>
                        ))}
                      </div>
                      <div className="grid grid-flow-col grid-rows-7 gap-1">
                        {activityHeatmap.map((item, i) => (
                          <div 
                            key={i}
                            className={`w-3 h-3 rounded-sm transition-all hover:scale-125 cursor-pointer ${
                              item.value === 0 ? (darkMode ? 'bg-neutral-800' : 'bg-slate-200') :
                              item.value < 3 ? 'bg-rose-500/20' :
                              item.value < 6 ? 'bg-rose-500/50' :
                              'bg-rose-500'
                            }`}
                            title={`${item.day} ${item.hour}:00 - ${item.value} messages`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-2 text-[8px] font-bold uppercase text-slate-500">
                    <span>Less</span>
                    <div className="flex space-x-1">
                      <div className={`w-2 h-2 rounded-sm ${darkMode ? 'bg-neutral-800' : 'bg-slate-200'}`} />
                      <div className="w-2 h-2 rounded-sm bg-rose-500/20" />
                      <div className="w-2 h-2 rounded-sm bg-rose-500/50" />
                      <div className="w-2 h-2 rounded-sm bg-rose-500" />
                    </div>
                    <span>More</span>
                  </div>
                </div>
              </div>

              <div className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-amber relative overflow-hidden group ${darkMode ? 'bg-amber-950/40 border-amber-500/30' : 'bg-amber-50 border-amber-200 shadow-xl shadow-amber-500/10'}`}>
                <div className={`absolute inset-0 pattern-grid opacity-[0.05] pointer-events-none ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                <div className="relative z-10 space-y-6 pointer-events-auto">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-500/10 text-amber-600'}`}>
                      <Users size={14} />
                    </div>
                    <h3 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>Top Interacting Users</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {userLeaderboard.map((user, i) => (
                      <div key={user.username} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${darkMode ? 'bg-black/40 border-white/5' : 'bg-white/60 border-black/5'}`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                            i === 0 ? 'bg-amber-500 text-white' : 
                            i === 1 ? 'bg-slate-400 text-white' : 
                            i === 2 ? 'bg-orange-400 text-white' : 
                            (darkMode ? 'bg-neutral-800 text-slate-400' : 'bg-slate-100 text-slate-500')
                          }`}>
                            {i + 1}
                          </div>
                          <span className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>@{user.username}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-black ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>{user.count}</span>
                          <span className="text-[8px] font-bold uppercase text-slate-500">Replies</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-emerald relative overflow-hidden group ${darkMode ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200 shadow-xl shadow-emerald-500/10'}`}>
                <div className={`absolute inset-0 pattern-dots opacity-[0.05] pointer-events-none ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <div className="relative z-10 space-y-6 pointer-events-auto">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'}`}>
                      <Database size={14} />
                    </div>
                    <h3 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Data Management</h3>
                  </div>
                  
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Backup your entire bot configuration including keywords, settings, and AI personas.
                  </p>

                  <button
                    onClick={handleExportConfig}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center space-x-2 shadow-lg ${darkMode ? 'bg-emerald-600 text-white shadow-emerald-900/20 hover:bg-emerald-500' : 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600'}`}
                  >
                    <Download size={16} />
                    <span>Export Configuration</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'media' && (
            <motion.div
              key="media"
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 w-full"
            >
              <div className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-indigo relative overflow-hidden group ${darkMode ? 'bg-indigo-950/40 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200 shadow-xl shadow-indigo-500/10'}`}>
                <div className={`absolute inset-0 pattern-dots opacity-[0.05] pointer-events-none ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <div className="relative z-10 space-y-6 pointer-events-auto">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-500/10 text-indigo-600'}`}>
                      <Library size={14} />
                    </div>
                    <h3 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Media Library</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Media Name</label>
                        <input
                          type="text"
                          value={newMediaName}
                          onChange={(e) => setNewMediaName(e.target.value)}
                          placeholder="e.g. Banner"
                          className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition-all ${darkMode ? 'bg-indigo-500/5 border-indigo-500/20 text-white placeholder-white/20' : 'bg-indigo-50 border-indigo-200 text-slate-900 placeholder-slate-400'}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Media URL</label>
                        <input
                          type="text"
                          value={newMediaUrl}
                          onChange={(e) => setNewMediaUrl(e.target.value)}
                          placeholder="https://..."
                          className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition-all ${darkMode ? 'bg-indigo-500/5 border-indigo-500/20 text-white placeholder-white/20' : 'bg-indigo-50 border-indigo-200 text-slate-900 placeholder-slate-400'}`}
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={handleAddMedia}
                      disabled={!newMediaUrl.trim() || !newMediaName.trim()}
                      className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center space-x-2 shadow-lg ${
                        !newMediaUrl.trim() || !newMediaName.trim()
                          ? (darkMode ? 'bg-neutral-800 text-neutral-500' : 'bg-slate-200 text-slate-400') 
                          : 'bg-indigo-500 text-white shadow-indigo-500/20 hover:bg-indigo-600'
                      }`}
                    >
                      <Plus size={16} />
                      <span>Add to Library</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 mt-6">
                    {mediaItems.length === 0 ? (
                      <div className="text-center py-12 opacity-40 italic text-sm">No media in library yet.</div>
                    ) : (
                      mediaItems.map(item => (
                        <div key={item._id} className={`group relative rounded-3xl overflow-hidden border transition-all ${darkMode ? 'bg-black/40 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                          <div className="aspect-video w-full overflow-hidden">
                            <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                          </div>
                          <div className={`p-4 flex items-center justify-between ${darkMode ? 'bg-neutral-900/80' : 'bg-white/90'} backdrop-blur-md`}>
                            <div>
                              <h4 className={`text-xs font-black uppercase tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.name}</h4>
                              <p className="text-[9px] text-slate-500 font-mono truncate max-w-[150px]">{item.url}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(item.url);
                                  showNotification('success', 'URL copied to clipboard');
                                }}
                                className={`p-2 rounded-xl transition-all ${darkMode ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-black/5 text-slate-500 hover:text-black'}`}
                                title="Copy URL"
                              >
                                <Link size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteMedia(item._id)}
                                className={`p-2 rounded-xl transition-all ${darkMode ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                                title="Delete"
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div
              key="logs"
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 w-full"
            >
              <div className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-emerald relative overflow-hidden group ${darkMode ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200 shadow-xl shadow-emerald-500/10'}`}>
                <div className={`absolute inset-0 pattern-dots opacity-[0.05] pointer-events-none ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <div className="relative z-10 space-y-6 pointer-events-auto">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-slate-500/20 text-slate-400' : 'bg-slate-500/10 text-slate-600'}`}>
                        <FileText size={14} />
                      </div>
                      <h3 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>System Logs</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center bg-black/5 dark:bg-black/20 rounded-xl p-1">
                        <button 
                          onClick={() => handleDownloadLogs('json')}
                          className={`p-2 rounded-lg transition-all ${darkMode ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-emerald-600 hover:bg-emerald-600/10'}`}
                          title="Download JSON"
                        >
                          <Download size={14} />
                        </button>
                        <button 
                          onClick={() => handleDownloadLogs('csv')}
                          className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg transition-all ${darkMode ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-emerald-600 hover:bg-emerald-600/10'}`}
                          title="Download CSV"
                        >
                          CSV
                        </button>
                      </div>
                      <button 
                        onClick={fetchLogs}
                        disabled={refreshingLogs}
                        className={`p-2 rounded-xl transition-all ${darkMode ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-emerald-600 hover:bg-emerald-600/10'}`}
                      >
                        <RefreshCw size={16} className={refreshingLogs ? 'animate-spin' : ''} />
                      </button>
                      <button 
                        onClick={clearLogs}
                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${
                          isConfirmingClear 
                            ? 'bg-rose-600 text-white animate-pulse'
                            : darkMode 
                              ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' 
                              : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                        }`}
                      >
                        {isConfirmingClear ? 'Confirm Clear?' : 'Clear All'}
                      </button>
                    </div>
                  </div>

                  {/* Filters & Search */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                      <input 
                        type="text"
                        placeholder="Search logs..."
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs border transition-all outline-none ${
                          darkMode ? 'bg-neutral-900 border-neutral-800 text-white focus:border-emerald-500/50' : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500/50'
                        }`}
                      />
                    </div>
                    <select 
                      value={logLevelFilter}
                      onChange={(e) => setLogLevelFilter(e.target.value)}
                      className={`px-4 py-2.5 rounded-xl text-xs border transition-all outline-none appearance-none ${
                        darkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    >
                      <option value="all">All Levels</option>
                      <option value="info">Info</option>
                      <option value="warn">Warn</option>
                      <option value="error">Error</option>
                    </select>
                    <select 
                      value={logCategoryFilter}
                      onChange={(e) => setLogCategoryFilter(e.target.value)}
                      className={`px-4 py-2.5 rounded-xl text-xs border transition-all outline-none appearance-none ${
                        darkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    >
                      <option value="all">All Categories</option>
                      {logCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredLogs.length === 0 ? (
                    <div className="text-center py-12 opacity-40 italic text-sm">No logs match your filters.</div>
                  ) : (
                    filteredLogs.map(log => (
                      <div 
                        key={log._id}
                        className={`p-4 rounded-[1.5rem] border transition-all relative overflow-hidden group/log ${
                          darkMode ? 'bg-neutral-950/60 border-emerald-500/10 hover:border-emerald-500/30' : 'bg-white border-emerald-100 shadow-sm hover:border-emerald-200'
                        }`}
                      >
                        <div className={`absolute inset-0 pattern-dots opacity-[0.02] ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${
                                log.level === 'error' ? 'bg-rose-500/20 text-rose-400' : 
                                log.level === 'warn' ? 'bg-amber-500/20 text-amber-400' : 
                                'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {log.level}
                              </span>
                              {log.category && (
                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${
                                  darkMode ? 'bg-slate-500/20 text-slate-400' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {log.category}
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono opacity-60">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="flex items-start justify-between gap-4">
                            <p className={`text-xs font-medium leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                              {log.message}
                            </p>
                            {log.details && (
                              <button 
                                onClick={() => setExpandedLogId(expandedLogId === log._id ? null : log._id)}
                                className={`p-1 rounded-lg transition-all ${darkMode ? 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-600/10'}`}
                              >
                                {expandedLogId === log._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            )}
                          </div>

                          {log.route && (
                            <div className="mt-2 flex items-center space-x-1 opacity-40">
                              <Link size={10} />
                              <span className="text-[9px] font-mono">{log.route}</span>
                            </div>
                          )}

                          <AnimatePresence>
                            {log.details && expandedLogId === log._id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="relative mt-3">
                                  <pre className={`text-[9px] p-4 rounded-xl overflow-x-auto font-mono whitespace-pre-wrap break-all ${
                                    darkMode ? 'bg-black/40 text-neutral-400' : 'bg-slate-50 text-slate-600 border border-slate-100'
                                  }`}>
                                    {log.details}
                                  </pre>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(log.details || '');
                                      showNotification('success', 'Details copied to clipboard');
                                    }}
                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/20 text-white/50 hover:text-white transition-all opacity-0 group-hover/log:opacity-100"
                                    title="Copy details"
                                  >
                                    <Copy size={12} />
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t px-2 pb-safe pt-2 flex items-center justify-around z-50 transition-colors duration-500 ${darkMode ? 'bg-slate-950 border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]'}`}>
        <TabButton id="dashboard" icon={LayoutDashboard} label="Home" activeTab={activeTab} setActiveTab={setActiveTab} setDirection={setDirection} darkMode={darkMode} />
        <TabButton id="keywords" icon={Hash} label="Words" activeTab={activeTab} setActiveTab={setActiveTab} setDirection={setDirection} darkMode={darkMode} />
        <TabButton id="broadcast" icon={Send} label="Cast" activeTab={activeTab} setActiveTab={setActiveTab} setDirection={setDirection} darkMode={darkMode} />
        <TabButton id="settings" icon={Settings} label="Set" activeTab={activeTab} setActiveTab={setActiveTab} setDirection={setDirection} darkMode={darkMode} />
        <TabButton id="logs" icon={FileText} label="Logs" activeTab={activeTab} setActiveTab={setActiveTab} setDirection={setDirection} darkMode={darkMode} />
      </nav>

      {/* Notifications */}
      <Toaster position="top-right" />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmationId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl ${darkMode ? 'bg-neutral-900 border border-neutral-800' : 'bg-white'}`}
            >
              <h3 className={`text-lg font-black uppercase tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Confirm Delete</h3>
              <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Are you sure you want to delete this keyword rule? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirmationId(null)}
                  className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors ${darkMode ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteKeyword}
                  className="flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-xs bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* System Pause Confirmation Modal */}
      <AnimatePresence>
        {showPauseConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className={`w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl border relative overflow-hidden ${
                darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-100'
              }`}
            >
              <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${stats?.isSystemPaused ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              
              <div className="relative z-10 text-center">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-transform duration-500 hover:rotate-12 ${
                  stats?.isSystemPaused 
                    ? (darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600') 
                    : (darkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-50 text-rose-600')
                }`}>
                  {stats?.isSystemPaused ? <Play size={40} fill="currentColor" /> : <Pause size={40} fill="currentColor" />}
                </div>
                
                <h3 className={`text-2xl font-black tracking-tight mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {stats?.isSystemPaused ? 'Resume System?' : 'Pause System?'}
                </h3>
                <p className={`text-sm mb-8 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {stats?.isSystemPaused 
                    ? 'The bot will start replying to messages again based on your rules.' 
                    : 'The bot will stop all automated replies until you resume it manually.'}
                </p>
                
                <div className="flex flex-col space-y-3">
                  <button
                    onClick={confirmTogglePause}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${
                      stats?.isSystemPaused 
                        ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600' 
                        : 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600'
                    }`}
                  >
                    {stats?.isSystemPaused ? 'Yes, Resume Now' : 'Yes, Pause Now'}
                  </button>
                  <button
                    onClick={() => setShowPauseConfirmation(false)}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                      darkMode ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan Missed Modal */}
      <AnimatePresence>
        {showScanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[80vh] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
            >
              <div className={`p-6 border-b flex items-center justify-between ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    <Search size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">Scan Results</h3>
                    <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {scannedItems.length} new missed keywords found
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowScanModal(false)}
                  className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {scannedItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${darkMode ? 'bg-slate-800/50 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                      <Check size={32} />
                    </div>
                    <h4 className="text-lg font-bold mb-1">All Caught Up!</h4>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>No new missed keywords were found in the recent topics.</p>
                  </div>
                ) : (
                  scannedItems.map((item, index) => {
                    const isSelected = selectedScannedItems.has(item._id);
                    return (
                      <div 
                        key={index} 
                        onClick={() => {
                          const newSet = new Set(selectedScannedItems);
                          if (isSelected) newSet.delete(item._id);
                          else newSet.add(item._id);
                          setSelectedScannedItems(newSet);
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-colors flex items-start space-x-4 ${
                          isSelected 
                            ? (darkMode ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-indigo-50 border-indigo-200')
                            : (darkMode ? 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')
                        }`}
                      >
                        <div className={`mt-1 w-5 h-5 rounded flex items-center justify-center border ${
                          isSelected 
                            ? 'bg-indigo-500 border-indigo-500 text-white' 
                            : (darkMode ? 'border-slate-600' : 'border-slate-300')
                        }`}>
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                              {item.topicName}
                            </span>
                            <span className={`text-[10px] font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                              {new Date(item.date).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            Keyword: <span className="text-amber-500">"{item.keyword}"</span>
                          </p>
                          <p className={`text-xs italic line-clamp-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            "{item.text}"
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              <div className={`p-6 border-t flex items-center justify-end space-x-3 ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                {isCatchingUp ? (
                  <button
                    onClick={handleCancelCatchUp}
                    className="px-6 py-3 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 flex items-center space-x-2"
                  >
                    <RefreshCw className="animate-spin" size={16} />
                    <span>Cancel Catch Up</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowScanModal(false)}
                      className={`px-6 py-3 rounded-xl text-sm font-bold transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-600'}`}
                    >
                      Close
                    </button>
                    {scannedItems.length > 0 && (
                      <button
                        onClick={() => {
                          if (selectedScannedItems.size === 0) {
                            showNotification('error', 'Please select at least one item');
                            return;
                          }
                          handleCatchUp(Array.from(selectedScannedItems));
                        }}
                        disabled={selectedScannedItems.size === 0}
                        className={`px-6 py-3 rounded-xl text-sm font-bold text-white transition-colors shadow-lg ${
                          selectedScannedItems.size === 0
                            ? 'bg-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20'
                        }`}
                      >
                        Catch Up Selected ({selectedScannedItems.size})
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Data Confirmation Modal */}
      <AnimatePresence>
        {showClearDataConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className={`w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl border relative overflow-hidden ${
                darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-100'
              }`}
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 bg-rose-500" />
              
              <div className="relative z-10 text-center">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-transform duration-500 hover:rotate-12 ${
                  darkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-50 text-rose-600'
                }`}>
                  <Trash size={40} />
                </div>
                
                <h3 className={`text-2xl font-black tracking-tight mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Clear All Data?
                </h3>
                <p className={`text-sm mb-8 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  This will permanently delete all logs, keywords, and media. This action cannot be undone.
                </p>
                
                <div className="flex flex-col space-y-3">
                  <button
                    onClick={async () => {
                      await fetch("/api/data/clear", { method: "DELETE" });
                      setShowClearDataConfirm(false);
                      window.location.reload();
                    }}
                    className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-white bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-500/20 transition-all"
                  >
                    Confirm Clear
                  </button>
                  <button
                    onClick={() => setShowClearDataConfirm(false)}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                      darkMode ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Last Keyword Confirmation Modal */}
      <AnimatePresence>
        {showDeleteLastKeywordConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className={`w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl border relative overflow-hidden ${
                darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-100'
              }`}
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 bg-orange-500" />
              
              <div className="relative z-10 text-center">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-transform duration-500 hover:rotate-12 ${
                  darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-50 text-orange-600'
                }`}>
                  <Trash2 size={40} />
                </div>
                
                <h3 className={`text-2xl font-black tracking-tight mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Delete Last?
                </h3>
                <p className={`text-sm mb-8 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Are you sure you want to remove the most recently imported keyword?
                </p>
                
                <div className="flex flex-col space-y-3">
                  <button
                    onClick={async () => {
                      await fetch("/api/data/last-import", { method: "DELETE" });
                      setShowDeleteLastKeywordConfirm(false);
                      window.location.reload();
                    }}
                    className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-white bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-500/20 transition-all"
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteLastKeywordConfirm(false)}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                      darkMode ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className={`w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl border relative overflow-hidden ${
                darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-100'
              }`}
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 bg-rose-500" />
              
              <div className="relative z-10 text-center">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-transform duration-500 hover:rotate-12 ${
                  darkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-50 text-rose-600'
                }`}>
                  <LogOut size={40} />
                </div>
                
                <h3 className={`text-2xl font-black tracking-tight mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Logout Session?
                </h3>
                <p className={`text-sm mb-8 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Are you sure you want to end your current session? You will need to sign in again to manage your bot.
                </p>
                
                <div className="flex flex-col space-y-3">
                  <button
                    onClick={handleLogout}
                    className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-white bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-500/20 transition-all"
                  >
                    Yes, Logout Now
                  </button>
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                      darkMode ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Keywords Confirmation Modal */}
      <AnimatePresence>
        {showResetKeywordsConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className={`w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl border relative overflow-hidden ${
                darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-100'
              }`}
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 bg-amber-500" />
              
              <div className="relative z-10 text-center">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-transform duration-500 hover:rotate-12 ${
                  darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-600'
                }`}>
                  <RotateCcw size={40} />
                </div>
                
                <h3 className={`text-2xl font-black tracking-tight mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Reset All Keywords?
                </h3>
                <p className={`text-sm mb-8 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  This will reset the reply counts for all keywords to zero immediately.
                </p>
                
                <div className="flex flex-col space-y-3">
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch("/api/keywords/reset-all", { method: "POST" });
                        if (response.ok) {
                          setShowResetKeywordsConfirm(false);
                          // Refresh keywords to show updated counts
                          const kwRes = await fetch("/api/keywords");
                          const kwText = await kwRes.text();
                          if (kwText.includes("Rate exceeded")) return;
                          try {
                            const kwData = JSON.parse(kwText);
                            setKeywords(kwData);
                          } catch (e) {
                            console.error("Failed to parse keywords after reset", e);
                          }
                        }
                      } catch (error) {
                        console.error("Failed to reset keywords:", error);
                      }
                    }}
                    className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-white bg-amber-500 hover:bg-amber-600 shadow-xl shadow-amber-500/20 transition-all"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => setShowResetKeywordsConfirm(false)}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                      darkMode ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className={`py-8 text-center border-t transition-colors duration-500 ${darkMode ? 'border-slate-800/50 text-slate-500' : 'border-slate-200/50 text-slate-400'}`}>
        <p className="text-xs font-bold tracking-[0.2em] uppercase">Created by Rohit</p>
        <p className="text-[10px] mt-2 opacity-50">© 2026 ROHIT'S USERBOT PRO • All Rights Reserved</p>
      </footer>
    </motion.div>
  );
}
