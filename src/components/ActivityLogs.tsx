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
      className={`w-full min-h-screen rounded-2xl transition-colors duration-300 ${
        darkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'
      }`}
    >
      <div className="p-0 space-y-0 w-full">
        {/* Terminal Header */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between px-5 py-3 border-b gap-3 transition-colors ${
          darkMode ? 'border-slate-800/80 bg-slate-900/90' : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`p-1.5 rounded-lg transition-all ${
                darkMode ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-200 text-slate-700 hover:text-slate-900'
              }`}
              title="Back to Dashboard"
            >
              <ArrowLeft size={15} />
            </button>
            <div className={`flex items-center space-x-2 px-2.5 py-1 rounded-lg border ${
              darkMode ? 'bg-slate-800/60 border-slate-700/60 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'
            }`}>
              <Terminal size={14} className="text-emerald-500" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider">System Logs</h3>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold tracking-wider ${
              darkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-100 border-slate-200'
            }`}>
              <button 
                onClick={() => handleDownloadLogs('json')}
                className="hover:text-emerald-500 transition-colors"
              >
                JSON
              </button>
              <span className="opacity-40">/</span>
              <button 
                onClick={() => handleDownloadLogs('csv')}
                className="hover:text-emerald-500 transition-colors"
              >
                CSV
              </button>
            </div>
            
            <button 
              onClick={fetchLogs}
              disabled={refreshingLogs}
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 text-[10px] font-bold transition-all ${
                darkMode ? 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:text-emerald-400' : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-emerald-600'
              }`}
            >
              <RefreshCw size={12} className={refreshingLogs ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            
            <button 
              onClick={clearLogs}
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                isConfirmingClear 
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-500 animate-pulse'
                  : darkMode 
                    ? 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:text-rose-400' 
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-rose-600'
              }`}
            >
              {isConfirmingClear ? 'Confirm Clear' : 'Clear Logs'}
            </button>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className={`px-5 py-2.5 border-b grid grid-cols-1 md:grid-cols-4 gap-3 ${
          darkMode ? 'border-slate-800/80 bg-slate-950/80' : 'border-slate-200 bg-slate-100/60'
        }`}>
          <div className={`md:col-span-2 flex items-center space-x-2 px-3 py-1.5 border rounded-lg ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <Search size={13} className="text-slate-400" />
            <input 
              type="text"
              placeholder="Search logs..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="flex-1 bg-transparent text-[11px] font-mono outline-none placeholder:text-slate-500"
            />
          </div>

          <div className={`flex items-center space-x-2 px-3 py-1.5 border rounded-lg ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <span className="text-slate-400 text-[10px] font-mono uppercase">Level:</span>
            <select 
              value={logLevelFilter}
              onChange={(e) => setLogLevelFilter(e.target.value)}
              className="flex-1 bg-transparent text-[11px] font-mono outline-none cursor-pointer"
            >
              <option value="all" className={darkMode ? 'bg-slate-900' : 'bg-white'}>All Levels</option>
              <option value="info" className={darkMode ? 'bg-slate-900' : 'bg-white'}>Info</option>
              <option value="warn" className={darkMode ? 'bg-slate-900' : 'bg-white'}>Warn</option>
              <option value="error" className={darkMode ? 'bg-slate-900' : 'bg-white'}>Error</option>
            </select>
          </div>

          <div className={`flex items-center space-x-2 px-3 py-1.5 border rounded-lg ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <span className="text-slate-400 text-[10px] font-mono uppercase">Category:</span>
            <select 
              value={logCategoryFilter}
              onChange={(e) => setLogCategoryFilter(e.target.value)}
              className="flex-1 bg-transparent text-[11px] font-mono outline-none cursor-pointer"
            >
              <option value="all" className={darkMode ? 'bg-slate-900' : 'bg-white'}>All Categories</option>
              {logCategories.map(cat => (
                <option key={cat} value={cat} className={darkMode ? 'bg-slate-900' : 'bg-white'}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Log List Stream */}
        <div 
          className="p-4 space-y-1.5 min-h-[60vh] max-h-[75vh] overflow-y-auto custom-scrollbar font-mono text-[11px]"
          onScroll={handleLogsScroll}
        >
          {displayedLogs.length === 0 ? (
            <div className="text-center py-24 opacity-50">
              <Terminal size={48} className="mx-auto mb-3 text-slate-400" />
              <p className="text-xs font-semibold text-slate-400">No logs available</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {displayedLogs.map((log, i) => (
                <div 
                  key={log._id || i} 
                  className={`group/line flex flex-col py-2 px-3 rounded-xl border transition-all ${
                    darkMode 
                      ? 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900/90' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  {/* Top Metadata Row */}
                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 select-none font-bold">
                        #{i + 1}
                      </span>
                      
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        log.level === 'error' 
                          ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' 
                          : log.level === 'warn'
                            ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                      }`}>
                        {log.level || 'INFO'}
                      </span>

                      <span className={`px-1.5 py-0.5 rounded font-mono ${
                        darkMode ? 'bg-indigo-500/15 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {log.route && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                          <LinkIcon size={10} className="text-indigo-400" />
                          <span className={`px-1.5 py-0.5 rounded border text-[9px] ${
                            darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
                          }`}>
                            {log.route}
                          </span>
                        </span>
                      )}

                      {log.details && (
                        <button 
                          onClick={() => setExpandedLogId(expandedLogId === log._id ? null : log._id)}
                          className={`p-1 rounded border transition-colors shrink-0 ${
                            darkMode 
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-emerald-400' 
                              : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-emerald-600'
                          }`}
                          title="Toggle Details"
                        >
                          {expandedLogId === log._id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Full Log Message starting from the left edge */}
                  <div className={`font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words ${
                    darkMode ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    {log.message}
                  </div>

                  <AnimatePresence>
                    {log.details && expandedLogId === log._id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden ml-10 mt-2"
                      >
                        <div className="relative">
                          <pre className={`text-[10px] p-3 border rounded-lg overflow-x-auto whitespace-pre-wrap break-all font-mono leading-relaxed ${
                            darkMode 
                              ? 'bg-slate-950 border-slate-800 text-emerald-400' 
                              : 'bg-slate-900 text-emerald-300 border-slate-800'
                          }`}>
                            {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                          </pre>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2));
                              showNotification('success', 'Details copied to clipboard');
                            }}
                            className="absolute top-2 right-2 p-1 bg-slate-800 border border-slate-700 rounded text-slate-300 hover:text-white transition-all opacity-80 hover:opacity-100"
                            title="Copy details"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {visibleLogsCount < filteredLogsCount && (
                <div className="py-6 text-center">
                  <button 
                    onClick={() => setVisibleLogsCount(prev => prev + 100)}
                    className={`text-[10px] font-bold tracking-wider px-4 py-2 border rounded-lg transition-all ${
                      darkMode 
                        ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-emerald-400' 
                        : 'bg-white border-slate-200 text-slate-700 hover:text-emerald-600'
                    }`}
                  >
                    Load More Logs ({filteredLogsCount - visibleLogsCount} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Terminal Footer */}
        <div className={`px-5 py-3 border-t flex items-center justify-between text-[10px] font-medium ${
          darkMode ? 'border-slate-800/80 bg-slate-950 text-slate-400' : 'border-slate-200 bg-slate-100/80 text-slate-600'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span>Status: Active</span>
          </div>
          <div>
            Total Logs: <span className="font-bold">{filteredLogsCount}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(ActivityLogs);
