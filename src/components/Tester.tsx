import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, RefreshCw, MessageCircle } from 'lucide-react';

interface TesterProps {
  darkMode: boolean;
  testMessage: string;
  setTestMessage: (msg: string) => void;
  handleTestPersona: () => void;
  isTesting: boolean;
  testReply: string;
  direction: number;
  slideVariants: any;
}

const Tester: React.FC<TesterProps> = ({
  darkMode,
  testMessage,
  setTestMessage,
  handleTestPersona,
  isTesting,
  testReply,
  direction,
  slideVariants,
}) => {
  return (
    <motion.div
      key="tester"
      custom={direction}
      variants={slideVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 w-full"
    >
      <div className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-orange relative overflow-hidden group ${darkMode ? 'bg-orange-950/40 border-orange-500/30' : 'bg-orange-50 border-orange-200 shadow-xl shadow-orange-500/10'}`}>
        <div className={`absolute inset-0 pattern-dots opacity-[0.05] pointer-events-none ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
        <div className="relative z-10 space-y-6 pointer-events-auto">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-500/10 text-orange-600'}`}>
              <Bot size={14} />
            </div>
            <h3 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>AI Persona Tester</h3>
          </div>
          
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Test your current AI Persona settings before they go live. This uses the persona defined in Settings.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Test Message</label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Type a message a user might send..."
                rows={3}
                className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm transition ${darkMode ? 'bg-orange-500/5 border-orange-500/20 text-white placeholder-white/20' : 'bg-orange-50 border-orange-200 text-slate-900 placeholder-slate-400'}`}
              />
            </div>
            
            <button
              onClick={handleTestPersona}
              disabled={isTesting || !testMessage.trim()}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition flex items-center justify-center space-x-2 shadow-lg ${
                isTesting || !testMessage.trim() 
                  ? (darkMode ? 'bg-neutral-800 text-neutral-500' : 'bg-slate-200 text-slate-400') 
                  : 'bg-orange-500 text-white shadow-orange-500/20 hover:bg-orange-600'
              }`}
            >
              {isTesting ? <RefreshCw className="animate-spin" size={16} /> : <MessageCircle size={16} />}
              <span>Test AI Response</span>
            </button>
          </div>

          <AnimatePresence>
            {testReply && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl border ${darkMode ? 'bg-black/40 border-orange-500/20' : 'bg-white/60 border-orange-200'}`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Bot size={14} className={darkMode ? 'text-orange-400' : 'text-orange-600'} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>AI Reply</span>
                </div>
                <p className={`text-sm whitespace-pre-wrap ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {testReply}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(Tester);
