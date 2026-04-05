import React, { memo } from 'react';
import { motion } from 'motion/react';
import { Library, Plus, Link, Trash } from 'lucide-react';

interface MediaManagerProps {
  darkMode: boolean;
  newMediaName: string;
  setNewMediaName: (name: string) => void;
  newMediaUrl: string;
  setNewMediaUrl: (url: string) => void;
  handleAddMedia: () => void;
  mediaItems: any[];
  handleDeleteMedia: (id: string) => void;
  showNotification: (type: 'success' | 'error', message: string) => void;
  direction: number;
  slideVariants: any;
}

const MediaManager: React.FC<MediaManagerProps> = ({
  darkMode,
  newMediaName,
  setNewMediaName,
  newMediaUrl,
  setNewMediaUrl,
  handleAddMedia,
  mediaItems,
  handleDeleteMedia,
  showNotification,
  direction,
  slideVariants,
}) => {
  return (
    <motion.div
      key="media"
      custom={direction}
      variants={slideVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 w-full"
    >
      <div className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-indigo relative overflow-hidden group ${darkMode ? 'bg-indigo-950/40 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200 shadow-xl shadow-indigo-500/10'}`}>
        <div className={`absolute inset-0 pattern-dots opacity-[0.05] pointer-events-none ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
        <div className="relative z-10 space-y-6 pointer-events-auto">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-500/10 text-indigo-600'}`}>
              <Library size={14} />
            </div>
            <h3 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Media Library</h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Media Name</label>
                <input
                  type="text"
                  value={newMediaName}
                  onChange={(e) => setNewMediaName(e.target.value)}
                  placeholder="e.g. Banner"
                  className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition ${darkMode ? 'bg-indigo-500/5 border-indigo-500/20 text-white placeholder-white/20' : 'bg-indigo-50 border-indigo-200 text-slate-900 placeholder-slate-400'}`}
                />
              </div>
              <div className="space-y-1">
                <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Media URL</label>
                <input
                  type="text"
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  placeholder="https://..."
                  className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition ${darkMode ? 'bg-indigo-500/5 border-indigo-500/20 text-white placeholder-white/20' : 'bg-indigo-50 border-indigo-200 text-slate-900 placeholder-slate-400'}`}
                />
              </div>
            </div>
            
            <button
              onClick={handleAddMedia}
              disabled={!newMediaUrl.trim() || !newMediaName.trim()}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition flex items-center justify-center space-x-2 shadow-lg ${
                !newMediaUrl.trim() || !newMediaName.trim()
                  ? (darkMode ? 'bg-neutral-800 text-neutral-500' : 'bg-slate-200 text-slate-400') 
                  : 'bg-indigo-500 text-white shadow-indigo-500/20 hover:bg-indigo-600'
              }`}
            >
              <Plus size={16} />
              <span>Add to Library</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-6">
            {mediaItems.length === 0 ? (
              <div className="text-center py-12 opacity-40 italic text-sm">No media in library yet.</div>
            ) : (
              mediaItems.map(item => (
                <div key={item._id} className={`group relative rounded-3xl overflow-hidden border transition ${darkMode ? 'bg-black/40 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                  <div className="aspect-video w-full overflow-hidden">
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                  </div>
                  <div className={`p-4 flex items-center justify-between ${darkMode ? 'bg-neutral-900/80' : 'bg-white/90'} backdrop-blur-md`}>
                    <div>
                      <h4 className={`text-xs font-black uppercase tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.name}</h4>
                      <p className="text-[9px] text-slate-500 font-mono truncate max-w-[150px]">{item.url}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(item.url);
                          showNotification('success', 'URL copied to clipboard');
                        }}
                        className={`p-2 rounded-xl transition ${darkMode ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-black/5 text-slate-500 hover:text-black'}`}
                        title="Copy URL"
                      >
                        <Link size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteMedia(item._id)}
                        className={`p-2 rounded-xl transition ${darkMode ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                        title="Delete"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(MediaManager);
