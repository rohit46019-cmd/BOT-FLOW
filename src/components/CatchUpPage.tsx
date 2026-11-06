import React, { memo, useState } from 'react';
import { ArrowLeft, Send, Zap, RefreshCw, Trash2, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';

interface CatchUpPageProps {
  darkMode: boolean;
  setActiveTab: (tab: string) => void;
  scannedItems: any[];
  handleClearAllMissed: () => void;
  handleReplyToSingleMissed: (id: string) => void;
  replyingIds: Set<string> | any;
  handleScanMissed: (autoReply?: boolean) => void;
  isScanningMissed: boolean;
  handleCatchUp?: (ids?: string[]) => void;
  isCatchingUp?: boolean;
}

const CatchUpPage: React.FC<CatchUpPageProps> = ({
  darkMode,
  setActiveTab,
  scannedItems,
  handleClearAllMissed,
  handleReplyToSingleMissed,
  replyingIds,
  handleScanMissed,
  isScanningMissed,
  handleCatchUp,
  isCatchingUp = false,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isReplying = (id: string) => {
    if (!replyingIds) return false;
    if (replyingIds instanceof Set) return replyingIds.has(id);
    if (Array.isArray(replyingIds)) return replyingIds.includes(id);
    return false;
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === scannedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(scannedItems.map(i => i._id)));
    }
  };

  return (
    <div className={`min-h-screen p-4 sm:p-6 pb-24 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`p-2.5 rounded-2xl border transition active:scale-95 ${
              darkMode ? 'bg-neutral-900 border-white/10 hover:bg-neutral-800 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm'
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-1.5">
              <h2 className="text-xl font-black tracking-tight">Catch Up & Auto Scan</h2>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                darkMode ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-indigo-100 text-indigo-700'
              }`}>
                🕒 Past 48 Hours
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                darkMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-700'
              }`}>
                ⚡ Auto Scan Active
              </span>
            </div>
            <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Shows missed keywords from the past 48 hours. Older data auto-deletes. Background auto-scan runs continuously and auto-replies.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Fast Scan */}
          <button 
            onClick={() => handleScanMissed(false)}
            disabled={isScanningMissed || isCatchingUp}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition shadow-sm active:scale-95 ${
              isScanningMissed 
                ? 'bg-indigo-600/50 text-indigo-200 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
            }`}
          >
            <RefreshCw size={13} className={isScanningMissed ? 'animate-spin' : ''} />
            <span>{isScanningMissed ? 'Scanning...' : 'Fast Scan'}</span>
          </button>

          {/* Fast Scan & Turant Reply */}
          <button 
            onClick={() => handleScanMissed(true)}
            disabled={isScanningMissed || isCatchingUp}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition shadow-sm active:scale-95 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-orange-500/20 disabled:opacity-50`}
            title="Scan and immediately reply to all matched keywords"
          >
            <Zap size={13} fill="currentColor" />
            <span>Scan & Turant Reply</span>
          </button>

          {/* Clear All */}
          {scannedItems.length > 0 && (
            <button 
              onClick={handleClearAllMissed}
              className={`p-2 rounded-xl text-xs font-bold transition border active:scale-95 ${
                darkMode ? 'bg-neutral-900 border-white/10 hover:bg-rose-500/20 text-rose-400' : 'bg-white border-slate-200 hover:bg-rose-50 text-rose-600 shadow-sm'
              }`}
              title="Clear all saved scans"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar (when items exist) */}
      {scannedItems.length > 0 && (
        <div className={`p-3.5 rounded-2xl border mb-4 flex flex-wrap items-center justify-between gap-3 ${
          darkMode ? 'bg-neutral-900/90 border-white/10' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAll}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                darkMode ? 'bg-white/10 hover:bg-white/15 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {selectedIds.size === scannedItems.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {selectedIds.size > 0 ? `${selectedIds.size} of ${scannedItems.length} selected` : `${scannedItems.length} total saved items`}
            </span>
          </div>

          {handleCatchUp && (
            <button
              onClick={() => {
                const targetIds = selectedIds.size > 0 ? Array.from(selectedIds) : scannedItems.map(i => i._id);
                handleCatchUp(targetIds);
              }}
              disabled={isCatchingUp}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-2 transition shadow-md active:scale-95 ${
                isCatchingUp 
                  ? 'bg-emerald-600/50 text-white cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              {isCatchingUp ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Replying...</span>
                </>
              ) : (
                <>
                  <Zap size={13} fill="currentColor" />
                  <span>⚡ Auto-Reply {selectedIds.size > 0 ? `Selected (${selectedIds.size})` : `All (${scannedItems.length})`}</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Items List */}
      <div className="space-y-3">
        {scannedItems.length === 0 ? (
          <div className={`text-center py-16 px-4 rounded-3xl border ${darkMode ? 'bg-neutral-900/50 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4 ${
              darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-base font-black mb-1">All Caught Up!</h3>
            <p className={`text-xs max-w-sm mx-auto mb-5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              No pending missed triggers. Click "Fast Scan" to query Telegram group topics instantly with Python rule matching.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => handleScanMissed(false)}
                disabled={isScanningMissed}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition active:scale-95 shadow-md shadow-indigo-600/20"
              >
                {isScanningMissed ? 'Scanning...' : 'Run Fast Scan Now'}
              </button>
            </div>
          </div>
        ) : (
          scannedItems.map((item: any) => {
            const isSelected = selectedIds.has(item._id);
            const replying = isReplying(item._id);

            return (
              <div 
                key={item._id}
                onClick={() => handleToggleSelect(item._id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected 
                    ? (darkMode ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30' : 'bg-indigo-50/80 border-indigo-300 shadow-sm ring-1 ring-indigo-400/30')
                    : (darkMode ? 'bg-neutral-900/90 border-white/10 hover:border-white/20' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm')
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1.5">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${
                      darkMode ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {item.topicName || `Topic #${item.topicId}`}
                    </span>
                    <span className={`text-[10px] font-mono flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <Clock size={11} />
                      {item.date ? new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </span>
                    {item.autoReplied && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Replied
                      </span>
                    )}
                  </div>

                  <p className={`text-xs font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    Matched Keyword: <span className="text-amber-500 font-black">"{item.keyword}"</span>
                  </p>

                  <p className={`text-[11px] italic leading-relaxed line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    "{item.text}"
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReplyToSingleMissed(item._id);
                    }}
                    disabled={replying}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 transition active:scale-95 ${
                      replying
                        ? 'bg-slate-500 text-white cursor-not-allowed'
                        : (darkMode ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200')
                    }`}
                  >
                    {replying ? (
                      <>
                        <RefreshCw size={11} className="animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send size={11} />
                        <span>Reply Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default memo(CatchUpPage);
