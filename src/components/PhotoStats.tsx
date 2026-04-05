import React, { memo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Image, Hash, ExternalLink } from 'lucide-react';

interface PhotoStatsProps {
  darkMode: boolean;
  setActiveTab: (tab: string) => void;
  photoStatsTab: 'today' | '24h';
  setPhotoStatsTab: (tab: 'today' | '24h') => void;
  stats: any;
  direction: number;
  slideVariants: any;
}

const PhotoStats: React.FC<PhotoStatsProps> = ({
  darkMode,
  setActiveTab,
  photoStatsTab,
  setPhotoStatsTab,
  stats,
  direction,
  slideVariants,
}) => {
  const currentTopics = photoStatsTab === 'today' ? stats?.todayPhotoSentStats?.topics : stats?.past24hPhotoSentStats?.topics;
  const totalCount = photoStatsTab === 'today' ? stats?.todayPhotoSentStats?.count : stats?.past24hPhotoSentStats?.count;

  return (
    <motion.div
      key="photo_stats"
      custom={direction}
      variants={slideVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 w-full"
    >
      <div className={`border p-6 rounded-[2.5rem] space-y-6 transition-colors duration-500 relative overflow-hidden group ${darkMode ? 'bg-amber-950/40 border-amber-500/30' : 'bg-amber-50 border-amber-200 shadow-xl shadow-amber-500/10'}`}>
        <div className={`absolute inset-0 pattern-lines opacity-[0.05] pointer-events-none ${darkMode ? 'text-amber-500' : 'text-amber-500'}`} />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition ${darkMode ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}`}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className={`text-2xl font-black tracking-tight flex items-center ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Photo Sent Activity
              </h2>
              <div className="flex space-x-2 mt-1">
                <button 
                  onClick={() => setPhotoStatsTab('today')}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition ${photoStatsTab === 'today' ? (darkMode ? 'bg-amber-500 text-white' : 'bg-amber-600 text-white') : (darkMode ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-amber-100 text-amber-600 hover:bg-amber-200')}`}
                >
                  Today (IST)
                </button>
                <button 
                  onClick={() => setPhotoStatsTab('24h')}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition ${photoStatsTab === '24h' ? (darkMode ? 'bg-amber-500 text-white' : 'bg-amber-600 text-white') : (darkMode ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-amber-100 text-amber-600 hover:bg-amber-200')}`}
                >
                  Past 24h
                </button>
              </div>
            </div>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-500'}`}>
            <Image size={24} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-amber-200/50 shadow-sm'}`}>
            <span className={`text-[9px] uppercase font-black tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Today Total</span>
            <div className={`text-xl font-black mt-1 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              {stats?.todayPhotoSentStats?.count || 0}
            </div>
          </div>
          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-amber-200/50 shadow-sm'}`}>
            <span className={`text-[9px] uppercase font-black tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Last 24h</span>
            <div className={`text-xl font-black mt-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {stats?.past24hPhotoSentStats?.count || 0}
            </div>
          </div>
        </div>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          {currentTopics?.length ? (
            currentTopics.map((topic: any, idx: number) => (
              <div key={idx} className={`p-3 rounded-2xl flex items-center justify-between group transition ${darkMode ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-white hover:bg-slate-50 shadow-sm'}`}>
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                    <Hash size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-bold text-xs truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{topic.name}</p>
                    <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{topic.time}</p>
                  </div>
                </div>
                {topic.link && (
                  <a 
                    href={topic.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition ${darkMode ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white' : 'bg-amber-100 text-amber-600 hover:bg-amber-600 hover:text-white'}`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest">Open</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            ))
          ) : (
            <div className={`text-center py-12 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              <Image size={32} className="mx-auto mb-4 opacity-20" />
              <p className="text-xs font-medium">No activity recorded for this period.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default memo(PhotoStats);
