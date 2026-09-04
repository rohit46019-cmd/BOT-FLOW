import React, { memo, useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  X, 
  RefreshCw, 
  Hash, 
  Settings, 
  Trash2, 
  Filter, 
  Plus, 
  Zap, 
  Users, 
  Copy, 
  CopyPlus,
  Check, 
  Bell, 
  Sparkles, 
  Link, 
  MessageSquare,
  Sliders,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  RotateCcw,
  Edit3,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal
} from 'lucide-react';
import AddKeywordSection from './AddKeywordSection';

export type KeywordFilterType = 'all' | 'active' | 'inactive' | 'approval' | 'notify' | 'forward' | 'message' | 'highest' | 'lowest';

interface KeywordsManagerProps {
  darkMode: boolean;
  keywords: any[];
  keywordSearch: string;
  setKeywordSearch: (val: string) => void;
  keywordFilter: KeywordFilterType;
  setKeywordFilter: (val: KeywordFilterType) => void;
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
  handleToggleNotifyOnHit?: (id: string, notify_on_hit: boolean) => void;
  handleDuplicateKeyword?: (kw: any) => void;
  fetchKeywords?: () => void;
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
  handleToggleNotifyOnHit,
  handleDuplicateKeyword,
  fetchKeywords,
  filteredKeywords,
  visibleKeywordsCount,
  handleKeywordsScroll,
  keywordsTopRef,
  direction,
  slideVariants,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedKeywordsId, setCopiedKeywordsId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [availableGroupsMap, setAvailableGroupsMap] = useState<Record<string, string>>({});
  const [expandedAdvanceIds, setExpandedAdvanceIds] = useState<Record<string, boolean>>({});
  const [expandedKeywordsIds, setExpandedKeywordsIds] = useState<Record<string, boolean>>({});

