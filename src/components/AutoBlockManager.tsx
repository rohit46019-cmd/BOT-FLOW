import React, { memo } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, ChevronUp, ChevronDown, Plus, RefreshCw, CheckCircle2, Trash2, Link, Search, Trash } from 'lucide-react';

interface AutoBlockManagerProps {
  darkMode: boolean;
  autoBlockKeywordsExpanded: boolean;
  setAutoBlockKeywordsExpanded: (expanded: boolean) => void;
  addAutoBlockKeyword: () => void;
  handleUpdateAutoBlockKeywords: () => void;
  saving: boolean;
  autoBlockKeywords: any[];
  updateAutoBlockKeyword: (index: number, field: string, value: any) => void;
  removeAutoBlockKeyword: (index: number) => void;
  newBlockedTopicLink: string;
  setNewBlockedTopicLink: (link: string) => void;
  handleBlockTopic: () => void;
  blockingTopic: boolean;
  blockedTopics: any[];
  blockedTopicSearch: string;
  setBlockedTopicSearch: (search: string) => void;
  handleUnblockTopic: (id: string) => void;
}

const AutoBlockManager: React.FC<AutoBlockManagerProps> = ({
  darkMode,
  autoBlockKeywordsExpanded,
  setAutoBlockKeywordsExpanded,
  addAutoBlockKeyword,
  handleUpdateAutoBlockKeywords,
  saving,
  autoBlockKeywords,
  updateAutoBlockKeyword,
  removeAutoBlockKeyword,
  newBlockedTopicLink,
  setNewBlockedTopicLink,
  handleBlockTopic,
  blockingTopic,
  blockedTopics,
  blockedTopicSearch,
  setBlockedTopicSearch,
  handleUnblockTopic,
}) => {
  return (
    <div className="space-y-6">
      <div className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-rose relative overflow-hidden group ${darkMode ? 'bg-rose-950/40 border-rose-500/30' : 'bg-rose-50 border-rose-200 shadow-xl shadow-rose-500/10'}`}>
        <div className={`absolute inset-0 pattern-dots opacity-[0.05] pointer-events-none ${darkMode ? 'text-rose-400' : 'text-rose-600'}`} />
        <div className="relative z-10 space-y-4 pointer-events-auto">
          <div className="flex items-center justify-between">
            <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Block Topics (No Auto-Reply)</label>
            <ShieldAlert size={16} className="text-rose-500" />
          </div>
          
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                <Link size={14} />
              </div>
              <input
                type="text"
                value={newBlockedTopicLink}
                onChange={(e) => setNewBlockedTopicLink(e.target.value)}
                placeholder="Paste topic link here..."
                className={`w-full pl-9 p-3 border rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm transition ${darkMode ? 'bg-rose-500/5 border-rose-500/20 text-white placeholder-white/20' : 'bg-rose-50 border-rose-200 text-slate-900 placeholder-slate-400'}`}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBlockTopic}
              disabled={blockingTopic || !newBlockedTopicLink.trim()}
              className={`px-6 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors flex items-center space-x-2 ${blockingTopic || !newBlockedTopicLink.trim() ? 'opacity-50 cursor-not-allowed bg-slate-400' : 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20'}`}
            >
              {blockingTopic ? <RefreshCw size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
              <span>{blockedTopics.some(t => t.link === newBlockedTopicLink) ? 'Unblock' : 'Block'}</span>
            </motion.button>
          </div>

          {blockedTopics.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  <Search size={14} />
                </div>
                <input
                  type="text"
                  value={blockedTopicSearch}
                  onChange={(e) => setBlockedTopicSearch(e.target.value)}
                  placeholder="Search blocked topics..."
                  className={`w-full pl-9 p-2 border rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-[10px] transition ${darkMode ? 'bg-neutral-900/50 border-white/10 text-white placeholder-white/20' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'}`}
                />
              </div>

              <div className="space-y-2">
                <label className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Blocked Topics List</label>
                <div className="grid gap-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                  {blockedTopics.filter(t => 
                    t.name?.toLowerCase().includes(blockedTopicSearch.toLowerCase()) || 
                    t.telegram_topic_id.toString().includes(blockedTopicSearch) ||
                    t.link?.toLowerCase().includes(blockedTopicSearch.toLowerCase())
                  ).map((topic) => (
                    <div key={topic._id} className={`flex items-center justify-between p-3 rounded-xl border ${darkMode ? 'bg-neutral-900/50 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`p-2 rounded-lg ${darkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-500'}`}>
                          <ShieldAlert size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{topic.name && topic.name !== "Unknown Topic" ? topic.name : `Topic ID: ${topic.telegram_topic_id}`}</p>
                          <p className={`text-[9px] opacity-50 truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{topic.link}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnblockTopic(topic._id)}
                        className={`p-2 rounded-lg transition ${darkMode ? 'text-rose-400 hover:bg-rose-500/20' : 'text-rose-600 hover:bg-rose-50'}`}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-rose relative overflow-hidden group ${darkMode ? 'bg-rose-950/40 border-rose-500/30' : 'bg-rose-50 border-rose-200 shadow-xl shadow-rose-500/10'}`}>
        <div className={`absolute inset-0 pattern-dots opacity-[0.05] pointer-events-none ${darkMode ? 'text-rose-400' : 'text-rose-600'}`} />
        <div className="relative z-10 space-y-4 pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Auto-Block Keywords</label>
              <ShieldAlert size={16} className="text-rose-500" />
            </div>
            <button
              onClick={() => setAutoBlockKeywordsExpanded(!autoBlockKeywordsExpanded)}
              className={`p-2 rounded-xl transition ${darkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-black/5 text-slate-500'}`}
            >
              {autoBlockKeywordsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={addAutoBlockKeyword}
                  className={`py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors flex items-center justify-center space-x-2 shadow-lg ${darkMode ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/20'}`}
                >
                  <Plus size={14} />
                  <span>Add Keyword</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleUpdateAutoBlockKeywords}
                  disabled={saving}
                  className={`py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg ${saving ? 'opacity-50 cursor-not-allowed bg-slate-400' : 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20'}`}
                >
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Save Rules</span>
                </motion.button>
              </div>
            </div>

            {autoBlockKeywordsExpanded && (
                <div
                  className="space-y-4 overflow-hidden"
                >
                  <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>If these keywords are found in a topic, the bot will automatically block it.</p>
                  
                  <div className="space-y-3">
                    {autoBlockKeywords.map((item, index) => (
                      <div key={index} className={`p-4 rounded-2xl border space-y-3 ${darkMode ? 'bg-neutral-900/50 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <div className="flex items-center space-x-2 w-full">
                          <input
                            type="text"
                            value={item.keyword}
                            onChange={(e) => updateAutoBlockKeyword(index, 'keyword', e.target.value)}
                            placeholder="Keyword..."
                            className={`flex-1 min-w-0 p-2 border rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm transition ${darkMode ? 'bg-rose-500/5 border-rose-500/20 text-white placeholder-white/20' : 'bg-rose-50 border-rose-200 text-slate-900 placeholder-slate-400'}`}
                          />
                          <button
                            onClick={() => removeAutoBlockKeyword(index)}
                            className={`flex-shrink-0 p-2.5 rounded-xl transition ${darkMode ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'}`}
                            title="Delete Keyword"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Match:</span>
                          <div className="flex bg-slate-100 dark:bg-neutral-900 rounded-lg p-1">
                            <button
                              onClick={() => updateAutoBlockKeyword(index, 'matchMode', 'exact')}
                              className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition ${item.matchMode === 'exact' ? (darkMode ? 'bg-rose-500 text-white' : 'bg-white shadow-sm text-slate-900') : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}
                            >
                              Exact
                            </button>
                            <button
                              onClick={() => updateAutoBlockKeyword(index, 'matchMode', 'partial')}
                              className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition ${item.matchMode === 'partial' ? (darkMode ? 'bg-rose-500 text-white' : 'bg-white shadow-sm text-slate-900') : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}
                            >
                              Partial
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(AutoBlockManager);
