import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, RefreshCw, Hash, FileText, Settings, Trash2, Filter, Plus, Zap, Users, Copy, Check } from 'lucide-react';
import AddKeywordSection from './AddKeywordSection';

interface KeywordsManagerProps {
  darkMode: boolean;
  keywords: any[];
  keywordSearch: string;
  setKeywordSearch: (val: string) => void;
  keywordFilter: 'all' | 'active' | 'inactive' | 'forward' | 'message' | 'highest' | 'lowest';
  setKeywordFilter: (val: 'all' | 'active' | 'inactive' | 'forward' | 'message' | 'highest' | 'lowest') => void;
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
  handleToggleKeyword: (id: string, enabled: boolean) => void;
  handleToggleApprovalMode?: (id: string, approval_mode: boolean) => void;
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
  keywordFilter,
  setKeywordFilter,
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
  handleToggleKeyword,
  handleToggleApprovalMode,
  filteredKeywords,
  visibleKeywordsCount,
  handleKeywordsScroll,
  keywordsTopRef,
  direction,
  slideVariants,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
            <div className="relative h-14 flex gap-2">
              <div className={`flex-1 relative`}>
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${isSearchFocused ? 'text-blue-500' : (darkMode ? 'text-slate-500' : 'text-slate-400')}`}>
                  <Search size={18} className={`${isSearchFocused ? 'scale-110' : 'scale-100'} transition-transform duration-300`} />
                </div>
                <input
                  type="text"
                  value={keywordSearch}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  onChange={(e) => setKeywordSearch(e.target.value)}
                  placeholder="Search keywords..."
                  className={`w-full h-full pl-11 pr-10 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition duration-300 ${darkMode ? 'bg-neutral-900/50 border-white/10 text-white placeholder-white/20' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'}`}
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
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`w-14 h-14 flex items-center justify-center rounded-2xl border transition ${darkMode ? 'bg-neutral-900/50 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm'}`}
              >
                <Filter size={20} />
              </button>
            </div>
            
            {showFilters && (
              <div className={`mt-2 p-2 rounded-2xl border flex flex-wrap gap-2 ${darkMode ? 'bg-neutral-900 border-white/10' : 'bg-white border-slate-200'}`}>
                {(['all', 'active', 'inactive', 'forward', 'message', 'highest', 'lowest'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setKeywordFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${keywordFilter === f ? (darkMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white') : (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Add/Edit Rule Form */}
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

              const targetGroupsCount = kw.target_groups?.length || 0;
              const isApproval = !!kw.approval_mode;

              return (
                <motion.div 
                  layout
                  key={kw._id}
                  whileHover={{ scale: 1.01, y: -1 }}
                  className={`p-3 rounded-xl border transition duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden ${
                    darkMode 
                      ? `bg-neutral-900/60 border-white/10 hover:border-${colorName}-500/40` 
                      : `bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-${colorName}-300`
                  }`}
                >
                  <div className={`absolute inset-0 pattern-dots opacity-[0.03] text-${colorName}-500 pointer-events-none`} />
                  
                  <div className="relative z-10 flex items-center flex-1 min-w-0 gap-3">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                        #{index + 1}
                      </span>
                      <button
                        title={kw.enabled !== false ? "Click to Disable Rule" : "Click to Enable Rule"}
                        onClick={(e) => { e.stopPropagation(); handleToggleKeyword(kw._id, kw.enabled === false); }}
                        className={`w-8 h-4 rounded-full transition-colors relative ${kw.enabled !== false ? 'bg-emerald-500' : 'bg-slate-500'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${kw.enabled !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap gap-1 items-center">
                        {(kw.keywords && kw.keywords.length > 0 ? kw.keywords : [kw.keyword]).map((k: string, i: number) => (
                          <span key={i} className={`text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-md truncate max-w-full ${darkMode ? `bg-${colorName}-500/20 text-${colorName}-300 border border-${colorName}-500/30` : `bg-${colorName}-50 text-${colorName}-700 border border-${colorName}-200`}`}>
                            #{k}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium text-slate-400">
                        {/* Target Groups Badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                          targetGroupsCount > 0 
                            ? (darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700')
                            : (darkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600')
                        }`}>
                          <Users size={11} />
                          {targetGroupsCount > 0 ? `${targetGroupsCount} Group(s)` : 'All Groups'}
                        </span>

                        {kw.reply && (
                          <span className="truncate max-w-[200px] text-slate-400 italic">
                            "{kw.reply}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 relative z-10 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10">
                    {/* Quick Approval Mode Toggle Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (handleToggleApprovalMode) {
                          handleToggleApprovalMode(kw._id, !isApproval);
                        }
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                        isApproval
                          ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 font-black'
                          : (darkMode ? 'bg-white/5 text-slate-400 hover:bg-amber-500/20 hover:text-amber-400' : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700')
                      }`}
                      title={isApproval ? "Approval Mode is ON (Click to disable)" : "Approval Mode is OFF (Click to enable)"}
                    >
                      <Zap size={13} className={isApproval ? 'fill-current animate-pulse' : ''} />
                      <span>{isApproval ? 'Approval ON' : 'Approval OFF'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {targetGroupsCount > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(kw.target_groups.join(', '));
                            setCopiedId(kw._id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className={`p-1.5 rounded-lg transition ${
                            copiedId === kw._id 
                              ? (darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                              : (darkMode ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-50 text-blue-600 hover:bg-blue-100')
                          }`}
                          title="Copy Target Groups"
                        >
                          {copiedId === kw._id ? <Check size={15} /> : <Copy size={15} />}
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEditKeyword(kw); }}
                        className={`p-1.5 rounded-lg transition ${darkMode ? editButtonClasses.dark : editButtonClasses.light}`}
                        title="Edit Rule Settings & Groups"
                      >
                        <Settings size={15} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteKeyword(kw._id); }}
                        className={`p-1.5 rounded-lg transition ${darkMode ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                        title="Delete Rule"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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

      {/* Floating Add Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsAddingNewRule(!isAddingNewRule)}
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-40 p-4 rounded-full shadow-2xl transition ${
          darkMode 
            ? 'bg-blue-600 text-white shadow-blue-900/50' 
            : 'bg-blue-500 text-white shadow-blue-500/30'
        }`}
      >
        <Plus size={24} />
      </motion.button>
    </motion.div>
  );
};

export default memo(KeywordsManager);
