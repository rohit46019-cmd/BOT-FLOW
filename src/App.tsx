import React, { useState, useEffect, useRef, useDeferredValue, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from 'react-hot-toast';
import { Skeleton } from './components/Skeleton';
import Dashboard from './components/Dashboard';
import KeywordsManager from './components/KeywordsManager';
import SettingsPanel from './components/SettingsPanel';
import CatchUpPage from './components/CatchUpPage';
import NotificationPanel from './components/NotificationPanel';
import PhotoStats from './components/PhotoStats';
import ActivityLogs from './components/ActivityLogs';
import BroadcastPanel from './components/BroadcastPanel';
import AutoBlockManager from './components/AutoBlockManager';
import Analytics from './components/Analytics';
import Tester from './components/Tester';
import Insights from './components/Insights';
import MediaManager from './components/MediaManager';
import UserManager from './components/UserManager';
import AddKeywordSection from './components/AddKeywordSection';
import { 
  MessageSquare, 
  LayoutGrid,
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
  ExternalLink,
  Image,
  Home,
  MessageSquareText,
  Megaphone,
  SlidersHorizontal,
  Terminal,
  Radio,
  Activity
} from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

interface Stats {
  topicCount: number;
  todayTopicCount: number;
  todayPhotoSentStats?: {
    count: number;
    topics: { name: string; link: string; time: string }[];
  };
  past24hPhotoSentStats?: {
    count: number;
    topics: { name: string; link: string; time: string }[];
  };
  keywordCount: number;
  autoReply: string;
  delaySeconds: number;
  keywordDelaySeconds: number;
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
  topicRenameEmoji: string;
  topicRenameKeywords: string;
  topicRenameMatchMode: 'exact' | 'partial';
  autoResetKeywords: boolean;
  autoBlockKeywords: string; // JSON string
  aiModeEnabled: boolean;
  aiPersona: string;
  geminiApiKeys: string; // JSON string
  replyInGeneral: boolean;
  sessionStartTime: number | null;
  lastLoginTime: string;
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

const TABS = ['dashboard', 'analytics', 'keywords', 'broadcast', 'settings', 'tester', 'user', 'logs', 'media', 'insights', 'photo_stats', 'catchup'] as const;
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
  const colors: Record<TabType, { bg: string, text: string, glow: string }> = {
    dashboard: { bg: 'from-emerald-400 to-emerald-600', text: 'text-emerald-500', glow: 'shadow-emerald-500/50' },
    analytics: { bg: 'from-cyan-400 to-cyan-600', text: 'text-cyan-500', glow: 'shadow-cyan-500/50' },
    keywords: { bg: 'from-blue-400 to-blue-600', text: 'text-blue-500', glow: 'shadow-blue-500/50' },
    broadcast: { bg: 'from-purple-400 to-purple-600', text: 'text-purple-500', glow: 'shadow-purple-500/50' },
    settings: { bg: 'from-amber-400 to-amber-600', text: 'text-amber-500', glow: 'shadow-amber-500/50' },
    tester: { bg: 'from-orange-400 to-orange-600', text: 'text-orange-500', glow: 'shadow-orange-500/50' },
    user: { bg: 'from-pink-400 to-pink-600', text: 'text-pink-500', glow: 'shadow-pink-500/50' },
    logs: { bg: 'from-slate-400 to-slate-600', text: 'text-slate-500', glow: 'shadow-slate-500/50' },
    media: { bg: 'from-indigo-400 to-indigo-600', text: 'text-indigo-500', glow: 'shadow-indigo-500/50' },
    insights: { bg: 'from-rose-400 to-rose-600', text: 'text-rose-500', glow: 'shadow-rose-500/50' },
    photo_stats: { bg: 'from-amber-400 to-amber-600', text: 'text-amber-500', glow: 'shadow-amber-500/50' },
    catchup: { bg: 'from-rose-400 to-rose-600', text: 'text-rose-500', glow: 'shadow-rose-500/50' }
  };

  const theme = colors[id] || colors.dashboard;

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
      className={`flex flex-col items-center justify-center py-2 px-1 sm:px-4 rounded-2xl transition duration-300 relative group ${
        isActive ? (darkMode ? "text-white" : "text-slate-900") : (darkMode ? `${theme.text} hover:text-white` : `${theme.text} hover:text-slate-900`)
      }`}
    >
      <div className={`p-2 rounded-xl transition duration-300 ${isActive ? `bg-gradient-to-tr ${theme.bg} shadow-lg ${theme.glow}` : `group-hover:bg-gradient-to-tr group-hover:${theme.bg} group-hover:shadow-lg group-hover:${theme.glow} bg-transparent`}`}>
        <Icon strokeWidth={2.5} className={`w-7 h-7 sm:w-8 sm:h-8 transition duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${isActive ? "scale-110 text-white" : `group-hover:scale-110 group-hover:text-white ${darkMode ? 'drop-shadow-[0_0_8px_currentColor]' : ''}`}`} />
      </div>
      <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest mt-1 transition ${isActive ? "opacity-100" : "opacity-70"}`}>{label}</span>
      {isActive && (
        <motion.div 
          layoutId="activeTab"
          className={`absolute -bottom-1 w-6 h-1 bg-gradient-to-r ${theme.bg} rounded-full`}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </button>
  );
};

const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export default function App() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [autoReplyInput, setAutoReplyInput] = useState("");
  const [autoReply2Enabled, setAutoReply2Enabled] = useState(false);
  const [autoReply2Input, setAutoReply2Input] = useState("");
  const [autoReply2DelayInput, setAutoReply2DelayInput] = useState(1);
  const [delaySecondsInput, setDelaySecondsInput] = useState(0);
  const [keywordDelaySecondsInput, setKeywordDelaySecondsInput] = useState(0);
  const [apiIdInput, setApiIdInput] = useState("");
  const [apiHashInput, setApiHashInput] = useState("");
  const [photoReplyEnabled, setPhotoReplyEnabled] = useState(false);
  const [photoReplyMessage, setPhotoReplyMessage] = useState("");
  const [photoReplyMessage2Enabled, setPhotoReplyMessage2Enabled] = useState(false);
  const [photoReplyMessage2, setPhotoReplyMessage2] = useState("");
  const [photoReplyMessage2StartTime, setPhotoReplyMessage2StartTime] = useState("");
  const [photoReplyMessage2EndTime, setPhotoReplyMessage2EndTime] = useState("");
  const [photoReplyMax, setPhotoReplyMax] = useState<number | string>(2);
  const [topicIcon, setTopicIcon] = useState("✅");
  const [topicRenameEmoji, setTopicRenameEmoji] = useState("🛑");
  const [topicRenameKeywords, setTopicRenameKeywords] = useState("");
  const [topicRenameMatchMode, setTopicRenameMatchMode] = useState<'exact' | 'partial'>('exact');
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(true);
  const [notificationSoundType, setNotificationSoundType] = useState("default");
  const [autoResetKeywords, setAutoResetKeywords] = useState(true);
  const [autoBlockKeywords, setAutoBlockKeywords] = useState<AutoBlockKeyword[]>([]);
  const [autoBlockKeywordsExpanded, setAutoBlockKeywordsExpanded] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'general'>('all');
  const [broadcastProgress, setBroadcastProgress] = useState({ total: 0, current: 0, status: 'idle' });
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [logSearch, setLogSearch] = useState("");
  const debouncedLogSearch = useDebounce(logSearch, 300);
  const [logLevelFilter, setLogLevelFilter] = useState<string>("all");
  const [logCategoryFilter, setLogCategoryFilter] = useState<string>("all");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [visibleLogsCount, setVisibleLogsCount] = useState(100);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isAddingNewRule, setIsAddingNewRule] = useState(false);
  const [keywordSearch, setKeywordSearch] = useState("");
  const [keywordFilter, setKeywordFilter] = useState<'all' | 'active' | 'inactive' | 'forward' | 'message' | 'highest' | 'lowest'>('all');
  const debouncedKeywordSearch = useDebounce(keywordSearch, 300);
  const [expandedKeywordId, setExpandedKeywordId] = useState<string | null>(null);
  const deferredKeywordSearch = useDeferredValue(keywordSearch);
  const [visibleKeywordsCount, setVisibleKeywordsCount] = useState(50);
  const [blockedTopics, setBlockedTopics] = useState<any[]>([]);
  const [newBlockedTopicLink, setNewBlockedTopicLink] = useState("");
  const [blockedTopicSearch, setBlockedTopicSearch] = useState("");
  const [blockingTopic, setBlockingTopic] = useState(false);
  const [aiModeEnabled, setAiModeEnabled] = useState(false);
  const [aiPersona, setAiPersona] = useState("");
  const [geminiApiKeys, setGeminiApiKeys] = useState<string[]>([]);
  const [replyInGeneral, setReplyInGeneral] = useState(false);
  const [photoStatsTab, setPhotoStatsTab] = useState<'today' | '24h'>('today');
  
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
  const [missedList, setMissedList] = useState<any[]>([]);
  const [isFetchingMissed, setIsFetchingMissed] = useState(false);
  const [isCatchingUp, setIsCatchingUp] = useState(false);
  const [isScanningMissed, setIsScanningMissed] = useState(false);
  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [selectedScannedItems, setSelectedScannedItems] = useState<Set<string>>(new Set());
  const [showScanModal, setShowScanModal] = useState(false);
  const [replyingIds, setReplyingIds] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(false);
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const keywordsTopRef = useRef<HTMLDivElement>(null);
  const keywordsBottomRef = useRef<HTMLDivElement>(null);
  const castTopRef = useRef<HTMLDivElement>(null);
  const castBottomRef = useRef<HTMLDivElement>(null);
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem("darkMode");
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      console.error("Error parsing darkMode from localStorage", e);
      return true;
    }
  });

  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  useEffect(() => {
    if (stats?.sessionStartTime) {
      setSessionStartTime(stats?.sessionStartTime);
    }
  }, [stats?.sessionStartTime]);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

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
        
        if (parsed.type === 'broadcast_update') {
          const data = parsed.data;
          setBroadcastProgress(data);
          if (data.status === 'completed') {
            showNotification('success', 'Broadcast completed successfully!');
            setBroadcasting(false);
          } else if (data.status === 'cancelled') {
            showNotification('warn', 'Broadcast cancelled');
            setBroadcasting(false);
          } else if (data.status === 'error') {
            showNotification('error', 'Broadcast encountered an error');
            setBroadcasting(false);
          }
          return;
        }

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
            const notificationUrl = parsed.data.url || '/';
            console.log("Showing system notification with URL:", notificationUrl);
            
            const options = {
              body: message,
              icon: "/logo.svg",
              silent: notificationSoundEnabled,
              requireInteraction: true,
              tag: 'photo-received',
              data: {
                url: notificationUrl
              }
            };

            try {
              // Try Service Worker notification first (required for Android Chrome)
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                  registration.showNotification("UserBot Pro", options);
                }).catch(() => {
                  // Fallback to constructor
                  const n = new Notification("UserBot Pro", options);
                  n.onclick = (e) => {
                    e.preventDefault();
                    window.focus();
                    window.open(notificationUrl, '_blank');
                  };
                });
              } else {
                const n = new Notification("UserBot Pro", options);
                n.onclick = (e) => {
                  e.preventDefault();
                  window.focus();
                  window.open(notificationUrl, '_blank');
                };
              }
            } catch (e) {
              console.error("Notification creation failed", e);
            }
          }
        } else if (parsed.type === 'photo_sent') {
          // Fetch stats to update the photo sent count
          fetchStats();
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

    // Fetch initial broadcast status
    fetch("/api/broadcast/status")
      .then(async res => {
        const text = await res.text();
        if (text.includes("Rate exceeded")) return null;
        try {
          return JSON.parse(text);
        } catch (e) {
          return null;
        }
      })
      .then(data => {
        if (data && data.status === 'running') {
          setBroadcasting(true);
          setBroadcastProgress(data);
        }
      })
      .catch(err => console.error("Error fetching broadcast status:", err));

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
        setAutoReply2Enabled(data.autoReply2Enabled);
        setAutoReply2Input(data.autoReply2);
        setAutoReply2DelayInput(data.autoReply2Delay || 1);
        setDelaySecondsInput(data.delaySeconds);
        setKeywordDelaySecondsInput(data.keywordDelaySeconds || 0);
        setApiIdInput(data.apiId);
        setApiHashInput(data.apiHash);
        setPhotoReplyEnabled(data.photoReplyEnabled);
        setPhotoReplyMessage(data.photoReplyMessage);
        setPhotoReplyMessage2Enabled(data.photoReplyMessage2Enabled);
        setPhotoReplyMessage2(data.photoReplyMessage2);
        setPhotoReplyMessage2StartTime(data.photoReplyMessage2StartTime || "");
        setPhotoReplyMessage2EndTime(data.photoReplyMessage2EndTime || "");
        setPhotoReplyMax(data.photoReplyMax || 2);
        setTopicIcon(data.topicIcon || "✅");
        setTopicRenameEmoji(data.topicRenameEmoji || "🛑");
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

  const filteredKeywords = useMemo(() => {
    const searchLower = deferredKeywordSearch.toLowerCase();
    let result = keywords.filter(kw => {
      const kws = (kw.keywords && kw.keywords.length > 0 ? kw.keywords : [kw.keyword]);
      const matchesKeyword = kws.some(k => k?.toLowerCase().includes(searchLower));
      const matchesReply = kw.reply?.toLowerCase().includes(searchLower);
      return matchesKeyword || matchesReply;
    });

    switch (keywordFilter) {
      case 'active': result = result.filter(kw => kw.enabled !== false); break;
      case 'inactive': result = result.filter(kw => kw.enabled === false); break;
      case 'forward': result = result.filter(kw => kw.message_link || (kw.message_links && kw.message_links.length > 0)); break;
      case 'message': result = result.filter(kw => kw.reply); break;
      case 'highest': result = [...result].sort((a, b) => (b.keywords?.length || 0) - (a.keywords?.length || 0)); break;
      case 'lowest': result = [...result].sort((a, b) => (a.keywords?.length || 0) - (b.keywords?.length || 0)); break;
    }

    return result;
  }, [keywords, deferredKeywordSearch, keywordFilter]);

  const displayedKeywords = useMemo(() => {
    return filteredKeywords.slice(0, visibleKeywordsCount);
  }, [filteredKeywords, visibleKeywordsCount]);

  useEffect(() => {
    setVisibleKeywordsCount(50);
  }, [deferredKeywordSearch]);

  const handleKeywordsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      if (visibleKeywordsCount < filteredKeywords.length) {
        setVisibleKeywordsCount(prev => prev + 50);
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

  const displayedLogs = useMemo(() => {
    return filteredLogs.slice(0, visibleLogsCount);
  }, [filteredLogs, visibleLogsCount]);

  useEffect(() => {
    setVisibleLogsCount(100);
  }, [logSearch, logLevelFilter, logCategoryFilter]);

  const logCategories = useMemo(() => {
    const cats = new Set<string>();
    logs.forEach(l => { if (l.category) cats.add(l.category); });
    return Array.from(cats);
  }, [logs]);

  const handleLogsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      if (visibleLogsCount < filteredLogs.length) {
        setVisibleLogsCount(prev => prev + 100);
      }
    }
  };

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

  const fetchMissedList = async () => {
    setIsFetchingMissed(true);
    try {
      const res = await fetch("/api/missed-list");
      const text = await res.text();
      if (text.includes("Rate exceeded")) return;
      if (!res.ok) return;
      try {
        const data = JSON.parse(text);
        setMissedList(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to parse missed list JSON:", text);
      }
    } catch (err) {
      console.error("Failed to fetch missed list", err);
    } finally {
      setIsFetchingMissed(false);
    }
  };

  const handleSkipMissed = async (id: string) => {
    try {
      const res = await fetch("/api/missed-skip", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setMissedList(prev => prev.filter(item => item._id !== id));
        setMissedCount(prev => Math.max(0, prev - 1));
        showNotification('success', 'Item skipped');
      }
    } catch (err) {
      showNotification('error', 'Failed to skip item');
    }
  };

  const handleSkipAllMissed = async () => {
    if (!confirm("Are you sure you want to skip all missed items?")) return;
    try {
      const res = await fetch("/api/missed-skip-all", { method: 'POST' });
      if (res.ok) {
        setMissedList([]);
        setMissedCount(0);
        showNotification('success', 'All items skipped');
      }
    } catch (err) {
      showNotification('error', 'Failed to skip all items');
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

  const handleClearAllMissed = async () => {
    try {
      const res = await fetch("/api/missed-triggers", { method: "DELETE" });
      if (res.ok) {
        setScannedItems([]);
        setMissedCount(0);
        showNotification('success', 'All missed triggers cleared');
      } else {
        showNotification('error', 'Failed to clear missed triggers');
      }
    } catch (err) {
      showNotification('error', 'Failed to clear missed triggers');
    }
  };

  const handleReplyToSingleMissed = async (triggerId: string) => {
    if (replyingIds.has(triggerId)) return;
    
    setReplyingIds(prev => new Set(prev).add(triggerId));
    try {
      const res = await fetch("/api/reply-single-missed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggerId })
      });
      
      const text = await res.text();
      let data: any = {};
      if (text.includes("Rate exceeded")) {
        data = { success: false, error: "Rate limit exceeded. Please try again later." };
      } else {
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = { success: false, error: "Invalid response from server" };
        }
      }
      
      if (data.success) {
        showNotification('success', 'Reply sent successfully');
        setScannedItems(prev => prev.filter(item => item._id !== triggerId));
        setMissedCount(prev => Math.max(0, prev - 1));
        fetchStats();
      } else {
        showNotification('error', data.error || 'Failed to send reply');
      }
    } catch (err) {
      showNotification('error', 'Failed to send reply');
    } finally {
      setReplyingIds(prev => {
        const next = new Set(prev);
        next.delete(triggerId);
        return next;
      });
    }
  };

  const handleScanMissed = async () => {
    if (isScanningMissed) return;
    if (stats?.isSystemPaused) {
      showNotification('error', 'System is paused. Cannot scan for missed items.');
      return;
    }
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
        if (activeTab === 'catchup') {
          fetchMissedList();
        }
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

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    } else if (activeTab === 'catchup') {
      fetchMissedList();
    }
  }, [activeTab]);

  const handleTogglePause = () => {
    setShowPauseConfirmation(true);
  };

  const confirmTogglePause = async () => {
    if (!stats) return;
    const newPausedState = !stats?.isSystemPaused;
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
          autoReply2Enabled,
          autoReply2: autoReply2Input,
          autoReply2Delay: autoReply2DelayInput,
          delaySeconds: delaySecondsInput,
          keywordDelaySeconds: keywordDelaySecondsInput,
          apiId: apiIdInput,
          apiHash: apiHashInput,
          photoReplyEnabled,
          photoReplyMessage,
          photoReplyMessage2Enabled,
          photoReplyMessage2,
          photoReplyMessage2StartTime,
          photoReplyMessage2EndTime,
          photoReplyMax: Number(photoReplyMax) || 2,
          notificationSoundEnabled,
          notificationSoundType,
          topicIcon,
          topicRenameEmoji,
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
    
    const hasMessageLinks = data.message_links && data.message_links.filter((l: string) => l.trim().length > 0).length > 0;
    
    if (!data.reply.trim() && !data.ai_reply_enabled && !hasMessageLinks) {
      showNotification('error', "Please enter a reply message, a message link, or enable AI reply");
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
        const text = await res.text();
        let errData: any = {};
        if (text.includes("Rate exceeded")) {
          errData = { error: "Rate limit exceeded. Please try again later." };
        } else {
          try {
            errData = JSON.parse(text);
          } catch (e) {
            errData = { error: "Invalid response from server" };
          }
        }
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

  const handleToggleKeyword = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/keywords/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) {
        showNotification('success', `Keyword ${enabled ? 'enabled' : 'disabled'}`);
        fetchKeywords();
      } else {
        showNotification('error', 'Failed to update keyword');
      }
    } catch (err) {
      showNotification('error', 'Update failed');
    }
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

  const handleResetKeywords = async () => {
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
          showNotification('success', 'All keywords reset!');
        } catch (e) {
          console.error("Failed to parse keywords after reset", e);
        }
      }
    } catch (error) {
      console.error("Failed to reset keywords:", error);
      showNotification('error', 'Failed to reset keywords');
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
    setBroadcastProgress({ total: 0, current: 0, status: 'running' });
    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: broadcastMessage,
          target: broadcastTarget
        }),
      });
      if (res.ok) {
        showNotification('success', 'Broadcast started');
        setBroadcastMessage("");
      } else {
        const text = await res.text();
        let data: any = {};
        if (text.includes("Rate exceeded")) {
          data = { error: "Rate limit exceeded. Please try again later." };
        } else {
          try {
            data = JSON.parse(text);
          } catch (e) {
            data = { error: "Invalid response from server" };
          }
        }
        showNotification('error', data.error || 'Broadcast failed');
        setBroadcasting(false);
      }
    } catch (err) {
      showNotification('error', 'Connection error');
      setBroadcasting(false);
    }
  };

  const handleCancelBroadcast = async () => {
    try {
      const res = await fetch("/api/broadcast/cancel", { method: "POST" });
      if (res.ok) {
        showNotification('warn', 'Cancelling broadcast...');
      } else {
        const text = await res.text();
        let data: any = {};
        if (text.includes("Rate exceeded")) {
          data = { error: "Rate limit exceeded. Please try again later." };
        } else {
          try {
            data = JSON.parse(text);
          } catch (e) {
            data = { error: "Invalid response from server" };
          }
        }
        showNotification('error', data.error || 'Failed to cancel');
      }
    } catch (err) {
      showNotification('error', 'Connection error');
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


  return (
    <AnimatePresence mode="wait">
      {isInitialLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
          className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full blur-[120px] opacity-20 bg-blue-500" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full blur-[100px] opacity-10 bg-emerald-500" />
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="relative z-10 flex flex-col items-center"
          >
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-2xl rotate-6 opacity-40 animate-pulse"></div>
              <div className="relative w-full h-full rounded-2xl overflow-hidden flex items-center justify-center border border-white/20 bg-neutral-900 shadow-2xl">
                <img src="/logo.svg" alt="Logo" className="w-14 h-14 object-contain" />
              </div>
              {/* Spinning Ring */}
              <div className="absolute -inset-4 border-2 border-white/5 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>

            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center space-x-2">
                <h1 className="text-3xl font-black tracking-tighter text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-emerald-100">
                  BotFlow
                </h1>
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black text-emerald-500 tracking-[0.4em] uppercase">Premium AI</span>
                <div className="flex space-x-1">
                  <motion.div 
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                    className="w-1 h-1 rounded-full bg-emerald-500" 
                  />
                  <motion.div 
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                    className="w-1 h-1 rounded-full bg-emerald-500" 
                  />
                  <motion.div 
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                    className="w-1 h-1 rounded-full bg-emerald-500" 
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bottom Text */}
          <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center space-y-1">
            <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase">Initializing Secure Connection</p>
            <div className="w-32 h-0.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="w-1/2 h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
              />
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`min-h-screen transition-colors duration-500 ${activeTab === 'logs' || darkMode ? 'bg-black text-white' : 'bg-slate-50 text-slate-800'} font-sans ${activeTab === 'logs' ? 'pb-0' : 'pb-24'} relative overflow-x-hidden`}
        >
      {/* Background Decorative Elements */}
      <div className={`fixed inset-0 pointer-events-none overflow-hidden z-0 transition-opacity duration-500 ${activeTab === 'logs' ? 'opacity-0' : 'opacity-100'}`}>
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
      <header className={`px-3 sm:px-6 py-2 flex items-center justify-between fixed top-0 left-0 right-0 z-50 border-b transition-all duration-500 bg-black border-white/10 text-white shadow-2xl ${activeTab === 'logs' ? 'opacity-0 pointer-events-none -translate-y-full' : 'opacity-100 translate-y-0'}`}>
        
        {/* Oval glow effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[200%] rounded-[100%] blur-3xl opacity-20 bg-white" />
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl transition relative group text-blue-400 hover:text-white hover:bg-white/10"
            >
              <div className="relative z-10 flex items-center justify-center w-[22px] h-[22px]">
                <div className="flex flex-col items-start justify-center w-full h-full space-y-1.5 transition duration-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,1)]">
                  <span className={`h-0.5 rounded-full transition duration-300 ${isMenuOpen ? 'w-[22px] translate-y-2 rotate-45 bg-white' : 'w-[22px] bg-white'}`}></span>
                  <span className={`h-0.5 rounded-full transition duration-300 ${isMenuOpen ? 'w-0 opacity-0 bg-white' : 'w-[16px] bg-white'}`}></span>
                  <span className={`h-0.5 rounded-full transition duration-300 ${isMenuOpen ? 'w-[22px] -translate-y-2 -rotate-45 bg-white' : 'w-[10px] bg-white'}`}></span>
                </div>
                {isMenuOpen && (
                  <motion.div 
                    layoutId="menu-glow"
                    className="absolute inset-0 bg-white/20 blur-xl rounded-full -z-10"
                  />
                )}
              </div>
              <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            {/* Status dot overlapping the 3-line bar */}
            <div className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border-2 border-black z-20 ${stats?.isUserBotConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}>
               <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${stats?.isUserBotConnected ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative w-8 h-8 group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-lg rotate-3 opacity-40 group-hover:rotate-6 transition-transform duration-500"></div>
              <div className="relative w-full h-full rounded-lg overflow-hidden flex items-center justify-center border transition-colors duration-500 bg-neutral-900 border-white/10">
                <img src="/logo.svg" alt="Logo" className="w-5 h-5 object-contain" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1">
                <h1 className="font-black text-base sm:text-xl tracking-tighter leading-none transition-colors duration-500 text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-emerald-100">
                  BotFlow
                </h1>
                <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-[7px] font-black text-emerald-400 tracking-[0.3em] uppercase block">Premium AI</span>
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 relative z-10 shrink-0">
          <button 
            onClick={() => setIsNotificationOpen(true)}
            className="p-2 rounded-xl transition relative group text-rose-400 hover:text-white hover:bg-white/10"
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
              <Bell size={22} className={`transition duration-300 drop-shadow-[0_0_8px_rgba(251,113,133,0.8)] group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] ${unreadCount > 0 ? 'text-rose-500' : ''}`} />
            </motion.div>
            {unreadCount > 0 && (
              <motion.span 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-black shadow-[0_0_15px_rgba(244,63,94,0.8)] group-hover:scale-125 transition-transform"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </button>
        </div>
      </header>

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
              <div className={`p-6 border-b flex flex-col space-y-6 ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-8 h-8">
                      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-lg rotate-3 opacity-40"></div>
                      <div className={`relative w-full h-full rounded-lg overflow-hidden flex items-center justify-center border ${darkMode ? 'bg-neutral-900 border-white/10' : 'bg-white border-black/5'}`}>
                        <img src="/logo.svg" alt="Logo" className="w-5 h-5 object-contain" />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-1">
                        <h1 className={`font-black text-base tracking-tighter leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>BotFlow</h1>
                        <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                      </div>
                      <span className="text-[7px] font-black text-emerald-500 tracking-[0.2em] uppercase block">Premium Edition</span>
                      {stats?.loginUser && (
                        <span className={`text-[9px] font-medium mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {stats?.loginUser?.firstName || ''} {stats?.loginUser?.lastName || ''} {stats?.loginUser?.phone ? `(${stats?.loginUser?.phone})` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setIsMenuOpen(false)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                    <X size={20} />
                  </button>
                </div>

                {/* Beautiful Connected Shape */}
                <div className={`relative overflow-hidden rounded-2xl p-4 border transition duration-500 ${
                  stats?.isUserBotConnected 
                    ? (darkMode ? 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'bg-emerald-50 border-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.15)]')
                    : (darkMode ? 'bg-rose-500/10 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.15)]' : 'bg-rose-50 border-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.15)]')
                }`}>
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 ${
                    stats?.isUserBotConnected ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}></div>
                  <div className="relative z-10 flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg relative ${
                      stats?.isUserBotConnected ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-rose-500 shadow-rose-500/30'
                    }`}>
                      <div className="absolute inset-0 rounded-full animate-ping opacity-50 bg-inherit"></div>
                      {stats?.isUserBotConnected ? <CheckCircle2 size={24} className="text-white relative z-10" /> : <X size={24} className="text-white relative z-10" />}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-black uppercase tracking-widest ${
                        stats?.isUserBotConnected ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : (darkMode ? 'text-rose-400' : 'text-rose-600')
                      }`}>
                        {stats?.isUserBotConnected ? 'Connected' : 'Disconnected'}
                      </span>
                      <span className={`text-[10px] font-medium mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {stats?.isUserBotConnected ? 'System is online and active' : 'System is currently offline'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <button
                  onClick={() => {
                    setIsNotificationOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition group ${darkMode ? 'text-blue-400 hover:bg-white/5' : 'text-blue-600 hover:bg-black/5'}`}
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
                  className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition ${activeTab === 'analytics' ? (darkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-50 text-cyan-600') : (darkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-black/5')}`}
                >
                  <PieChart size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">Analytics</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('tester');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition ${activeTab === 'tester' ? (darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-50 text-orange-600') : (darkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-black/5')}`}
                >
                  <Bot size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">AI Test</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('media');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition ${activeTab === 'media' ? (darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600') : (darkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-black/5')}`}
                >
                  <Library size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">Media Library</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('insights');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition ${activeTab === 'insights' ? (darkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-50 text-rose-600') : (darkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-black/5')}`}
                >
                  <BarChart3 size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">Insights</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('user');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition ${activeTab === 'user' ? (darkMode ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-50 text-pink-600') : (darkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-black/5')}`}
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
                  className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition ${darkMode ? 'text-rose-400 hover:bg-white/5' : 'text-rose-600 hover:bg-black/5'}`}
                >
                  <Trash size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">Clear All Data</span>
                </button>

                <button
                  onClick={() => {
                    setShowDeleteLastKeywordConfirm(true);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition ${darkMode ? 'text-rose-400 hover:bg-white/5' : 'text-rose-600 hover:bg-black/5'}`}
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
                    className={`p-2 rounded-xl transition ${darkMode ? 'bg-white/5 text-yellow-400' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${darkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Close Menu
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <NotificationPanel 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)} 
        logs={logs} 
        darkMode={darkMode} 
      />

      {/* Floating Dark Mode Button */}
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className={`fixed bottom-24 right-4 z-50 p-3 rounded-full shadow-lg transition-all duration-500 ${activeTab === 'logs' ? 'opacity-0 pointer-events-none' : 'opacity-100'} ${darkMode ? 'bg-neutral-900 text-yellow-400 hover:bg-neutral-800 border border-neutral-800' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}`}
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <main 
        className={`mx-auto relative z-10 transition-all duration-500 ${activeTab === 'logs' ? 'max-w-none w-full p-0 pt-0 pb-0' : 'max-w-md p-4 pt-24 pb-28'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait" custom={direction}>
          {activeTab === 'dashboard' && (
            <Dashboard 
              darkMode={darkMode}
              stats={stats}
              setActiveTab={setActiveTab}
              handleScanMissed={handleScanMissed}
              isScanningMissed={isScanningMissed}
              missedCount={missedCount}
              isCatchingUp={isCatchingUp}
              handleCancelCatchUp={handleCancelCatchUp}
              handleTogglePause={handleTogglePause}
              loading={loading}
              deferredPrompt={deferredPrompt}
              handleInstallApp={handleInstallApp}
            />
          )}

          {activeTab === 'catchup' && (
            <CatchUpPage 
              darkMode={darkMode} 
              setActiveTab={setActiveTab} 
              scannedItems={scannedItems} 
              handleClearAllMissed={handleClearAllMissed} 
              handleReplyToSingleMissed={handleReplyToSingleMissed} 
              replyingIds={replyingIds}
              handleScanMissed={handleScanMissed}
              isScanningMissed={isScanningMissed}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPanel 
              darkMode={darkMode}
              autoReplyInput={autoReplyInput}
              setAutoReplyInput={setAutoReplyInput}
              autoReply2Enabled={autoReply2Enabled}
              setAutoReply2Enabled={setAutoReply2Enabled}
              autoReply2Input={autoReply2Input}
              setAutoReply2Input={setAutoReply2Input}
              autoReply2DelayInput={autoReply2DelayInput}
              setAutoReply2DelayInput={setAutoReply2DelayInput}
              delaySecondsInput={delaySecondsInput}
              setDelaySecondsInput={setDelaySecondsInput}
              keywordDelaySecondsInput={keywordDelaySecondsInput}
              setKeywordDelaySecondsInput={setKeywordDelaySecondsInput}
              handleToggleAutoReset={handleToggleAutoReset}
              autoResetKeywords={autoResetKeywords}
              handleToggleAiMode={handleToggleAiMode}
              aiModeEnabled={aiModeEnabled}
              geminiApiKeys={geminiApiKeys}
              setGeminiApiKeys={setGeminiApiKeys}
              verifyKey={verifyKey}
              aiPersona={aiPersona}
              setAiPersona={setAiPersona}
              handleTogglePhotoReply={handleTogglePhotoReply}
              photoReplyEnabled={photoReplyEnabled}
              photoReplyMessage={photoReplyMessage}
              setPhotoReplyMessage={setPhotoReplyMessage}
              handleTogglePhotoReplyMessage2={handleTogglePhotoReplyMessage2}
              photoReplyMessage2Enabled={photoReplyMessage2Enabled}
              photoReplyMessage2={photoReplyMessage2}
              setPhotoReplyMessage2={setPhotoReplyMessage2}
              photoReplyMessage2StartTime={photoReplyMessage2StartTime}
              setPhotoReplyMessage2StartTime={setPhotoReplyMessage2StartTime}
              photoReplyMessage2EndTime={photoReplyMessage2EndTime}
              setPhotoReplyMessage2EndTime={setPhotoReplyMessage2EndTime}
              topicIcon={topicIcon}
              setTopicIcon={setTopicIcon}
              topicRenameEmoji={topicRenameEmoji}
              setTopicRenameEmoji={setTopicRenameEmoji}
              photoReplyMax={photoReplyMax}
              setPhotoReplyMax={setPhotoReplyMax}
              handleToggleNotificationSound={handleToggleNotificationSound}
              notificationSoundEnabled={notificationSoundEnabled}
              notificationSoundType={notificationSoundType}
              handleUpdateNotificationSoundType={handleUpdateNotificationSoundType}
              requestNotificationPermission={requestNotificationPermission}
              testPush={testPush}
              handleExportData={handleExportData}
              handleImportData={handleImportData}
              fileInputRef={fileInputRef}
              importing={importing}
              handleUpdateSettings={handleUpdateSettings}
              saving={saving}
              direction={direction}
              slideVariants={slideVariants}
            />
          )}

          {activeTab === 'keywords' && (
            <KeywordsManager 
              darkMode={darkMode}
              keywordSearch={keywordSearch}
              setKeywordSearch={setKeywordSearch}
              isAddingNewRule={isAddingNewRule}
              setIsAddingNewRule={setIsAddingNewRule}
              editingKeywordId={editingKeywordId}
              keywords={keywords}
              handleAddKeyword={handleAddKeyword}
              handleDeleteKeyword={handleDeleteKeyword}
              handleToggleKeyword={handleToggleKeyword}
              cancelEdit={cancelEdit}
              visibleKeywordsCount={visibleKeywordsCount}
              handleKeywordsScroll={handleKeywordsScroll}
              keywordsTopRef={keywordsTopRef}
              direction={direction}
              slideVariants={slideVariants}
              isSearchFocused={isSearchFocused}
              setIsSearchFocused={setIsSearchFocused}
              displayedKeywords={displayedKeywords}
              filteredKeywords={filteredKeywords}
              keywordFilter={keywordFilter}
              setKeywordFilter={setKeywordFilter}
              handleEditKeyword={handleEditKeyword}
            />
          )}

          {activeTab === 'broadcast' && (
            <div
              key="broadcast"
              className="space-y-6 w-full"
            >
              <div ref={castTopRef} />
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
                        className={`w-full pl-9 p-3 border rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm transition ${darkMode ? 'bg-rose-500/5 border-rose-500/20 text-white placeholder-white/20' : 'bg-rose-50 border-rose-200 text-slate-900 placeholder-slate-400'}`}
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBlockTopic}
                      disabled={blockingTopic || !newBlockedTopicLink.trim()}
                      className={`px-6 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors flex items-center space-x-2 ${blockingTopic || !newBlockedTopicLink.trim() ? 'opacity-50 cursor-not-allowed bg-slate-400' : 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20'}`}
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
                          className={`w-full pl-9 p-2 border rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-[10px] transition ${darkMode ? 'bg-neutral-900/50 border-white/10 text-white placeholder-white/20' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'}`}
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
                                className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-emerald-500/10 text-slate-500 hover:text-emerald-400' : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'}`}
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
                    disabled={broadcasting}
                    className={`w-full h-32 p-5 border rounded-3xl focus:ring-4 focus:ring-purple-500/20 outline-none text-sm transition ${darkMode ? 'bg-purple-950/20 border-purple-500/20 text-white placeholder-white/20' : 'bg-white border-purple-100 text-slate-900 placeholder-slate-400 shadow-inner'} ${broadcasting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div className="space-y-3 px-1">
                  <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Broadcast Target</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setBroadcastTarget('all')}
                      disabled={broadcasting}
                      className={`py-3 px-4 rounded-2xl text-xs font-bold transition border-2 flex items-center justify-center space-x-2 ${
                        broadcastTarget === 'all'
                          ? (darkMode ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-purple-100 border-purple-500 text-purple-700')
                          : (darkMode ? 'bg-neutral-900/40 border-white/5 text-slate-500 hover:border-white/10' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200')
                      } ${broadcasting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <LayoutGrid size={14} />
                      <span>All Topics</span>
                    </button>
                    <button
                      onClick={() => setBroadcastTarget('general')}
                      disabled={broadcasting}
                      className={`py-3 px-4 rounded-2xl text-xs font-bold transition border-2 flex items-center justify-center space-x-2 ${
                        broadcastTarget === 'general'
                          ? (darkMode ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-purple-100 border-purple-500 text-purple-700')
                          : (darkMode ? 'bg-neutral-900/40 border-white/5 text-slate-500 hover:border-white/10' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200')
                      } ${broadcasting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <MessageSquare size={14} />
                      <span>General Section</span>
                    </button>
                  </div>
                </div>

                {broadcasting && broadcastProgress.status === 'running' && broadcastTarget === 'all' && (
                  <div className="space-y-3 px-1">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className={darkMode ? 'text-purple-400' : 'text-purple-600'}>Processing Broadcast</span>
                      <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                        {broadcastProgress.current} / {broadcastProgress.total} Topics
                      </span>
                    </div>
                    <div className={`h-3 w-full rounded-full overflow-hidden ${darkMode ? 'bg-purple-950/40' : 'bg-purple-100'}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(broadcastProgress.current / (broadcastProgress.total || 1)) * 100}%` }}
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                      />
                    </div>
                    <div className="flex justify-center">
                        <button
                      onClick={handleCancelBroadcast}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${darkMode ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                    >
                      Cancel Broadcast
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleBroadcast}
                disabled={broadcasting || !broadcastMessage.trim() || broadcastMessage.length > 500}
                className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest text-sm transition-colors disabled:opacity-50 flex items-center justify-center space-x-3 shadow-xl ${darkMode ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500' : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-purple-500/20'}`}
              >
                <Send size={18} />
                <span>{broadcasting ? 'Sending...' : 'Broadcast Now'}</span>
              </button>
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
                    className={`p-2 rounded-xl transition ${darkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-black/5 text-slate-500'}`}
                  >
                    {autoBlockKeywordsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex flex-col space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={addAutoBlockKeyword}
                        className={`py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors flex items-center justify-center space-x-2 shadow-lg ${darkMode ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/20'}`}
                      >
                        <Plus size={14} />
                        <span>Add Keyword</span>
                      </button>

                      <button
                        onClick={handleUpdateAutoBlockKeywords}
                        disabled={saving}
                        className={`py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg ${saving ? 'opacity-50 cursor-not-allowed bg-slate-400' : 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20'}`}
                      >
                        {saving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        <span>Save Rules</span>
                      </button>
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
                                    className={`flex-1 min-w-0 p-2 border rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm transition ${darkMode ? 'bg-rose-500/5 border-rose-500/20 text-white placeholder-white/20' : 'bg-rose-50 border-rose-200 text-slate-900 placeholder-slate-400'}`}
                                  />
                                  <button
                                    onClick={() => removeAutoBlockKeyword(index)}
                                    className={`flex-shrink-0 p-2.5 rounded-xl transition ${darkMode ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'}`}
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
                                      className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition ${item.matchMode === 'exact' ? (darkMode ? 'bg-rose-500 text-white' : 'bg-white shadow-sm text-slate-900') : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}
                                    >
                                      Exact
                                    </button>
                                    <button
                                      onClick={() => updateAutoBlockKeyword(index, 'matchMode', 'partial')}
                                      className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition ${item.matchMode === 'partial' ? (darkMode ? 'bg-rose-500 text-white' : 'bg-white shadow-sm text-slate-900') : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}
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
              <div ref={castBottomRef} />

              <div className={`fixed bottom-24 left-4 flex flex-col rounded-full shadow-xl border overflow-hidden z-40 ${darkMode ? 'bg-neutral-900 border-white/10' : 'bg-white border-slate-200'}`}>
                <motion.button
                  whileHover={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={scrollToCastTop}
                  className={`p-3 transition ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}
                >
                  <ArrowUp size={20} />
                </motion.button>
                <div className={`h-px w-full ${darkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
                <motion.button
                  whileHover={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={scrollToCastBottom}
                  className={`p-3 transition ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}
                >
                  <ArrowDown size={20} />
                </motion.button>
              </div>
            </div>
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
                    <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto border transition ${darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600'}`}>
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

                      {stats?.lastLoginTime && (
                        <div className="flex flex-col items-center pt-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            Last Login:
                          </span>
                          <span className={`text-[10px] font-mono font-bold mt-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            {stats?.lastLoginTime ? new Date(stats.lastLoginTime).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            }) : 'Never'}
                          </span>
                        </div>
                      )}

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
                          className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition flex items-center justify-center space-x-2 border ${darkMode ? 'bg-neutral-950 border-neutral-800 text-slate-300 hover:bg-neutral-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
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
                            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm transition ${darkMode ? 'bg-pink-500/5 border-pink-500/20 text-white placeholder-white/20' : 'bg-pink-50 border-pink-200 text-slate-900 placeholder-slate-400'}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>API Hash</label>
                          <input
                            type="text"
                            value={apiHashInput}
                            onChange={(e) => setApiHashInput(e.target.value)}
                            placeholder="Enter API Hash"
                            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm transition ${darkMode ? 'bg-pink-500/5 border-pink-500/20 text-white placeholder-white/20' : 'bg-pink-50 border-pink-200 text-slate-900 placeholder-slate-400'}`}
                          />
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => { handleUpdateSettings(); setAuthStep('phone'); }}
                          className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition shadow-lg ${darkMode ? 'bg-pink-600 text-white shadow-pink-900/20 hover:bg-pink-500' : 'bg-pink-500 text-white shadow-pink-500/20 hover:bg-pink-600'}`}
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
                            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm transition ${darkMode ? 'bg-pink-500/5 border-pink-500/20 text-white placeholder-white/20' : 'bg-pink-50 border-pink-200 text-slate-900 placeholder-slate-400'}`}
                          />
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleSendCode}
                          disabled={authLoading}
                          className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition flex items-center justify-center space-x-2 shadow-lg ${darkMode ? 'bg-pink-600 text-white shadow-pink-900/20 hover:bg-pink-500' : 'bg-pink-500 text-white shadow-pink-500/20 hover:bg-pink-600'}`}
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
                            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm transition ${darkMode ? 'bg-pink-500/5 border-pink-500/20 text-white placeholder-white/20' : 'bg-pink-50 border-pink-200 text-slate-900 placeholder-slate-400'}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>2FA Password (Optional)</label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="If enabled"
                            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm transition ${darkMode ? 'bg-pink-500/5 border-pink-500/20 text-white placeholder-white/20' : 'bg-pink-50 border-pink-200 text-slate-900 placeholder-slate-400'}`}
                          />
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleSignIn}
                          disabled={authLoading}
                          className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition flex items-center justify-center space-x-2 shadow-lg ${darkMode ? 'bg-pink-600 text-white shadow-pink-900/20 hover:bg-pink-500' : 'bg-pink-500 text-white shadow-pink-500/20 hover:bg-pink-600'}`}
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
                        className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition ${darkMode ? 'bg-orange-500/5 border-orange-500/20 text-white placeholder-white/20' : 'bg-orange-50 border-orange-200 text-slate-900 placeholder-slate-400'}`}
                      />
                    </div>
                    
                    <button
                      onClick={handleTestPersona}
                      disabled={isTesting || !testMessage.trim()}
                      className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition flex items-center justify-center space-x-2 shadow-lg ${
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
                            className={`w-3 h-3 rounded-sm transition hover:scale-125 cursor-pointer ${
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
                      <div key={user.username} className={`flex items-center justify-between p-3 rounded-2xl border transition ${darkMode ? 'bg-black/40 border-white/5' : 'bg-white/60 border-black/5'}`}>
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
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition flex items-center justify-center space-x-2 shadow-lg ${darkMode ? 'bg-emerald-600 text-white shadow-emerald-900/20 hover:bg-emerald-500' : 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600'}`}
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
                          className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition ${darkMode ? 'bg-indigo-500/5 border-indigo-500/20 text-white placeholder-white/20' : 'bg-indigo-50 border-indigo-200 text-slate-900 placeholder-slate-400'}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Media URL</label>
                        <input
                          type="text"
                          value={newMediaUrl}
                          onChange={(e) => setNewMediaUrl(e.target.value)}
                          placeholder="https://..."
                          className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition ${darkMode ? 'bg-indigo-500/5 border-indigo-500/20 text-white placeholder-white/20' : 'bg-indigo-50 border-indigo-200 text-slate-900 placeholder-slate-400'}`}
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={handleAddMedia}
                      disabled={!newMediaUrl.trim() || !newMediaName.trim()}
                      className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition flex items-center justify-center space-x-2 shadow-lg ${
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
                        <div key={item._id} className={`group relative rounded-3xl overflow-hidden border transition ${darkMode ? 'bg-black/40 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
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
                                className={`p-2 rounded-xl transition ${darkMode ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-black/5 text-slate-500 hover:text-black'}`}
                                title="Copy URL"
                              >
                                <Link size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteMedia(item._id)}
                                className={`p-2 rounded-xl transition ${darkMode ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
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

          {activeTab === 'photo_stats' && (
            <motion.div
              key="photo_stats"
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 w-full"
            >
              <div className={`border p-6 rounded-[2.5rem] space-y-6 transition-colors duration-500 relative overflow-hidden group ${darkMode ? 'bg-amber-950/40 border-amber-500/30' : 'bg-amber-50 border-amber-200 shadow-xl shadow-amber-500/10'}`}>
                <div className={`absolute inset-0 pattern-lines opacity-[0.05] pointer-events-none ${darkMode ? 'text-amber-500' : 'text-amber-500'}`} />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => setActiveTab('dashboard')}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition ${darkMode ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}`}
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div>
                      <h2 className={`text-2xl font-black tracking-tight flex items-center ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Photo Sent Activity
                      </h2>
                      <div className="flex space-x-2 mt-1">
                        <button 
                          onClick={() => setPhotoStatsTab('today')}
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition ${photoStatsTab === 'today' ? (darkMode ? 'bg-amber-500 text-white' : 'bg-amber-600 text-white') : (darkMode ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-amber-100 text-amber-600 hover:bg-amber-200')}`}
                        >
                          Today (IST)
                        </button>
                        <button 
                          onClick={() => setPhotoStatsTab('24h')}
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition ${photoStatsTab === '24h' ? (darkMode ? 'bg-amber-500 text-white' : 'bg-amber-600 text-white') : (darkMode ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-amber-100 text-amber-600 hover:bg-amber-200')}`}
                        >
                          Past 24h
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-500'}`}>
                    <Image size={24} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-amber-200/50 shadow-sm'}`}>
                    <span className={`text-[9px] uppercase font-black tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Today Total</span>
                    <div className={`text-xl font-black mt-1 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                      {stats?.todayPhotoSentStats?.count || 0}
                    </div>
                  </div>
                  <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-amber-200/50 shadow-sm'}`}>
                    <span className={`text-[9px] uppercase font-black tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Last 24h</span>
                    <div className={`text-xl font-black mt-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {stats?.past24hPhotoSentStats?.count || 0}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {(photoStatsTab === 'today' ? stats?.todayPhotoSentStats?.topics : stats?.past24hPhotoSentStats?.topics)?.length ? (
                    (photoStatsTab === 'today' ? stats?.todayPhotoSentStats?.topics : stats?.past24hPhotoSentStats?.topics)?.map((topic, idx) => (
                      <div key={idx} className={`p-3 rounded-2xl flex items-center justify-between group transition ${darkMode ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-white hover:bg-slate-50 shadow-sm'}`}>
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                            <Hash size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className={`font-bold text-xs truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{topic.name}</p>
                            <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{topic.time}</p>
                          </div>
                        </div>
                        {topic.link && (
                          <a 
                            href={topic.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition ${darkMode ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white' : 'bg-amber-100 text-amber-600 hover:bg-amber-600 hover:text-white'}`}
                          >
                            <span className="text-[9px] font-black uppercase tracking-widest">Open</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className={`text-center py-12 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      <Image size={32} className="mx-auto mb-4 opacity-20" />
                      <p className="text-xs font-medium">No activity recorded for this period.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <ActivityLogs 
              darkMode={darkMode}
              handleDownloadLogs={handleDownloadLogs}
              fetchLogs={fetchLogs}
              refreshingLogs={refreshingLogs}
              direction={direction}
              slideVariants={slideVariants}
              clearLogs={clearLogs}
              isConfirmingClear={isConfirmingClear}
              logSearch={logSearch}
              setLogSearch={setLogSearch}
              logLevelFilter={logLevelFilter}
              setLogLevelFilter={setLogLevelFilter}
              logCategoryFilter={logCategoryFilter}
              setLogCategoryFilter={setLogCategoryFilter}
              logCategories={logCategories}
              displayedLogs={displayedLogs}
              handleLogsScroll={handleLogsScroll}
              expandedLogId={expandedLogId}
              setExpandedLogId={setExpandedLogId}
              visibleLogsCount={visibleLogsCount}
              setVisibleLogsCount={setVisibleLogsCount}
              filteredLogsCount={filteredLogs.length}
              showNotification={showNotification}
              setActiveTab={setActiveTab}
            />
          )}
        </AnimatePresence>
        </main>

      {/* Floating Bottom Navigation */}
      <div className={`fixed bottom-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[90%] sm:max-w-xs z-50 transition-all duration-500 ${activeTab === 'logs' ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'}`}>
        <nav className={`rounded-2xl border px-2 py-1 flex items-center justify-between transition duration-500 shadow-2xl backdrop-blur-xl ${darkMode ? 'bg-slate-950/90 border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)]' : 'bg-white/90 border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)]'}`}>
          <TabButton id="dashboard" icon={LayoutGrid} label="Home" activeTab={activeTab} setActiveTab={setActiveTab} setDirection={setDirection} darkMode={darkMode} />
          <TabButton id="keywords" icon={MessageCircle} label="Words" activeTab={activeTab} setActiveTab={setActiveTab} setDirection={setDirection} darkMode={darkMode} />
          <TabButton id="broadcast" icon={Radio} label="Cast" activeTab={activeTab} setActiveTab={setActiveTab} setDirection={setDirection} darkMode={darkMode} />
          <TabButton id="settings" icon={Settings} label="Set" activeTab={activeTab} setActiveTab={setActiveTab} setDirection={setDirection} darkMode={darkMode} />
          <TabButton id="logs" icon={Activity} label="Logs" activeTab={activeTab} setActiveTab={setActiveTab} setDirection={setDirection} darkMode={darkMode} />
        </nav>
      </div>

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
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition shadow-lg ${
                      stats?.isSystemPaused 
                        ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600' 
                        : 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600'
                    }`}
                  >
                    {stats?.isSystemPaused ? 'Yes, Resume Now' : 'Yes, Pause Now'}
                  </button>
                  <button
                    onClick={() => setShowPauseConfirmation(false)}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition ${
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
                  scannedItems.map((item) => {
                    const isSelected = selectedScannedItems.has(item._id);
                    return (
                      <div 
                        key={item._id} 
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
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReplyToSingleMissed(item._id);
                              }}
                              disabled={replyingIds.has(item._id)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 transition ${
                                replyingIds.has(item._id)
                                  ? 'bg-slate-400 text-white cursor-not-allowed'
                                  : (darkMode ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100')
                              }`}
                            >
                              {replyingIds.has(item._id) ? (
                                <RefreshCw className="animate-spin" size={12} />
                              ) : (
                                <Send size={12} />
                              )}
                              <span>{replyingIds.has(item._id) ? 'Replying...' : 'Reply Now'}</span>
                            </button>
                          </div>
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
                    className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-white bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-500/20 transition"
                  >
                    Confirm Clear
                  </button>
                  <button
                    onClick={() => setShowClearDataConfirm(false)}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition ${
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
                    className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-white bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-500/20 transition"
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteLastKeywordConfirm(false)}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition ${
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
                    className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-white bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-500/20 transition"
                  >
                    Yes, Logout Now
                  </button>
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition ${
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
                    onClick={handleResetKeywords}
                    className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-white bg-amber-500 hover:bg-amber-600 shadow-xl shadow-amber-500/20 transition"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => setShowResetKeywordsConfirm(false)}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition ${
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
    </motion.div>
      )}
    </AnimatePresence>
  );
}

