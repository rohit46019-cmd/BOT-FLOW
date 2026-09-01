import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Zap, Plus, Trash2, CheckCircle2, Image as ImageIcon, Bell, Send, Database, Download, Upload, Save, RefreshCw, FileText } from 'lucide-react';
import ActivityLogs from './ActivityLogs';

interface SettingsPanelProps {
  darkMode: boolean;
  autoReplyInput: string;
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
  targetGroupId: string;
  setTargetGroupId: (val: string) => void;
  telegramBotToken: string;
  setTelegramBotToken: (val: string) => void;
  handleUpdateSettings: () => void;
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
  targetGroupId,
  setTargetGroupId,
  telegramBotToken,
  setTelegramBotToken,
  handleUpdateSettings,
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

  return (
    <motion.div
      key="settings"
      custom={direction}
      variants={slideVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 w-full pb-20"
    >
      {/* 2 Sub-Tabs: Settings & Logs */}
      <div className={`p-1 rounded-lg border flex items-center gap-1.5 ${darkMode ? 'bg-neutral-900/90 border-white/10' : 'bg-slate-200/80 border-slate-300'}`}>
        <button
          type="button"
          onClick={() => setSettingsSubTab('settings')}
          className={`flex-1 py-1.5 px-3 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            settingsSubTab === 'settings'
              ? (darkMode ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'bg-white text-slate-900 shadow-xs border border-slate-200')
              : (darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
          }`}
        >
          <Bot size={13} />
          <span>Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setSettingsSubTab('logs')}
          className={`flex-1 py-1.5 px-3 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            settingsSubTab === 'logs'
              ? (darkMode ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'bg-white text-slate-900 shadow-xs border border-slate-200')
              : (darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
          }`}
        >
          <FileText size={13} />
          <span>Logs</span>
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
      {/* General Settings Card */}
      <div className={`p-4 rounded-xl border transition-all duration-300 ${darkMode ? 'bg-neutral-900/60 border-white/10' : 'bg-white border-slate-200 shadow-xs'}`}>
        <div className="flex items-center space-x-2 mb-4">
          <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
            <Bot size={15} />
          </div>
          <h3 className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>General Bot Settings</h3>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className={`text-[9px] font-bold uppercase tracking-wider block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Target Group IDs (Comma Separated)</label>
            <input
              type="text"
              value={targetGroupId}
              onChange={(e) => setTargetGroupId(e.target.value)}
              placeholder="e.g. -100123456789, -100987654321"
              className={`w-full p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-xs transition ${darkMode ? 'bg-black/30 border-white/10 text-white placeholder-white/15' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`}
            />
            <p className={`text-[9.5px] leading-relaxed ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Separate multiple groups with commas. The bot will automatically start, reply to messages, and broadcast across all configured groups simultaneously.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className={`text-[9px] font-bold uppercase tracking-wider block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Telegram Bot Token</label>
            <input
              type="password"
              value={telegramBotToken}
              onChange={(e) => setTelegramBotToken(e.target.value)}
              placeholder="Enter bot token from @BotFather"
              className={`w-full p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-xs transition ${darkMode ? 'bg-black/30 border-white/10 text-white placeholder-white/15' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`}
            />
            <p className={`text-[9.5px] leading-relaxed ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Required for topic creation logs and other bot features. Get this from @BotFather on Telegram.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className={`text-[9px] font-bold uppercase tracking-wider block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Welcome Message</label>
            <textarea
              value={autoReplyInput}
              onChange={(e) => setAutoReplyInput(e.target.value)}
              placeholder="Message sent to new users..."
              rows={2}
              className={`w-full p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-xs transition ${darkMode ? 'bg-black/30 border-white/10 text-white placeholder-white/15' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`}
            />
          </div>

          <div className="space-y-1.5 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between">
              <label className={`text-[9px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Second Welcome Message</label>
              <button 
                onClick={() => setAutoReply2Enabled(!autoReply2Enabled)}
                className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors focus:outline-none ${autoReply2Enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${autoReply2Enabled ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
            </div>
            {autoReply2Enabled && (
              <div className="space-y-2">
                <textarea
                  value={autoReply2Input}
                  onChange={(e) => setAutoReply2Input(e.target.value)}
                  placeholder="Second message..."
                  rows={2}
                  className={`w-full p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-xs transition ${darkMode ? 'bg-black/30 border-white/10 text-white placeholder-white/15' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`}
                />
                <div className="space-y-1">
                  <label className={`text-[9px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Delay (Seconds)</label>
                  <input
                    type="number"
                    value={autoReply2DelayInput}
                    onChange={(e) => setAutoReply2DelayInput(parseInt(e.target.value) || 0)}
                    className={`w-full p-2 border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs transition ${darkMode ? 'bg-black/30 border-white/10 text-white placeholder-white/15' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <label className={`text-[9px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Topic Reply Delay (Sec)</label>
              <input
                type="number"
                value={delaySecondsInput}
                onChange={(e) => setDelaySecondsInput(parseInt(e.target.value) || 0)}
                className={`w-full p-2 border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs transition ${darkMode ? 'bg-black/30 border-white/10 text-white placeholder-white/15' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`}
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className={`text-[9px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Keyword Reply Delay (Sec)</label>
              <input
                type="number"
                value={keywordDelaySecondsInput}
                onChange={(e) => setKeywordDelaySecondsInput(parseInt(e.target.value) || 0)}
                className={`w-full p-2 border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-xs transition ${darkMode ? 'bg-black/30 border-white/10 text-white placeholder-white/15' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-white/5">
            <div className={`flex items-center justify-between p-2.5 rounded-lg border transition duration-300 ${darkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50/50 border-slate-200'}`}>
              <div className="space-y-0.5 flex-1 mr-3 min-w-0">
                <p className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Auto Reset Keywords</p>
                <p className={`text-[9.5px] leading-tight ${darkMode ? 'text-slate-400' : 'text-slate-500'} break-words`}>Automatically reset all keyword reply limits daily at 12:00 AM IST.</p>
              </div>
              <button
                onClick={handleToggleAutoReset}
                className={`relative inline-flex h-4.5 w-8 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${autoResetKeywords ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${autoResetKeywords ? 'translate-x-4' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Integration Card */}
      <div className={`p-6 rounded-[2rem] border transition duration-500 ${darkMode ? 'bg-neutral-900/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
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
                          className={`p-3 rounded-xl transition ${!key ? 'opacity-30' : (darkMode ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100')}`}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            const newKeys = [...geminiApiKeys];
                            newKeys.splice(index, 1);
                            setGeminiApiKeys(newKeys);
                          }}
                          className={`p-3 rounded-xl transition ${darkMode ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setGeminiApiKeys([...geminiApiKeys, ""])}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${darkMode ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
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
                  className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm transition ${darkMode ? 'bg-neutral-950 border-white/5 text-white placeholder-white/10' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400'}`}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Photo Reply Card */}
      <div className={`p-6 rounded-[2rem] border transition duration-500 ${darkMode ? 'bg-neutral-900/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
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
                  className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm transition ${darkMode ? 'bg-neutral-950 border-white/5 text-white placeholder-white/10' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400'}`}
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
                        className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm transition ${darkMode ? 'bg-neutral-950 border-white/5 text-white placeholder-white/10' : 'bg-slate-50 border-slate-100 text-slate-900 placeholder-slate-400'}`}
                      />
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Active Time (IST)</label>
                          <input
                            type="time"
                            value={photoReplyMessage2StartTime}
                            onChange={(e) => setPhotoReplyMessage2StartTime(e.target.value)}
                            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm transition ${darkMode ? 'bg-neutral-950 border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Closing Time (IST)</label>
                          <input
                            type="time"
                            value={photoReplyMessage2EndTime}
                            onChange={(e) => setPhotoReplyMessage2EndTime(e.target.value)}
                            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm transition ${darkMode ? 'bg-neutral-950 border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-neutral-800">
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Topic Icon</label>
                  <select
                    value={topicIcon}
                    onChange={(e) => setTopicIcon(e.target.value)}
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm transition ${darkMode ? 'bg-neutral-950 border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                  >
                    {["📰", "💡", "⚡️", "🎙", "🔝", "🗣", "🆒", "❗️", "📝", "📆", "📁", "🔎", "📣", "🔥", "❤️", "❓", "📈", "📉", "💎", "💰", "💸", "🪙", "💱", "⁉️", "🎮", "💻", "📱", "🚗", "🏠", "💘", "🎉", "‼️", "🏆", "🏁", "🎬", "🎵", "🔞", "📚", "👑", "⚽️", "🏀", "📺", "👀", "🫦", "🍓", "💄", "👠", "✈️", "🧳", "🏖", "⛅️", "🦄", "🛍", "👜", "🛒", "🚂", "🛥", "🏔", "🏕", "🤖", "🪩", "🎟", "🏴‍☠️", "🗳", "🎓", "🔭", "🔬", "🎶", "🎤", "🕺", "💃", "🪖", "💼", "🧪", "👨‍👩‍👧‍👦", "👶", "🤰", "💅", "🏛", "🧮", "🖨", "👮‍♂️", "🩺", "💊", "💉", "🧼", "🪪", "🛃", "🍽", "🐟", "🎨", "🎭", "🎩", "🔮", "🍹", "🎂", "☕️", "🍣", "🍔", "🍕", "🦠", "💬", "🎄", "🎃", "✍️", "⭐️", "✅", "🎖", "🤡", "🧠", "🦮", "🐈"].map(emoji => (
                      <option key={emoji} value={emoji}>{emoji}</option>
                    ))}
                  </select>
                  <p className={`text-[10px] mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Only these default emojis can be used as topic icons without Telegram Premium.</p>
                </div>
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Rename Emoji</label>
                  <input
                    type="text"
                    value={topicRenameEmoji}
                    onChange={(e) => setTopicRenameEmoji(e.target.value)}
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm transition ${darkMode ? 'bg-neutral-950 border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                    placeholder="e.g. 🛑"
                  />
                  <p className={`text-[10px] mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Emoji added to the topic name.</p>
                </div>
                <div className="space-y-2">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Max Replies</label>
                  <input
                    type="number"
                    value={photoReplyMax}
                    onChange={(e) => setPhotoReplyMax(e.target.value === '' ? '' : parseInt(e.target.value) || 1)}
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm transition ${darkMode ? 'bg-neutral-950 border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notifications Card */}
      <div className={`p-4 rounded-xl border transition duration-300 ${darkMode ? 'bg-neutral-900/60 border-white/10' : 'bg-white border-slate-200 shadow-xs'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <Bell size={15} />
            </div>
            <h3 className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Notification Settings</h3>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className={`text-[9px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Sound</span>
              <button 
                onClick={handleToggleNotificationSound}
                className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors focus:outline-none ${notificationSoundEnabled ? 'bg-blue-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${notificationSoundEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`flex items-center justify-between p-3 rounded-lg border transition duration-300 ${darkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-150'}`}>
            <div className="space-y-0.5 pr-3">
              <p className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Push Notifications</p>
              <p className={`text-[9.5px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {Notification.permission === 'granted' ? 'Real-time alerts are active.' : 'Enable browser notifications for instant alerts.'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {Notification.permission === 'granted' && (
                <button
                  onClick={testPush}
                  className={`p-1.5 rounded transition border ${darkMode ? 'bg-blue-500/15 border-blue-500/20 text-blue-400 hover:bg-blue-500/25' : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'}`}
                  title="Send Test Push"
                >
                  <Send size={12} />
                </button>
              )}
              <button
                onClick={requestNotificationPermission}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none shadow-inner ${Notification.permission === 'granted' ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-sm ${Notification.permission === 'granted' ? 'translate-x-4.5' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>

          {/* Interactive Style Picker Grid */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <label className={`text-[9.5px] font-bold uppercase tracking-wider block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Interactive Notification Styles (10 Demos)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'minimalist', name: 'Modern Minimalist', desc: 'Sleek, lightweight flat alert card', previewBg: darkMode ? 'bg-neutral-800' : 'bg-slate-50', previewBorder: 'border-slate-200 dark:border-neutral-700' },
                { id: 'glassmorphic', name: 'Glassmorphic Glow', desc: 'iOS translucent base, neon aura', previewBg: 'bg-indigo-500/10 backdrop-blur-xs', previewBorder: 'border-white/10' },
                { id: 'neobrutalist', name: 'Neo-Brutalist', desc: 'Solid bold boundaries, offsets', previewBg: 'bg-lime-400', previewBorder: 'border-2 border-black font-mono shadow-[2px_2px_0px_#000000]' },
                { id: 'cyberpunk', name: 'Cyberpunk Neon', desc: 'Obsidian core, cyan laser glow', previewBg: 'bg-zinc-950 font-mono text-cyan-400', previewBorder: 'border border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.2)]' },
                { id: 'terminal', name: 'Retro Terminal', desc: 'Phosphor greens, CRT command prefix', previewBg: 'bg-black font-mono text-emerald-400', previewBorder: 'border border-emerald-500/20' },
                { id: 'gradient', name: 'Gradient Aura', desc: 'Vivid sunset color shifting', previewBg: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white', previewBorder: 'border-white/20' },
                { id: 'compact-pill', name: 'Compact Pill', desc: 'Ultra-small floating center badge', previewBg: darkMode ? 'bg-neutral-900/95' : 'bg-white', previewBorder: 'border-slate-200 dark:border-white/10 rounded-full' },
                { id: 'organic', name: 'Organic Linen', desc: 'Calm oatmeal, terracotta highlights', previewBg: 'bg-[#FAF6F0] font-serif text-[#3F3B35]', previewBorder: 'border-[#E6DFD5]' },
                { id: 'luxury-gold', name: 'Dark Royal Gold', desc: 'Royal navy, brushed gold hairline', previewBg: 'bg-slate-950 text-amber-100 font-serif', previewBorder: 'border border-amber-500/30' },
                { id: 'dynamic-island', name: 'Dynamic Island', desc: 'Capsule dynamic physics pop', previewBg: 'bg-black text-white rounded-full', previewBorder: 'border border-neutral-800' }
              ].map((style) => (
                <div 
                  key={style.id}
                  className={`p-2 rounded-lg border transition flex flex-col justify-between ${
                    notificationStyle === style.id
                      ? (darkMode ? 'bg-blue-500/10 border-blue-500/40 shadow-xs' : 'bg-blue-50 border-blue-200 shadow-xs')
                      : (darkMode ? 'bg-black/10 border-white/5 hover:border-white/10' : 'bg-slate-50 border-slate-150 hover:bg-slate-100')
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{style.name}</span>
                      {notificationStyle === style.id && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                      )}
                    </div>
                    <p className={`text-[8.5px] leading-normal ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{style.desc}</p>
                  </div>

                  <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-neutral-800/40">
                    <button
                      onClick={() => {
                        if (setNotificationStyle) {
                          setNotificationStyle(style.id);
                          localStorage.setItem('notificationStyle', style.id);
                          if (showNotification) {
                            showNotification('success', `Active style updated to: ${style.name}!`);
                          }
                        }
                      }}
                      className={`flex-1 py-1 px-1.5 rounded text-[8px] font-bold uppercase tracking-wider text-center transition ${
                        notificationStyle === style.id
                          ? 'bg-blue-500 text-white font-extrabold'
                          : (darkMode ? 'bg-neutral-800 text-slate-300 hover:text-white' : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs')
                      }`}
                    >
                      Use Style
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
                      className={`p-1 rounded transition border flex items-center justify-center ${
                        darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 shadow-xs'
                      }`}
                      title="Test Alert Style"
                    >
                      <Send size={9} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {notificationSoundEnabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4 overflow-hidden pt-3 border-t border-white/5"
              >
              <div className="grid grid-cols-3 gap-1.5">
                {['default', 'bell', 'chime', 'ping', 'digital', 'rising', 'double', 'low', 'laser'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleUpdateNotificationSoundType(type)}
                    className={`py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition ${
                      notificationSoundType === type 
                        ? (darkMode ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600') 
                        : (darkMode ? 'bg-black/10 border-white/5 text-slate-500 hover:text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 shadow-sm')
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <button
                onClick={requestNotificationPermission}
                className={`w-full flex items-center justify-center space-x-1 py-2 rounded-lg border font-bold text-[9px] uppercase tracking-wider transition ${darkMode ? 'bg-black/20 border-white/15 text-slate-400 hover:bg-black/30' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs'}`}
              >
                <Bell size={11} />
                <span>Test Sound Type</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>

      {/* Data & Backup Card */}
      <div className={`p-4 rounded-xl border transition duration-300 ${darkMode ? 'bg-neutral-900/60 border-white/10' : 'bg-white border-slate-200 shadow-xs'}`}>
        <div className="flex items-center space-x-2 mb-4">
          <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
            <Database size={15} />
          </div>
          <h3 className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Data & Backup</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleExportData}
            className={`flex flex-col items-center justify-center space-y-1 py-3 px-2 rounded-lg border transition ${darkMode ? 'bg-black/20 border-white/10 text-slate-300 hover:bg-black/30' : 'bg-slate-50 border-slate-150 text-slate-600 hover:bg-white shadow-xs'}`}
          >
            <Download size={16} className="text-blue-500" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Export Data</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className={`flex flex-col items-center justify-center space-y-1 py-3 px-2 rounded-lg border transition ${darkMode ? 'bg-black/20 border-white/10 text-slate-300 hover:bg-black/30' : 'bg-slate-50 border-slate-150 text-slate-600 hover:bg-white shadow-xs'}`}
          >
            <Upload size={16} className="text-purple-500" />
            <span className="text-[9px] font-bold uppercase tracking-wider">{importing ? 'Importing...' : 'Import Data'}</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImportData} accept=".json" className="hidden" />
        </div>
      </div>
      </>
      )}

      {/* Save Button - only show when in settings tab */}
      {settingsSubTab === 'settings' && (
        <div className="fixed bottom-32 left-4 right-4 z-40 max-w-lg mx-auto">
          <motion.button
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleUpdateSettings}
            disabled={saving}
            className={`w-full py-2.5 rounded-lg font-bold uppercase tracking-wider text-[11px] transition-all shadow-md flex items-center justify-center space-x-1.5 ${darkMode ? 'bg-emerald-600 text-white shadow-emerald-950/40' : 'bg-emerald-500 text-white shadow-emerald-500/20'}`}
          >
            {saving ? (
              <RefreshCw className="animate-spin" size={13} />
            ) : (
              <Save size={13} />
            )}
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

export default memo(SettingsPanel);
