import React, { memo } from 'react';
import { motion } from 'motion/react';
import { Calendar } from 'lucide-react';

interface InsightsProps {
  darkMode: boolean;
  activityHeatmap: any[];
  direction: number;
  slideVariants: any;
}

const Insights: React.FC<InsightsProps> = ({
  darkMode,
  activityHeatmap,
  direction,
  slideVariants,
}) => {
  return (
    <motion.div
      key="insights"
      custom={direction}
      variants={slideVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 w-full"
    >
      <div className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-rose relative overflow-hidden group ${darkMode ? 'bg-rose-950/40 border-rose-500/30' : 'bg-rose-50 border-rose-200 shadow-xl shadow-rose-500/10'}`}>
        <div className={`absolute inset-0 pattern-dots opacity-[0.05] pointer-events-none ${darkMode ? 'text-rose-400' : 'text-rose-600'}`} />
        <div className="relative z-10 space-y-6 pointer-events-auto">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-500/10 text-rose-600'}`}>
              <Calendar size={14} />
            </div>
            <h3 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-rose-400' : 'text-rose-600'}`}>Activity Heatmap</h3>
          </div>
          
          <div className="overflow-x-auto pb-2 custom-scrollbar">
            <div className="flex space-x-1 min-w-max">
              <div className="flex flex-col space-y-1 pr-2">
                {['Mon', 'Wed', 'Fri', 'Sun'].map(day => (
                  <span key={day} className="text-[8px] h-3 flex items-center text-slate-500 font-bold uppercase">{day}</span>
                ))}
              </div>
              <div className="grid grid-flow-col grid-rows-7 gap-1">
                {activityHeatmap.map((item, i) => (
                  <div 
                    key={i}
                    className={`w-3 h-3 rounded-sm transition hover:scale-125 cursor-pointer ${
                      item.value === 0 ? (darkMode ? 'bg-neutral-800' : 'bg-slate-200') :
                      item.value < 3 ? 'bg-rose-500/20' :
                      item.value < 6 ? 'bg-rose-500/50' :
                      'bg-rose-500'
                    }`}
                    title={`${item.day} ${item.hour}:00 - ${item.value} messages`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-2 text-[8px] font-bold uppercase text-slate-500">
            <span>Less</span>
            <div className="flex space-x-1">
              <div className={`w-2 h-2 rounded-sm ${darkMode ? 'bg-neutral-800' : 'bg-slate-200'}`} />
              <div className="w-2 h-2 rounded-sm bg-rose-500/20" />
              <div className="w-2 h-2 rounded-sm bg-rose-500/50" />
              <div className="w-2 h-2 rounded-sm bg-rose-500" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(Insights);
