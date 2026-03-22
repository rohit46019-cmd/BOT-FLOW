import React, { useState, useEffect, useRef } from "react";
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
  Check
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
  hasSession: boolean;
  isDuplicateSession: boolean;
  lastLogoutTime?: string;
  lastLogoutTimeISO?: string;
  lastLogoutReason?: string;
  sessionStartTime?: string;
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

export default function App() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sessionRunningTime, setSessionRunningTime] = useState<string>("");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (stats?.isUserBotConnected && stats?.sessionStartTime) {
      const startTime = parseInt(stats.sessionStartTime, 10);
      const updateTimer = () => {
        const now = Date.now();
        const diff = now - startTime;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setSessionRunningTime(`${hours}h ${minutes}m ${seconds}s`);
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setSessionRunningTime("");
    }
    return () => clearInterval(interval);
  }, [stats?.isUserBotConnected, stats?.sessionStartTime]);
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
  const [newKeywords, setNewKeywords] = useState<string[]>([""]); // Changed from single string to array
  const [newReply, setNewReply] = useState("");
  const [newMatchMode, setNewMatchMode] = useState<'exact' | 'partial'>('exact');
  const [newMessageLinks, setNewMessageLinks] = useState<string[]>([""]);
  const [newMaxReplies, setNewMaxReplies] = useState<number | string>(0);
  const [newAiReplyEnabled, setNewAiReplyEnabled] = useState(false);
  const [keywordSearch, setKeywordSearch] = useState("");
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
  const [logoutElapsedTime, setLogoutElapsedTime] = useState<number>(0);

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
    if (stats?.isUserBotConnected || !stats?.lastLogoutTimeISO) {
      setLogoutElapsedTime(0);
      return;
    }
    
    const logoutDate = new Date(stats.lastLogoutTimeISO);
    const update = () => {
      const diff = Date.now() - logoutDate.getTime();
      if (isNaN(diff) || diff < 0) {
        setLogoutElapsedTime(0);
      } else {
        setLogoutElapsedTime(Math.floor(diff / 1000));
      }
    };
    
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [stats?.isUserBotConnected, stats?.lastLogoutTimeISO]);

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
  const logoutTimer = formatTime(logoutElapsedTime);

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
      const data = await response.json();
      setBlockedTopics(data);
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

  const handleTestNotification = async () => {
    try {
      const response = await fetch('/api/test-notification', { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        showNotification('success', 'Test notification sent to Telegram group!');
      } else {
        showNotification('error', data.error || 'Failed to send test notification');
      }
    } catch (err) {
      showNotification('error', 'Failed to send test notification');
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
        
        // Unsubscribe from any existing subscription to ensure we use the latest VAPID keys
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          await existingSub.unsubscribe();
          console.log('Unsubscribed from existing push subscription');
        }

        // Get VAPID public key from server
        const response = await fetch('/api/push/vapid-public-key');
        const { publicKey } = await response.json();
        
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
        } else if (parsed.type === 'USERBOT_LOGOUT') {
          const reason = parsed.reason;
          const time = parsed.time;
          
          // Update stats locally to reflect disconnection
          setStats(prev => prev ? { 
            ...prev, 
            isUserBotConnected: false,
            lastLogoutTime: time,
            lastLogoutReason: reason
          } : null);
          
          // Show in-app notification
          showNotification('error', `UserBot Logged Out: ${reason}`);
          
          // Play sound if enabled
          if (notificationSoundEnabled) {
            playNotificationSound();
          }
          
          // Show system notification
          if ("Notification" in window && Notification.permission === "granted") {
            const options = {
              body: `UserBot Logged Out: ${reason} at ${new Date(time).toLocaleTimeString()}`,
              icon: "/logo.svg",
              silent: false,
              requireInteraction: true,
              tag: 'userbot-logout'
            };
            
            try {
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(reg => reg.showNotification("UserBot Logout", options));
              } else {
                new Notification("UserBot Logout", options);
              }
            } catch (e) {
              console.error("Logout notification failed", e);
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
      if (!res.ok) {
        const text = await res.text();
        if (text.includes("Rate exceeded")) return;
        throw new Error(`Server error: ${res.status}`);
      }
      const data = await res.json();
      setKeywords(data);
    } catch (err: any) {
      if (err.message !== "Failed to fetch") {
        console.error("Failed to fetch keywords", err);
      }
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
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
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
      
      const data = await res.json();
      if (res.ok) {
        setTestReply(data.reply);
      } else {
        showNotification('error', data.error || 'Test failed');
      }
    } catch (err) {
      showNotification('error', 'Connection error');
    } finally {
      setIsTesting(false);
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

  const fetchMissedCount = async () => {
    try {
      const res = await fetch("/api/missed-count");
      if (!res.ok) return;
      const data = await res.json();
      setMissedCount(data.count || 0);
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
      const data = await res.json();
      if (data.success) {
        if (data.cancelled) {
          showNotification('warn', `Catch up cancelled. Processed ${data.count} keywords.`);
        } else {
          showNotification('success', `Caught up with ${data.count} missed keywords`);
        }
        setShowScanModal(false);
        fetchMissedCount();
        fetchStats();
      } else {
        showNotification('error', data.error || 'Catch up failed');
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
      const data = await res.json();
      if (data.success) {
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
        showNotification('error', data.error || 'Scan failed');
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

  const handleTestPush = async () => {
    try {
      const res = await fetch('/api/push/test', { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        showNotification('success', 'Test notification sent! Check your device notifications.');
      } else {
        showNotification('error', 'Failed to send test notification');
      }
    } catch (err) {
      showNotification('error', 'Error testing notifications');
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
    if (validKeywords.length === 0 || (!newReply && newMessageLinks.every(l => !l) && !newAiReplyEnabled)) return;

    // Capture current values for the API call
    const payload = { 
      id: editingKeywordId,
      keyword: validKeywords[0], // Legacy support
      keywords: validKeywords,
      reply: newReply, 
      message_links: newMessageLinks.filter(l => l.trim().length > 0),
      max_replies: Number(newMaxReplies) || 0,
      match_mode: newMatchMode,
      ai_reply_enabled: newAiReplyEnabled
    };

    // Optimistic UI updates
    showNotification('success', editingKeywordId ? 'Keyword updated!' : 'Keyword added!');
    
    // Reset form immediately
    setNewKeywords([""]);
    setNewReply("");
    setNewMessageLinks([""]);
    setNewMaxReplies(2);
    setNewMatchMode('exact');
    setNewAiReplyEnabled(false);
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

  const verifyKey = async (key: string) => {
    if (!key) return;
    showNotification('warn', 'Verifying key...');
    try {
      const res = await fetch("/api/verify-gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', 'API Key is valid and connected!');
      } else {
        showNotification('error', `Invalid Key: ${data.error}`);
      }
    } catch (err) {
      showNotification('error', 'Verification failed: Network error');
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
    setNewMaxReplies(kw.max_replies !== undefined ? kw.max_replies : 0);
    setNewMatchMode(kw.match_mode || 'exact');
    setNewAiReplyEnabled(!!kw.ai_reply_enabled);
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
    setNewAiReplyEnabled(false);
    setEditingKeywordId(null);
  };

  const addKeywordField = () => {
    setNewKeywords([...newKeywords, ""]);
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout
    
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const data = await res.json().catch(() => null);

      if (res.ok) {
        setAuthStep('code');
        showNotification('success', 'Code sent!');
      } else {
        showNotification('error', data?.error || `Failed to send code: ${res.statusText}`);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        showNotification('error', 'Request timed out. Please check your API ID/Hash and try again.');
      } else {
        console.error(err);
        showNotification('error', 'Connection error: Check console');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignIn = async () => {
    setAuthLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout
    
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, password }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
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
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        showNotification('error', 'Request timed out. Please try again.');
      } else {
        console.error(err);
        showNotification('error', 'Connection error: Check console');
      }
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
    if (!confirm("Are you sure you want to logout?")) return;
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
        duration: 0.2, 
        ease: 'easeOut'
      }
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-20%' : '20%',
      opacity: 0,
      transition: { 
        type: 'tween', 
        duration: 0.2, 
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
      <header className={`px-6 py-4 flex items-center justify-between fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-all duration-500 ${darkMode ? 'bg-black/40 border-white/10' : 'bg-white/40 border-black/5'}`}>
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-xl rotate-3 opacity-40 group-hover:rotate-6 transition-transform duration-500"></div>
            <div className={`relative w-full h-full rounded-xl overflow-hidden flex items-center justify-center border transition-colors duration-500 ${darkMode ? 'bg-neutral-900 border-white/10' : 'bg-white border-black/5'}`}>
              <img src="/logo.svg" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className={`font-black text-xl tracking-tight leading-none transition-colors duration-500 gradient-text`}>ROHIT'S USERBOT</h1>
            <span className="text-[9px] font-black text-emerald-500 tracking-widest uppercase block">Management</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all duration-300 ${
            stats?.isUserBotConnected 
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
              : stats?.isDuplicateSession
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              stats?.isUserBotConnected 
                ? 'bg-emerald-500 animate-pulse' 
                : stats?.isDuplicateSession
                  ? 'bg-amber-500 animate-bounce'
                  : 'bg-rose-500'
            }`} />
            <span>
              {stats?.isUserBotConnected 
                ? 'Connected' 
                : stats?.isDuplicateSession
                  ? 'Duplicate Session'
                  : 'Disconnected'}
            </span>
            {stats?.isUserBotConnected && sessionRunningTime && (
              <span className="ml-2 pl-2 border-l border-emerald-500/20 text-emerald-500/70 lowercase font-mono tracking-normal">
                {sessionRunningTime}
              </span>
            )}
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-xl transition-all ${darkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-black/5'}`}
            >
              <MoreVertical size={20} />
            </button>
            
            <AnimatePresence>
              {isMenuOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMenuOpen(false)}
                    className="fixed inset-0 z-[60]"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10, x: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10, x: 10 }}
                    className={`absolute right-0 mt-2 w-48 rounded-2xl shadow-2xl border z-[70] overflow-hidden backdrop-blur-xl ${darkMode ? 'bg-neutral-900/90 border-white/10' : 'bg-white/90 border-black/5'}`}
                  >
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => {
                          setActiveTab('analytics');
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'analytics' ? (darkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-50 text-cyan-600') : (darkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-black/5')}`}
                      >
                        <PieChart size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Analytics</span>
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm("Are you sure you want to clear all data?")) {
                            await fetch("/api/data/clear", { method: "DELETE" });
                            setIsMenuOpen(false);
                            window.location.reload();
                          }
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${darkMode ? 'text-rose-400 hover:bg-white/5' : 'text-rose-600 hover:bg-black/5'}`}
                      >
                        <Trash size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Clear All Data</span>
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm("Are you sure you want to delete the last keyword?")) {
                            await fetch("/api/data/last-import", { method: "DELETE" });
                            setIsMenuOpen(false);
                            window.location.reload();
                          }
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${darkMode ? 'text-rose-400 hover:bg-white/5' : 'text-rose-600 hover:bg-black/5'}`}
                      >
                        <Trash2 size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Delete Last Keyword</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('tester');
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'tester' ? (darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-50 text-orange-600') : (darkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-black/5')}`}
                      >
                        <Bot size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">AI Test</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('media');
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'media' ? (darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600') : (darkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-black/5')}`}
                      >
                        <Library size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Media Library</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('insights');
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'insights' ? (darkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-50 text-rose-600') : (darkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-black/5')}`}
                      >
                        <BarChart3 size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">Insights</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('user');
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'user' ? (darkMode ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-50 text-pink-600') : (darkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-black/5')}`}
                      >
                        <User size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">User Profile</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
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
        className="p-4 pt-20 max-w-md mx-auto relative z-10"
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
              {!stats?.isUserBotConnected && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setActiveTab('user')}
                  className={`p-5 rounded-[2.5rem] border flex items-center justify-between cursor-pointer transition-all duration-500 glow-rose ${darkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-rose-50 border-rose-200 text-rose-600 shadow-xl shadow-rose-500/10'}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-500/10 text-rose-600'}`}>
                      <ShieldAlert size={24} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest">UserBot Disconnected</h3>
                      <p className="text-[10px] font-bold opacity-60">
                        {logoutTimer.days > 0 || logoutTimer.time !== "00:00:00" 
                          ? `Offline for ${logoutTimer.days > 0 ? `${logoutTimer.days}d ` : ''}${logoutTimer.time}`
                          : 'Bot is currently offline'}
                      </p>
                      {stats?.lastLogoutReason && (
                        <p className="text-[9px] font-black text-rose-400 mt-1 uppercase tracking-tighter">
                          Reason: {stats.lastLogoutReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); fetchStats(); }}
                      className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${darkMode ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50'}`}
                    >
                      Try Reconnect
                    </button>
                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${darkMode ? 'border-rose-500/30 bg-rose-500/10' : 'border-rose-200 bg-white'}`}>
                      Fix Now
                    </div>
                  </div>
                </motion.div>
              )}

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
                        <Key size={24} />
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-emerald-300/60' : 'text-emerald-600/60'}`}>Active Keywords</p>
                      {loading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        <h3 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-emerald-900'}`}>{stats?.keywordCount || 0}</h3>
                      )}
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
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-blue-300/60' : 'text-blue-600/60'}`}>Today / Total Topics</p>
                      {loading ? (
                        <Skeleton className="h-8 w-24" />
                      ) : (
                        <h3 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-blue-900'}`}>
                          {stats?.todayTopicCount || 0} <span className="text-sm font-medium opacity-40 ml-1">/ {stats?.topicCount || 0}</span>
                        </h3>
                      )}
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
                      <motion.h3 
                        className={`text-6xl font-black tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent`}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        {stats?.delaySeconds || 0}<span className="text-2xl font-medium opacity-40 ml-1 text-amber-900">sec</span>
                      </motion.h3>
                    </div>
                    <div className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-500/20 text-amber-600'}`}>
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
                            ? (darkMode ? 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed')
                            : (darkMode ? 'bg-amber-950/40 border-amber-500/30 text-amber-400 hover:bg-amber-900/50' : 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 shadow-xl shadow-amber-500/10')
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-500/20 text-amber-600'}`}>
                            {isCatchingUp ? <RefreshCw className="animate-spin" size={24} /> : <RotateCcw size={24} />}
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Manual Catch Up</p>
                            <h3 className="text-lg font-black tracking-tight">{missedCount > 0 ? `${missedCount} Missed Keywords` : 'No Missed Keywords'}</h3>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                          stats?.isSystemPaused 
                            ? 'border-slate-800 bg-slate-800/20' 
                            : 'border-amber-500/30 bg-amber-500/10'
                        }`}>
                          {stats?.isSystemPaused ? 'Unpause to Reply' : 'Reply Now'}
                        </div>
                      </button>

                      <button
                        onClick={handleScanMissed}
                        disabled={isScanningMissed}
                        className={`w-full p-6 rounded-[2.5rem] border transition-all duration-500 flex items-center justify-between group relative overflow-hidden ${
                          darkMode ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-400 hover:bg-indigo-900/50' : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100 shadow-xl shadow-indigo-500/10'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-500/20 text-indigo-600'}`}>
                            {isScanningMissed ? <RefreshCw className="animate-spin" size={24} /> : <Search size={24} />}
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Scan Missed</p>
                            <h3 className="text-lg font-black tracking-tight">Scan Recent Topics</h3>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/30 bg-indigo-500/10`}>
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
                      <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-500/5 text-purple-600'}`}>
                        <MessageSquare size={14} />
                      </div>
                      <h3 className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>AI Smart Reply</h3>
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
                        className="space-y-4 overflow-hidden"
                      >
                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Gemini API Keys (Rotation)</label>
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
                                  className={`flex-1 p-2 border rounded-lg outline-none text-sm ${darkMode ? 'bg-purple-500/5 border-purple-500/20 text-white' : 'bg-purple-50 border-purple-200 text-slate-900'}`}
                                />
                                <button
                                  onClick={() => verifyKey(key)}
                                  disabled={!key}
                                  className={`p-2 rounded-lg ${!key ? 'opacity-50 cursor-not-allowed' : ''} ${darkMode ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                  title="Verify Key"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    const newKeys = [...geminiApiKeys];
                                    newKeys.splice(index, 1);
                                    setGeminiApiKeys(newKeys);
                                  }}
                                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => setGeminiApiKeys([...geminiApiKeys, ""])}
                              className={`flex items-center space-x-1 text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}`}
                            >
                              <Plus size={12} />
                              <span>Add API Key</span>
                            </button>
                          </div>
                          <p className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            Add multiple keys to rotate automatically if one hits the rate limit.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>AI Persona / System Prompt</label>
                          <textarea
                            value={aiPersona}
                            onChange={(e) => setAiPersona(e.target.value)}
                            placeholder="You are a smart assistant for a Telegram store..."
                            rows={6}
                            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm transition-all ${darkMode ? 'bg-purple-500/5 border-purple-500/20 text-white placeholder-white/20' : 'bg-purple-50 border-purple-200 text-slate-900 placeholder-slate-400'}`}
                          />
                          <p className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            The AI will only reply if no keywords match. It can reply in Hinglish, Hindi, or English based on this persona.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-500/5 text-indigo-600'}`}>
                        <Bell size={14} />
                      </div>
                      <h3 className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Notification Settings</h3>
                    </div>
                    <button 
                      onClick={handleToggleNotificationSound}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notificationSoundEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSoundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col space-y-3">
                      <button
                        onClick={handleTestPush}
                        className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center space-x-2 border ${darkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20' : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'}`}
                      >
                        <Bell size={14} />
                        <span>Test Push Notification</span>
                      </button>
                      <button
                        onClick={handleTestNotification}
                        className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center space-x-2 border ${darkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'}`}
                      >
                        <MessageCircle size={14} />
                        <span>Test Telegram Notification</span>
                      </button>
                      <button
                        onClick={subscribeToPush}
                        className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center space-x-2 border ${darkMode ? 'bg-slate-500/10 border-slate-500/20 text-slate-400 hover:bg-slate-500/20' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                      >
                        <RefreshCw size={14} />
                        <span>Re-subscribe to Notifications</span>
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sound Type</label>
                      <select
                        value={notificationSoundType}
                        onChange={(e) => handleUpdateNotificationSoundType(e.target.value)}
                        className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition-all ${darkMode ? 'bg-indigo-500/5 border-indigo-500/20 text-white' : 'bg-indigo-50 border-indigo-200 text-slate-900'}`}
                      >
                        <option value="default">Default Alert</option>
                        <option value="modern">Modern Ping</option>
                        <option value="success">Success Chime</option>
                        <option value="error">Error Alert</option>
                        <option value="none">No Sound</option>
                      </select>
                    </div>
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
                      onClick={handleTogglePhotoReply}
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

                        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-neutral-800">
                          <div className="flex items-center justify-between">
                            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Second Reply Message</label>
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
                                  placeholder="Second message to send after the first one"
                                  rows={2}
                                  className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm transition-all mt-2 ${darkMode ? 'bg-amber-500/5 border-amber-500/20 text-white placeholder-white/20' : 'bg-amber-50 border-amber-200 text-slate-900 placeholder-slate-400'}`}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
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
                      onClick={handleToggleNotificationSound}
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
                              onClick={() => handleUpdateNotificationSoundType(type)}
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
              {keywords.length > 0 && (
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
              )}

              <div ref={keywordsTopRef} className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-blue relative overflow-hidden group ${darkMode ? 'bg-blue-950/40 border-blue-500/30' : 'bg-blue-50 border-blue-200 shadow-xl shadow-blue-500/10'}`}>
                <div className={`absolute inset-0 pattern-grid opacity-[0.05] pointer-events-none ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <div className="relative z-10 space-y-4 pointer-events-auto">
                  <div className="flex items-center justify-between">
                    <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Trigger Keywords</label>
                    <button 
                      onClick={addKeywordField}
                      className="text-blue-500 hover:text-blue-400 transition-colors flex items-center space-x-1"
                    >
                      <Plus size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Add</span>
                    </button>
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
                    <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Max Replies (0 = Unlimited)</label>
                    <input
                      type="number"
                      min="0"
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>AI Reply Override</label>
                    <button 
                      onClick={() => setNewAiReplyEnabled(!newAiReplyEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${newAiReplyEnabled ? 'bg-purple-500' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newAiReplyEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <p className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    If enabled, the AI will also try to reply to this keyword (using your persona).
                  </p>
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

                  <div className="space-y-3">
                    {keywords.filter(kw => {
                      const searchLower = keywordSearch.toLowerCase();
                      const kws = (kw.keywords && kw.keywords.length > 0 ? kw.keywords : [kw.keyword]);
                      const matchesKeyword = kws.some(k => k?.toLowerCase().includes(searchLower));
                      const matchesReply = kw.reply?.toLowerCase().includes(searchLower);
                      return matchesKeyword || matchesReply;
                    }).map((kw, index) => (
                      <motion.div 
                      layout
                      key={kw._id}
                      whileHover={{ scale: 1.01, y: -2 }}
                      className={`p-6 rounded-[2rem] border transition-all duration-500 flex items-start justify-between relative overflow-hidden ${darkMode ? 'bg-emerald-950/20 border-emerald-500/20 backdrop-blur-sm' : 'bg-emerald-50/50 border-emerald-100 shadow-sm hover:shadow-md'}`}
                    >
                      <div className={`absolute inset-0 pattern-dots opacity-[0.03] ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <div className="relative z-10 flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                            #{index + 1}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {(kw.keywords && kw.keywords.length > 0 ? kw.keywords : [kw.keyword]).map((k, i) => (
                              <span key={i} className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-500/5 text-emerald-600'}`}>
                                {k}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <p className={`text-sm font-medium leading-relaxed ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            {kw.reply || <span className="italic opacity-40">No reply message</span>}
                          </p>
                          
                          <div className="flex items-center gap-3">
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
                      <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Reply in General</p>
                      <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>If enabled, bot replies to keywords in the general section instead of the topic.</p>
                    </div>
                    <button
                      onClick={handleToggleReplyInGeneral}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${replyInGeneral ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${replyInGeneral ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-2xl border bg-white/5 backdrop-blur-sm border-white/10">
                    <div className="space-y-1">
                      <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Push Notifications</p>
                      <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {Notification.permission === 'granted' ? 'Notifications are enabled' : 'Enable notifications for photo alerts'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {Notification.permission === 'granted' && (
                        <button
                          onClick={testPush}
                          className={`p-2 rounded-xl transition-all ${darkMode ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                          title="Send Test Push"
                        >
                          <Send size={16} />
                        </button>
                      )}
                      <button
                        onClick={requestNotificationPermission}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${Notification.permission === 'granted' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${Notification.permission === 'granted' ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>
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
                    {stats?.lastLogoutTime && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-5 rounded-3xl border ${darkMode ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100'}`}
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`p-2 rounded-xl ${darkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-500/10 text-rose-600'}`}>
                            <AlertCircle size={18} />
                          </div>
                          <div>
                            <h4 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-rose-400' : 'text-rose-600'}`}>Last Logout</h4>
                            <p className={`text-[10px] font-bold ${darkMode ? 'text-rose-300/60' : 'text-rose-600/60'}`}>{stats.lastLogoutReason || 'Unknown Reason'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className={`text-[9px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Time Since Logout</p>
                            <div className="flex items-center space-x-2">
                              <span className={`text-2xl font-black ${darkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                                {logoutTimer.days > 0 && `${logoutTimer.days}d `}{logoutTimer.time}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-[9px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Logged Out At</p>
                            <p className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                              {stats.lastLogoutTime}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

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
      <nav className={`fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t px-2 pb-safe pt-2 flex items-center justify-around z-50 transition-colors duration-500 ${darkMode ? 'bg-black/40 border-white/10' : 'bg-white/40 border-black/5'}`}>
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

      <footer className={`py-8 text-center border-t transition-colors duration-500 ${darkMode ? 'border-slate-800/50 text-slate-500' : 'border-slate-200/50 text-slate-400'}`}>
        <p className="text-xs font-bold tracking-[0.2em] uppercase">Created by Rohit</p>
        <p className="text-[10px] mt-2 opacity-50">© 2026 ROHIT'S USERBOT PRO • All Rights Reserved</p>
      </footer>
    </motion.div>
  );
}
