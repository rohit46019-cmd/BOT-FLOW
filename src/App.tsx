import React, { useState, useEffect, useRef } from "react";
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
  FileText,
  Download,
  Upload,
  Play,
  Pause
} from "lucide-react";

interface Stats {
  topicCount: number;
  todayTopicCount: number;
  autoReply: string;
  delaySeconds: number;
  isSystemPaused: boolean;
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
  message_link?: string;
  message_links?: string[];
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
  const [newMessageLinks, setNewMessageLinks] = useState<string[]>([""]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [direction, setDirection] = useState(0);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const [refreshingLogs, setRefreshingLogs] = useState(false);
  const [editingKeywordId, setEditingKeywordId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

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
      if (!res.ok) {
        const text = await res.text();
        if (text.includes("Rate exceeded")) return;
        throw new Error(`Server error: ${res.status}`);
      }
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
      if (!res.ok) {
        const text = await res.text();
        if (text.includes("Rate exceeded")) return;
        throw new Error(`Server error: ${res.status}`);
      }
      const data = await res.json();
      setKeywords(data);
    } catch (err) {
      console.error("Failed to fetch keywords", err);
    }
  };

  const fetchLogs = async () => {
    setRefreshingLogs(true);
    try {
      const res = await fetch("/api/logs");
      if (!res.ok) {
        const text = await res.text();
        if (text.includes("Rate exceeded")) return;
        throw new Error(`Server error: ${res.status}`);
      }
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      // Add a slight delay so the animation is visible even for fast requests
      setTimeout(() => setRefreshingLogs(false), 500);
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

  const handleTogglePause = async () => {
    if (!stats) return;
    const newPausedState = !stats.isSystemPaused;
    
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
    if (!newKeyword || (!newReply && newMessageLinks.every(l => !l))) return;
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: editingKeywordId,
          keyword: newKeyword, 
          reply: newReply, 
          message_links: newMessageLinks.filter(l => l.trim().length > 0)
        }),
      });
      if (res.ok) {
        showNotification('success', editingKeywordId ? 'Keyword updated!' : 'Keyword added!');
        setNewKeyword("");
        setNewReply("");
        setNewMessageLinks([""]);
        setEditingKeywordId(null);
        fetchKeywords();
      }
    } catch (err) {
      showNotification('error', editingKeywordId ? 'Failed to update keyword' : 'Failed to add keyword');
    }
  };

  const handleEditKeyword = (kw: Keyword) => {
    setNewKeyword(kw.keyword);
    setNewReply(kw.reply || "");
    const links = kw.message_links && kw.message_links.length > 0 
      ? [...kw.message_links] 
      : (kw.message_link ? [kw.message_link] : [""]);
    setNewMessageLinks(links);
    setEditingKeywordId(kw._id);
    // Scroll to top of the keyword section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setNewKeyword("");
    setNewReply("");
    setNewMessageLinks([""]);
    setEditingKeywordId(null);
  };

  const addUrlField = () => {
    if (newMessageLinks.length < 6) {
      setNewMessageLinks([...newMessageLinks, ""]);
    }
  };

  const removeUrlField = (index: number) => {
    if (newMessageLinks.length > 1) {
      const newLinks = [...newMessageLinks];
      newLinks.splice(index, 1);
      setNewMessageLinks(newLinks);
    } else {
      setNewMessageLinks([""]);
    }
  };

  const updateUrlField = (index: number, value: string) => {
    const newLinks = [...newMessageLinks];
    newLinks[index] = value;
    setNewMessageLinks(newLinks);
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

  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = async () => {
    try {
      const res = await fetch("/api/data/export");
      if (res.ok) {
        const data = await res.json();
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
                <motion.div 
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:animate-pulse transition-all" />
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-purple-500/20 rounded-full blur-xl -ml-5 -mb-5" />
                  <BarChart3 className="text-white/80 mb-3 relative z-10" size={20} />
                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest relative z-10">Total Topics</p>
                  <h3 className="text-3xl font-black mt-1 relative z-10">{stats?.topicCount || 0}</h3>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.05, rotateY: -5 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 group"
                >
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl -mr-5 -mb-5 group-hover:animate-pulse transition-all" />
                  <div className="absolute top-0 left-0 w-16 h-16 bg-teal-300/20 rounded-full blur-lg -ml-2 -mt-2" />
                  <LayoutDashboard className="text-white/80 mb-3 relative z-10" size={20} />
                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest relative z-10">Today</p>
                  <h3 className="text-3xl font-black mt-1 relative z-10">{stats?.todayTopicCount || 0}</h3>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className={`col-span-2 border p-5 rounded-3xl transition-colors duration-500 ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Response Delay</p>
                      <h3 className={`text-3xl font-black mt-1 transition-colors duration-500 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{stats?.delaySeconds || 0}s</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <RefreshCw className="text-emerald-400" size={24} />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* System Pause/Resume Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleTogglePause}
                className={`w-full p-6 rounded-[2.5rem] shadow-xl flex items-center justify-between transition-all duration-500 ${
                  stats?.isSystemPaused 
                    ? 'bg-rose-500 text-white shadow-rose-500/30' 
                    : 'bg-emerald-500 text-white shadow-emerald-500/30'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    {stats?.isSystemPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-widest opacity-80">System Status</p>
                    <h3 className="text-xl font-black">{stats?.isSystemPaused ? 'PAUSED' : 'ACTIVE'}</h3>
                  </div>
                </div>
                <div className="bg-white/20 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
                  {stats?.isSystemPaused ? 'Tap to Resume' : 'Tap to Pause'}
                </div>
              </motion.button>

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

                <div className="pt-6 border-t border-slate-800 space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Backup & Restore</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleExportData}
                      className={`flex items-center justify-center space-x-2 p-4 rounded-2xl border font-bold text-xs uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                    >
                      <Download size={16} />
                      <span>Export</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={importing}
                      className={`flex items-center justify-center space-x-2 p-4 rounded-2xl border font-bold text-xs uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                    >
                      <Upload size={16} />
                      <span>{importing ? '...' : 'Import'}</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImportData}
                      accept=".json"
                      className="hidden"
                    />
                  </div>
                </div>
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

                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Chat Forward URLs (Optional)</label>
                    {newMessageLinks.length < 6 && (
                      <button 
                        onClick={addUrlField}
                        className="text-emerald-500 hover:text-emerald-400 transition-colors"
                        title="Add more URLs"
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>
                  
                  {newMessageLinks.map((link, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={link}
                        onChange={(e) => updateUrlField(index, e.target.value)}
                        placeholder="https://t.me/c/3672030592/123"
                        className={`flex-1 p-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-colors duration-500 ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      />
                      {newMessageLinks.length > 1 && (
                        <button 
                          onClick={() => removeUrlField(index)}
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <p className="text-[10px] text-slate-500 ml-1 italic">Paste Telegram message links to forward media/files. Max 6 URLs.</p>
                </div>

                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddKeyword}
                    className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center space-x-2"
                  >
                    {editingKeywordId ? <RefreshCw size={18} /> : <Plus size={18} />}
                    <span>{editingKeywordId ? 'Update Keyword' : 'Add Keyword'}</span>
                  </motion.button>
                  {editingKeywordId && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={cancelEdit}
                      className="bg-slate-500 text-white px-6 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-400 transition-all"
                    >
                      <X size={18} />
                    </motion.button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {keywords.map(kw => (
                  <motion.div 
                    layout
                    key={kw._id}
                    className={`border p-4 rounded-2xl flex items-center justify-between transition-colors duration-500 ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">{kw.keyword}</p>
                        {(kw.message_links && kw.message_links.length > 0) || kw.message_link ? (
                          <div className="space-y-1 mt-1">
                            <div className="flex items-center space-x-2">
                              <FileText size={12} className="text-slate-500" />
                              <p className="text-[10px] text-slate-500 italic">Forwarding {kw.message_links?.length || 1} content(s)</p>
                            </div>
                            {kw.reply && <p className={`text-[10px] transition-colors duration-500 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{kw.reply}</p>}
                          </div>
                        ) : (
                          <p className={`text-sm mt-1 transition-colors duration-500 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{kw.reply}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditKeyword(kw)}
                        className={`p-2 rounded-xl transition-all ${darkMode ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-emerald-600 hover:bg-emerald-600/10'}`}
                      >
                        <Settings size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteKeyword(kw._id)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
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
                    <h3 className={`text-xl font-black uppercase tracking-tighter transition-colors duration-500 ${darkMode ? 'text-white' : 'text-slate-900'}`}>System Linked</h3>
                    <p className="text-slate-500 text-sm">The Telegram session is active and shared across all users.</p>
                    <div className="pt-4">
                      <button 
                        onClick={fetchStats}
                        className="text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:underline"
                      >
                        Refresh Connection Status
                      </button>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="text-slate-500 text-[9px] font-bold uppercase tracking-widest hover:text-rose-500 transition-colors mt-8 opacity-30 hover:opacity-100"
                    >
                      Reset System Session
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
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={fetchLogs}
                      disabled={refreshingLogs}
                      className={`p-2 rounded-full transition-all ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'} ${refreshingLogs ? 'opacity-50' : ''}`}
                      title="Refresh Logs"
                    >
                      <RefreshCw size={14} className={refreshingLogs ? 'animate-spin' : ''} />
                    </button>
                    <button 
                      onClick={clearLogs}
                      className="text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 px-3 py-1 rounded-full transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
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
