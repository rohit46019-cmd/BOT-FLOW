import React, { memo } from 'react';
import { motion } from 'motion/react';
import { LayoutGrid, MessageSquare, Send } from 'lucide-react';

interface BroadcastPanelProps {
  darkMode: boolean;
  castTopRef: React.RefObject<HTMLDivElement | null>;
  broadcastMessage: string;
  setBroadcastMessage: (msg: string) => void;
  broadcasting: boolean;
  broadcastTarget: 'all' | 'general';
  setBroadcastTarget: (target: 'all' | 'general') => void;
  broadcastProgress: { current: number; total: number; status: string };
  handleCancelBroadcast: () => void;
  handleBroadcast: () => void;
  direction: number;
  slideVariants: any;
}

const BroadcastPanel: React.FC<BroadcastPanelProps> = ({
  darkMode,
  castTopRef,
  broadcastMessage,
  setBroadcastMessage,
  broadcasting,
  broadcastTarget,
  setBroadcastTarget,
  broadcastProgress,
  handleCancelBroadcast,
  handleBroadcast,
  direction,
  slideVariants,
}) => {
  return (
    <motion.div
      key="broadcast"
      custom={direction}
      variants={slideVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-4 w-full"
    >
      <div ref={castTopRef} />
      <div className={`border p-4.5 rounded-xl space-y-4 transition-all duration-300 relative overflow-hidden group ${
        darkMode ? 'bg-neutral-900/60 border-purple-500/20 shadow-xs' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="relative z-10 space-y-2 pointer-events-auto">
          <div className="flex items-center justify-between">
            <label className={`text-[9.5px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Broadcast Message
            </label>
            <span className={`text-[9px] font-semibold ${broadcastMessage.length > 500 ? 'text-rose-500' : darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {broadcastMessage.length} / 500
            </span>
          </div>
          <textarea
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            placeholder="Type your announcement here..."
            disabled={broadcasting}
            rows={4}
            className={`w-full p-3 border rounded-lg focus:ring-1 focus:ring-purple-500 outline-none text-xs transition leading-relaxed ${
              darkMode ? 'bg-black/30 border-white/10 text-white placeholder-white/20' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            } ${broadcasting ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>

        <div className="space-y-2">
          <label className={`text-[9.5px] font-bold uppercase tracking-wider block ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Broadcast Target
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setBroadcastTarget('all')}
              disabled={broadcasting}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition border flex items-center justify-center space-x-1.5 ${
                broadcastTarget === 'all'
                  ? (darkMode ? 'bg-purple-500/10 border-purple-500/40 text-purple-400' : 'bg-purple-50 border-purple-300 text-purple-700')
                  : (darkMode ? 'bg-transparent border-white/5 text-slate-400 hover:border-white/10' : 'bg-transparent border-slate-200 text-slate-600 hover:bg-slate-50')
              } ${broadcasting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <LayoutGrid size={12} />
              <span>All Topics</span>
            </button>
            <button
              type="button"
              onClick={() => setBroadcastTarget('general')}
              disabled={broadcasting}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition border flex items-center justify-center space-x-1.5 ${
                broadcastTarget === 'general'
                  ? (darkMode ? 'bg-purple-500/10 border-purple-500/40 text-purple-400' : 'bg-purple-50 border-purple-300 text-purple-700')
                  : (darkMode ? 'bg-transparent border-white/5 text-slate-400 hover:border-white/10' : 'bg-transparent border-slate-200 text-slate-600 hover:bg-slate-50')
              } ${broadcasting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <MessageSquare size={12} />
              <span>General Section</span>
            </button>
          </div>
        </div>

        {broadcasting && broadcastProgress.status === 'running' && broadcastTarget === 'all' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider">
              <span className={darkMode ? 'text-purple-400' : 'text-purple-600'}>Processing Broadcast</span>
              <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                {broadcastProgress.current} / {broadcastProgress.total} Topics
              </span>
            </div>
            <div className={`h-2 w-full rounded-full overflow-hidden ${darkMode ? 'bg-purple-950/40' : 'bg-purple-100'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(broadcastProgress.current / (broadcastProgress.total || 1)) * 100}%` }}
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
              />
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleCancelBroadcast}
                className={`px-4 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition border ${
                  darkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                }`}
              >
                Cancel Broadcast
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleBroadcast}
          disabled={broadcasting || !broadcastMessage.trim() || broadcastMessage.length > 500}
          className={`w-full py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5 shadow-xs ${
            darkMode 
              ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-950/20' 
              : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-100'
          }`}
        >
          <Send size={13} />
          <span>{broadcasting ? 'Sending...' : 'Broadcast Now'}</span>
        </button>
      </div>
    </motion.div>
  );
};

export default memo(BroadcastPanel);