  const toggleAdvance = (id: string) => {
    setExpandedAdvanceIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleKeywordsExpand = (id: string) => {
    setExpandedKeywordsIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    fetch("/api/groups")
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.groups)) {
          const map: Record<string, string> = {};
          data.groups.forEach((g: any) => {
            if (g.id) map[g.id] = g.title || g.id;
          });
          setAvailableGroupsMap(map);
        }
      })
      .catch(() => {});
  }, []);

  // Statistics for counts and filter badges
  const counts = useMemo(() => {
    const total = keywords.length;
    const active = keywords.filter(k => k.enabled !== false).length;
    const inactive = total - active;
    const notify = keywords.filter(k => !!k.notify_on_hit).length;
    const approval = keywords.filter(k => !!k.approval_mode).length;
    const forward = keywords.filter(k => k.message_link || (k.message_links && k.message_links.length > 0)).length;
    const message = keywords.filter(k => !!k.reply).length;
    return { total, active, inactive, notify, approval, forward, message };
  }, [keywords]);

  // Filter option items configuration
  const filterOptions: { id: KeywordFilterType; label: string; icon: any; count?: number; color: string }[] = [
    { id: 'all', label: 'All Rules', icon: Sliders, count: counts.total, color: 'blue' },
    { id: 'notify', label: 'Notify ON', icon: Bell, count: counts.notify, color: 'emerald' },
    { id: 'approval', label: 'Approval Mode', icon: Zap, count: counts.approval, color: 'amber' },
    { id: 'active', label: 'Active', icon: CheckCircle2, count: counts.active, color: 'emerald' },
    { id: 'inactive', label: 'Inactive', icon: XCircle, count: counts.inactive, color: 'rose' },
    { id: 'forward', label: 'Telegram Link', icon: Link, count: counts.forward, color: 'indigo' },
    { id: 'message', label: 'Reply Text', icon: MessageSquare, count: counts.message, color: 'sky' },
    { id: 'highest', label: 'Most Keywords', icon: ArrowUpDown, color: 'purple' },
    { id: 'lowest', label: 'Least Keywords', icon: ArrowUpDown, color: 'purple' },
  ];

  const activeFilterMeta = filterOptions.find(f => f.id === keywordFilter);

  return (
    <motion.div
      key="keywords"
      custom={direction}
      variants={slideVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-4 w-full pb-20"
    >
      <div ref={keywordsTopRef} />

      {/* TOP FIXED CONTROLS: Search Bar & Filter Button */}
      <div className="w-full space-y-1.5">
        <div className="flex items-center gap-2 w-full">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search 
              size={16} 
              className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                isSearchFocused 
                  ? 'text-blue-500' 
                  : (darkMode ? 'text-slate-400' : 'text-slate-400')
              }`} 
            />
            <input
              type="text"
              value={keywordSearch}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              onChange={(e) => setKeywordSearch(e.target.value)}
              placeholder="Search keywords or rules..."
              className={`w-full h-9 pl-9 pr-8 rounded-xl border text-xs font-medium outline-none transition-all ${
                darkMode 
                  ? 'bg-neutral-900/90 border-white/10 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs'
              }`}
            />
            {keywordSearch && (
              <button 
                type="button"
                onClick={() => setKeywordSearch("")}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md transition-colors ${
                  darkMode ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Side Filter Button */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-9 px-3 flex items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold transition-all flex-shrink-0 active:scale-95 ${
              keywordFilter !== 'all'
                ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                : showFilters
                  ? (darkMode ? 'bg-white/15 border-white/20 text-white' : 'bg-slate-100 border-slate-300 text-slate-900')
                  : (darkMode ? 'bg-neutral-900/90 border-white/10 text-slate-300 hover:bg-neutral-800 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs')
            }`}
            title="Filter keywords"
          >
            <Filter size={15} className={keywordFilter !== 'all' ? 'fill-current' : ''} />
            <span className="hidden xs:inline">
              {activeFilterMeta && keywordFilter !== 'all' ? activeFilterMeta.label : 'Filter'}
            </span>
            {keywordFilter !== 'all' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </button>
        </div>

        {/* Filter Dropdown Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 4 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className={`overflow-hidden p-2.5 rounded-xl border transition ${
                darkMode ? 'bg-neutral-900/95 border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                  darkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  <Filter size={12} /> Filter Rules
                </span>
                {keywordFilter !== 'all' && (
                  <button
                    onClick={() => setKeywordFilter('all')}
                    className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
                  >
                    <RotateCcw size={11} /> Reset Filter
                  </button>
                )}
              </div>

              {/* Grid of Micro Filter Buttons */}
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1">
                {filterOptions.map(option => {
                  const Icon = option.icon;
                  const isSelected = keywordFilter === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => setKeywordFilter(option.id)}
                      className={`p-1.5 rounded-lg border text-left flex items-center justify-between gap-1.5 transition ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                          : (darkMode 
                              ? 'bg-white/[0.04] border-white/5 text-slate-300 hover:bg-white/10' 
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100')
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Icon size={12} className={
                          isSelected 
                            ? 'text-white' 
                            : option.id === 'notify' ? 'text-emerald-400' : option.id === 'approval' ? 'text-amber-400' : 'text-slate-400'
                        } />
                        <span className="text-[11px] font-medium leading-tight truncate">
                          {option.label}
                        </span>
                      </div>
                      {option.count !== undefined && (
                        <span className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded ${
                          isSelected 
                            ? 'bg-white/20 text-white' 
                            : (darkMode ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-600')
                        }`}>
                          {option.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filter Indicator Banner if filter active and panel closed */}
        {keywordFilter !== 'all' && !showFilters && (
          <div className={`px-2.5 py-1 rounded-lg border flex items-center justify-between text-xs transition ${
            darkMode ? 'bg-blue-950/40 border-blue-800/40 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <div className="flex items-center gap-1.5">
              <Filter size={12} />
              <span className="text-[11px]">Filter: <strong>{activeFilterMeta?.label}</strong> ({filteredKeywords.length})</span>
            </div>
            <button
              onClick={() => setKeywordFilter('all')}
              className="font-bold underline hover:opacity-80 transition text-[11px]"
            >
              Clear
            </button>
          </div>
        )}

        {/* Rules Section Header & Actions */}
        <div className="flex items-center justify-between px-0.5 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Rules
            </span>
            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
              darkMode ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-700'
            }`}>
              {filteredKeywords.length} of {counts.total}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {fetchKeywords && (
              <button
                onClick={() => {
                  setIsSyncing(true);
                  fetchKeywords();
                  setTimeout(() => setIsSyncing(false), 800);
                }}
                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition active:scale-95 ${
                  isSyncing 
                    ? 'bg-emerald-600 border-emerald-600 text-white' 
                    : (darkMode ? 'bg-white/5 border-white/10 text-emerald-400 hover:bg-white/10' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100')
                }`}
                title="Sync rules"
              >
                <Sparkles size={12} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? "Syncing" : "Sync"}</span>
              </button>
            )}

            <button
              onClick={() => setIsAddingNewRule(!isAddingNewRule)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center gap-1 shadow-xs active:scale-95"
            >
              <Plus size={13} />
              <span>{isAddingNewRule ? "Close" : "New Rule"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Rule Form Section (Full Screen Modal) */}
      <AnimatePresence>
        {(isAddingNewRule || editingKeywordId) && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`fixed inset-0 z-[200] flex flex-col pt-12 pb-4 px-4 overflow-y-auto backdrop-blur-xl ${
              darkMode ? 'bg-neutral-950/95' : 'bg-slate-50/95'
            }`}
          >
            <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col">
              <div className="flex items-center justify-between mb-4 mt-8 px-2 shrink-0">
                <h2 className={`text-xl font-black uppercase tracking-tight flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {editingKeywordId ? <><Edit3 size={20} className="text-amber-500" /> Edit Rule</> : <><Plus size={20} className="text-emerald-500" /> Create New Rule</>}
                </h2>
                <button
                  onClick={() => {
                    cancelEdit();
                    setIsAddingNewRule(false);
                  }}
                  className={`p-2 rounded-full transition-colors active:scale-90 ${
                    darkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
              <div className={`p-1 rounded-2xl flex-1 min-h-0 overflow-y-auto pb-24 ${darkMode ? 'bg-neutral-900 border border-white/10 shadow-2xl' : 'bg-white border border-slate-200 shadow-xl'}`}>
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
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RULES LIST: Compact, Responsive, Smooth */}
      {keywords.length > 0 ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {displayedKeywords.map((kw, index) => {
              const colorName = ['blue', 'emerald', 'indigo', 'amber', 'purple', 'rose'][index % 6];
              const isEnabled = kw.enabled !== false;
              const isApproval = !!kw.approval_mode;
              const isNotify = !!kw.notify_on_hit;
              const isAi = !!kw.ai_reply_enabled;
              const hasLinks = (kw.message_links && kw.message_links.length > 0) || !!kw.message_link;
              const targetGroupsCount = kw.target_groups?.length || 0;
              const keywordsList = kw.keywords && kw.keywords.length > 0 ? kw.keywords : (kw.keyword ? [kw.keyword] : []);

              return (
                <motion.div 
                  layout
                  key={kw._id}
                  className={`p-2.5 rounded-xl border transition-all duration-200 relative overflow-hidden group shadow-sm hover:shadow-md ${
                    darkMode 
                      ? `${isEnabled ? 'bg-neutral-900/95' : 'bg-neutral-900/40 opacity-65'} border-white/10 hover:border-blue-500/40 shadow-black/40` 
                      : `${isEnabled ? 'bg-white' : 'bg-slate-50 opacity-65'} border-slate-200/90 hover:border-blue-300 shadow-slate-200/60`
                  }`}
                >
                  {/* Top accent line */}
                  <div className={`absolute top-0 left-0 right-0 h-0.5 ${
                    isEnabled 
                      ? (isNotify ? 'bg-emerald-500' : isApproval ? 'bg-amber-500' : 'bg-blue-500') 
                      : 'bg-slate-500'
                  }`} />

                  <div className="flex flex-col gap-1.5">
                    {/* Header Row: Index, Match Mode, Status Tags, Groups */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1 min-w-0">
                        {/* Index Badge */}
                        <span className={`text-[9.5px] font-mono font-extrabold uppercase px-1.5 py-0.2 rounded ${
                          darkMode ? 'bg-white/10 text-white' : 'bg-slate-900 text-white'
                        }`}>
                          #{String(index + 1).padStart(2, '0')}
                        </span>

                        {/* Match Mode Pill */}
                        <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.2 rounded border ${
                          kw.match_mode === 'partial'
                            ? (darkMode ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-700')
                            : (darkMode ? 'bg-slate-800 border-white/5 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500')
                        }`}>
                          {kw.match_mode === 'partial' ? 'PARTIAL' : 'EXACT'}
                        </span>

                        {/* AI Badge */}
                        {isAi && (
                          <span className={`inline-flex items-center gap-0.5 text-[8.5px] font-bold uppercase px-1 py-0.2 rounded ${
                            darkMode ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            <Sparkles size={8} /> AI
                          </span>
                        )}

                        {/* Forward Pill */}
                        {hasLinks && (
                          <span className={`inline-flex items-center gap-0.5 text-[8.5px] font-bold px-1 py-0.2 rounded ${
                            darkMode ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`} title="Telegram Message Forward Attached">
                            <Link size={8} /> Fwd
                          </span>
                        )}

                        {/* Status Pills */}
                        {isNotify && (
                          <span className={`inline-flex items-center gap-0.5 text-[8.5px] font-bold px-1 py-0.2 rounded ${
                            darkMode ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            <Bell size={8} className="fill-current" />
                          </span>
                        )}

                        {isApproval && (
                          <span className={`inline-flex items-center gap-0.5 text-[8.5px] font-bold px-1 py-0.2 rounded ${
                            darkMode ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            <Zap size={8} className="fill-current" />
                          </span>
                        )}
                      </div>

                      {/* Right: Target Groups Summary */}
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold border shrink-0 ${
                        targetGroupsCount > 0 
                          ? (darkMode ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-200')
                          : (darkMode ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                      }`}>
                        <Users size={9} />
                        <span>{targetGroupsCount > 0 ? `${targetGroupsCount} Grps` : 'All'}</span>
                      </span>
                    </div>

                    {/* Compact Keywords Box: ONLY 2 lines max of keywords, no reply/link preview */}
                    <div className={`p-1.5 rounded-lg border transition-all relative ${
                      darkMode 
                        ? 'bg-black/30 border-white/5' 
                        : 'bg-slate-50 border-slate-200/70'
                    }`}>
                      <div 
                        className={`flex flex-wrap items-center gap-1 transition-all duration-200 max-h-[38px] overflow-hidden`}
                      >
                        {keywordsList.map((k: string, i: number) => (
                          <span 
                            key={i} 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(k);
                              setCopiedKeywordsId(`${kw._id}-${i}`);
                              setTimeout(() => setCopiedKeywordsId(null), 1500);
                            }}
                            className={`inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border cursor-pointer hover:scale-105 active:scale-95 transition ${
                              darkMode 
                                ? `bg-${colorName}-500/15 text-${colorName}-300 border-${colorName}-500/30 hover:border-${colorName}-500/60` 
                                : `bg-${colorName}-50 text-${colorName}-700 border-${colorName}-200 hover:border-${colorName}-300`
                            }`}
                            title="Click to copy keyword"
                          >
                            <Hash size={8} className="opacity-70 shrink-0" />
                            <span className="truncate max-w-[110px]">{k}</span>
                            {copiedKeywordsId === `${kw._id}-${i}` ? <Check size={8} className="text-emerald-400 shrink-0" /> : null}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Compact Action Buttons Row */}
                    <div className={`pt-1 border-t flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap w-full ${
                      darkMode ? 'border-white/5' : 'border-slate-100'
                    }`}>
                      {/* 1. Active Toggle */}
                      <button
                        type="button"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleToggleKeyword(kw._id, isEnabled === false); 
                        }}
                        className={`h-6 px-2 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border active:scale-95 shrink-0 ${
                          isEnabled
                            ? (darkMode ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100')
                            : (darkMode ? 'bg-neutral-800 text-slate-400 border-white/5 hover:bg-neutral-700' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200')
                        }`}
                        title={isEnabled ? "Active (Click to Turn Off)" : "Disabled (Click to Turn On)"}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                        <span>{isEnabled ? 'Active' : 'Off'}</span>
                      </button>

                      {/* 2. Notify Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (handleToggleNotifyOnHit) {
                            handleToggleNotifyOnHit(kw._id, !isNotify);
                          }
                        }}
                        className={`h-6 px-2 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border active:scale-95 shrink-0 ${
                          isNotify
                            ? (darkMode ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100')
                            : (darkMode ? 'bg-neutral-800 text-slate-400 border-white/5 hover:bg-neutral-700' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200')
                        }`}
                        title="Toggle Notify on Hit"
                      >
                        <Bell size={10} className={isNotify ? 'fill-current text-blue-400' : 'text-slate-400'} />
                        <span>Notify: {isNotify ? 'ON' : 'OFF'}</span>
                      </button>

                      {/* 3. Approval Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (handleToggleApprovalMode) {
                            handleToggleApprovalMode(kw._id, !isApproval);
                          }
                        }}
                        className={`h-6 px-2 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border active:scale-95 shrink-0 ${
                          isApproval
                            ? (darkMode ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30' : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100')
                            : (darkMode ? 'bg-neutral-800 text-slate-400 border-white/5 hover:bg-neutral-700' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200')
                        }`}
                        title="Toggle Approval Mode"
                      >
                        <Zap size={10} className={isApproval ? 'fill-current text-amber-400' : 'text-slate-400'} />
                        <span>Approval: {isApproval ? 'ON' : 'OFF'}</span>
                      </button>

                      {/* 4. Edit Button */}
                      <button 
                        type="button"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleEditKeyword(kw); 
                        }}
                        className={`h-6 px-2 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border active:scale-95 shrink-0 ${
                          darkMode 
                            ? 'bg-neutral-800 hover:bg-neutral-700 text-slate-200 border-white/10' 
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                        title="Edit this rule"
                      >
                        <Edit3 size={10} className="text-blue-400" />
                        <span>Edit</span>
                      </button>

                      {/* 5. Advance Toggle */}
                      <button 
                        type="button"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          toggleAdvance(kw._id); 
                        }}
                        className={`h-6 px-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-0.5 border active:scale-95 shrink-0 ${
                          expandedAdvanceIds[kw._id]
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : (darkMode ? 'bg-neutral-800 hover:bg-neutral-700 text-slate-300 border-white/10' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200')
                        }`}
                        title="More options"
                      >
                        <SlidersHorizontal size={10} className={expandedAdvanceIds[kw._id] ? 'text-white' : 'text-indigo-400'} />
                        <span>More</span>
                        {expandedAdvanceIds[kw._id] ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                      </button>

                      {/* 6. Delete Button */}
                      <button 
                        type="button"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleDeleteKeyword(kw._id); 
                        }}
                        className={`h-6 px-1.5 rounded-lg transition flex items-center gap-0.5 border active:scale-95 shrink-0 ${
                          darkMode 
                            ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/20' 
                            : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200'
                        }`}
                        title="Delete this rule"
                      >
                        <Trash2 size={10} />
                        <span className="text-[10px] font-bold">Del</span>
                      </button>
                    </div>

                    {/* Advance Expandable Panel */}
                    <AnimatePresence>
                      {expandedAdvanceIds[kw._id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`mt-1 border-t rounded-lg p-2 flex flex-col gap-1.5 transition-all ${
                            darkMode ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200/80'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                            <span>Rule ID: {kw._id?.slice(-6)}</span>
                            {typeof kw.max_replies === 'number' && kw.max_replies > 0 && (
                              <span>Limit: {kw.max_replies}</span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (handleDuplicateKeyword) {
                                  handleDuplicateKeyword(kw);
                                }
                              }}
                              className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded border text-[10px] font-bold transition active:scale-95 ${
                                darkMode ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              <CopyPlus size={11} className="text-indigo-400" />
                              <span>Duplicate</span>
                            </button>

                            {targetGroupsCount > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(kw.target_groups.join(', '));
                                  setCopiedId(kw._id);
                                  setTimeout(() => setCopiedId(null), 2000);
                                }}
                                className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded border text-[10px] font-bold transition active:scale-95 ${
                                  copiedId === kw._id
                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                    : (darkMode ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700')
                                }`}
                              >
                                {copiedId === kw._id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} className="text-blue-400" />}
                                <span>{copiedId === kw._id ? 'Copied' : 'Copy Groups'}</span>
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredKeywords.length === 0 && (
            <div className={`text-center py-6 rounded-xl border border-dashed ${
              darkMode ? 'border-white/10 text-slate-500' : 'border-slate-200 text-slate-400'
            }`}>
              <Search size={20} className="mx-auto mb-1.5 opacity-30" />
              <p className="text-[11px] font-medium">No rules matching your filter or search query</p>
              {(keywordFilter !== 'all' || keywordSearch) && (
                <button
                  onClick={() => {
                    setKeywordFilter('all');
                    setKeywordSearch('');
                  }}
                  className="mt-2 text-[10px] text-blue-500 font-bold underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {visibleKeywordsCount < filteredKeywords.length && (
            <div className="pt-2 pb-6 text-center">
              <button
                type="button"
                onClick={() => handleKeywordsScroll({} as any)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition shadow-xs flex items-center justify-center gap-2 mx-auto active:scale-95 ${
                  darkMode 
                    ? 'bg-neutral-800 border-white/10 text-slate-200 hover:bg-neutral-700' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Load More Rules ({filteredKeywords.length - visibleKeywordsCount} more)</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className={`text-center py-6 rounded-xl border border-dashed ${
          darkMode ? 'border-white/10 bg-neutral-900/30' : 'border-slate-200 bg-slate-50/50'
        }`}>
          <Sliders size={24} className="mx-auto mb-1.5 text-blue-500 opacity-60" />
          <h3 className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            No Auto-Reply Rules Configured
          </h3>
          <p className={`text-[10px] max-w-xs mx-auto mt-0.5 mb-2.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Create your first auto-reply rule to trigger automated replies, forwards, approvals or alerts.
          </p>
          <button
            onClick={() => setIsAddingNewRule(true)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold uppercase text-[9px] tracking-wider transition inline-flex items-center gap-1 shadow-xs"
          >
            <Plus size={11} />
            <span>Create Rule</span>
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default memo(KeywordsManager);
