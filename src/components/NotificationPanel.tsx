import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, User, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  logs: any[];
  darkMode: boolean;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, logs, darkMode }) => {
  const notificationLogs = logs.filter((l: any) => 
    l.message.toLowerCase().includes('photo') || 
    l.message.toLowerCase().includes('block')
  );
  
  // Extract unique senders (only for photo logs)
  const recentSenders = Array.from(new Set(notificationLogs.filter((l: any) => l.message.toLowerCase().includes('photo')).map((l: any) => {
    try {
      const details = l.details ? JSON.parse(l.details) : {};
      const topicId = details.topicId || l.message.match(/topic (\d+)/)?.[1];
      const topicName = l.message.replace('Photo received from ', '').replace('Photo auto-reply sent to ', '').split(':')[0];
      return JSON.stringify({ name: topicName, id: topicId });
    } catch (e) {
      return null;
    }
  }).filter(Boolean))).map(s => JSON.parse(s as string));

  const [activeSubTab, setActiveSubTab] = useState<'senders' | 'alerts'>('senders');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 right-0 bottom-0 w-80 z-[101] shadow-2xl flex flex-col ${darkMode ? 'bg-slate-950 border-l border-white/10' : 'bg-white border-l border-slate-200'}`}
          >
            <div className={`p-6 border-b flex items-center justify-between ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
              <div className="flex items-center space-x-2">
                <Bell className="text-blue-500" size={18} />
                <h2 className={`font-black text-sm uppercase tracking-widest ${darkMode ? 'text-white' : 'text-slate-900'}`}>Notifications</h2>
              </div>
              <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <X size={20} />
              </button>
            </div>

            <div className={`flex border-b ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
              <button 
                onClick={() => setActiveSubTab('senders')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition relative ${activeSubTab === 'senders' ? (darkMode ? 'text-blue-400' : 'text-blue-600') : (darkMode ? 'text-slate-500' : 'text-slate-400')}`}
              >
                Recent Senders
                {activeSubTab === 'senders' && <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
              </button>
              <button 
                onClick={() => setActiveSubTab('alerts')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition relative ${activeSubTab === 'alerts' ? (darkMode ? 'text-blue-400' : 'text-blue-600') : (darkMode ? 'text-slate-500' : 'text-slate-400')}`}
              >
                All Alerts
                {activeSubTab === 'alerts' && <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeSubTab === 'senders' ? (
                recentSenders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-50">
                    <User size={40} className="mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">No recent senders</p>
                  </div>
                ) : (
                  recentSenders.map((sender) => (
                    <div 
                      key={sender.id || sender.name} 
                      onClick={() => {
                        if (sender.id) {
                          window.open(`https://t.me/c/3672030592/${sender.id}`, '_blank', 'noopener,noreferrer');
                        } else {
                          toast.error("Topic ID not found");
                        }
                      }}
                      className={`p-4 rounded-2xl border transition flex items-center justify-between cursor-pointer group ${darkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-500/20 flex items-center justify-center border border-blue-500/30 group-hover:scale-105 transition-transform">
                          <img 
                            src={`https://picsum.photos/seed/${sender.id}/100`} 
                            alt={sender.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-xs font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{sender.name}</span>
                          <span className={`text-[9px] font-mono opacity-50 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Topic ID: {sender.id || 'Unknown'}</span>
                        </div>
                      </div>
                      <div className={`p-2 rounded-lg transition ${darkMode ? 'text-blue-400 group-hover:bg-blue-500/20' : 'text-blue-600 group-hover:bg-blue-500/10'}`}>
                        <ExternalLink size={16} />
                      </div>
                    </div>
                  ))
                )
              ) : (
                notificationLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-50">
                    <Bell size={40} className="mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">No notifications</p>
                  </div>
                ) : (
                  notificationLogs.slice(0, 50).map((log: any) => {
                    let topicId = null;
                    let topicName = null;
                    let topicLink = null;
                    try {
                      const details = log.details ? JSON.parse(log.details) : {};
                      topicId = details.topicId;
                      topicName = details.topicName || details.name;
                      topicLink = details.link;
                    } catch(e) {}

                    const isBlockLog = log.message.toLowerCase().includes('block');

                    return (
                      <div key={log._id || log.timestamp} className={`p-4 rounded-2xl border transition ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? (isBlockLog ? 'text-rose-400' : 'text-blue-400') : (isBlockLog ? 'text-rose-600' : 'text-blue-600')}`}>{log.type || (isBlockLog ? 'BLOCK' : 'PHOTO')}</span>
                          <span className="text-[8px] opacity-40 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{log.message}</p>
                        
                        {(topicName || topicLink) && isBlockLog && (
                          <div className="mt-2 pt-2 border-t border-white/5 flex flex-col gap-1">
                            {topicName && (
                              <p className={`text-[10px] font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Topic: <span className={darkMode ? 'text-slate-200' : 'text-slate-800'}>{topicName}</span>
                              </p>
                            )}
                            {topicLink && (
                              <a 
                                href={topicLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[9px] font-black uppercase tracking-widest text-blue-500 hover:underline inline-flex items-center gap-1"
                              >
                                View Topic <ExternalLink size={8} />
                              </a>
                            )}
                          </div>
                        )}

                        {topicId && !isBlockLog && (
                          <div className="mt-2 pt-2 border-t border-white/5 flex justify-end">
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(topicId);
                                toast.success(`Copied ID: ${topicId}`);
                              }}
                              className="text-[9px] font-black uppercase tracking-widest text-blue-500 hover:underline"
                            >
                              Copy Topic ID: {topicId}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )
              )}
            </div>
            
            <div className={`p-4 border-t ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
              <button 
                onClick={onClose}
                className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${darkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Close Panel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default memo(NotificationPanel);
