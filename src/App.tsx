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
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface Stats {
  topicCount: number;
  todayTopicCount: number;
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
    keywords: 'from-blue-400 to-blue-600',
    broadcast: 'from-purple-400 to-purple-600',
    settings: 'from-amber-400 to-amber-600',
    user: 'from-pink-400 to-pink-600',
    logs: 'from-slate-400 to-slate-600'
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

export default function App() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [autoReplyInput, setAutoReplyInput] = useState("");
  const [delaySecondsInput, setDelaySecondsInput] = useState(0);
  const [apiIdInput, setApiIdInput] = useState("");
  const [apiHashInput, setApiHashInput] = useState("");
  const [photoReplyEnabled, setPhotoReplyEnabled] = useState(false);
  const [photoReplyMessage, setPhotoReplyMessage] = useState("");
  const [photoReplyMax, setPhotoReplyMax] = useState<number | string>(2);
  const [topicIcon, setTopicIcon] = useState("🛑");
  const [topicRenameKeywords, setTopicRenameKeywords] = useState("");
  const [topicRenameMatchMode, setTopicRenameMatchMode] = useState<'exact' | 'partial'>('exact');
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(true);
  const [notificationSoundType, setNotificationSoundType] = useState("default");
  const [autoResetKeywords, setAutoResetKeywords] = useState(true);
  const [autoBlockKeywords, setAutoBlockKeywords] = useState<AutoBlockKeyword[]>([]);
  const [autoBlockKeywordsExpanded, setAutoBlockKeywordsExpanded] = useState(true);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [newKeywords, setNewKeywords] = useState<string[]>([""]); // Changed from single string to array
  const [newReply, setNewReply] = useState("");
  const [newMatchMode, setNewMatchMode] = useState<'exact' | 'partial'>('exact');
  const [newMessageLinks, setNewMessageLinks] = useState<string[]>([""]);
  const [newMaxReplies, setNewMaxReplies] = useState<number | string>(2);
  const [keywordSearch, setKeywordSearch] = useState("");
  const [blockedTopics, setBlockedTopics] = useState<any[]>([]);
  const [newBlockedTopicLink, setNewBlockedTopicLink] = useState("");
  const [blockedTopicSearch, setBlockedTopicSearch] = useState("");
  const [blockingTopic, setBlockingTopic] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warn', message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [direction, setDirection] = useState(0);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const [refreshingLogs, setRefreshingLogs] = useState(false);
  const [editingKeywordId, setEditingKeywordId] = useState<string | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const keywordsTopRef = useRef<HTMLDivElement>(null);
  const keywordsBottomRef = useRef<HTMLDivElement>(null);
  const castTopRef = useRef<HTMLDivElement>(null);
  const castBottomRef = useRef<HTMLDivElement>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved !== null ? JSON.parse(saved) : true;
  });

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

  const fetchBlockedTopics = React.useCallback(async () => {
    try {
      const response = await fetch('/api/blocked-topics');
      const data = await response.json();
      setBlockedTopics(data);
    } catch (err) {
      console.error("Failed to fetch blocked topics:", err);
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
      const data = await response.json();
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
    setNotification({ type, message });
    setTimeout(() => setNotification(null), (type === 'error' || type === 'warn') ? 6000 : duration);
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

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        showNotification('success', 'Notifications enabled!');
        playNotificationSound();
        
        const options = { body: "Test notification successful!", icon: "/logo.svg" };
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(reg => reg.showNotification("UserBot Pro", options));
        } else {
          new Notification("UserBot Pro", options);
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
      Notification.requestPermission();
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
                  registration.showNotification("UserBot Pro", options);
                }).catch(() => {
                  // Fallback to constructor
                  new Notification("UserBot Pro", options);
                });
              } else {
                new Notification("UserBot Pro", options);
              }
            } catch (e) {
              console.error("Notification creation failed", e);
              // Final fallback attempt
              try {
                if (Notification.permission === "granted") {
                   // Some environments might allow this if the constructor failed
                   navigator.serviceWorker?.ready?.then(reg => reg.showNotification("UserBot Pro", options));
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
      setPhotoReplyEnabled(data.photoReplyEnabled);
      setPhotoReplyMessage(data.photoReplyMessage);
      setPhotoReplyMax(data.photoReplyMax || 2);
      setTopicIcon(data.topicIcon || "🛑");
      setTopicRenameKeywords(data.topicRenameKeywords || "");
      setTopicRenameMatchMode(data.topicRenameMatchMode || "exact");
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
    fetchBlockedTopics();

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
          photoReplyMax: Number(photoReplyMax) || 2,
          notificationSoundEnabled,
          notificationSoundType,
          topicIcon,
          topicRenameKeywords,
          topicRenameMatchMode
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
    const validKeywords = newKeywords.filter(k => k.trim().length > 0);
    if (validKeywords.length === 0 || (!newReply && newMessageLinks.every(l => !l))) return;

    // Capture current values for the API call
    const payload = { 
      id: editingKeywordId,
      keyword: validKeywords[0], // Legacy support
      keywords: validKeywords,
      reply: newReply, 
      message_links: newMessageLinks.filter(l => l.trim().length > 0),
      max_replies: Number(newMaxReplies) || 2,
      match_mode: newMatchMode
    };

    // Optimistic UI updates
    showNotification('success', editingKeywordId ? 'Keyword updated!' : 'Keyword added!');
    
    // Reset form immediately
    setNewKeywords([""]);
    setNewReply("");
    setNewMessageLinks([""]);
    setNewMaxReplies(2);
    setNewMatchMode('exact');
    setEditingKeywordId(null);

    // If we are editing, we might want to update the local list immediately to reflect changes
    // If adding, we can append to the list
    if (editingKeywordId) {
      setKeywords(prev => prev.map(k => k._id === editingKeywordId ? { ...k, ...payload, _id: k._id } as Keyword : k));
    } else {
      // For new items, we don't have an ID yet, so we can't easily add to the list without causing key issues or duplicates when we refetch.
      // But we can just leave the list as is, and let the background fetch update it.
      // The user sees the form cleared and "Success", which feels instant.
    }

    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        // Refresh list to get the real ID and ensure consistency
        fetchKeywords();
      } else {
        // If failed, we should probably notify the user. 
        // Since we already cleared the form, this is a bit awkward, but better than blocking.
        const data = await res.json();
        showNotification('error', data?.error || 'Failed to save keyword on server');
        // Optionally restore the form data here if needed, but for now just erroring is enough.
      }
    } catch (err) {
      showNotification('error', 'Connection error: Failed to save keyword');
    }
  };

  const handleEditKeyword = (kw: Keyword) => {
    // Load keywords (legacy or new array)
    const kws = kw.keywords && kw.keywords.length > 0 
      ? [...kw.keywords] 
      : (kw.keyword ? [kw.keyword] : [""]);
    setNewKeywords(kws);
    
    setNewReply(kw.reply || "");
    const links = kw.message_links && kw.message_links.length > 0 
      ? [...kw.message_links] 
      : (kw.message_link ? [kw.message_link] : [""]);
    setNewMessageLinks(links);
    setNewMaxReplies(kw.max_replies || 2);
    setNewMatchMode(kw.match_mode || 'exact');
    setEditingKeywordId(kw._id);
    // Scroll to top of the keyword section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setNewKeywords([""]);
    setNewReply("");
    setNewMessageLinks([""]);
    setNewMaxReplies(2);
    setNewMatchMode('exact');
    setEditingKeywordId(null);
  };

  const addKeywordField = () => {
    if (newKeywords.length < 20) {
      setNewKeywords([...newKeywords, ""]);
    }
  };

  const removeKeywordField = (index: number) => {
    if (newKeywords.length > 1) {
      const newKws = [...newKeywords];
      newKws.splice(index, 1);
      setNewKeywords(newKws);
    } else {
      setNewKeywords([""]);
    }
  };

  const updateKeywordField = (index: number, value: string) => {
    const newKws = [...newKeywords];
    newKws[index] = value;
    setNewKeywords(newKws);
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
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-black' : 'bg-slate-50'}`}>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="text-emerald-500" size={40} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-black text-white' : 'bg-slate-50 text-slate-800'} font-sans pb-24 relative overflow-x-hidden`}>
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
      <header className={`px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-500 ${darkMode ? 'bg-black/40 border-white/10' : 'bg-white/40 border-black/5'}`}>
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-xl rotate-3 opacity-40 group-hover:rotate-6 transition-transform duration-500"></div>
            <div className={`relative w-full h-full rounded-xl overflow-hidden flex items-center justify-center border transition-colors duration-500 ${darkMode ? 'bg-neutral-900 border-white/10' : 'bg-white border-black/5'}`}>
              <img src="/logo.svg" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className={`font-black text-xl tracking-tight leading-none transition-colors duration-500 gradient-text`}>UserBot</h1>
            <span className="text-[9px] font-black text-emerald-500 tracking-widest uppercase block">Management</span>
          </div>
        </div>
        
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all duration-300 ${stats?.isUserBotConnected ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${stats?.isUserBotConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span>{stats?.isUserBotConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </header>

      {/* Floating Dark Mode Button */}
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className={`fixed bottom-24 right-4 z-50 p-4 rounded-full shadow-xl transition-all ${darkMode ? 'bg-neutral-900 text-yellow-400 hover:bg-neutral-800 border border-neutral-800' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}`}
      >
        {darkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      <main 
        className="p-4 max-w-md mx-auto relative z-10"
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
                    className={`p-6 rounded-[2.5rem] border transition-all duration-500 card-3d glow-emerald relative overflow-hidden group ${darkMode ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200 shadow-xl shadow-emerald-500/10'}`}
                  >
                    <div className={`absolute inset-0 pattern-dots opacity-[0.07] pointer-events-none ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <div className="relative z-10 pointer-events-auto">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/20 text-emerald-600'}`}>
                        <BarChart3 size={24} />
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-emerald-300/60' : 'text-emerald-600/60'}`}>Total Topics</p>
                      <h3 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-emerald-900'}`}>{stats?.topicCount || 0}</h3>
                    </div>
                  </motion.div>

                  <motion.div 
                    whileHover={{ y: -8, scale: 1.02 }}
                    initial={{ opacity: 0, y: 30, rotateX: -10 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, type: "spring" }}
                    className={`p-6 rounded-[2.5rem] border transition-all duration-500 card-3d glow-blue relative overflow-hidden group ${darkMode ? 'bg-blue-950/40 border-blue-500/30' : 'bg-blue-50 border-blue-200 shadow-xl shadow-blue-500/10'}`}
                  >
                    <div className={`absolute inset-0 pattern-grid opacity-[0.05] pointer-events-none ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <div className="relative z-10 pointer-events-auto">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/20 text-blue-600'}`}>
                        <LayoutDashboard size={24} />
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-blue-300/60' : 'text-blue-600/60'}`}>Today</p>
                      <h3 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-blue-900'}`}>{stats?.todayTopicCount || 0}</h3>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 30, rotateX: -10 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
                    whileHover={{ y: -8 }}
                    className={`col-span-2 p-8 rounded-[2.5rem] border transition-all duration-500 flex items-center justify-between card-3d glow-amber relative overflow-hidden group ${darkMode ? 'bg-amber-950/40 border-amber-500/30' : 'bg-amber-50 border-amber-200 shadow-xl shadow-amber-500/10'}`}
                  >
                    <div className={`absolute inset-0 pattern-lines opacity-[0.05] pointer-events-none ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                    <div className="relative z-10 pointer-events-auto">
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-amber-300/60' : 'text-amber-600/60'}`}>Response Delay</p>
                      <h3 className={`text-4xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-amber-900'}`}>
                        {stats?.delaySeconds || 0}<span className="text-lg font-medium opacity-40 ml-1">sec</span>
                      </h3>
                    </div>
                    <div className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-500/20 text-amber-600'}`}>
                      <RefreshCw size={28} />
                    </div>
                  </motion.div>
              </div>

              {/* System Pause/Resume Button */}
              <motion.button
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleTogglePause}
                className={`w-full p-8 rounded-[2.5rem] border flex items-center justify-between transition-all duration-500 relative overflow-hidden group ${
                  stats?.isSystemPaused 
                    ? (darkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 glow-rose' : 'bg-rose-50 border-rose-200 text-rose-600 shadow-xl shadow-rose-500/10') 
                    : (darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 glow-emerald' : 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-xl shadow-emerald-500/10')
                }`}
              >
                <div className="flex items-center space-x-4 relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${
                    stats?.isSystemPaused 
                      ? (darkMode ? 'bg-rose-500/20 border-rose-500/30' : 'bg-white border-rose-200 shadow-sm') 
                      : (darkMode ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-white border-emerald-200 shadow-sm')
                  }`}>
                    {stats?.isSystemPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
                  </div>
                  <div className="text-left">
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 opacity-60`}>Auto Reply System</p>
                    <h3 className="text-xl font-bold tracking-tight">{stats?.isSystemPaused ? 'System Paused' : 'System Active'}</h3>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all ${
                  stats?.isSystemPaused 
                    ? (darkMode ? 'bg-rose-500/20 border-rose-500/30' : 'bg-white border-rose-200') 
                    : (darkMode ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-white border-emerald-200')
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
              className="space-y-6 w-full"
            >
              <div className={`border p-8 rounded-[2.5rem] space-y-8 transition-colors duration-500 glow-emerald relative overflow-hidden group ${darkMode ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200 shadow-xl shadow-emerald-500/10'}`}>
                <div className={`absolute inset-0 pattern-dots opacity-[0.05] pointer-events-none ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <div className="relative z-10 space-y-6 pointer-events-auto">
                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Welcome Message</label>
                    <textarea
                      value={autoReplyInput}
                      onChange={(e) => setAutoReplyInput(e.target.value)}
                      placeholder="Message sent to new users..."
                      rows={3}
                      className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all ${darkMode ? 'bg-emerald-500/5 border-emerald-500/20 text-white placeholder-white/20' : 'bg-emerald-50 border-emerald-200 text-slate-900 placeholder-slate-400'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Reply Delay (Seconds)</label>
                    <input
                      type="number"
                      value={delaySecondsInput}
                      onChange={(e) => setDelaySecondsInput(parseInt(e.target.value) || 0)}
                      className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all ${darkMode ? 'bg-blue-500/5 border-blue-500/20 text-white placeholder-white/20' : 'bg-blue-50 border-blue-200 text-slate-900 placeholder-slate-400'}`}
                    />
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-500/5 text-emerald-600'}`}>
                        <ImageIcon size={14} />
                      </div>
                      <h3 className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Photo Reply Settings</h3>
                    </div>
                    <button 
                      onClick={() => setPhotoReplyEnabled(!photoReplyEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${photoReplyEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
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
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Reply Message</label>
                          <textarea
                            value={photoReplyMessage}
                            onChange={(e) => setPhotoReplyMessage(e.target.value)}
                            placeholder="What should the bot say to photos?"
                            rows={2}
                            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm transition-all ${darkMode ? 'bg-amber-500/5 border-amber-500/20 text-white placeholder-white/20' : 'bg-amber-50 border-amber-200 text-slate-900 placeholder-slate-400'}`}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Topic Icon (Appended twice)</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={topicIcon}
                              onChange={(e) => setTopicIcon(e.target.value)}
                              placeholder="🛑"
                              className={`w-1/2 p-3 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm transition-all ${darkMode ? 'bg-amber-500/5 border-amber-500/20 text-white placeholder-white/20' : 'bg-amber-50 border-amber-200 text-slate-900 placeholder-slate-400'}`}
                            />
                            <div className={`flex-1 p-3 rounded-xl border text-sm ${darkMode ? 'bg-neutral-900 border-neutral-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                              Preview: Name {topicIcon}{topicIcon}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Topic Rename Trigger Keywords</label>
                          <div className="flex flex-col space-y-2">
                            <input
                              type="text"
                              value={topicRenameKeywords}
                              onChange={(e) => setTopicRenameKeywords(e.target.value)}
                              placeholder="e.g. done, completed, finished (leave empty for all photos)"
                              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm transition-all ${darkMode ? 'bg-amber-500/5 border-amber-500/20 text-white placeholder-white/20' : 'bg-amber-50 border-amber-200 text-slate-900 placeholder-slate-400'}`}
                            />
                            <div className="flex items-center space-x-2">
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Match Mode:</span>
                              <div className="flex bg-slate-100 dark:bg-neutral-900 rounded-lg p-1">
                                <button
                                  onClick={() => setTopicRenameMatchMode('exact')}
                                  className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${topicRenameMatchMode === 'exact' ? (darkMode ? 'bg-amber-500 text-white' : 'bg-white shadow-sm text-slate-900') : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}
                                >
                                  Exact
                                </button>
                                <button
                                  onClick={() => setTopicRenameMatchMode('partial')}
                                  className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${topicRenameMatchMode === 'partial' ? (darkMode ? 'bg-amber-500 text-white' : 'bg-white shadow-sm text-slate-900') : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}
                                >
                                  Partial
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Max Photo Replies per Topic</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={photoReplyMax}
                            onChange={(e) => setPhotoReplyMax(e.target.value === '' ? '' : parseInt(e.target.value) || 1)}
                            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm transition-all ${darkMode ? 'bg-amber-500/5 border-amber-500/20 text-white placeholder-white/20' : 'bg-amber-50 border-amber-200 text-slate-900 placeholder-slate-400'}`}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-500/5 text-blue-600'}`}>
                        <Bell size={14} />
                      </div>
                      <h3 className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Notification Settings</h3>
                    </div>
                    <button 
                      onClick={() => setNotificationSoundEnabled(!notificationSoundEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notificationSoundEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
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
                        className="space-y-4 overflow-hidden"
                      >
                        <div className="grid grid-cols-3 gap-2">
                          {['default', 'bell', 'chime', 'ping', 'digital', 'rising', 'double', 'low', 'laser'].map((type) => (
                            <button
                              key={type}
                              onClick={() => {
                                setNotificationSoundType(type);
                                playNotificationSound(type);
                              }}
                              className={`py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                notificationSoundType === type 
                                  ? (darkMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600') 
                                  : (darkMode ? 'bg-neutral-950 border-neutral-800 text-slate-500 hover:text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-600')
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={requestNotificationPermission}
                          className={`w-full flex items-center justify-center space-x-2 py-3 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all ${darkMode ? 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                          <Bell size={14} />
                          <span>Test Notification</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-neutral-800">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-500/5 text-purple-600'}`}>
                      <Download size={14} />
                    </div>
                    <h3 className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Data Management</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={handleExportData}
                      className={`flex items-center justify-center space-x-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${darkMode ? 'bg-neutral-950 border-neutral-800 text-slate-300 hover:bg-neutral-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      <Download size={14} />
                      <span>Export</span>
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={importing}
                      className={`flex items-center justify-center space-x-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${darkMode ? 'bg-neutral-950 border-neutral-800 text-slate-300 hover:bg-neutral-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      <Upload size={14} />
                      <span>{importing ? '...' : 'Import'}</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImportData} accept=".json" className="hidden" />
                  </div>
                </div>

                <div className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleUpdateSettings}
                    disabled={saving}
                    className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg ${darkMode ? 'bg-emerald-600 text-white shadow-emerald-900/20 hover:bg-emerald-500' : 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600'}`}
                  >
                    {saving ? 'Saving...' : 'Save All Settings'}
                  </motion.button>
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
              <div ref={keywordsTopRef} className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-blue relative overflow-hidden group ${darkMode ? 'bg-blue-950/40 border-blue-500/30' : 'bg-blue-50 border-blue-200 shadow-xl shadow-blue-500/10'}`}>
                <div className={`absolute inset-0 pattern-grid opacity-[0.05] pointer-events-none ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <div className="relative z-10 space-y-4 pointer-events-auto">
                  <div className="flex items-center justify-between">
                    <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Trigger Keywords</label>
                    {newKeywords.length < 20 && (
                      <button 
                        onClick={addKeywordField}
                        className="text-blue-500 hover:text-blue-400 transition-colors flex items-center space-x-1"
                      >
                        <Plus size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Add</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="grid gap-2">
                    {newKeywords.map((kw, index) => (
                      <div key={index} className="flex items-center space-x-2 group">
                        <input
                          type="text"
                          value={kw}
                          onChange={(e) => updateKeywordField(index, e.target.value)}
                          placeholder="e.g. hello"
                          className={`flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all ${darkMode ? 'bg-blue-500/5 border-blue-500/20 text-white placeholder-white/20' : 'bg-blue-50 border-blue-200 text-slate-900 placeholder-slate-400'}`}
                        />
                        {newKeywords.length > 1 && (
                          <button 
                            onClick={() => removeKeywordField(index)}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Match Mode</label>
                    <div className={`flex p-1 rounded-xl w-full ${darkMode ? 'bg-neutral-950/40 border border-white/10' : 'bg-slate-100'}`}>
                      <button
                        onClick={() => setNewMatchMode('exact')}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${newMatchMode === 'exact' ? (darkMode ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-blue-600 shadow-sm') : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Exact
                      </button>
                      <button
                        onClick={() => setNewMatchMode('partial')}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${newMatchMode === 'partial' ? (darkMode ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-blue-600 shadow-sm') : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Partial
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Max Replies</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newMaxReplies}
                      onChange={(e) => setNewMaxReplies(e.target.value === '' ? '' : parseInt(e.target.value))}
                      className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all ${darkMode ? 'bg-blue-500/5 border-blue-500/20 text-white placeholder-white/20' : 'bg-blue-50 border-blue-200 text-slate-900 placeholder-slate-400'}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Reply Message</label>
                  <textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="What should the bot say?"
                    rows={2}
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all ${darkMode ? 'bg-blue-500/5 border-blue-500/20 text-white placeholder-white/20' : 'bg-blue-50 border-blue-200 text-slate-900 placeholder-slate-400'}`}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Forward Content (Optional)</label>
                    {newMessageLinks.length < 6 && (
                      <button 
                        onClick={addUrlField}
                        className="text-blue-500 hover:text-blue-400 transition-colors flex items-center space-x-1"
                      >
                        <Plus size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Add</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="grid gap-2">
                    {newMessageLinks.map((link, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={link}
                          onChange={(e) => updateUrlField(index, e.target.value)}
                          placeholder="Telegram message link..."
                          className={`flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all ${darkMode ? 'bg-blue-500/5 border-blue-500/20 text-white placeholder-white/20' : 'bg-blue-50 border-blue-200 text-slate-900 placeholder-slate-400'}`}
                        />
                        {newMessageLinks.length > 1 && (
                          <button 
                            onClick={() => removeUrlField(index)}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleAddKeyword}
                    className={`flex-1 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center space-x-2 shadow-lg ${darkMode ? 'bg-emerald-600 text-white shadow-emerald-900/20 hover:bg-emerald-500' : 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600'}`}
                  >
                    {editingKeywordId ? <RefreshCw size={16} /> : <Plus size={16} />}
                    <span>{editingKeywordId ? 'Update Rule' : 'Create Rule'}</span>
                  </motion.button>
                  {editingKeywordId && (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={cancelEdit}
                      className={`px-6 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all ${darkMode ? 'bg-neutral-800 text-slate-300 hover:bg-neutral-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      <X size={18} />
                    </motion.button>
                  )}
                </div>
              </div>

              {keywords.length > 0 && (
                <div className="space-y-4">
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      <Search size={18} />
                    </div>
                    <input
                      type="text"
                      value={keywordSearch}
                      onChange={(e) => setKeywordSearch(e.target.value)}
                      placeholder="Search keywords or replies..."
                      className={`w-full pl-11 pr-4 py-3.5 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all ${darkMode ? 'bg-neutral-900/50 border-white/10 text-white placeholder-white/20' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'}`}
                    />
                    {keywordSearch && (
                      <button 
                        onClick={() => setKeywordSearch("")}
                        className={`absolute inset-y-0 right-0 pr-4 flex items-center ${darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {keywords.filter(kw => {
                      const searchLower = keywordSearch.toLowerCase();
                      const kws = (kw.keywords && kw.keywords.length > 0 ? kw.keywords : [kw.keyword]);
                      const matchesKeyword = kws.some(k => k?.toLowerCase().includes(searchLower));
                      const matchesReply = kw.reply?.toLowerCase().includes(searchLower);
                      return matchesKeyword || matchesReply;
                    }).map(kw => (
                      <motion.div 
                      layout
                      key={kw._id}
                      whileHover={{ scale: 1.01, y: -2 }}
                      className={`p-6 rounded-[2rem] border transition-all duration-500 flex items-start justify-between relative overflow-hidden ${darkMode ? 'bg-emerald-950/20 border-emerald-500/20 backdrop-blur-sm' : 'bg-emerald-50/50 border-emerald-100 shadow-sm hover:shadow-md'}`}
                    >
                      <div className={`absolute inset-0 pattern-dots opacity-[0.03] ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <div className="relative z-10 flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {(kw.keywords && kw.keywords.length > 0 ? kw.keywords : [kw.keyword]).map((k, i) => (
                            <span key={i} className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-500/5 text-emerald-600'}`}>
                              {k}
                            </span>
                          ))}
                        </div>
                        
                        <div className="space-y-2">
                          <p className={`text-sm font-medium leading-relaxed ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            {kw.reply || <span className="italic opacity-40">No reply message</span>}
                          </p>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center space-x-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                              <RefreshCw size={10} />
                              <span>Max: {kw.max_replies || 2}</span>
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
                      
                      <div className="flex flex-col space-y-2 ml-4">
                        <button 
                          onClick={() => handleEditKeyword(kw)}
                          className={`p-2.5 rounded-xl transition-all ${darkMode ? 'bg-neutral-800 text-slate-400 hover:text-emerald-400' : 'bg-slate-50 text-slate-400 hover:text-emerald-600'}`}
                        >
                          <Settings size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteKeyword(kw._id)}
                          className={`p-2.5 rounded-xl transition-all ${darkMode ? 'bg-neutral-800 text-slate-400 hover:text-rose-400' : 'bg-slate-50 text-slate-400 hover:text-rose-600'}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}

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
                <div className="fixed bottom-24 left-4 flex flex-col space-y-2 z-40">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={scrollToKeywordsTop}
                    className={`p-3 rounded-full shadow-lg border transition-all ${darkMode ? 'bg-neutral-900 border-white/10 text-blue-400' : 'bg-white border-slate-200 text-blue-600'}`}
                  >
                    <ArrowUp size={20} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={scrollToKeywordsBottom}
                    className={`p-3 rounded-full shadow-lg border transition-all ${darkMode ? 'bg-neutral-900 border-white/10 text-blue-400' : 'bg-white border-slate-200 text-blue-600'}`}
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
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Broadcast Message</label>
                  <textarea
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Type your announcement here..."
                    className={`w-full h-48 p-4 border rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none text-sm transition-all ${darkMode ? 'bg-purple-500/5 border-purple-500/20 text-white placeholder-white/20' : 'bg-purple-50 border-purple-200 text-slate-900 placeholder-slate-400'}`}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleBroadcast}
                  disabled={broadcasting || !broadcastMessage.trim()}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg ${darkMode ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500' : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-purple-500/20'}`}
                >
                  <Send size={16} />
                  <span>{broadcasting ? 'Sending...' : 'Broadcast Now'}</span>
                </motion.button>
              </div>

              <div className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-amber relative overflow-hidden group ${darkMode ? 'bg-amber-950/40 border-amber-500/30' : 'bg-amber-50 border-amber-200 shadow-xl shadow-amber-500/10'}`}>
                <div className={`absolute inset-0 pattern-grid opacity-[0.05] pointer-events-none ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
                <div className="relative z-10 space-y-4 pointer-events-auto">
                  <div className="flex items-center justify-between">
                    <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Keyword Reset Settings</label>
                    <RotateCcw size={16} className="text-amber-500" />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-2xl border bg-white/5 backdrop-blur-sm border-white/10">
                    <div className="space-y-1">
                      <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Auto Reset Keywords</p>
                      <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Automatically reset keyword limits daily at 12:00 AM IST</p>
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

              <div className="fixed bottom-24 left-4 flex flex-col space-y-2 z-40">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={scrollToCastTop}
                  className={`p-3 rounded-full shadow-lg border transition-all ${darkMode ? 'bg-neutral-900 border-white/10 text-purple-400' : 'bg-white border-slate-200 text-purple-600'}`}
                >
                  <ArrowUp size={20} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={scrollToCastBottom}
                  className={`p-3 rounded-full shadow-lg border transition-all ${darkMode ? 'bg-neutral-900 border-white/10 text-purple-400' : 'bg-white border-slate-200 text-purple-600'}`}
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
                      <button 
                        onClick={fetchStats}
                        className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest hover:underline"
                      >
                        Refresh Status
                      </button>
                      <button 
                        onClick={handleLogout}
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-slate-500/20 text-slate-400' : 'bg-slate-500/10 text-slate-600'}`}>
                        <FileText size={14} />
                      </div>
                      <h3 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>System Logs</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={fetchLogs}
                        disabled={refreshingLogs}
                        className={`p-2 rounded-xl transition-all ${darkMode ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-emerald-600 hover:bg-emerald-600/10'}`}
                      >
                        <RefreshCw size={16} className={refreshingLogs ? 'animate-spin' : ''} />
                      </button>
                      <button 
                        onClick={clearLogs}
                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${darkMode ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {logs.length === 0 ? (
                    <div className="text-center py-12 opacity-40 italic text-sm">No logs recorded yet.</div>
                  ) : (
                    logs.map(log => (
                      <div 
                        key={log._id}
                        className={`p-5 rounded-[1.5rem] border transition-all relative overflow-hidden ${
                          darkMode ? 'bg-neutral-950/60 border-emerald-500/20' : 'bg-emerald-50/30 border-emerald-100 shadow-sm'
                        }`}
                      >
                        <div className={`absolute inset-0 pattern-dots opacity-[0.02] ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-2">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${
                              log.level === 'error' ? 'bg-rose-500/20 text-rose-400' : 
                              log.level === 'warn' ? 'bg-amber-500/20 text-amber-400' : 
                              'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {log.level}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono opacity-60">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className={`text-xs font-medium mb-1 leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{log.message}</p>
                          {log.details && (
                            <pre className={`mt-2 text-[9px] p-3 rounded-xl overflow-x-auto font-mono ${
                              darkMode ? 'bg-black/40 text-neutral-500' : 'bg-white border border-black/5 text-slate-500'
                            }`}>
                              {log.details}
                            </pre>
                          )}
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
      <nav className={`fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t px-4 pb-safe pt-2 flex items-center justify-around z-50 transition-colors duration-500 ${darkMode ? 'bg-black/40 border-white/10' : 'bg-white/40 border-black/5'}`}>
        <TabButton id="dashboard" icon={LayoutDashboard} label="Home" activeTab={activeTab} setActiveTab={setActiveTab} setDirection={setDirection} darkMode={darkMode} />
        <TabButton id="keywords" icon={Hash} label="Words" activeTab={activeTab} setActiveTab={setActiveTab} setDirection={setDirection} darkMode={darkMode} />
        <TabButton id="broadcast" icon={Send} label="Cast" activeTab={activeTab} setActiveTab={setActiveTab} setDirection={setDirection} darkMode={darkMode} />
        <TabButton id="settings" icon={Settings} label="Set" activeTab={activeTab} setActiveTab={setActiveTab} setDirection={setDirection} darkMode={darkMode} />
        <TabButton id="user" icon={User} label="User" activeTab={activeTab} setActiveTab={setActiveTab} setDirection={setDirection} darkMode={darkMode} />
        <TabButton id="logs" icon={FileText} label="Logs" activeTab={activeTab} setActiveTab={setActiveTab} setDirection={setDirection} darkMode={darkMode} />
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
                : notification.type === 'warn'
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : notification.type === 'warn' ? <ShieldAlert size={20} /> : <AlertCircle size={20} />}
            <span className="font-bold text-sm">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
    </div>
  );
}
