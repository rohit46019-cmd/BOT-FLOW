import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, RefreshCw, Hash, FileText, Settings, Trash2 } from 'lucide-react';
import AddKeywordSection from './AddKeywordSection';

interface KeywordsManagerProps {
  darkMode: boolean;
  keywords: any[];
  keywordSearch: string;
  setKeywordSearch: (val: string) => void;
  isSearchFocused: boolean;
  setIsSearchFocused: (val: boolean) => void;
  isAddingNewRule: boolean;
  setIsAddingNewRule: (val: boolean) => void;
  editingKeywordId: string | null;
  handleAddKeyword: (data: any) => void;
  cancelEdit: () => void;
  displayedKeywords: any[];
  handleEditKeyword: (kw: any) => void;
  handleDeleteKeyword: (id: string) => void;
  filteredKeywords: any[];
  visibleKeywordsCount: number;
  handleKeywordsScroll: (e: any) => void;
  keywordsTopRef: any;
  direction: number;
  slideVariants: any;
}

const KeywordsManager: React.FC<KeywordsManagerProps> = ({
  darkMode,
  keywords,
  keywordSearch,
  setKeywordSearch,
  isSearchFocused,
  setIsSearchFocused,
  isAddingNewRule,
  setIsAddingNewRule,
  editingKeywordId,
  handleAddKeyword,
  cancelEdit,
  displayedKeywords,
  handleEditKeyword,
  handleDeleteKeyword,
  filteredKeywords,
  visibleKeywordsCount,
  handleKeywordsScroll,
  keywordsTopRef,
  direction,
  slideVariants,
}) => {
  return (
    <motion.div
      key="keywords"
      custom={direction}
      variants={slideVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 w-full"
    >
      {keywords.length > 0 && (
        <div className="space-y-2">
          <motion.div 
            initial={false}
            animate={{ 
              scale: isSearchFocused ? 1.02 : 1,
              boxShadow: isSearchFocused ? (darkMode ? "0 0 20px rgba(59, 130, 246, 0.2)" : "0 10px 25px -5px rgba(59, 130, 246, 0.1)") : "none"
            }}
            className="relative group"
          >
            <div className="relative h-14">
              <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${isSearchFocused ? 'text-blue-500' : (darkMode ? 'text-slate-500' : 'text-slate-400')}`}>
                <Search size={18} className={`${isSearchFocused ? 'scale-110' : 'scale-100'} transition-transform duration-300`} />
              </div>
              <input
                type="text"
                value={keywordSearch}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onChange={(e) => setKeywordSearch(e.target.value)}
                placeholder="Search keywords or replies..."
                className={`w-full h-full pl-11 pr-12 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition duration-300 ${darkMode ? 'bg-neutral-900/50 border-white/10 text-white placeholder-white/20' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'}`}
              />
              <AnimatePresence>
                {keywordSearch && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setKeywordSearch("")}
                    className={`absolute inset-y-0 right-0 pr-4 flex items-center ${darkMode ? 'text-slate-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'}`}
                  >
                    <X size={18} className="hover:rotate-90 transition-transform duration-300" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add/Edit Rule Form */}
      <button
        ref={keywordsTopRef}
        onClick={() => setIsAddingNewRule(!isAddingNewRule)}
        className={`w-full p-4 rounded-2xl font-black uppercase tracking-widest text-sm transition ${
          darkMode 
            ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' 
            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
        }`}
      >
        {isAddingNewRule || editingKeywordId ? 'Hide Form' : 'Create New Rule'}
      </button>
      <AnimatePresence>
        {(isAddingNewRule || editingKeywordId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <AddKeywordSection 
              editingKeyword={editingKeywordId ? keywords.find(k => k._id === editingKeywordId) : null}
              onSave={(data: any) => {
                handleAddKeyword(data);
                setIsAddingNewRule(false);
              }}
              onCancel={() => {
                cancelEdit();
                setIsAddingNewRule(false);
              }}
              darkMode={darkMode}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {keywords.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar" onScroll={handleKeywordsScroll}>
            {displayedKeywords.map((kw, index) => {
              const colorName = ['emerald', 'blue', 'rose', 'amber', 'purple', 'indigo'][index % 6];
              
              const editButtonClasses = [
                { dark: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30', light: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
                { dark: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30', light: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
                { dark: 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30', light: 'bg-rose-50 text-rose-600 hover:bg-rose-100' },
                { dark: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30', light: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
                { dark: 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30', light: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
                { dark: 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30', light: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' },
              ][index % 6];

              return (
                <motion.div 
                  layout
                  key={kw._id}
                  whileHover={{ scale: 1.01, y: -2 }}
                  className={`p-3 rounded-none border transition duration-500 flex items-start justify-between relative overflow-hidden h-16 ${
                    darkMode 
                      ? `bg-neutral-900/40 border-white/5 hover:border-${colorName}-500/30` 
                      : `bg-white border-slate-100 shadow-sm hover:shadow-xl hover:border-${colorName}-200`
                  }`}
                >
                  <div className={`absolute inset-0 pattern-dots opacity-[0.03] text-${colorName}-500`} />
                  <div className="relative z-10 flex items-start flex-1 min-w-0 gap-2 h-full">
                    <span className={`flex-shrink-0 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-none ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                      #{index + 1}
                    </span>
                    <div className="flex flex-wrap gap-1 overflow-hidden">
                      {(kw.keywords && kw.keywords.length > 0 ? kw.keywords : [kw.keyword]).map((k: string, i: number) => (
                        <span key={i} className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-none truncate max-w-full ${darkMode ? `bg-${colorName}-500/10 text-${colorName}-400` : `bg-${colorName}-500/5 text-${colorName}-600`}`}>
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-1 ml-2 relative z-10 flex-shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEditKeyword(kw); }}
                      className={`p-2 rounded-none transition ${darkMode ? editButtonClasses.dark : editButtonClasses.light}`}
                    >
                      <Settings size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteKeyword(kw._id); }}
                      className={`p-2 rounded-none transition ${darkMode ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {filteredKeywords.length === 0 && keywordSearch && (
              <div className={`text-center py-12 rounded-[2rem] border border-dashed ${darkMode ? 'border-white/10 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                <Search size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No keywords found matching "{keywordSearch}"</p>
              </div>
            )}

            {visibleKeywordsCount < filteredKeywords.length && (
              <div className="py-4 text-center">
                <RefreshCw className="animate-spin mx-auto text-blue-500" size={24} />
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default memo(KeywordsManager);
