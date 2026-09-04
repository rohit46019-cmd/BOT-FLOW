import React, { memo } from 'react';
import { Terminal, Activity, ChevronRight } from 'lucide-react';

interface LiveLogBoxProps {
  logs: any[];
  darkMode: boolean;
}

const LiveLogBox: React.FC<LiveLogBoxProps> = ({ logs, darkMode }) => {
  const latestLogs = logs.slice(-5).reverse();

  const getLogBadge = (message: string, level?: string) => {
    const msg = message.toLowerCase();
    if (level === 'error' || msg.includes('fail') || msg.includes('error')) {
      return { label: 'ERR', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
    }
    if (msg.includes('hit') || msg.includes('keyword')) {
      return { label: 'HIT', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
    }
    if (msg.includes('photo') || msg.includes('image')) {
      return { label: 'MEDIA', color: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30' };
    }
    if (msg.includes('ai') || msg.includes('gemini')) {
      return { label: 'AI', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
    }
    if (msg.includes('sent') || msg.includes('reply') || msg.includes('success')) {
      return { label: 'REPLY', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    }
    return { label: 'SYS', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
  };

  return (
    <div className={`col-span-2 p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
      darkMode 
        ? 'bg-neutral-900/90 border-white/10 shadow-lg' 
        : 'bg-white border-slate-200 shadow-md'
    }`}>
      {/* Top terminal bar with traffic lights */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
        <div className="flex items-center space-x-2">
          {/* Traffic lights */}
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center space-x-1.5 pl-2">
            <Terminal size={14} className="text-emerald-400" />
            <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Live Activity Stream
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Live</span>
        </div>
      </div>

      {/* Log Feed */}
      <div className="space-y-1.5 font-mono text-[10.5px]">
        {latestLogs.map((log, i) => {
          const badge = getLogBadge(log.message || '', log.level);
          const timeStr = log.timestamp 
            ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : '--:--:--';

          return (
            <div 
              key={i} 
              className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors ${
                darkMode ? 'bg-black/40 hover:bg-white/5' : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-bold uppercase border shrink-0 ${badge.color}`}>
                {badge.label}
              </span>
              <span className="text-[9.5px] opacity-40 shrink-0 select-none">
                [{timeStr}]
              </span>
              <span className={`truncate flex-1 font-medium ${
                log.level === 'error' ? 'text-rose-400 font-bold' : (darkMode ? 'text-slate-300' : 'text-slate-700')
              }`}>
                {log.message}
              </span>
            </div>
          );
        })}

        {latestLogs.length === 0 && (
          <div className="flex items-center justify-center py-4 text-center text-slate-500 text-xs">
            <Activity size={14} className="mr-1.5 animate-pulse text-slate-400" />
            <span>Listening for telegram events and incoming messages...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(LiveLogBox);
