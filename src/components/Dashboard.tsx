import React, { memo } from 'react';
import { Key, LayoutDashboard, Image, RefreshCw, RotateCcw, Search, Play, Pause, Download } from 'lucide-react';
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
  return (
    <div className="space-y-4 w-full">
      {deferredPrompt && (
        <div 
          onClick={handleInstallApp}
          className={`p-3 rounded-xl border border-dashed flex items-center justify-between cursor-pointer transition-all hover:bg-blue-500/5 active:scale-[0.99] ${
            darkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <Download size={16} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide">Install App</p>
              <p className="text-[9.5px] opacity-75 font-medium">Add BotFlow to home screen</p>
            </div>
          </div>
          <div className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
            darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white shadow-xs'
          }`}>
            Install
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Active Keywords */}
        <div 
          className={`p-3.5 rounded-xl border transition-all duration-300 relative overflow-hidden group flex flex-col items-center justify-center text-center ${
            darkMode 
              ? 'bg-neutral-900/60 border-white/10 hover:border-violet-500/40 shadow-sm' 
              : 'bg-white border-slate-200 hover:border-violet-300 shadow-xs'
          }`}
        >
          <div className="absolute inset-0 pattern-dots opacity-[0.03] pointer-events-none text-violet-500" />
          <div className="relative z-10 flex flex-col items-center">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 transition-all duration-300 group-hover:scale-105 ${
              darkMode ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'bg-violet-50 text-violet-600 border border-violet-100'
            }`}>
              <Key size={18} />
            </div>
            <p className={`text-[9.5px] font-bold uppercase tracking-wider mb-1 ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>Active Keywords</p>
            {loading ? (
              <Skeleton className="h-6 w-12 rounded" />
            ) : (
              <h3 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {stats?.keywordCount || 0}
              </h3>
            )}
          </div>
        </div>

        {/* Today / Total Topics */}
        <div 
          className={`p-3.5 rounded-xl border transition-all duration-300 relative overflow-hidden group flex flex-col items-center justify-center text-center ${
            darkMode 
              ? 'bg-neutral-900/60 border-white/10 hover:border-cyan-500/40 shadow-sm' 
              : 'bg-white border-slate-200 hover:border-cyan-300 shadow-xs'
          }`}
        >
          <div className="absolute inset-0 pattern-grid opacity-[0.03] pointer-events-none text-cyan-500" />
          <div className="relative z-10 flex flex-col items-center">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 transition-all duration-300 group-hover:scale-105 ${
              darkMode ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-600 border border-cyan-100'
            }`}>
              <LayoutDashboard size={18} />
            </div>
            <p className={`text-[9.5px] font-bold uppercase tracking-wider mb-1 ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>Topics</p>
            {loading ? (
              <Skeleton className="h-6 w-16 rounded" />
            ) : (
              <h3 className={`text-xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {stats?.todayTopicCount || 0} <span className="text-[11px] font-medium opacity-60">/ {stats?.topicCount || 0}</span>
              </h3>
            )}
          </div>
        </div>

        {/* Photos Sent Today */}
        <div 
          onClick={() => setActiveTab('photo_stats')}
          className={`p-3.5 rounded-xl border transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col items-center justify-center text-center ${
            darkMode 
              ? 'bg-neutral-900/60 border-white/10 hover:border-fuchsia-500/40 shadow-sm' 
              : 'bg-white border-slate-200 hover:border-fuchsia-300 shadow-xs'
          }`}
        >
          <div className="absolute inset-0 pattern-lines opacity-[0.03] pointer-events-none text-fuchsia-500" />
          <div className="relative z-10 flex flex-col items-center">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 transition-all duration-300 group-hover:scale-105 ${
              darkMode ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' : 'bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100'
            }`}>
              <Image size={18} />
            </div>
            <p className={`text-[9.5px] font-bold uppercase tracking-wider mb-1 ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>Photos Sent</p>
            <h3 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {stats?.todayPhotoSentStats?.count || 0}
            </h3>
          </div>
        </div>

        {/* Manual Catch Up */}
        <div
          onClick={!isCatchingUp && !stats?.isSystemPaused ? () => setActiveTab('catchup') : undefined}
          className={`p-3.5 rounded-xl border transition-all duration-300 relative overflow-hidden group flex flex-col items-center justify-center text-center ${
            stats?.isSystemPaused 
              ? `${darkMode ? 'bg-neutral-900/30 border-white/5 opacity-50' : 'bg-slate-100 border-slate-200 opacity-60'} cursor-not-allowed`
              : `${darkMode ? 'bg-neutral-900/60 border-white/10 hover:border-rose-500/40' : 'bg-white border-slate-200 hover:border-rose-300 shadow-xs'} cursor-pointer`
          }`}
        >
          <div className="relative z-10 flex flex-col items-center w-full">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition-all duration-300 group-hover:scale-105 ${
              stats?.isSystemPaused
                ? 'bg-slate-500/10 text-slate-400'
                : (darkMode ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-600 border border-rose-100')
            }`}>
              {isCatchingUp ? <RefreshCw className="animate-spin" size={18} /> : <RotateCcw size={18} />}
            </div>
            <p className={`text-[9.5px] font-bold uppercase tracking-wider mb-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Catch Up</p>
            <h3 className={`text-xs font-bold truncate max-w-full leading-tight mb-1.5 ${darkMode ? 'text-white' : 'text-slate-850'}`}>
              {missedCount > 0 ? `${missedCount} Missed` : 'No Missed'}
            </h3>
            
            {isCatchingUp ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelCatchUp();
                }}
                className="px-2 py-0.5 rounded-md text-[8.5px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 transition relative z-20"
              >
                Cancel
              </button>
            ) : (
              <div className={`px-2 py-0.5 rounded-md text-[8.5px] font-bold uppercase tracking-wider border ${
                stats?.isSystemPaused 
                  ? 'border-slate-300 text-slate-500 bg-slate-100' 
                  : 'border-rose-200 text-rose-600 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400'
              }`}>
                {stats?.isSystemPaused ? 'Paused' : 'Reply'}
              </div>
            )}
          </div>
        </div>

        {/* Scan Missed */}
        <div 
          onClick={handleScanMissed}
          className={`p-3.5 rounded-xl border transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col items-center justify-center text-center ${
            darkMode 
              ? 'bg-neutral-900/60 border-white/10 hover:border-indigo-500/40 shadow-sm' 
              : 'bg-white border-slate-200 hover:border-indigo-300 shadow-xs'
          }`}
        >
          <div className="relative z-10 flex flex-col items-center w-full">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition-all duration-300 group-hover:scale-105 ${
              darkMode ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
            }`}>
              {isScanningMissed ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
            </div>
            <p className={`text-[9.5px] font-bold uppercase tracking-wider mb-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Scan Missed</p>
            <h3 className={`text-xs font-bold leading-tight mb-1.5 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Recent Topics</h3>
            <div className={`px-2 py-0.5 rounded-md text-[8.5px] font-bold uppercase tracking-wider border ${
              darkMode ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400' : 'border-indigo-250 bg-indigo-50 text-indigo-600'
            }`}>
              {isScanningMissed ? 'Scanning...' : 'Scan'}
            </div>
          </div>
        </div>

        {/* System Pause/Resume Button */}
        <div
          onClick={handleTogglePause}
          className={`p-3.5 rounded-xl border transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col items-center justify-center text-center ${
            stats?.isSystemPaused 
              ? (darkMode ? 'bg-neutral-900/60 border-rose-500/30 hover:border-rose-500/50' : 'bg-white border-rose-200 hover:border-rose-400 shadow-xs') 
              : (darkMode ? 'bg-neutral-900/60 border-emerald-500/30 hover:border-emerald-500/50' : 'bg-white border-emerald-200 hover:border-emerald-400 shadow-xs')
          }`}
        >
          <div className="relative z-10 flex flex-col items-center w-full">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 border transition-all duration-300 group-hover:scale-105 ${
              stats?.isSystemPaused 
                ? (darkMode ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-600') 
                : (darkMode ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600')
            }`}>
              {stats?.isSystemPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
            </div>
            <p className={`text-[9.5px] font-bold uppercase tracking-wider mb-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>System</p>
            <h3 className={`text-xs font-bold leading-tight mb-1.5 ${
              stats?.isSystemPaused 
                ? (darkMode ? 'text-rose-400' : 'text-rose-600') 
                : (darkMode ? 'text-emerald-400' : 'text-emerald-600')
            }`}>{stats?.isSystemPaused ? 'Paused' : 'Active'}</h3>
            <div className={`px-2 py-0.5 rounded-md text-[8.5px] font-bold uppercase tracking-wider border transition ${
              stats?.isSystemPaused 
                ? (darkMode ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-rose-500 text-white hover:bg-rose-600') 
                : (darkMode ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-emerald-500 text-white hover:bg-emerald-600')
            }`}>
              {stats?.isSystemPaused ? 'Resume' : 'Pause'}
            </div>
          </div>
        </div>

        {/* Live Logs */}
        <LiveLogBox logs={logs} darkMode={darkMode} />
      </div>
    </div>
  );
};

export default memo(Dashboard);
