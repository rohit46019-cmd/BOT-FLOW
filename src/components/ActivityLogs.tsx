import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Download, 
  RefreshCw, 
  Search, 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  Link as LinkIcon, 
  Copy,
  ArrowLeft
} from 'lucide-react';

interface ActivityLogsProps {
  darkMode: boolean;
  handleDownloadLogs: (format: 'json' | 'csv') => void;
  fetchLogs: () => void;
  refreshingLogs: boolean;
  logs: any[];
  direction: number;
  slideVariants: any;
  clearLogs: () => void;
  isConfirmingClear: boolean;
  logSearch: string;
  setLogSearch: (val: string) => void;
  logLevelFilter: string;
  setLogLevelFilter: (val: string) => void;
  logCategoryFilter: string;
  setLogCategoryFilter: (val: string) => void;
  logCategories: string[];
  displayedLogs: any[];
  handleLogsScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  expandedLogId: string | null;
  setExpandedLogId: (id: string | null) => void;
  visibleLogsCount: number;
  setVisibleLogsCount: (val: number | ((prev: number) => number)) => void;
  filteredLogsCount: number;
  showNotification: (type: 'success' | 'error', message: string) => void;
  setActiveTab: (tab: any) => void;
}

const ActivityLogs: React.FC<ActivityLogsProps> = ({
  darkMode,
  handleDownloadLogs,
  fetchLogs,
  refreshingLogs,
  direction,
  slideVariants,
  clearLogs,
  isConfirmingClear,
  logSearch,
  setLogSearch,
  logLevelFilter,
  setLogLevelFilter,
  logCategoryFilter,
  setLogCategoryFilter,
  logCategories,
  displayedLogs,
  handleLogsScroll,
  expandedLogId,
  setExpandedLogId,
  visibleLogsCount,
  setVisibleLogsCount,
  filteredLogsCount,
  showNotification,
  setActiveTab,
}) => {
  return (
    <motion.div
      key="logs"
      custom={direction}
      variants={slideVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full min-h-screen bg-neutral-950"
    >
      <div className="p-0 space-y-0 transition-all duration-500 relative bg-neutral-950 w-full">
        {/* Terminal Header - Raw Style */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950 gap-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="p-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white transition-all mr-2"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-md">
              <Terminal size={14} className="text-emerald-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-200">System Logs</h3>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center space-x-2 gap-y-2">
            <div className="flex items-center space-x-2 bg-neutral-900 px-3 py-1.5 rounded-md border border-neutral-800">
              <button 
                onClick={() => handleDownloadLogs('json')}
                className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 hover:text-emerald-400 transition-all"
              >
                JSON
              </button>
              <span className="text-neutral-600">/</span>
              <button 
                onClick={() => handleDownloadLogs('csv')}
                className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 hover:text-emerald-400 transition-all"
              >
                CSV
              </button>
            </div>
            
            <button 
              onClick={fetchLogs}
              disabled={refreshingLogs}
              className="bg-neutral-900 px-3 py-1.5 rounded-md border border-neutral-800 text-neutral-300 hover:text-emerald-400 transition-all flex items-center gap-2 text-[10px] uppercase font-bold"
            >
              <RefreshCw size={14} className={refreshingLogs ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button 
              onClick={clearLogs}
              className={`px-3 py-1.5 rounded-md border transition-all text-[10px] font-bold uppercase tracking-widest ${
                isConfirmingClear 
                  ? 'bg-rose-900/30 border-rose-500/50 text-rose-400 animate-pulse'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-rose-400 hover:border-rose-900/50'
              }`}
            >
              {isConfirmingClear ? 'CONFIRM_CLEAR' : 'CLEAR_ALL'}
            </button>
          </div>
        </div>

        {/* Filters & Search - Raw Terminal Style */}
        <div className="px-6 py-3 border-b border-neutral-800 bg-neutral-950 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 flex items-center space-x-3 bg-neutral-900 px-3 py-2 border border-neutral-800 rounded-md">
            <span className="text-neutral-400 text-[11px] font-mono">$ grep</span>
            <input 
              type="text"
              placeholder="..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="flex-1 bg-transparent text-[12px] font-mono text-neutral-200 outline-none placeholder:text-neutral-600"
            />
          </div>
          <div className="flex items-center space-x-2 bg-neutral-900 px-3 py-2 border border-neutral-800 rounded-md">
            <span className="text-neutral-400 text-[11px] font-mono">--level</span>
            <select 
              value={logLevelFilter}
              onChange={(e) => setLogLevelFilter(e.target.value)}
              className="flex-1 bg-transparent text-[12px] font-mono text-neutral-200 outline-none appearance-none cursor-pointer"
            >
              <option value="all">all</option>
              <option value="info">info</option>
              <option value="warn">warn</option>
              <option value="error">error</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 bg-neutral-900 px-3 py-2 border border-neutral-800 rounded-md">
            <span className="text-neutral-400 text-[11px] font-mono">--cat</span>
            <select 
              value={logCategoryFilter}
              onChange={(e) => setLogCategoryFilter(e.target.value)}
              className="flex-1 bg-transparent text-[12px] font-mono text-neutral-200 outline-none appearance-none cursor-pointer"
            >
              <option value="all">all</option>
              {logCategories.map(cat => (
                <option key={cat} value={cat}>{cat.toLowerCase()}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Terminal Content - Raw Stream */}
        <div 
          className="p-6 space-y-2 min-h-[70vh] overflow-y-auto custom-scrollbar font-mono bg-neutral-950"
          onScroll={handleLogsScroll}
        >
          {displayedLogs.length === 0 ? (
            <div className="text-center py-40 opacity-30">
              <Terminal size={80} className="mx-auto mb-4 text-neutral-500" />
              <p className="text-[14px] font-black uppercase tracking-[1em] text-neutral-400">NULL_STREAM</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedLogs.map((log, i) => (
                <div 
                  key={log._id || i} 
                  className="group/line flex flex-col py-1.5 transition-colors border-b border-neutral-900/50"
                >
                  <div className="flex items-start space-x-4">
                    <span className="text-[10px] text-neutral-500 shrink-0 select-none w-10 text-right mt-0.5">
                      {String(i + 1).padStart(3, '0')}
                    </span>
                    
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      <span className={`text-[10px] font-bold shrink-0 mt-0.5 w-12 ${
                        log.level === 'error' 
                          ? 'text-rose-500' 
                          : log.level === 'warn'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                      }`}>
                        [{log.level?.toUpperCase() || 'INFO'}]
                      </span>
                      
                      <span className="text-[11px] text-blue-400 shrink-0 mt-0.5 bg-blue-500/10 px-1 rounded">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-neutral-200 leading-relaxed whitespace-pre-wrap break-words group-hover/line:text-white transition-colors">
                          {log.message}
                        </p>
                        
                        {log.route && (
                          <div className="mt-1.5 flex items-center space-x-1 text-[10px] text-neutral-500">
                            <LinkIcon size={10} className="text-indigo-400" />
                            <span className="bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">{log.route}</span>
                          </div>
                        )}
                      </div>

                      {log.details && (
                        <button 
                          onClick={() => setExpandedLogId(expandedLogId === log._id ? null : log._id)}
                          className="p-1.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-400 hover:text-emerald-400 hover:border-emerald-900/50 transition-colors shrink-0"
                        >
                          {expandedLogId === log._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {log.details && expandedLogId === log._id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden ml-14 mt-3"
                      >
                        <div className="relative">
                          <pre className="text-[11px] p-4 bg-black border border-neutral-800 rounded-md text-emerald-500/80 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-relaxed shadow-inner">
                            {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                          </pre>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2));
                              showNotification('success', 'Details copied to clipboard');
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-400 hover:text-white hover:border-neutral-600 transition-all opacity-0 group-hover/line:opacity-100 shadow-md"
                            title="Copy details"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {visibleLogsCount < filteredLogsCount && (
                <div className="py-12 text-center">
                  <button 
                    onClick={() => setVisibleLogsCount(prev => prev + 100)}
                    className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 hover:text-emerald-500 bg-neutral-900 px-6 py-2 border border-neutral-800 rounded-md transition-all"
                  >
                    [FETCH_MORE_DATA]
                  </button>
                </div>
              )}

              <div className="flex items-center space-x-2 py-6 px-2">
                <span className="text-emerald-500 animate-pulse select-none text-xl font-bold">_</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Terminal Footer - Minimal Raw */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center space-x-8 text-[9px] font-bold tracking-widest text-neutral-500">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              SYSTEM_READY
            </span>
            <span>LOG_COUNT: {filteredLogsCount}</span>
          </div>
          <div className="text-[9px] font-bold tracking-widest text-neutral-600">
            AIS_OS_V4.2 // RAW_STREAM
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(ActivityLogs);
