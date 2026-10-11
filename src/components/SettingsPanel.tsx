import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Zap, Plus, Trash2, CheckCircle2, Image as ImageIcon, Bell, Send, Database, Download, Upload, Save, RefreshCw, FileText, Eye, EyeOff, ExternalLink, Sparkles, Smartphone, FileJson, History, Calendar, Globe, Copy, Check } from 'lucide-react';
import ActivityLogs from './ActivityLogs';
import { LOGO_PRESETS } from './LogoSelectorModal';
import { getDeviceInfo, pingDeviceSession } from '../utils/deviceTracker';

interface SettingsPanelProps {
  darkMode: boolean;
  autoReplyInput: string;
  appLogoInput: string;
  setAppLogoInput: (val: string) => void;
  deferredPrompt: any;
  handleInstallApp: () => void;
  onOpenLogoSelector?: () => void;
  onOpenInstallGuide?: () => void;
  setAutoReplyInput: (val: string) => void;
  autoReply2Enabled: boolean;
  setAutoReply2Enabled: (val: boolean) => void;
  autoReply2Input: string;
  setAutoReply2Input: (val: string) => void;
  autoReply2DelayInput: number;
  setAutoReply2DelayInput: (val: number) => void;
  delaySecondsInput: number;
  setDelaySecondsInput: (val: number) => void;
  keywordDelaySecondsInput: number;
  setKeywordDelaySecondsInput: (val: number) => void;
  handleToggleAutoReset: () => void;
  autoResetKeywords: boolean;
  aiModeEnabled: boolean;
  handleToggleAiMode: () => void;
  geminiApiKeys: string[];
  setGeminiApiKeys: (val: string[]) => void;
  verifyKey: (key: string) => void;
  aiPersona: string;
  setAiPersona: (val: string) => void;
  photoReplyEnabled: boolean;
  handleTogglePhotoReply: () => void;
  photoReplyMessage: string;
  setPhotoReplyMessage: (val: string) => void;
  photoReplyMessage2Enabled: boolean;
  handleTogglePhotoReplyMessage2: () => void;
  photoReplyMessage2: string;
  setPhotoReplyMessage2: (val: string) => void;
  photoReplyMessage2StartTime: string;
  setPhotoReplyMessage2StartTime: (val: string) => void;
  photoReplyMessage2EndTime: string;
  setPhotoReplyMessage2EndTime: (val: string) => void;
  topicIcon: string;
  setTopicIcon: (val: string) => void;
  topicRenameEmoji: string;
  setTopicRenameEmoji: (val: string) => void;
  photoReplyMax: number | string;
  setPhotoReplyMax: (val: number | string) => void;
  notificationSoundEnabled: boolean;
  handleToggleNotificationSound: () => void;
  notificationSoundType: string;
  handleUpdateNotificationSoundType: (val: string) => void;
  testPush: () => void;
  requestNotificationPermission: () => void;
  notificationStyle?: string;
  setNotificationStyle?: (val: string) => void;
  handleExportData: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  importing: boolean;
  onOpenDeleteLastImport?: () => void;
  onOpenDeleteLastRule?: () => void;
  lastImportInfo?: { hasLastImport: boolean; count: number; importedAt: string | null; latestRuleName?: string; totalRules?: number } | null;
  importBatches?: Array<{
    id: string;
    batchId: string;
    fileName: string;
    importedAt: string;
    count: number;
    names: string[];
  }>;
  onDeleteBatch?: (batch: { batchId: string; fileName: string; count: number }) => void;
  isFetchingBatches?: boolean;
  deletingBatchId?: string | null;
  onRefreshBatches?: () => void;
  targetGroupId: string;
  setTargetGroupId: (val: string) => void;
  telegramBotToken: string;
  setTelegramBotToken: (val: string) => void;
  handleUpdateSettings: () => void;
  handleForceUpdateAndPurge?: () => void;
  saving: boolean;
  direction: number;
  slideVariants: any;

