import React, { memo } from 'react';
import { Key, LayoutDashboard, Image, RefreshCw, RotateCcw, Search, Play, Pause, MessageSquare, Download } from 'lucide-react';
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
    <div className="space-y-6 w-full">
      {deferredPrompt && (
        <div 
          onClick={handleInstallApp}
          className={`p-4 rounded-3xl border-2 border-dashed flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${darkMode ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'}`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <Download size={20} />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-tight">Install BotFlow App</p>
              <p className="text-[10px] opacity-70 font-bold">Add to home screen for a better experience</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'}`}>
            Install
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Active Keywords */}
        <div 
          className={`card-3d aspect-square p-4 rounded-3xl border-t-2 border-l-2 border-b-[8px] border-r-[6px] transition-colors duration-200 relative overflow-hidden group flex flex-col items-center justify-center text-center ${darkMode ? 'bg-violet-700 border-violet-900 shadow-[0_0_20px_rgba(109,40,217,0.6)]' : 'bg-violet-500 border-violet-700 shadow-[0_0_20px_rgba(139,92,246,0.6)]'}`}
        >
          <div className="card-3d-glow" style={{ '--x': '50%', '--y': '50%' } as any} />
          <div className={`absolute inset-0 pattern-dots opacity-[0.15] pointer-events-none ${darkMode ? 'text-violet-100' : 'text-violet-100'}`} />
          <div className="relative z-10 pointer-events-auto flex flex-col items-center card-3d-inner">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform duration-500 group-hover:scale-110 ${darkMode ? 'bg-violet-800 text-violet-100' : 'bg-violet-400 text-violet-50'}`}>
              <Key size={24} />
            </div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-violet-100/80' : 'text-violet-50/80'}`}>Active Keywords</p>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <h3 className={`text-4xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-white'}`}>{stats?.keywordCount || 0}</h3>
            )}
          </div>
        </div>

        {/* Today / Total Topics */}
        <div 
          className={`card-3d aspect-square p-4 rounded-3xl border-t-2 border-l-2 border-b-[8px] border-r-[6px] transition-colors duration-200 relative overflow-hidden group flex flex-col items-center justify-center text-center ${darkMode ? 'bg-cyan-700 border-cyan-900 shadow-[0_0_20px_rgba(8,145,178,0.6)]' : 'bg-cyan-500 border-cyan-700 shadow-[0_0_20px_rgba(6,182,212,0.6)]'}`}
        >
          <div className="card-3d-glow" style={{ '--x': '50%', '--y': '50%' } as any} />
          <div className={`absolute inset-0 pattern-grid opacity-[0.15] pointer-events-none ${darkMode ? 'text-cyan-100' : 'text-cyan-100'}`} />
          <div className="relative z-10 pointer-events-auto flex flex-col items-center card-3d-inner">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform duration-500 group-hover:scale-110 ${darkMode ? 'bg-cyan-800 text-cyan-100' : 'bg-cyan-400 text-cyan-50'}`}>
              <LayoutDashboard size={24} />
            </div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-cyan-100/80' : 'text-cyan-50/80'}`}>Topics</p>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <h3 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-white'}`}>
                {stats?.todayTopicCount || 0} <span className="text-sm font-medium opacity-80">/ {stats?.topicCount || 0}</span>
              </h3>
            )}
          </div>
        </div>

        {/* Photos Sent Today */}
        <div 
          onClick={() => setActiveTab('photo_stats')}
          className={`card-3d aspect-square p-4 rounded-3xl border-t-2 border-l-2 border-b-[8px] border-r-[6px] transition-colors duration-200 relative overflow-hidden group cursor-pointer flex flex-col items-center justify-center text-center ${darkMode ? 'bg-fuchsia-700 border-fuchsia-900 shadow-[0_0_20px_rgba(192,38,211,0.6)]' : 'bg-fuchsia-500 border-fuchsia-700 shadow-[0_0_20px_rgba(217,70,239,0.6)]'}`}
        >
          <div className="card-3d-glow" style={{ '--x': '50%', '--y': '50%' } as any} />
          <div className={`absolute inset-0 pattern-lines opacity-[0.15] pointer-events-none ${darkMode ? 'text-fuchsia-100' : 'text-fuchsia-100'}`} />
          <div className="relative z-10 pointer-events-auto flex flex-col items-center card-3d-inner">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform duration-500 group-hover:scale-110 ${darkMode ? 'bg-fuchsia-800 text-fuchsia-100' : 'bg-fuchsia-400 text-fuchsia-50'}`}>
              <Image size={24} />
            </div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-fuchsia-100/80' : 'text-fuchsia-50/80'}`}>Photos Sent</p>
            <h3 className={`text-4xl font-black tracking-tight text-white`}>
              {stats?.todayPhotoSentStats?.count || 0}
            </h3>
          </div>
        </div>

        {/* Manual Catch Up */}
        <div
          onClick={!isCatchingUp && !stats?.isSystemPaused ? () => setActiveTab('catchup') : undefined}
          className={`card-3d aspect-square p-4 rounded-3xl border-t-2 border-l-2 border-b-[8px] border-r-[6px] transition-colors duration-200 relative overflow-hidden group flex flex-col items-center justify-center text-center ${
            stats?.isSystemPaused 
              ? (darkMode ? 'bg-slate-800 border-slate-900 text-slate-400 cursor-not-allowed' : 'bg-slate-200 border-slate-400 text-slate-500 cursor-not-allowed')
              : (darkMode ? 'bg-rose-700 border-rose-900 text-white shadow-[0_0_20px_rgba(225,29,72,0.6)] cursor-pointer' : 'bg-rose-500 border-rose-700 text-white shadow-[0_0_20px_rgba(244,63,94,0.6)] cursor-pointer')
          }`}
        >
          <div className="card-3d-glow" style={{ '--x': '50%', '--y': '50%' } as any} />
          <div className="relative z-10 pointer-events-auto flex flex-col items-center w-full card-3d-inner">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-transform duration-500 group-hover:scale-110 ${darkMode ? 'bg-rose-800 text-rose-100' : 'bg-rose-400 text-rose-50'}`}>
              {isCatchingUp ? <RefreshCw className="animate-spin" size={24} /> : <RotateCcw size={24} />}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Catch Up</p>
            <h3 className="text-sm font-black tracking-tight mb-2 leading-tight">{missedCount > 0 ? `${missedCount} Missed` : 'No Missed'}</h3>
            
            {isCatchingUp ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelCatchUp();
                }}
                className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/20 bg-black/20 hover:bg-black/40 transition relative z-20`}
              >
                Cancel
              </button>
            ) : (
              <div className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                stats?.isSystemPaused 
                  ? 'border-slate-700 bg-slate-700/20' 
                  : 'border-rose-400 bg-rose-400/20'
              }`}>
                {stats?.isSystemPaused ? 'Paused' : 'Reply'}
              </div>
            )}
          </div>
        </div>

        {/* Scan Missed */}
        <div 
          onClick={handleScanMissed}
          className={`card-3d aspect-square p-4 rounded-3xl border-t-2 border-l-2 border-b-[8px] border-r-[6px] transition-colors duration-200 relative overflow-hidden group cursor-pointer flex flex-col items-center justify-center text-center ${darkMode ? 'bg-indigo-700 border-indigo-900 shadow-[0_0_20px_rgba(67,56,202,0.6)]' : 'bg-indigo-500 border-indigo-700 shadow-[0_0_20px_rgba(99,102,241,0.6)]'}`}
        >
          <div className="card-3d-glow" style={{ '--x': '50%', '--y': '50%' } as any} />
          <div className="relative z-10 pointer-events-auto flex flex-col items-center w-full card-3d-inner">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-transform duration-500 group-hover:scale-110 ${darkMode ? 'bg-indigo-800 text-indigo-100' : 'bg-indigo-400 text-indigo-50'}`}>
              {isScanningMissed ? <RefreshCw className="animate-spin" size={24} /> : <Search size={24} />}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Scan Missed</p>
            <h3 className="text-sm font-black tracking-tight mb-2 leading-tight">Recent Topics</h3>
            <div className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-400 bg-indigo-400/20`}>
              {isScanningMissed ? 'Scanning...' : 'Scan Now'}
            </div>
          </div>
        </div>

        {/* System Pause/Resume Button */}
        <div
          onClick={handleTogglePause}
          className={`card-3d aspect-square p-4 rounded-3xl border-t-2 border-l-2 border-b-[8px] border-r-[6px] transition-colors duration-200 relative overflow-hidden group cursor-pointer flex flex-col items-center justify-center text-center ${
            stats?.isSystemPaused 
              ? (darkMode ? 'bg-rose-700 border-rose-900 text-white shadow-[0_0_20px_rgba(225,29,72,0.6)]' : 'bg-rose-500 border-rose-700 text-white shadow-[0_0_20px_rgba(244,63,94,0.6)]') 
              : (darkMode ? 'bg-emerald-700 border-emerald-900 text-white shadow-[0_0_20px_rgba(4,120,87,0.6)]' : 'bg-emerald-500 border-emerald-700 text-white shadow-[0_0_20px_rgba(16,185,129,0.6)]')
          }`}
        >
          <div className="card-3d-glow" style={{ '--x': '50%', '--y': '50%' } as any} />
          <div className="relative z-10 pointer-events-auto flex flex-col items-center w-full card-3d-inner">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 border transition-colors ${
              stats?.isSystemPaused 
                ? (darkMode ? 'bg-rose-800 border-rose-700 text-rose-100' : 'bg-rose-400 border-rose-300 text-rose-50') 
                : (darkMode ? 'bg-emerald-800 border-emerald-700 text-emerald-100' : 'bg-emerald-400 border-emerald-300 text-emerald-50')
            }`}>
              {stats?.isSystemPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
            </div>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80 text-white`}>System</p>
            <h3 className="text-sm font-bold tracking-tight text-white mb-2">{stats?.isSystemPaused ? 'Paused' : 'Active'}</h3>
            <div className={`px-3 py-1 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition ${
              stats?.isSystemPaused 
                ? (darkMode ? 'bg-rose-800 border-rose-700 text-rose-100' : 'bg-rose-400 border-rose-300 text-rose-50') 
                : (darkMode ? 'bg-emerald-800 border-emerald-700 text-emerald-100' : 'bg-emerald-400 border-emerald-300 text-emerald-50')
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
