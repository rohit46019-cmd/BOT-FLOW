import React, { memo } from 'react';
import { 
  Key, 
  LayoutDashboard, 
  Image, 
  RefreshCw, 
  RotateCcw, 
  Search, 
  Play, 
  Pause, 
  Download,
  Zap,
  Sparkles,
  Radio,
  Settings,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Bot
} from 'lucide-react';
import { Skeleton } from './Skeleton';
import LiveLogBox from './LiveLogBox';

interface DashboardProps {
  darkMode: boolean;
  loading: boolean;
  stats: any;
  setActiveTab: (tab: string) => void;
  isCatchingUp: boolean;
  handleCancelCatchUp: () => void;
  missedCount: number;
  handleScanMissed: () => void;
  isScanningMissed: boolean;
  handleTogglePause: () => void;
  deferredPrompt?: any;
  handleInstallApp?: () => void;
  logs: any[];
}

const Dashboard: React.FC<DashboardProps> = ({
  darkMode,
  loading,
  stats,
  setActiveTab,
  isCatchingUp,
  handleCancelCatchUp,
  missedCount,
  handleScanMissed,
  isScanningMissed,
  handleTogglePause,
  deferredPrompt,
  handleInstallApp,
  logs,
}) => {
  const isConnected = stats?.isUserBotConnected;
  const isPaused = stats?.isSystemPaused;
  const user = stats?.loginUser;

  return (
    <div className="space-y-4 w-full animate-in fade-in duration-300">
      {/* PWA Install Banner if prompt available */}
      {deferredPrompt && (
        <div 
          onClick={handleInstallApp}
          className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm ${
            darkMode 
              ? 'bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 border-blue-500/40 text-blue-300' 
              : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-300 text-blue-700'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-500/30 text-white' : 'bg-blue-600 text-white shadow-sm'}`}>
              <Download size={18} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Install BotFlow Web App</p>
              <p className="text-[10px] opacity-80 font-medium">Add to your home screen for quick 1-tap access</p>
            </div>
          </div>
          <div className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white shadow-md transition">
            Install
          </div>
        </div>
      )}

      {/* Hero Telegram Account & Live Status Banner (Colourful & Modern) */}
      <div className={`p-4 rounded-3xl border relative overflow-hidden transition-all duration-300 shadow-lg ${
        isConnected 
          ? (darkMode 
              ? 'bg-gradient-to-br from-indigo-950/80 via-neutral-900 to-purple-950/70 border-indigo-500/30' 
              : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-indigo-200')
          : (darkMode 
              ? 'bg-gradient-to-br from-rose-950/70 via-neutral-900 to-amber-950/60 border-rose-500/30' 
              : 'bg-gradient-to-br from-rose-50 via-white to-amber-50 border-rose-200')
      }`}>
        {/* Glow ambient spots */}
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3">
          {/* Top row: Avatar + Identity + Status Tag */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black shadow-md border ${
                  isConnected 
                    ? 'bg-gradient-to-tr from-blue-600 to-emerald-500 border-white/20' 
                    : 'bg-gradient-to-tr from-rose-600 to-amber-500 border-white/20'
                }`}>
                  {user?.firstName ? (
                    <User size={22} className="text-white" />
                  ) : (
                    <Bot size={22} className="text-white" />
                  )}
                </div>
                <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 ${darkMode ? 'border-neutral-900' : 'border-white'} ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className={`text-sm sm:text-base font-black truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {user?.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : 'UserBot Engine'}
                  </h2>
                  {isConnected ? (
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle size={15} className="text-rose-400 shrink-0" />
                  )}
                </div>
                <p className={`text-[10px] font-mono truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {user?.username ? `@${user.username}` : (user?.phone || (isConnected ? 'Telegram Connected' : 'Not Logged In'))}
                </p>
              </div>
            </div>

            {/* Quick Engine Status Indicator */}
            <div className="shrink-0 flex items-center gap-1.5">
              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-xs flex items-center gap-1.5 ${
                isPaused 
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' 
                  : (isConnected 
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30')
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isPaused ? 'bg-rose-400' : (isConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400')
                }`} />
                <span>{isPaused ? 'Paused' : (isConnected ? 'Active & Live' : 'Offline')}</span>
              </span>
            </div>
          </div>

          {/* Feature Configuration Pills (Colourful) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {/* AI Pill */}
            <div className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold uppercase tracking-wide border flex items-center gap-1 ${
              stats?.aiModeEnabled 
                ? (darkMode ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-purple-50 text-purple-700 border-purple-200')
                : (darkMode ? 'bg-white/5 text-slate-500 border-white/5' : 'bg-slate-100 text-slate-400 border-slate-200')
            }`}>
              <Sparkles size={11} className={stats?.aiModeEnabled ? 'text-purple-400' : ''} />
              <span>AI Reply: {stats?.aiModeEnabled ? 'ON' : 'OFF'}</span>
            </div>

            {/* Auto Reset Pill */}
            <div className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold uppercase tracking-wide border flex items-center gap-1 ${
              stats?.autoResetKeywords 
                ? (darkMode ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-50 text-amber-700 border-amber-200')
                : (darkMode ? 'bg-white/5 text-slate-500 border-white/5' : 'bg-slate-100 text-slate-400 border-slate-200')
            }`}>
              <Zap size={11} className={stats?.autoResetKeywords ? 'text-amber-400' : ''} />
              <span>Auto-Reset: {stats?.autoResetKeywords ? 'ON' : 'OFF'}</span>
            </div>

            {/* Photo Reply Pill */}
            <div className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold uppercase tracking-wide border flex items-center gap-1 ${
              stats?.photoReplyEnabled 
                ? (darkMode ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40' : 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200')
                : (darkMode ? 'bg-white/5 text-slate-500 border-white/5' : 'bg-slate-100 text-slate-400 border-slate-200')
            }`}>
              <Image size={11} className={stats?.photoReplyEnabled ? 'text-fuchsia-400' : ''} />
              <span>Photo: {stats?.photoReplyEnabled ? 'ON' : 'OFF'}</span>
            </div>

            {/* Delay Pill */}
            <div className={`px-2 py-0.5 rounded-lg text-[9.5px] font-bold uppercase tracking-wide border ${
              darkMode ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
            }`}>
              <span>⏱️ {stats?.delaySeconds || 0}s Delay</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Colourful Metric & Action Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Active Keywords (Violet/Purple Theme) */}
        <div 
          onClick={() => setActiveTab('keywords')}
          className={`p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${
            darkMode 
              ? 'bg-gradient-to-br from-violet-600/15 via-purple-600/10 to-neutral-900/90 border-violet-500/30 hover:border-violet-400' 
              : 'bg-gradient-to-br from-violet-50 via-purple-50/50 to-white border-violet-200 hover:border-violet-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs ${
              darkMode ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-violet-500 text-white shadow-violet-200'
            }`}>
              <Key size={18} />
            </div>
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
              darkMode ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-700'
            }`}>
              Rules
            </span>
          </div>

          <div>
            <p className={`text-[10px] font-extrabold uppercase tracking-wider mb-0.5 ${
              darkMode ? 'text-violet-300/80' : 'text-violet-700'
            }`}>Active Keywords</p>
            {loading ? (
              <Skeleton className="h-7 w-12 rounded-lg" />
            ) : (
              <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {stats?.keywordCount || 0}
              </h3>
            )}
          </div>

          <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] font-bold ${
            darkMode ? 'border-violet-500/20 text-violet-400' : 'border-violet-100 text-violet-600'
          }`}>
            <span>Manage Rules</span>
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 2: Topics Activity (Cyan/Sky Theme) */}
        <div 
          onClick={() => setActiveTab('keywords')}
          className={`p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${
            darkMode 
              ? 'bg-gradient-to-br from-cyan-600/15 via-sky-600/10 to-neutral-900/90 border-cyan-500/30 hover:border-cyan-400' 
              : 'bg-gradient-to-br from-cyan-50 via-sky-50/50 to-white border-cyan-200 hover:border-cyan-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs ${
              darkMode ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-cyan-500 text-white shadow-cyan-200'
            }`}>
              <LayoutDashboard size={18} />
            </div>
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
              darkMode ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700'
            }`}>
              Today
            </span>
          </div>

          <div>
            <p className={`text-[10px] font-extrabold uppercase tracking-wider mb-0.5 ${
              darkMode ? 'text-cyan-300/80' : 'text-cyan-700'
            }`}>Topics Monitored</p>
            {loading ? (
              <Skeleton className="h-7 w-16 rounded-lg" />
            ) : (
              <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {stats?.todayTopicCount || 0} <span className="text-xs font-semibold opacity-60">/ {stats?.topicCount || 0}</span>
              </h3>
            )}
          </div>

          <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] font-bold ${
            darkMode ? 'border-cyan-500/20 text-cyan-400' : 'border-cyan-100 text-cyan-600'
          }`}>
            <span>Target Groups</span>
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 3: Photos Sent Today (Fuchsia/Pink Theme) */}
        <div 
          onClick={() => setActiveTab('photo_stats')}
          className={`p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${
            darkMode 
              ? 'bg-gradient-to-br from-fuchsia-600/15 via-pink-600/10 to-neutral-900/90 border-fuchsia-500/30 hover:border-fuchsia-400' 
              : 'bg-gradient-to-br from-fuchsia-50 via-pink-50/50 to-white border-fuchsia-200 hover:border-fuchsia-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs ${
              darkMode ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30' : 'bg-fuchsia-500 text-white shadow-fuchsia-200'
            }`}>
              <Image size={18} />
            </div>
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
              darkMode ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'bg-fuchsia-100 text-fuchsia-700'
            }`}>
              Media
            </span>
          </div>

          <div>
            <p className={`text-[10px] font-extrabold uppercase tracking-wider mb-0.5 ${
              darkMode ? 'text-fuchsia-300/80' : 'text-fuchsia-700'
            }`}>Photos Sent</p>
            <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {stats?.todayPhotoSentStats?.count || 0}
            </h3>
          </div>

          <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] font-bold ${
            darkMode ? 'border-fuchsia-500/20 text-fuchsia-400' : 'border-fuchsia-100 text-fuchsia-600'
          }`}>
            <span>View Gallery</span>
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 4: Catch Up Missed (Amber/Orange Theme) */}
        <div
          onClick={!isCatchingUp && !isPaused ? () => setActiveTab('catchup') : undefined}
          className={`p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden group flex flex-col justify-between shadow-2xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${
            isPaused 
              ? `${darkMode ? 'bg-neutral-900/40 border-white/5 opacity-60' : 'bg-slate-100 border-slate-200 opacity-60'} cursor-not-allowed`
              : `${darkMode ? 'bg-gradient-to-br from-amber-600/15 via-orange-600/10 to-neutral-900/90 border-amber-500/30 hover:border-amber-400' : 'bg-gradient-to-br from-amber-50 via-orange-50/50 to-white border-amber-200 hover:border-amber-400'} cursor-pointer`
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs ${
              isPaused 
                ? 'bg-slate-500/20 text-slate-400' 
                : (darkMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-500 text-white shadow-amber-200')
            }`}>
              {isCatchingUp ? <RefreshCw className="animate-spin" size={18} /> : <RotateCcw size={18} />}
            </div>
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
              missedCount > 0 
                ? 'bg-rose-500 text-white' 
                : (darkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700')
            }`}>
              {missedCount > 0 ? `${missedCount} Missed` : 'Synced'}
            </span>
          </div>

          <div>
            <p className={`text-[10px] font-extrabold uppercase tracking-wider mb-0.5 ${
              darkMode ? 'text-amber-300/80' : 'text-amber-700'
            }`}>Catch Up</p>
            <h3 className={`text-base sm:text-lg font-black tracking-tight leading-tight truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {missedCount > 0 ? `${missedCount} Unreplied` : 'All Caught Up'}
            </h3>
          </div>

          <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] font-bold ${
            darkMode ? 'border-amber-500/20 text-amber-400' : 'border-amber-100 text-amber-600'
          }`}>
            {isCatchingUp ? (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelCatchUp();
                }}
                className="text-rose-400 font-extrabold hover:underline"
              >
                Cancel Catchup
              </button>
            ) : (
              <>
                <span>{missedCount > 0 ? 'Reply Now' : 'Check List'}</span>
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </div>
        </div>

        {/* Card 5: Scan Recent Topics (Electric Blue Theme) */}
        <div 
          onClick={handleScanMissed}
          className={`p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${
            darkMode 
              ? 'bg-gradient-to-br from-blue-600/15 via-indigo-600/10 to-neutral-900/90 border-blue-500/30 hover:border-blue-400' 
              : 'bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white border-blue-200 hover:border-blue-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs ${
              darkMode ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-blue-500 text-white shadow-blue-200'
            }`}>
              {isScanningMissed ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
            </div>
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
              darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
            }`}>
              Radar
            </span>
          </div>

          <div>
            <p className={`text-[10px] font-extrabold uppercase tracking-wider mb-0.5 ${
              darkMode ? 'text-blue-300/80' : 'text-blue-700'
            }`}>Scan Missed</p>
            <h3 className={`text-base sm:text-lg font-black tracking-tight leading-tight truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {isScanningMissed ? 'Scanning...' : 'Scan Topics'}
            </h3>
          </div>

          <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] font-bold ${
            darkMode ? 'border-blue-500/20 text-blue-400' : 'border-blue-100 text-blue-600'
          }`}>
            <span>{isScanningMissed ? 'Please wait' : 'Start Radar'}</span>
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 6: System Engine Controller (Emerald/Teal vs Rose Theme) */}
        <div
          onClick={handleTogglePause}
          className={`p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${
            isPaused 
              ? (darkMode 
                  ? 'bg-gradient-to-br from-rose-600/15 via-red-600/10 to-neutral-900/90 border-rose-500/30 hover:border-rose-400' 
                  : 'bg-gradient-to-br from-rose-50 via-red-50/50 to-white border-rose-200 hover:border-rose-400')
              : (darkMode 
                  ? 'bg-gradient-to-br from-emerald-600/15 via-teal-600/10 to-neutral-900/90 border-emerald-500/30 hover:border-emerald-400' 
                  : 'bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-emerald-200 hover:border-emerald-400')
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs ${
              isPaused 
                ? (darkMode ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-rose-500 text-white shadow-rose-200')
                : (darkMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-500 text-white shadow-emerald-200')
            }`}>
              {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
            </div>
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
              isPaused 
                ? 'bg-rose-500 text-white shadow-xs' 
                : 'bg-emerald-500 text-white shadow-xs'
            }`}>
              {isPaused ? 'Paused' : 'Running'}
            </span>
          </div>

          <div>
            <p className={`text-[10px] font-extrabold uppercase tracking-wider mb-0.5 ${
              isPaused 
                ? (darkMode ? 'text-rose-300/80' : 'text-rose-700') 
                : (darkMode ? 'text-emerald-300/80' : 'text-emerald-700')
            }`}>Bot Engine</p>
            <h3 className={`text-base sm:text-lg font-black tracking-tight leading-tight ${
              isPaused 
                ? (darkMode ? 'text-rose-400' : 'text-rose-600') 
                : (darkMode ? 'text-emerald-400' : 'text-emerald-600')
            }`}>
              {isPaused ? 'Engine Paused' : 'Active & Live'}
            </h3>
          </div>

          <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] font-bold ${
            isPaused 
              ? (darkMode ? 'border-rose-500/20 text-rose-400' : 'border-rose-100 text-rose-600')
              : (darkMode ? 'border-emerald-500/20 text-emerald-400' : 'border-emerald-100 text-emerald-600')
          }`}>
            <span>{isPaused ? 'Click to Resume' : 'Click to Pause'}</span>
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Quick Launch Control Hub */}
        <div className="col-span-2 pt-1">
          <div className={`p-3 rounded-2xl border ${
            darkMode ? 'bg-neutral-900/60 border-white/10' : 'bg-slate-50 border-slate-200'
          }`}>
            <p className={`text-[10px] font-black uppercase tracking-wider mb-2.5 flex items-center gap-1.5 ${
              darkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <Zap size={13} className="text-amber-400" />
              <span>Quick Navigation Hub</span>
            </p>

            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('keywords')}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition hover:scale-105 active:scale-95 ${
                  darkMode ? 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20 text-purple-300' : 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700'
                }`}
              >
                <Key size={16} className="mb-1 text-purple-400" />
                <span className="text-[10px] font-bold">Rules</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('catchup')}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition hover:scale-105 active:scale-95 ${
                  darkMode ? 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-700'
                }`}
              >
                <RotateCcw size={16} className="mb-1 text-amber-400" />
                <span className="text-[10px] font-bold">Catchup</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('broadcast')}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition hover:scale-105 active:scale-95 ${
                  darkMode ? 'bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-300' : 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100 text-cyan-700'
                }`}
              >
                <Radio size={16} className="mb-1 text-cyan-400" />
                <span className="text-[10px] font-bold">Broadcast</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition hover:scale-105 active:scale-95 ${
                  darkMode ? 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 text-blue-300' : 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700'
                }`}
              >
                <Settings size={16} className="mb-1 text-blue-400" />
                <span className="text-[10px] font-bold">Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Activity Feed */}
        <LiveLogBox logs={logs} darkMode={darkMode} />
      </div>
    </div>
  );
};

export default memo(Dashboard);