  // Logs Props for Settings Logs Subtab
  logs?: any[];
  handleDownloadLogs?: (format: 'json' | 'csv') => void;
  fetchLogs?: () => void;
  refreshingLogs?: boolean;
  clearLogs?: () => void;
  isConfirmingClear?: boolean;
  logSearch?: string;
  setLogSearch?: (val: string) => void;
  logLevelFilter?: string;
  setLogLevelFilter?: (val: string) => void;
  logCategoryFilter?: string;
  setLogCategoryFilter?: (val: string) => void;
  logCategories?: string[];
  displayedLogs?: any[];
  handleLogsScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  expandedLogId?: string | null;
  setExpandedLogId?: (id: string | null) => void;
  visibleLogsCount?: number;
  setVisibleLogsCount?: (val: number | ((prev: number) => number)) => void;
  filteredLogsCount?: number;
  showNotification?: (type: 'success' | 'error' | 'warn', message: string, duration?: number) => void;
  setActiveTab?: (tab: any) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({

  darkMode,
  autoReplyInput,
  appLogoInput,
  setAppLogoInput,
  deferredPrompt,
  handleInstallApp,
  onOpenLogoSelector,
  onOpenInstallGuide,
  setAutoReplyInput,
  autoReply2Enabled,
  setAutoReply2Enabled,
  autoReply2Input,
  setAutoReply2Input,
  autoReply2DelayInput,
  setAutoReply2DelayInput,
  delaySecondsInput,
  setDelaySecondsInput,
  keywordDelaySecondsInput,
  setKeywordDelaySecondsInput,
  handleToggleAutoReset,
  autoResetKeywords,
  aiModeEnabled,
  handleToggleAiMode,
  geminiApiKeys,
  setGeminiApiKeys,
  verifyKey,
  aiPersona,
  setAiPersona,
  photoReplyEnabled,
  handleTogglePhotoReply,
  photoReplyMessage,
  setPhotoReplyMessage,
  photoReplyMessage2Enabled,
  handleTogglePhotoReplyMessage2,
  photoReplyMessage2,
  setPhotoReplyMessage2,
  photoReplyMessage2StartTime,
  setPhotoReplyMessage2StartTime,
  photoReplyMessage2EndTime,
  setPhotoReplyMessage2EndTime,
  topicIcon,
  setTopicIcon,
  topicRenameEmoji,
  setTopicRenameEmoji,
  photoReplyMax,
  setPhotoReplyMax,
  notificationSoundEnabled,
  handleToggleNotificationSound,
  notificationSoundType,
  handleUpdateNotificationSoundType,
  testPush,
  requestNotificationPermission,
  notificationStyle = 'minimalist',
  setNotificationStyle,
  handleExportData,
  fileInputRef,
  handleImportData,
  importing,
  onOpenDeleteLastImport,
  onOpenDeleteLastRule,
  lastImportInfo,
  importBatches = [],
  onDeleteBatch,
  isFetchingBatches = false,
  deletingBatchId = null,
  onRefreshBatches,
  targetGroupId,
  setTargetGroupId,
  telegramBotToken,
  setTelegramBotToken,
  handleUpdateSettings,
  handleForceUpdateAndPurge,
  saving,
  direction,
  slideVariants,

  logs = [],
  handleDownloadLogs = () => {},
  fetchLogs = () => {},
  refreshingLogs = false,
  clearLogs = () => {},
  isConfirmingClear = false,
  logSearch = "",
  setLogSearch = () => {},
  logLevelFilter = "all",
  setLogLevelFilter = () => {},
  logCategoryFilter = "all",
  setLogCategoryFilter = () => {},
  logCategories = [],
  displayedLogs = [],
  handleLogsScroll = () => {},
  expandedLogId = null,
  setExpandedLogId = () => {},
  visibleLogsCount = 50,
  setVisibleLogsCount = () => {},
  filteredLogsCount = 0,
  showNotification = (type: 'success' | 'error' | 'warn', message: string, duration?: number) => {},
  setActiveTab = () => {},
}) => {
  const [settingsSubTab, setSettingsSubTab] = useState<'settings' | 'logs'>('settings');
  const [activeTabSettings, setActiveTabSettings] = useState("general");
  const [showToken, setShowToken] = useState(false);
  const [botInfo, setBotInfo] = useState<{ id: number; firstName: string; username: string } | null>(null);
  const [isTestingWelcome, setIsTestingWelcome] = useState(false);
  const [isTestingTopic, setIsTestingTopic] = useState(false);

  const handleTestTopicRename = async () => {
    setIsTestingTopic(true);
    try {
      const res = await fetch("/api/test-topic-rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicIcon, topicRenameEmoji })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', data.message || `Topic #${data.topicId} updated!`);
      } else {
        showNotification('error', data?.error || 'Failed to update topic');
      }
    } catch (err: any) {
      showNotification('error', `Connection error: ${err.message}`);
    } finally {
      setIsTestingTopic(false);
    }
  };

  const handleTestWelcome = async () => {
    setIsTestingWelcome(true);
    try {
      const res = await fetch("/api/test-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messageText: autoReplyInput, 
          targetGroup: targetGroupId 
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', data.message || 'Test welcome message sent successfully!');
      } else {
        showNotification('error', data?.error || 'Failed to send test welcome message');
      }
    } catch (e: any) {
      showNotification('error', e.message || 'Connection error while testing welcome message');
    } finally {
      setIsTestingWelcome(false);
    }
  };

  // Unique IP & Device Tracking state
  const [userIp, setUserIp] = useState<string>('Detecting...');
  const [deviceId, setDeviceId] = useState<string>('');
  const [deviceName, setDeviceName] = useState<string>('');
  const [copiedIp, setCopiedIp] = useState(false);

  useEffect(() => {
    const info = getDeviceInfo();
    setDeviceId(info.deviceId);
    setDeviceName(info.deviceName);
    pingDeviceSession().then(res => {
      if (res && res.ip) {
        setUserIp(res.ip);
      } else {
        setUserIp('Connected');
      }
    }).catch(() => {
      setUserIp('Connected');
    });
  }, []);

  useEffect(() => {
    const fetchBotInfo = async () => {
      try {
        const res = await fetch('/api/bot-info');
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (data.bot) {
          setBotInfo(data.bot);
        } else {
          setBotInfo(null);
        }
      } catch (err: any) {
        if (err?.message !== 'Failed to fetch' && !err?.name?.includes('AbortError')) {
          console.error("Failed to fetch bot info", err);
        }
      }
    };
    fetchBotInfo();
  }, [telegramBotToken]); // Re-fetch if token changes, though in reality we only know it after a save

  return (
    <motion.div
      key="settings"
      custom={direction}
      variants={slideVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-3.5 w-full pb-24"
    >
      {/* 2 Sub-Tabs: Settings & Logs (Compact & Colorful) */}
      <div className={`p-1 rounded-xl border flex items-center gap-1.5 shadow-xs ${
        darkMode ? 'bg-neutral-900/80 border-white/10' : 'bg-slate-200/70 border-slate-300'
      }`}>
        <button
          type="button"
          onClick={() => setSettingsSubTab('settings')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            settingsSubTab === 'settings'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
              : (darkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60')
          }`}
        >
          <Bot size={14} />
          <span>Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setSettingsSubTab('logs')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            settingsSubTab === 'logs'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs'
              : (darkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60')
          }`}
        >
          <FileText size={14} />
          <span>Activity Logs</span>
        </button>
      </div>

      {settingsSubTab === 'logs' ? (
        <div className="rounded-xl overflow-hidden border border-white/10">
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
            filteredLogsCount={filteredLogsCount}
            showNotification={showNotification}
            setActiveTab={setActiveTab}
          />
        </div>
      ) : (
        <>
      
      {/* Category Tabs: Colorful, Stylish, Compact Pills */}
      <div className={`p-1 rounded-xl border flex items-center gap-1.5 overflow-x-auto hide-scrollbar ${
        darkMode ? 'bg-neutral-900/80 border-white/10' : 'bg-slate-100/80 border-slate-200 shadow-xs'
      }`}>
        {[
          { 
            id: 'general', 
            label: 'General', 
            icon: Bot,
            activeBg: 'from-blue-600 to-indigo-600 text-white shadow-xs',
            inactiveClass: darkMode ? 'text-blue-400/80 hover:text-blue-300 hover:bg-blue-500/10' : 'text-blue-700 hover:bg-blue-50'
          },
          { 
            id: 'ai', 
            label: 'AI Reply', 
            icon: Sparkles,
            activeBg: 'from-purple-600 to-pink-600 text-white shadow-xs',
            inactiveClass: darkMode ? 'text-purple-400/80 hover:text-purple-300 hover:bg-purple-500/10' : 'text-purple-700 hover:bg-purple-50'
          },
          { 
            id: 'photo', 
            label: 'Photo & Topics', 
            icon: ImageIcon,
            activeBg: 'from-amber-500 to-orange-500 text-white shadow-xs',
            inactiveClass: darkMode ? 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10' : 'text-amber-700 hover:bg-amber-50'
          },
          { 
            id: 'alerts', 
            label: 'Alerts', 
            icon: Bell,
            activeBg: 'from-sky-500 to-cyan-500 text-white shadow-xs',
            inactiveClass: darkMode ? 'text-sky-400/80 hover:text-sky-300 hover:bg-sky-500/10' : 'text-sky-700 hover:bg-sky-50'
          },
          { 
            id: 'advanced', 
            label: 'Data & Backup', 
            icon: Database,
            activeBg: 'from-emerald-500 to-teal-500 text-white shadow-xs',
            inactiveClass: darkMode ? 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/10' : 'text-emerald-700 hover:bg-emerald-50'
          }
        ].map(tab => {
          const isActive = activeTabSettings === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabSettings(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all duration-200 shrink-0 ${
                isActive
                  ? `bg-gradient-to-r ${tab.activeBg}`
                  : `${tab.inactiveClass}`
              }`}
            >
              <tab.icon size={13} className={isActive ? 'text-white' : ''} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Tab Contents */}
  
      {activeTabSettings === "general" && (<>
      {/* Unique IP Address & Device Tracking Card */}
      <div className={`p-3.5 rounded-xl border transition-all duration-200 shadow-xs ${
        darkMode ? 'bg-neutral-900/70 border-indigo-500/25 hover:border-indigo-500/40' : 'bg-white border-indigo-200 hover:border-indigo-300'
      }`}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-xs">
              <Globe size={14} />
            </div>
            <div>
              <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-indigo-300' : 'text-indigo-900'}`}>
                Hardware & IP Fingerprint
              </h3>
              <p className="text-[9px] text-slate-400 font-medium">Session IP tracing & hardware verification</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            LIVE
          </span>
        </div>

        <div className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
          darkMode ? 'bg-black/35 border-white/5' : 'bg-indigo-50/40 border-indigo-100'
        }`}>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Your IP:</span>
              <span className="text-xs font-mono font-black text-emerald-400">{userIp}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Device ID:</span>
              <span className="text-[9.5px] font-mono font-bold text-slate-300 truncate max-w-[180px] sm:max-w-[240px]">{deviceId}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(`IP: ${userIp} | Device ID: ${deviceId} | Device: ${deviceName}`);
              setCopiedIp(true);
              setTimeout(() => setCopiedIp(false), 2000);
            }}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-xs active:scale-95 shrink-0"
          >
            {copiedIp ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}
            <span>{copiedIp ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* App Logo & Visual Branding Card */}
      <div className={`p-3.5 rounded-xl border transition-all duration-200 shadow-xs ${
        darkMode ? 'bg-neutral-900/70 border-emerald-500/25 hover:border-emerald-500/40' : 'bg-white border-emerald-200 hover:border-emerald-300'
      }`}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs">
              <Sparkles size={14} />
            </div>
            <div>
              <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-emerald-300' : 'text-emerald-900'}`}>
                App Logo & Branding
              </h3>
              <p className="text-[9px] text-slate-400 font-medium">Select preset icon or upload custom branding</p>
            </div>
          </div>
          {onOpenLogoSelector && (
            <button
              type="button"
              onClick={onOpenLogoSelector}
              className="text-[9px] font-black uppercase tracking-wider text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 transition flex items-center space-x-1 active:scale-95"
            >
              <span>Gallery</span>
            </button>
          )}
        </div>

        {/* Current Active Preview */}
        <div className={`flex items-center justify-between p-2.5 rounded-lg border mb-2.5 ${
          darkMode ? 'bg-black/35 border-white/5' : 'bg-emerald-50/40 border-emerald-100'
        }`}>
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-black/60 border border-white/20 p-1 flex items-center justify-center shrink-0 shadow-xs">
              <img 
                src={appLogoInput || '/pwa-192x192.png'} 
                alt="Active Logo" 
                className="w-full h-full object-contain rounded-md" 
              />
            </div>
            <div className="min-w-0">
              <span className="text-[8.5px] font-black uppercase text-slate-400 block tracking-wider">Active Logo</span>
              <span className="text-xs font-bold truncate block">
                {appLogoInput 
                  ? (appLogoInput.startsWith('data:') ? 'Custom Uploaded Logo' : 'Selected Preset Icon') 
                  : 'BotFlow Default Logo'}
              </span>
              <span className="text-[9px] text-emerald-400 font-bold block">⚡ Auto-syncs to Home Screen & APK</span>
            </div>
          </div>

          {appLogoInput && (
            <button
              type="button"
              onClick={() => setAppLogoInput('')}
              className="text-[9px] font-bold text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg border border-rose-500/30 bg-rose-500/15 flex items-center space-x-1 transition active:scale-95 shrink-0"
            >
              <Trash2 size={11} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Curated Presets Selection */}
        <div className="space-y-1 mb-2.5">
          <label className={`text-[9px] font-black uppercase tracking-wider block ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Pick From Curated Logos
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
            {LOGO_PRESETS.map((p) => {
              const isSelected = (appLogoInput === p.url) || (!appLogoInput && p.id === 'default');
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setAppLogoInput(p.url)}
                  className={`p-1.5 rounded-lg border flex flex-col items-center gap-1 transition-all text-center ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/25 ring-1 ring-emerald-500 shadow-xs scale-102'
                      : darkMode
                      ? 'border-white/10 bg-black/20 hover:bg-white/5 hover:border-white/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                  }`}
                  title={p.name}
                >
                  <div className="w-7 h-7 rounded-md overflow-hidden flex items-center justify-center bg-black/30">
                    <img src={p.url} alt={p.name} className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[8px] font-bold truncate max-w-full leading-tight">{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Upload Form */}
        <div className="space-y-1">
          <label className={`text-[9px] font-black uppercase tracking-wider block ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Or Upload Custom Image
          </label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const img = new Image();
                  img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_DIM = 512;
                    let width = img.width;
                    let height = img.height;
                    if (width > height) {
                      if (width > MAX_DIM) {
                        height = Math.round((height * MAX_DIM) / width);
                        width = MAX_DIM;
                      }
                    } else {
                      if (height > MAX_DIM) {
                        width = Math.round((width * MAX_DIM) / height);
                        height = MAX_DIM;
                      }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.drawImage(img, 0, 0, width, height);
                      setAppLogoInput(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.9));
                    }
                  };
                  img.src = ev.target?.result as string;
                };
                reader.readAsDataURL(file);
              }
            }}
            className={`w-full text-[10px] p-1.5 border rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none transition ${
              darkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          />
          <p className={`text-[8.5px] leading-tight ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Auto-optimized to 512x512. Click 'Save Settings' to apply.
          </p>
        </div>
      </div>

      {/* General Settings Card */}
      <div className={`p-3.5 rounded-xl border transition-all duration-200 shadow-xs ${
        darkMode ? 'bg-neutral-900/70 border-blue-500/25 hover:border-blue-500/40' : 'bg-white border-blue-200 hover:border-blue-300'
      }`}>
        <div className="flex items-center space-x-2 mb-3">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xs">
            <Bot size={14} />
          </div>
          <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>
            General Bot Settings
          </h3>
        </div>
        
        <div className="space-y-3">
          <div className="space-y-1">
            <label className={`text-[9.5px] font-black uppercase tracking-wider block ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Target Group IDs (Comma Separated)
            </label>
            <input
              type="text"
              value={targetGroupId}
              onChange={(e) => setTargetGroupId(e.target.value)}
              placeholder="e.g. -100123456789, -100987654321"
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono transition ${
                darkMode ? 'bg-black/30 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            <p className={`text-[8.5px] leading-tight ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Multiple groups separated by commas. Bot listens and acts across all listed group IDs.
            </p>
          </div>

          <div className="space-y-1 pt-2 border-t border-white/5">
            <label className={`text-[9.5px] font-black uppercase tracking-wider block ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Telegram Bot Token
            </label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={telegramBotToken}
                onChange={(e) => setTelegramBotToken(e.target.value)}
                placeholder="Enter bot token from @BotFather"
                className={`w-full p-2 pr-9 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono transition ${
                  darkMode ? 'bg-black/30 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
              <button 
                type="button"
                onClick={() => setShowToken(!showToken)}
                className={`absolute inset-y-0 right-0 px-2.5 flex items-center justify-center transition-colors ${
                  darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            
            {botInfo && (
              <div className={`mt-1.5 p-2 rounded-lg flex items-center justify-between border ${
                darkMode ? 'bg-emerald-900/15 border-emerald-500/25' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-black shadow-xs">
                    {botInfo.firstName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={`text-xs font-bold leading-tight ${darkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>{botInfo.firstName}</p>
                    <p className={`text-[9.5px] font-mono ${darkMode ? 'text-emerald-400/80' : 'text-emerald-600'}`}>@{botInfo.username}</p>
                  </div>
                </div>
                <a 
                  href={`https://t.me/${botInfo.username}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1 rounded-md text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            )}

            {!botInfo && telegramBotToken && (
              <p className={`text-[8.5px] leading-tight ${darkMode ? 'text-rose-400/80' : 'text-rose-500'}`}>
                Valid token required to fetch bot info. Please check your token and save settings.
              </p>
            )}
            
            <p className={`text-[8.5px] leading-tight ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Required for topic creation logs and other bot features.
            </p>
          </div>
          
          {/* Welcome Message Clean Card (Colorful & Compact) */}
          <div className={`p-3 rounded-xl border transition-all space-y-2.5 shadow-xs ${
            darkMode ? 'bg-black/35 border-blue-500/30' : 'bg-blue-50/40 border-blue-200'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[11px] font-black uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Welcome Message
                  </span>
                  <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    autoReplyInput?.trim()
                      ? (darkMode ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border border-emerald-300')
                      : (darkMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-800 border border-amber-300')
                  }`}>
                    {autoReplyInput?.trim() ? 'Configured' : 'Empty'}
                  </span>
                </div>
                <p className={`text-[9px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Sent automatically when a new topic is created or a new user joins.
                </p>
              </div>

              {/* Instant Test Button */}
              <button
                type="button"
                onClick={handleTestWelcome}
                disabled={isTestingWelcome}
                className="px-2.5 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xs active:scale-95 shrink-0 disabled:opacity-50"
                title="Send a test welcome message to verify it works"
              >
                {isTestingWelcome ? (
                  <RefreshCw size={10} className="animate-spin text-blue-200" />
                ) : (
                  <Send size={10} className="text-white" />
                )}
                <span>{isTestingWelcome ? 'Sending...' : 'Test Send'}</span>
              </button>
            </div>

            <textarea
              value={autoReplyInput}
              onChange={(e) => setAutoReplyInput(e.target.value)}
              placeholder="e.g. Welcome to our group! Please check the pinned rules..."
              rows={2}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs transition ${
                darkMode ? 'bg-neutral-900 border-white/10 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />

            {/* Second Welcome Message Section */}
            <div className={`pt-2 border-t space-y-2 ${darkMode ? 'border-white/5' : 'border-slate-200/80'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-[10px] font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Second Follow-Up Welcome Message
                  </span>
                  <p className={`text-[8.5px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Send an optional second message after a delay.
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => setAutoReply2Enabled(!autoReply2Enabled)}
                  className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors focus:outline-none ${autoReply2Enabled ? 'bg-emerald-500' : 'bg-slate-400/40'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-xs ${autoReply2Enabled ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
              </div>

              {autoReply2Enabled && (
                <div className="space-y-1.5 pl-1">
                  <textarea
                    value={autoReply2Input}
                    onChange={(e) => setAutoReply2Input(e.target.value)}
                    placeholder="e.g. Feel free to ask any questions here!"
                    rows={2}
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs transition ${
                      darkMode ? 'bg-neutral-900 border-white/10 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <div className="flex items-center gap-2">
                    <label className={`text-[9.5px] font-bold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Follow-up Delay:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={autoReply2DelayInput}
                      onChange={(e) => setAutoReply2DelayInput(parseInt(e.target.value) || 1)}
                      className={`w-16 p-1 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono text-center transition ${
                        darkMode ? 'bg-neutral-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                    <span className="text-[9px] text-slate-400">seconds</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className={`text-[9px] font-black uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Topic Delay (Sec)
              </label>
              <input
                type="number"
                value={delaySecondsInput}
                onChange={(e) => setDelaySecondsInput(parseInt(e.target.value) || 0)}
                className={`w-full p-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono text-center transition ${
                  darkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>
            <div className="space-y-1">
              <label className={`text-[9px] font-black uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Keyword Delay (Sec)
              </label>
              <input
                type="number"
                value={keywordDelaySecondsInput}
                onChange={(e) => setKeywordDelaySecondsInput(parseInt(e.target.value) || 0)}
                className={`w-full p-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono text-center transition ${
                  darkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-white/5">
            <div className={`flex items-center justify-between p-2 rounded-lg border transition ${
              darkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50/60 border-slate-200'
            }`}>
              <div className="space-y-0.5 flex-1 mr-2 min-w-0">
                <p className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Auto Reset Keywords</p>
                <p className={`text-[9px] leading-tight ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Automatically reset keyword limits daily at 12:00 AM IST.</p>
              </div>
              <button
                onClick={handleToggleAutoReset}
                className={`relative inline-flex h-4.5 w-8 shrink-0 items-center rounded-full transition-colors focus:outline-none ${autoResetKeywords ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${autoResetKeywords ? 'translate-x-4' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

            </>)}

      {activeTabSettings === "ai" && (<>
      {/* AI Integration Card (Compact, Stylish, Colorful) */}
      <div className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 shadow-xs ${
        darkMode ? 'bg-neutral-900/70 border-purple-500/25 hover:border-purple-500/40' : 'bg-white border-purple-200 hover:border-purple-300'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-xs">
              <Zap size={14} />
            </div>
            <div>
              <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-purple-300' : 'text-purple-900'}`}>
                AI Smart Reply
              </h3>
              <p className="text-[9px] text-slate-400 font-medium">Gemini AI model multi-key auto-replies</p>
            </div>
          </div>
          <button 
            onClick={handleToggleAiMode}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none shadow-inner ${aiModeEnabled ? 'bg-purple-500' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-xs ${aiModeEnabled ? 'translate-x-4.5' : 'translate-x-1'}`} />
          </button>
        </div>

        <AnimatePresence>
          {aiModeEnabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 overflow-hidden pt-1"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={`text-[9.5px] font-black uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Gemini API Keys (Multi-Key Rotation)
                  </label>
                  <button
                    onClick={() => setGeminiApiKeys([...geminiApiKeys, ""])}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider transition bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/30 active:scale-95"
                  >
                    <Plus size={11} />
                    <span>Add Key</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {geminiApiKeys.map((key, index) => (
                    <div key={index} className="flex items-center space-x-1.5">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => {
                          const newKeys = [...geminiApiKeys];
                          newKeys[index] = e.target.value;
                          setGeminiApiKeys(newKeys);
                        }}
                        placeholder="Enter AIzaSy..."
                        className={`flex-1 p-2 border rounded-lg outline-none text-xs font-mono transition focus:ring-2 focus:ring-purple-500 ${
                          darkMode ? 'bg-black/30 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                      <button
                        onClick={() => verifyKey(key)}
                        disabled={!key}
                        className={`p-2 rounded-lg transition border active:scale-95 ${
                          !key 
                            ? 'opacity-30 border-transparent' 
                            : (darkMode ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100')
                        }`}
                        title="Verify API Key"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          const newKeys = [...geminiApiKeys];
                          newKeys.splice(index, 1);
                          setGeminiApiKeys(newKeys);
                        }}
                        className={`p-2 rounded-lg transition border active:scale-95 ${
                          darkMode ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Delete Key"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-white/5">
                <label className={`text-[9.5px] font-black uppercase tracking-wider block ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  AI Persona / System Prompt
                </label>
                <textarea
                  value={aiPersona}
                  onChange={(e) => setAiPersona(e.target.value)}
                  placeholder="e.g. You are a helpful Telegram community assistant..."
                  rows={3}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-xs transition ${
                    darkMode ? 'bg-neutral-900 border-white/10 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <p className={`text-[8.5px] leading-tight ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Custom personality instructions for Gemini AI when answering user questions.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

            </>)}

      {activeTabSettings === "photo" && (<>
      {/* Photo Automation Card (Compact, Stylish, Colorful) */}
      <div className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 shadow-xs ${
        darkMode ? 'bg-neutral-900/70 border-amber-500/25 hover:border-amber-500/40' : 'bg-white border-amber-200 hover:border-amber-300'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xs">
              <ImageIcon size={14} />
            </div>
            <div>
              <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-amber-300' : 'text-amber-900'}`}>
                Photo Automation
              </h3>
              <p className="text-[9px] text-slate-400 font-medium">Auto-replies and topic icons for incoming images</p>
            </div>
          </div>
          <button 
            onClick={handleTogglePhotoReply}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none shadow-inner ${photoReplyEnabled ? 'bg-amber-500' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-xs ${photoReplyEnabled ? 'translate-x-4.5' : 'translate-x-1'}`} />
          </button>
        </div>

        <AnimatePresence>
          {photoReplyEnabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 overflow-hidden pt-1"
            >
              <div className="space-y-1">
                <label className={`text-[9.5px] font-black uppercase tracking-wider block ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Primary Reply Message
                </label>
                <textarea
                  value={photoReplyMessage}
                  onChange={(e) => setPhotoReplyMessage(e.target.value)}
                  placeholder="e.g. Thanks for sharing this photo! We will review it shortly."
                  rows={2}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs transition ${
                    darkMode ? 'bg-neutral-900 border-white/10 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className={`p-2.5 rounded-lg border space-y-2 ${darkMode ? 'bg-black/25 border-white/5' : 'bg-amber-50/30 border-amber-100'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-[10px] font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Second Follow-Up Message
                    </span>
                    <p className={`text-[8.5px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Optional message sent during scheduled operating hours.
                    </p>
                  </div>
                  <button 
                    onClick={handleTogglePhotoReplyMessage2}
                    className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors focus:outline-none ${photoReplyMessage2Enabled ? 'bg-amber-500' : 'bg-slate-400/40'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-xs ${photoReplyMessage2Enabled ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                </div>

                <AnimatePresence>
                  {photoReplyMessage2Enabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-2 overflow-hidden pt-1"
                    >
                      <textarea
                        value={photoReplyMessage2}
                        onChange={(e) => setPhotoReplyMessage2(e.target.value)}
                        placeholder="e.g. Our support line is active right now."
                        rows={2}
                        className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs transition ${
                          darkMode ? 'bg-neutral-900 border-white/10 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <label className={`text-[8.5px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Active Time (IST)
                          </label>
                          <input
                            type="time"
                            value={photoReplyMessage2StartTime}
                            onChange={(e) => setPhotoReplyMessage2StartTime(e.target.value)}
                            className={`w-full p-1.5 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-mono transition ${
                              darkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
                            }`}
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className={`text-[8.5px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Closing Time (IST)
                          </label>
                          <input
                            type="time"
                            value={photoReplyMessage2EndTime}
                            onChange={(e) => setPhotoReplyMessage2EndTime(e.target.value)}
                            className={`w-full p-1.5 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-mono transition ${
                              darkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
                            }`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-white/5">
                <div className="space-y-1">
                  <label className={`text-[9px] font-black uppercase tracking-wider block ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Topic Icon
                  </label>
                  <select
                    value={topicIcon}
                    onChange={(e) => setTopicIcon(e.target.value)}
                    className={`w-full p-1.5 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs transition ${
                      darkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {["📰", "💡", "⚡️", "🎙", "🔝", "🗣", "🆒", "❗️", "📝", "📆", "📁", "🔎", "📣", "🔥", "❤️", "❓", "📈", "📉", "💎", "💰", "💸", "🪙", "💱", "⁉️", "🎮", "💻", "📱", "🚗", "🏠", "💘", "🎉", "‼️", "🏆", "🏁", "🎬", "🎵", "🔞", "📚", "👑", "⚽️", "🏀", "📺", "👀", "🫦", "🍓", "💄", "👠", "✈️", "🧳", "🏖", "⛅️", "🦄", "🛍", "👜", "🛒", "🚂", "🛥", "🏔", "🏕", "🤖", "🪩", "🎟", "🏴‍☠️", "🗳", "🎓", "🔭", "🔬", "🎶", "🎤", "🕺", "💃", "🪖", "💼", "🧪", "👨‍👩‍👧‍👦", "👶", "🤰", "💅", "🏛", "🧮", "🖨", "👮‍♂️", "🩺", "💊", "💉", "🧼", "🪪", "🛃", "🍽", "🐟", "🎨", "🎭", "🎩", "🔮", "🍹", "🎂", "☕️", "🍣", "🍔", "🍕", "🦠", "💬", "🎄", "🎃", "✍️", "⭐️", "✅", "🎖", "🤡", "🧠", "🦮", "🐈"].map(emoji => (
                      <option key={emoji} value={emoji}>{emoji}</option>
                    ))}
                  </select>
                  <p className={`text-[8.5px] leading-tight ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Telegram topic icon badge.</p>
                </div>
                <div className="space-y-1">
                  <label className={`text-[9px] font-black uppercase tracking-wider block ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Rename Emoji
                  </label>
                  <input
                    type="text"
                    value={topicRenameEmoji}
                    onChange={(e) => setTopicRenameEmoji(e.target.value)}
                    className={`w-full p-1.5 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs transition ${
                      darkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                    placeholder="e.g. 🛑"
                  />
                  <p className={`text-[8.5px] leading-tight ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Prefix added to topic title.</p>
                </div>
                <div className="space-y-1">
                  <label className={`text-[9px] font-black uppercase tracking-wider block ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Max Replies
                  </label>
                  <input
                    type="number"
                    value={photoReplyMax}
                    onChange={(e) => setPhotoReplyMax(e.target.value === '' ? '' : parseInt(e.target.value) || 1)}
                    className={`w-full p-1.5 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-xs font-mono text-center transition ${
                      darkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                  <p className={`text-[8.5px] leading-tight ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Daily limit per user.</p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/5">
                <button
                  type="button"
                  disabled={isTestingTopic}
                  onClick={handleTestTopicRename}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition active:scale-95 shadow-xs ${
                    darkMode ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30' : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200'
                  } ${isTestingTopic ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <Zap size={11} className={isTestingTopic ? 'animate-spin' : ''} />
                  <span>{isTestingTopic ? 'Updating Topic...' : '⚡ Test Topic Icon & Emoji Rename'}</span>
                </button>
                <span className={`text-[8.5px] leading-tight ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Live updates latest active topic with badge {topicIcon} & prefix "{topicRenameEmoji}"
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

            </>)}

      {activeTabSettings === "alerts" && (<>
      {/* Notifications Card (Compact, Stylish, Colorful) */}
      <div className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 shadow-xs ${
        darkMode ? 'bg-neutral-900/70 border-sky-500/25 hover:border-sky-500/40' : 'bg-white border-sky-200 hover:border-sky-300'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-xs">
              <Bell size={14} />
            </div>
            <div>
              <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-sky-300' : 'text-sky-900'}`}>
                Notification Settings
              </h3>
              <p className="text-[9px] text-slate-400 font-medium">Alert styles, push notifications & audio chimes</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-[8.5px] font-black uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Sound</span>
            <button 
              onClick={handleToggleNotificationSound}
              className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors focus:outline-none ${notificationSoundEnabled ? 'bg-sky-500' : 'bg-slate-400/40'}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-xs ${notificationSoundEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {/* Push Notifications Card */}
          <div className={`flex items-center justify-between p-2.5 rounded-lg border transition ${
            darkMode ? 'bg-black/25 border-white/5' : 'bg-sky-50/40 border-sky-100'
          }`}>
            <div className="space-y-0.5 pr-2">
              <p className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Push Notifications</p>
              <p className={`text-[8.5px] leading-tight ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {Notification.permission === 'granted' ? 'Real-time alerts active.' : 'Enable browser notifications for instant alerts.'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {Notification.permission === 'granted' && (
                <button
                  onClick={testPush}
                  className="p-1.5 rounded-lg transition bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-xs active:scale-95"
                  title="Send Test Push"
                >
                  <Send size={11} />
                </button>
              )}

              <button
                onClick={requestNotificationPermission}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none shadow-inner ${Notification.permission === 'granted' ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-xs ${Notification.permission === 'granted' ? 'translate-x-4.5' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>

          {/* Interactive Style Picker Grid */}
          <div className="pt-2 border-t border-white/5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-[9.5px] font-black uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Interactive Alert Themes (10 Styles)
              </label>
              <span className="text-[8.5px] text-sky-400 font-bold">Pick your look</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'minimalist', name: 'Minimalist', desc: 'Sleek flat alert card' },
                { id: 'glassmorphic', name: 'Glassmorphic', desc: 'Translucent neon aura' },
                { id: 'neobrutalist', name: 'Neo-Brutalist', desc: 'Bold outlines & pop' },
                { id: 'cyberpunk', name: 'Cyberpunk', desc: 'Cyan laser grid glow' },
                { id: 'terminal', name: 'CRT Terminal', desc: 'Phosphor green CRT' },
                { id: 'gradient', name: 'Gradient Aura', desc: 'Sunset color shifting' },
                { id: 'compact-pill', name: 'Compact Pill', desc: 'Ultra-small floating pill' },
                { id: 'organic', name: 'Organic Linen', desc: 'Calm oatmeal tones' },
                { id: 'luxury-gold', name: 'Dark Royal Gold', desc: 'Navy & gold hairline' },
                { id: 'dynamic-island', name: 'Dynamic Island', desc: 'Floating capsule physics' }
              ].map((style) => {
                const isSelected = notificationStyle === style.id;
                return (
                  <div 
                    key={style.id}
                    className={`p-2 rounded-lg border transition-all flex flex-col justify-between ${
                      isSelected
                        ? (darkMode ? 'bg-sky-500/15 border-sky-500/40 shadow-xs' : 'bg-sky-50 border-sky-300 shadow-xs')
                        : (darkMode ? 'bg-black/20 border-white/5 hover:border-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[9.5px] font-bold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{style.name}</span>
                        {isSelected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-ping" />
                        )}
                      </div>
                      <p className={`text-[8px] leading-tight ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{style.desc}</p>
                    </div>

                    <div className="mt-2 flex items-center gap-1 pt-1.5 border-t border-white/5">
                      <button
                        onClick={() => {
                          if (setNotificationStyle) {
                            setNotificationStyle(style.id);
                            localStorage.setItem('notificationStyle', style.id);
                            if (showNotification) {
                              showNotification('success', `Active style: ${style.name}!`);
                            }
                          }
                        }}
                        className={`flex-1 py-0.5 px-1 rounded text-[8px] font-black uppercase tracking-wider text-center transition ${
                          isSelected
                            ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-extrabold shadow-xs'
                            : (darkMode ? 'bg-neutral-800 text-slate-300 hover:text-white' : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs')
                        }`}
                      >
                        {isSelected ? 'Active' : 'Use'}
                      </button>
                      <button
                        onClick={() => {
                          if (setNotificationStyle) {
                            const prev = notificationStyle;
                            setNotificationStyle(style.id);
                            setTimeout(() => {
                              if (showNotification) {
                                const rand = Math.random();
                                if (rand > 0.6) {
                                  showNotification('success', `Test: Database synced under ${style.name} style.`);
                                } else if (rand > 0.3) {
                                  showNotification('warn', `Test: Impending rate limits warnings on bot routes.`);
                                } else {
                                  showNotification('error', `Test: Outbound connection reset error trace.`);
                                }
                              }
                              setTimeout(() => {
                                setNotificationStyle(prev);
                              }, 50);
                            }, 10);
                          }
                        }}
                        className={`p-0.5 px-1 rounded transition border flex items-center justify-center ${
                          darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 shadow-xs'
                        }`}
                        title="Test Alert Style"
                      >
                        <Send size={8} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <AnimatePresence>
            {notificationSoundEnabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 overflow-hidden pt-2 border-t border-white/5"
              >
                <label className={`text-[9px] font-black uppercase tracking-wider block ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Select Alert Sound Tone
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {['default', 'bell', 'chime', 'ping', 'digital', 'rising', 'double', 'low', 'laser'].map((type) => (
                    <button
                      key={type}
                      onClick={() => handleUpdateNotificationSoundType(type)}
                      className={`py-1 rounded-md text-[8.5px] font-bold uppercase tracking-wider border transition ${
                        notificationSoundType === type 
                          ? (darkMode ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' : 'bg-sky-100 border-sky-300 text-sky-800') 
                          : (darkMode ? 'bg-black/20 border-white/5 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800')
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <button
                  onClick={requestNotificationPermission}
                  className={`w-full flex items-center justify-center space-x-1 py-1.5 rounded-lg border font-bold text-[9px] uppercase tracking-wider transition ${
                    darkMode ? 'bg-black/30 border-white/10 text-slate-300 hover:bg-black/40' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                  }`}
                >
                  <Bell size={10} />
                  <span>Test Sound Tone</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

            </>)}

      {activeTabSettings === "advanced" && (<>
      {/* Data & Backup Card (Compact, Stylish, Colorful) */}
      <div className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 shadow-xs ${
        darkMode ? 'bg-neutral-900/70 border-emerald-500/25 hover:border-emerald-500/40' : 'bg-white border-emerald-200 hover:border-emerald-300'
      }`}>
        <div className="flex items-center space-x-2 mb-3">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs">
            <Database size={14} />
          </div>
          <div>
            <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-emerald-300' : 'text-emerald-900'}`}>
              Data & Backup
            </h3>
            <p className="text-[9px] text-slate-400 font-medium">Export, import, and manage JSON rule database</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <button 
            type="button"
            onClick={handleExportData}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-lg border transition bg-gradient-to-r from-blue-600/15 to-indigo-600/15 hover:from-blue-600/25 text-blue-300 border-blue-500/30 active:scale-95 shadow-xs"
          >
            <Download size={14} className="text-blue-400 shrink-0" />
            <span className="text-[9.5px] font-black uppercase tracking-wider">Export Data</span>
          </button>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-lg border transition bg-gradient-to-r from-purple-600/15 to-pink-600/15 hover:from-purple-600/25 text-purple-300 border-purple-500/30 active:scale-95 shadow-xs"
          >
            <Upload size={14} className="text-purple-400 shrink-0" />
            <span className="text-[9.5px] font-black uppercase tracking-wider">{importing ? 'Importing...' : 'Import Data'}</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImportData} accept=".json" className="hidden" />

          {onOpenDeleteLastImport && (
            <button
              type="button"
              onClick={onOpenDeleteLastImport}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-lg border text-[9.5px] font-black uppercase tracking-wider transition bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30 active:scale-95 shadow-xs"
              title="Delete all rules imported in the last JSON file at once"
            >
              <Trash2 size={13} className="text-rose-400 shrink-0" />
              <span className="truncate">
                {lastImportInfo && lastImportInfo.count > 0 
                  ? `Delete Last (${lastImportInfo.count})` 
                  : 'Delete Last JSON'}
              </span>
            </button>
          )}

          {onOpenDeleteLastRule && (
            <button
              type="button"
              onClick={onOpenDeleteLastRule}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-lg border text-[9.5px] font-black uppercase tracking-wider transition bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30 active:scale-95 shadow-xs"
              title="Delete only the single latest rule (1 by 1)"
            >
              <Trash2 size={13} className="text-amber-400 shrink-0" />
              <span className="truncate">Delete Last 1 Rule</span>
            </button>
          )}
        </div>
      </div>

      {/* Past Imported Files History Card (Compact & Stylish) */}
      <div className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 shadow-xs ${
        darkMode ? 'bg-neutral-900/70 border-indigo-500/25 hover:border-indigo-500/40' : 'bg-white border-indigo-200 hover:border-indigo-300'
      }`}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs">
              <History size={14} />
            </div>
            <div>
              <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-indigo-300' : 'text-indigo-900'}`}>
                Imported Files History
              </h3>
              <p className="text-[9px] text-slate-400 font-medium">Past imported JSON backup files & rule batches</p>
            </div>
          </div>
          {onRefreshBatches && (
            <button
              type="button"
              onClick={onRefreshBatches}
              disabled={isFetchingBatches}
              className="p-1.5 rounded-lg border border-white/10 bg-black/20 text-slate-400 hover:text-white transition"
              title="Refresh imported files list"
            >
              <RefreshCw size={12} className={isFetchingBatches ? 'animate-spin text-indigo-400' : ''} />
            </button>
          )}
        </div>

        {importBatches && importBatches.length > 0 ? (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {importBatches.map((batch) => (
              <div
                key={batch.batchId || batch.id}
                className={`p-2.5 rounded-lg border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  darkMode 
                    ? 'bg-black/30 border-white/5 hover:border-white/15' 
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70 shadow-xs'
                }`}
              >
                <div className="flex items-start space-x-2 min-w-0 flex-1">
                  <div className="p-1.5 rounded-md shrink-0 mt-0.5 bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                    <FileJson size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <span className={`text-xs font-bold truncate max-w-[180px] sm:max-w-[240px] ${darkMode ? 'text-white' : 'text-slate-900'}`} title={batch.fileName}>
                        {batch.fileName}
                      </span>
                      <span className="text-[8.5px] font-black px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {batch.count} Rules
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-[9px] text-slate-400 mt-0.5">
                      <Calendar size={10} className="shrink-0 text-slate-500" />
                      <span>{new Date(batch.importedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {/* Side Delete Button */}
                <div className="flex sm:flex-col justify-end shrink-0">
                  <button
                    type="button"
                    disabled={deletingBatchId === batch.batchId}
                    onClick={() => onDeleteBatch && onDeleteBatch({ batchId: batch.batchId, fileName: batch.fileName, count: batch.count })}
                    className="flex items-center justify-center space-x-1 py-1 px-2.5 rounded-md border text-[9.5px] font-bold uppercase tracking-wider transition bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30 active:scale-95 disabled:opacity-50 shrink-0"
                    title={`Delete "${batch.fileName}"`}
                  >
                    {deletingBatchId === batch.batchId ? (
                      <RefreshCw size={11} className="animate-spin text-rose-300" />
                    ) : (
                      <Trash2 size={11} className="text-rose-400 shrink-0" />
                    )}
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`p-3 rounded-lg border text-center ${darkMode ? 'bg-black/20 border-white/5 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
            <FileJson size={18} className="mx-auto mb-1 opacity-40 text-indigo-400" />
            <p className="text-[11px] font-bold">No past imported files found</p>
            <p className="text-[8.5px] opacity-75 mt-0.5">When you import JSON backup files, they appear here.</p>
          </div>
        )}
      </div>

      {/* System Update & Cache Maintenance Card */}
      {handleForceUpdateAndPurge && (
        <div className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 shadow-xs ${
          darkMode ? 'bg-neutral-900/70 border-teal-500/25 hover:border-teal-500/40' : 'bg-white border-teal-200 hover:border-teal-300'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-xs">
              <RefreshCw size={14} />
            </div>
            <div>
              <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-teal-300' : 'text-teal-900'}`}>App Updates & Cache</h3>
              <p className="text-[9px] text-slate-400 font-medium">Force clear stale cache and sync latest updates</p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={handleForceUpdateAndPurge}
            className="w-full mt-2 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border text-[10px] font-black uppercase tracking-wider transition bg-gradient-to-r from-emerald-600/20 to-teal-600/20 text-emerald-300 hover:from-emerald-600/30 border-emerald-500/30 active:scale-98 shadow-xs"
          >
            <RefreshCw size={12} className="text-emerald-300 shrink-0" />
            <span>Update App & Flush Cache</span>
          </button>
          
          <button 
            type="button"
            onClick={() => {
              if (deferredPrompt) {
                handleInstallApp();
              } else if (onOpenInstallGuide) {
                onOpenInstallGuide();
              }
            }}
            className="w-full mt-2 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border text-[10px] font-black uppercase tracking-wider transition bg-gradient-to-r from-blue-600/25 to-indigo-600/25 text-blue-300 hover:brightness-110 border-blue-500/30 active:scale-98 shadow-xs"
          >
            <Download size={12} className="text-blue-300 shrink-0" />
            <span>{deferredPrompt ? 'Install App to Home Screen' : 'Install App / APK Download Guide'}</span>
          </button>
        </div>
      )}

      </>
      )}
            </>)}

      {/* Save Button - STYLISH, COMPACT, HIGH-VISIBILITY FLOATING ACTION BUTTON (FAB) */}
      {settingsSubTab === 'settings' && (
        <div className="fixed bottom-20 right-4 sm:right-6 md:right-8 z-45">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleUpdateSettings}
            disabled={saving}
            className="py-2.5 px-4.5 rounded-full font-black uppercase tracking-wider text-[11px] transition-all shadow-2xl flex items-center justify-center space-x-1.5 shrink-0 border bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 text-white border-rose-400/30 shadow-[0_8px_25px_rgba(244,63,94,0.45)] hover:brightness-110 active:scale-95"
          >
            {saving ? (
              <RefreshCw className="animate-spin" size={13} />
            ) : (
              <Save size={13} className="animate-pulse" />
            )}
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

export default memo(SettingsPanel);
