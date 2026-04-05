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
      className="w-full min-h-screen bg-black"
    >
      <div className="p-0 space-y-0 transition-all duration-500 relative bg-black w-full">
        {/* Terminal Header - Raw Style */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 border-b border-neutral-950 bg-black gap-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="p-2 rounded-lg bg-neutral-900/50 text-neutral-500 hover:text-white transition-all mr-2"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center space-x-2">
              <Terminal size={14} className="text-neutral-900" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-700">AIS_SYSTEM_LOGS_STREAM</h3>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleDownloadLogs('json')}
                className="text-[9px] font-bold uppercase tracking-widest text-neutral-700 hover:text-emerald-500 transition-all"
              >
                JSON
              </button>
              <span className="text-neutral-900">/</span>
              <button 
                onClick={() => handleDownloadLogs('csv')}
                className="text-[9px] font-bold uppercase tracking-widest text-neutral-700 hover:text-emerald-500 transition-all"
              >
                CSV
              </button>
            </div>
            <button 
              onClick={fetchLogs}
              disabled={refreshingLogs}
              className="text-neutral-700 hover:text-emerald-500 transition-all"
            >
              <RefreshCw size={14} className={refreshingLogs ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={clearLogs}
              className={`text-[9px] font-bold uppercase tracking-widest transition-all ${
                isConfirmingClear 
                  ? 'text-rose-500 animate-pulse'
                  : 'text-neutral-700 hover:text-rose-500'
              }`}
            >
              {isConfirmingClear ? 'CONFIRM_CLEAR' : 'CLEAR_ALL'}
            </button>
          </div>
        </div>

        {/* Filters & Search - Raw Terminal Style */}
        <div className="px-6 py-3 border-b border-neutral-950 bg-black grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 flex items-center space-x-3 bg-black px-3 py-1.5 border border-neutral-950">
            <span className="text-neutral-900 text-[10px] font-mono">$ grep</span>
            <input 
              type="text"
              placeholder="..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="flex-1 bg-transparent text-[11px] font-mono text-neutral-400 outline-none placeholder:text-neutral-900"
            />
          </div>
          <div className="flex items-center space-x-2 bg-black px-3 py-1.5 border border-neutral-950">
            <span className="text-neutral-900 text-[10px] font-mono">--level</span>
            <select 
              value={logLevelFilter}
              onChange={(e) => setLogLevelFilter(e.target.value)}
              className="flex-1 bg-transparent text-[11px] font-mono text-neutral-500 outline-none appearance-none cursor-pointer"
            >
              <option value="all">all</option>
              <option value="info">info</option>
              <option value="warn">warn</option>
              <option value="error">error</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 bg-black px-3 py-1.5 border border-neutral-950">
            <span className="text-neutral-900 text-[10px] font-mono">--cat</span>
            <select 
              value={logCategoryFilter}
              onChange={(e) => setLogCategoryFilter(e.target.value)}
              className="flex-1 bg-transparent text-[11px] font-mono text-neutral-500 outline-none appearance-none cursor-pointer"
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
          className="p-6 space-y-2 min-h-[70vh] overflow-y-auto custom-scrollbar font-mono bg-black"
          onScroll={handleLogsScroll}
        >
          {displayedLogs.length === 0 ? (
            <div className="text-center py-40 opacity-5">
              <Terminal size={80} className="mx-auto mb-4 text-neutral-500" />
              <p className="text-[14px] font-black uppercase tracking-[1em] text-neutral-400">NULL_STREAM</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedLogs.map((log, i) => (
                <div 
                  key={log._id || i} 
                  className="group/line flex flex-col py-1 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    <span className="text-[10px] text-neutral-800 shrink-0 select-none w-10 text-right">
                      {i + 1}
                    </span>
                    
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      <span className={`text-[9px] font-bold shrink-0 mt-0.5 ${
                        log.level === 'error' 
                          ? 'text-red-500' 
                          : log.level === 'warn'
                            ? 'text-red-400'
                            : 'text-white'
                      }`}>
                        {log.level?.toUpperCase() || 'INFO'}
                      </span>
                      
                      <span className="text-[9px] text-neutral-600 shrink-0 mt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-white leading-relaxed whitespace-pre-wrap break-words group-hover/line:text-neutral-300 transition-colors">
                          {log.message}
                        </p>
                        
                        {log.route && (
                          <div className="mt-1 flex items-center space-x-1 opacity-10 text-[9px] text-neutral-700">
                            <LinkIcon size={10} />
                            <span>{log.route}</span>
                          </div>
                        )}
                      </div>

                      {log.details && (
                        <button 
                          onClick={() => setExpandedLogId(expandedLogId === log._id ? null : log._id)}
                          className="p-1 text-neutral-900 hover:text-emerald-900 transition-colors shrink-0"
                        >
                          {expandedLogId === log._id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
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
                        className="overflow-hidden ml-14 mt-2"
                      >
                        <div className="relative">
                          <pre className="text-[10px] p-4 bg-neutral-950 border border-neutral-900 text-neutral-600 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-relaxed">
                            {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                          </pre>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2));
                              showNotification('success', 'Details copied to clipboard');
                            }}
                            className="absolute top-2 right-2 p-1.5 text-neutral-800 hover:text-white transition-all opacity-0 group-hover/line:opacity-100"
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
                    className="text-[10px] font-bold tracking-[0.3em] text-neutral-800 hover:text-neutral-400 transition-all"
                  >
                    [FETCH_MORE_DATA]
                  </button>
                </div>
              )}

              <div className="flex items-center space-x-2 py-6 px-2">
                <span className="text-emerald-950 animate-pulse select-none">_</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Terminal Footer - Minimal Raw */}
        <div className="px-6 py-4 border-t border-neutral-950 bg-black flex items-center justify-between">
          <div className="flex items-center space-x-8 text-[9px] font-bold tracking-widest text-neutral-800">
            <span className="flex items-center gap-2">
              <div className="w-1 h-1 bg-red-500" />
              SYSTEM_READY
            </span>
            <span>LOG_COUNT: {filteredLogsCount}</span>
          </div>
          <div className="text-[9px] font-bold tracking-widest text-neutral-800">
            AIS_OS_V4.2 // RAW_STREAM
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(ActivityLogs);
