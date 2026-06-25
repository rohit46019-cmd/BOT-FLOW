import React, { memo } from 'react';
import { Terminal } from 'lucide-react';

interface LiveLogBoxProps {
  logs: any[];
  darkMode: boolean;
}

const LiveLogBox: React.FC<LiveLogBoxProps> = ({ logs, darkMode }) => {
  const latestLogs = logs.slice(-5).reverse();

  return (
    <div className={`col-span-2 p-4 rounded-3xl border ${darkMode ? 'bg-black border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className="flex items-center space-x-2 mb-3">
        <Terminal size={16} className={darkMode ? 'text-emerald-400' : 'text-emerald-600'} />
        <h3 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-white' : 'text-slate-900'}`}>Live Logs</h3>
      </div>
      <div className="space-y-1 font-mono text-[10px]">
        {latestLogs.map((log, i) => (
          <div key={i} className={`flex items-center space-x-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <span className="opacity-50">[{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
            <span className={`truncate ${log.level === 'error' ? (darkMode ? 'text-rose-400' : 'text-rose-600') : ''}`}>
              {log.message}
            </span>
          </div>
        ))}
        {latestLogs.length === 0 && (
          <div className="opacity-50 text-center py-2">No logs yet</div>
        )}
      </div>
    </div>
  );
};

export default memo(LiveLogBox);
