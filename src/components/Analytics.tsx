import React, { memo } from 'react';
import { motion } from 'motion/react';
import { PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis 
} from 'recharts';

interface AnalyticsProps {
  darkMode: boolean;
  analyticsData: {
    keywordData: any[];
    topicData: any[];
  };
  direction: number;
  slideVariants: any;
}

const Analytics: React.FC<AnalyticsProps> = ({
  darkMode,
  analyticsData,
  direction,
  slideVariants,
}) => {
  return (
    <motion.div
      key="analytics"
      custom={direction}
      variants={slideVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 w-full"
    >
      <div className={`border p-6 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-cyan relative overflow-hidden group ${darkMode ? 'bg-cyan-950/40 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200 shadow-xl shadow-cyan-500/10'}`}>
        <div className={`absolute inset-0 pattern-dots opacity-[0.05] pointer-events-none ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
        <div className="relative z-10 space-y-6 pointer-events-auto">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-500/10 text-cyan-600'}`}>
              <PieChartIcon size={14} />
            </div>
            <h3 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>Top Keywords Triggered</h3>
          </div>
          
          <div className="h-64 w-full">
            {analyticsData.keywordData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={analyticsData.keywordData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {analyticsData.keywordData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: darkMode ? '#171717' : '#ffffff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: darkMode ? '#e5e5e5' : '#171717' }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full opacity-50 text-sm">No data available yet</div>
            )}
          </div>
        </div>
      </div>

      <div className={`border p-6 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-blue relative overflow-hidden group ${darkMode ? 'bg-blue-950/40 border-blue-500/30' : 'bg-blue-50 border-blue-200 shadow-xl shadow-blue-500/10'}`}>
        <div className={`absolute inset-0 pattern-grid opacity-[0.05] pointer-events-none ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        <div className="relative z-10 space-y-6 pointer-events-auto">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600'}`}>
              <BarChart3 size={14} />
            </div>
            <h3 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Most Active Topics</h3>
          </div>
          
          <div className="h-64 w-full">
            {analyticsData.topicData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.topicData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                  <YAxis tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                  <Tooltip 
                    cursor={{ fill: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ backgroundColor: darkMode ? '#171717' : '#ffffff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full opacity-50 text-sm">No data available yet</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(Analytics);
