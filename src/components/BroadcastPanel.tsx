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
      className="space-y-6 w-full"
    >
      <div ref={castTopRef} />
      <div className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-purple relative overflow-hidden group ${darkMode ? 'bg-purple-950/40 border-purple-500/30' : 'bg-purple-50 border-purple-200 shadow-xl shadow-purple-500/10'}`}>
        <div className={`absolute inset-0 pattern-lines opacity-[0.05] pointer-events-none ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
        <div className="relative z-10 space-y-3 pointer-events-auto">
          <div className="flex items-center justify-between ml-1">
            <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Broadcast Message</label>
            <span className={`text-[10px] font-bold ${broadcastMessage.length > 500 ? 'text-rose-500' : darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {broadcastMessage.length} / 500
            </span>
          </div>
          <textarea
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            placeholder="Type your announcement here..."
            disabled={broadcasting}
            className={`w-full h-32 p-5 border rounded-3xl focus:ring-4 focus:ring-purple-500/20 outline-none text-sm transition ${darkMode ? 'bg-purple-950/20 border-purple-500/20 text-white placeholder-white/20' : 'bg-white border-purple-100 text-slate-900 placeholder-slate-400 shadow-inner'} ${broadcasting ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>

        <div className="space-y-3 px-1">
          <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Broadcast Target</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setBroadcastTarget('all')}
              disabled={broadcasting}
              className={`py-3 px-4 rounded-2xl text-xs font-bold transition border-2 flex items-center justify-center space-x-2 ${
                broadcastTarget === 'all'
                  ? (darkMode ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-purple-100 border-purple-500 text-purple-700')
                  : (darkMode ? 'bg-neutral-900/40 border-white/5 text-slate-500 hover:border-white/10' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200')
              } ${broadcasting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <LayoutGrid size={14} />
              <span>All Topics</span>
            </button>
            <button
              onClick={() => setBroadcastTarget('general')}
              disabled={broadcasting}
              className={`py-3 px-4 rounded-2xl text-xs font-bold transition border-2 flex items-center justify-center space-x-2 ${
                broadcastTarget === 'general'
                  ? (darkMode ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-purple-100 border-purple-500 text-purple-700')
                  : (darkMode ? 'bg-neutral-900/40 border-white/5 text-slate-500 hover:border-white/10' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200')
              } ${broadcasting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <MessageSquare size={14} />
              <span>General Section</span>
            </button>
          </div>
        </div>

        {broadcasting && broadcastProgress.status === 'running' && broadcastTarget === 'all' && (
          <div className="space-y-3 px-1">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
              <span className={darkMode ? 'text-purple-400' : 'text-purple-600'}>Processing Broadcast</span>
              <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                {broadcastProgress.current} / {broadcastProgress.total} Topics
              </span>
            </div>
            <div className={`h-3 w-full rounded-full overflow-hidden ${darkMode ? 'bg-purple-950/40' : 'bg-purple-100'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(broadcastProgress.current / (broadcastProgress.total || 1)) * 100}%` }}
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
              />
            </div>
            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancelBroadcast}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${darkMode ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
              >
                Cancel Broadcast
              </motion.button>
            </div>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleBroadcast}
          disabled={broadcasting || !broadcastMessage.trim() || broadcastMessage.length > 500}
          className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest text-sm transition-colors disabled:opacity-50 flex items-center justify-center space-x-3 shadow-xl ${darkMode ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500' : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-purple-500/20'}`}
        >
          <Send size={18} />
          <span>{broadcasting ? 'Sending...' : 'Broadcast Now'}</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default memo(BroadcastPanel);
