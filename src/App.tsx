import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Folder,
  ArrowLeft,
  FileText
} from "lucide-react";

interface Stats {
  topicCount: number;
  autoReply: string;
  delaySeconds: number;
  isUserBotConnected: boolean;
  apiId: string;
  apiHash: string;
  defaultPhone: string;
}

interface Keyword {
  _id: string;
  keyword: string;
  reply: string;
  photo?: string;
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
  message: string;
  details?: string;
  route?: string;
  timestamp: string;
}

const TABS = ['dashboard', 'keywords', 'broadcast', 'settings', 'user', 'logs'] as const;
type TabType = typeof TABS[number];

export default function App() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [autoReplyInput, setAutoReplyInput] = useState("");
  const [delaySecondsInput, setDelaySecondsInput] = useState(0);
  const [apiIdInput, setApiIdInput] = useState("");
  const [apiHashInput, setApiHashInput] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [newReply, setNewReply] = useState("");
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [direction, setDirection] = useState(0);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const [darkMode, setDarkMode] = useState(true);

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
      const data = await res.json();
      setStats(data);
      setAutoReplyInput(data.autoReply);
      setDelaySecondsInput(data.delaySeconds);
      setApiIdInput(data.apiId);
      setApiHashInput(data.apiHash);
      if (!phone) setPhone(data.defaultPhone);
      
      if (data.apiId && data.apiHash && data.apiId !== "0" && data.apiHash !== "") {
        setAuthStep('phone');
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchKeywords = async () => {
    try {
      const res = await fetch("/api/keywords");
      const data = await res.json();
      setKeywords(data);
    } catch (err) {
      console.error("Failed to fetch keywords", err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    }
  };

  const clearLogs = async () => {
    if (!confirm("Clear all logs?")) return;
    try {
      const res = await fetch("/api/logs", { method: "DELETE" });
      if (res.ok) {
        setLogs([]);
        showNotification('success', 'Logs cleared');
      }
    } catch (err) {
      showNotification('error', 'Failed to clear logs');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchKeywords();
    fetchLogs();

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string, duration = 3000) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), type === 'error' ? 6000 : duration);
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab]);

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
          apiHash: apiHashInput
        }),
      });
      
      const data = await res.json().catch(() => null);
      
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

  const handleAddKeyword = async () => {
    if (!newKeyword || !newReply) return;
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: newKeyword, reply: newReply, photo: newPhoto }),
      });
      if (res.ok) {
        showNotification('success', 'Keyword added!');
        setNewKeyword("");
        setNewReply("");
        setNewPhoto(null);
        fetchKeywords();
      }
    } catch (err) {
      showNotification('error', 'Failed to add keyword');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    try {
      const res = await fetch(`/api/keywords/${id}`, { method: "DELETE" });
      if (res.ok) {
        showNotification('success', 'Keyword deleted');
        fetchKeywords();
      }
    } catch (err) {
      showNotification('error', 'Delete failed');
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
      
      const data = await res.json().catch(() => null);

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
      
      const data = await res.json().catch(() => null);

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

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        showNotification('success', 'Logged out');
        fetchStats();
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

  const navigateTab = (newDirection: number) => {
    const currentIndex = TABS.indexOf(activeTab);
    let newIndex = currentIndex + newDirection;
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= TABS.length) newIndex = TABS.length - 1;
    if (newIndex !== currentIndex) {
      setDirection(newDirection);
      setActiveTab(TABS[newIndex]);
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
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    })
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="text-emerald-500" size={40} />
        </motion.div>
      </div>
    );
  }

  const TabButton = ({ id, icon: Icon, label }: { id: TabType, icon: any, label: string }) => {
    const isActive = activeTab === id;
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
        className={`flex flex-col items-center justify-center py-2 px-1 sm:px-4 rounded-2xl transition-all duration-300 relative ${
          isActive ? "text-emerald-400" : (darkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800")
        }`}
      >
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${isActive ? "scale-110" : ""}`} />
        <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest mt-1">{label}</span>
        {isActive && (
          <motion.div 
            layoutId="activeTab"
            className="absolute -top-1 w-8 h-1 bg-emerald-500 rounded-full"
          />
        )}
      </button>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-[#0f172a] text-slate-200' : 'bg-slate-50 text-slate-800'} font-sans pb-24`}>
      {/* Offline Warning */}
      {!stats?.isUserBotConnected && (
        <div className="bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.2em] py-2 text-center sticky top-0 z-[60] shadow-lg">
          ⚠️ Please login Telegram ID to enable auto-replies
        </div>
      )}

      {/* Header */}
      <header className={`p-6 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-500 ${darkMode ? 'bg-[#0f172a]/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-emerald-900/20">
            <img src="/logo.svg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className={`font-black text-xl tracking-tighter transition-colors duration-500 ${darkMode ? 'text-white' : 'text-slate-900'}`}>USERBOT<span className="text-emerald-500">PRO</span></h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${stats?.isUserBotConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            <span className={`w-2 h-2 rounded-full ${stats?.isUserBotConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span>{stats?.isUserBotConnected ? 'Connected' : 'Offline'}</span>
          </div>
        </div>
      </header>

      {/* Floating Dark Mode Button */}
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className={`fixed bottom-24 right-4 z-50 p-4 rounded-full shadow-xl transition-all ${darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700 border border-slate-700' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}`}
      >
        {darkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      <main 
        className="p-4 max-w-md mx-auto overflow-hidden"
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
                <div className={`border p-5 rounded-3xl transition-colors duration-500 ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <BarChart3 className="text-emerald-400 mb-3" size={20} />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Topics</p>
                  <h3 className={`text-3xl font-black mt-1 transition-colors duration-500 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{stats?.topicCount || 0}</h3>
                </div>
                <div className={`border p-5 rounded-3xl transition-colors duration-500 ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <RefreshCw className="text-emerald-400 mb-3" size={20} />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Delay</p>
                  <h3 className={`text-3xl font-black mt-1 transition-colors duration-500 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{stats?.delaySeconds || 0}s</h3>
                </div>
              </div>

              <div className={`border p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-colors duration-500 ${darkMode ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">Auto Reply Active</p>
                  <p className={`text-lg font-medium leading-relaxed italic transition-colors duration-500 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    "{stats?.autoReply || 'No message set'}"
                  </p>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-600/10 rounded-full blur-3xl" />
              </div>
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
              className="space-y-6 w-full"
            >
              {/* Settings Section */}
              <div className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Welcome Message</label>
                  <textarea
                    value={autoReplyInput}
                    onChange={(e) => setAutoReplyInput(e.target.value)}
                    className={`w-full h-32 p-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Delay (Seconds)</label>
                  <input
                    type="number"
                    value={delaySecondsInput}
                    onChange={(e) => setDelaySecondsInput(parseInt(e.target.value) || 0)}
                    className={`w-full p-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpdateSettings}
                  disabled={saving}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
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
              <div className={`border p-8 rounded-[2.5rem] space-y-4 transition-colors duration-500 ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Keyword</label>
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="e.g. hello"
                    className={`w-full p-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-colors duration-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reply Message</label>
                  <input
                    type="text"
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="e.g. Hi there!"
                    className={`w-full p-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-colors duration-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reply Photo (Optional)</label>
                  <div className="flex items-center space-x-4">
                    <label className={`flex-1 flex items-center justify-center space-x-2 p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${darkMode ? 'border-slate-800 hover:border-emerald-500/50 bg-slate-950/50' : 'border-slate-200 hover:border-emerald-500/50 bg-slate-50'}`}>
                      <ImageIcon size={20} className="text-emerald-500" />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {newPhoto ? 'Change Photo' : 'Upload Photo'}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                    {newPhoto && (
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-emerald-500/30">
                        <img src={newPhoto} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setNewPhoto(null)}
                          className="absolute top-0 right-0 bg-rose-500 text-white p-0.5 rounded-bl-lg"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddKeyword}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center space-x-2"
                >
                  <Plus size={18} />
                  <span>Add Keyword</span>
                </motion.button>
              </div>

              <div className="space-y-3">
                {keywords.map(kw => (
                  <motion.div 
                    layout
                    key={kw._id}
                    className={`border p-4 rounded-2xl flex items-center justify-between transition-colors duration-500 ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
                  >
                    <div className="flex items-center space-x-4">
                      {kw.photo && (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700">
                          <img src={kw.photo} alt="Reply" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">{kw.keyword}</p>
                        <p className={`text-sm mt-1 transition-colors duration-500 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{kw.reply}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteKeyword(kw._id)}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
              </div>
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
              <div className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Broadcast Content</label>
                  <textarea
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="What would you like to announce?"
                    className={`w-full h-40 p-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-colors duration-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBroadcast}
                  disabled={broadcasting || !broadcastMessage.trim()}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center space-x-2 ${darkMode ? 'bg-white text-slate-950 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                >
                  <Send size={18} />
                  <span>{broadcasting ? 'Sending...' : 'Send Now'}</span>
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
              <div className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                {stats?.isUserBotConnected ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="bg-emerald-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                      <CheckCircle2 className="text-emerald-500" size={40} />
                    </div>
                    <h3 className={`text-xl font-black uppercase tracking-tighter transition-colors duration-500 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Account Linked</h3>
                    <p className="text-slate-500 text-sm">Your personal account is active.</p>
                    <button 
                      onClick={handleLogout}
                      className="text-rose-500 text-xs font-bold uppercase tracking-widest hover:underline mt-4"
                    >
                      Logout Session
                    </button>
                    
                    {deferredPrompt && (
                      <div className={`pt-6 border-t mt-6 transition-colors duration-500 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <button
                          onClick={handleInstallApp}
                          className="w-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600/30 transition-all flex items-center justify-center space-x-2"
                        >
                          <Smartphone size={18} />
                          <span>Install App</span>
                        </button>
                        <p className="text-[10px] text-slate-500 mt-2 text-center">Install USERBOT PRO on your home screen</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {authStep === 'credentials' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">API ID</label>
                          <input
                            type="text"
                            value={apiIdInput}
                            onChange={(e) => setApiIdInput(e.target.value)}
                            className={`w-full p-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-colors duration-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">API Hash</label>
                          <input
                            type="text"
                            value={apiHashInput}
                            onChange={(e) => setApiHashInput(e.target.value)}
                            className={`w-full p-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-colors duration-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                          />
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => { handleUpdateSettings(); setAuthStep('phone'); }}
                          className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-500 transition-all"
                        >
                          Next Step
                        </motion.button>
                      </div>
                    )}

                    {authStep === 'phone' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1234567890"
                            className={`w-full p-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors duration-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                          />
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSendCode}
                          disabled={authLoading}
                          className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-500 transition-all flex items-center justify-center space-x-2"
                        >
                          {authLoading ? <RefreshCw className="animate-spin" size={20} /> : null}
                          <span>Send Login Code</span>
                        </motion.button>
                        <button onClick={() => setAuthStep('credentials')} className="w-full text-slate-500 text-sm">Back to API Settings</button>
                      </div>
                    )}

                    {authStep === 'code' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold uppercase tracking-wider transition-colors duration-500">Login Code</label>
                          <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Enter code from Telegram"
                            className={`w-full p-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors duration-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold uppercase tracking-wider transition-colors duration-500">2FA Password (Optional)</label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="If enabled"
                            className={`w-full p-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors duration-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                          />
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSignIn}
                          disabled={authLoading}
                          className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-500 transition-all flex items-center justify-center space-x-2"
                        >
                          {authLoading ? <RefreshCw className="animate-spin" size={20} /> : null}
                          <span>Complete Login</span>
                        </motion.button>
                        <button onClick={() => setAuthStep('phone')} className="w-full text-slate-500 text-sm">Back</button>
                      </div>
                    )}
                  </div>
                )}
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
              <div className={`border p-6 rounded-[2.5rem] space-y-6 transition-colors duration-500 ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-center justify-between px-2">
                  <h3 className={`text-xl font-black uppercase tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>System Logs</h3>
                  <button 
                    onClick={clearLogs}
                    className="text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 px-3 py-1 rounded-full transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {logs.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 italic text-sm">No logs found</div>
                  ) : (
                    logs.map((log) => (
                      <div 
                        key={log._id} 
                        className={`p-4 rounded-2xl border transition-colors ${
                          darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            log.level === 'error' ? 'bg-rose-500/20 text-rose-500' : 
                            log.level === 'warn' ? 'bg-amber-500/20 text-amber-500' : 
                            'bg-emerald-500/20 text-emerald-500'
                          }`}>
                            {log.level}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className={`text-sm font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{log.message}</p>
                        {log.route && (
                          <p className="text-[10px] font-mono text-slate-500 mb-2">Route: {log.route}</p>
                        )}
                        {log.details && (
                          <pre className={`text-[10px] p-3 rounded-xl overflow-x-auto font-mono ${
                            darkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {log.details}
                          </pre>
                        )}
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
      <nav className={`fixed bottom-6 left-2 right-2 sm:left-4 sm:right-4 backdrop-blur-xl border rounded-[2rem] p-2 flex items-center justify-around shadow-2xl z-50 transition-colors duration-500 ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
        <TabButton id="dashboard" icon={LayoutDashboard} label="Home" />
        <TabButton id="keywords" icon={Hash} label="Words" />
        <TabButton id="broadcast" icon={Send} label="Cast" />
        <TabButton id="settings" icon={Settings} label="Set" />
        <TabButton id="user" icon={User} label="User" />
        <TabButton id="logs" icon={FileText} label="Logs" />
      </nav>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-28 left-4 right-4 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 border ${
              notification.type === 'success' 
                ? 'bg-emerald-600 text-white border-emerald-500' 
                : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-bold text-sm">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
