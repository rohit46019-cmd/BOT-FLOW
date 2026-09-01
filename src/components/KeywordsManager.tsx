import React, { memo, useState, useMemo } from 'react';
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
  Check, 
  Bell, 
  Sparkles, 
  Link, 
  MessageSquare,
  Sliders,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  RotateCcw
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
  filteredKeywords,
  visibleKeywordsCount,
  handleKeywordsScroll,
  keywordsTopRef,
  direction,
  slideVariants,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      className="space-y-2.5 w-full"
    >
      <div ref={keywordsTopRef} />

      {/* TOP BAR: Ultra-Compact Single Line Header + Search + Filter + New Rule */}
      <div className={`px-2.5 py-1.5 rounded-xl border transition ${
        darkMode 
          ? 'bg-neutral-900/90 border-white/10' 
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between gap-1.5">
          {/* Mini Title */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Rules
            </span>
            <span className={`text-[8px] font-mono px-1 py-0.2 rounded font-bold ${
              darkMode ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-700'
            }`}>
              {filteredKeywords.length}/{counts.total}
            </span>
          </div>

          {/* Search Bar + Filter + New Rule in Single Compact Top Line */}
          <div className="flex items-center gap-1 flex-1 max-w-lg ml-1">
            {/* Small Slim Search Bar */}
            <div className="relative flex-1">
              <Search size={10} className={`absolute left-2 top-1/2 -translate-y-1/2 transition ${
                isSearchFocused ? 'text-blue-500' : (darkMode ? 'text-slate-500' : 'text-slate-400')
              }`} />
              <input
                type="text"
                value={keywordSearch}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onChange={(e) => setKeywordSearch(e.target.value)}
                placeholder="Search keywords..."
                className={`w-full pl-5 pr-5 py-0.5 border rounded-md focus:ring-1 focus:ring-blue-500 outline-none text-[9.5px] leading-tight transition ${
                  darkMode 
                    ? 'bg-black/30 border-white/10 text-white placeholder-white/25 focus:bg-black/50' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                }`}
              />
              {keywordSearch && (
                <button 
                  onClick={() => setKeywordSearch("")}
                  className={`absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded transition ${
                    darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Clear"
                >
                  <X size={9} />
                </button>
              )}
            </div>

            {/* Top Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-1.5 py-0.5 flex items-center gap-0.5 rounded-md border text-[8.5px] font-black uppercase tracking-wider transition flex-shrink-0 ${
                keywordFilter !== 'all'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : showFilters
                    ? (darkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-100 border-slate-300 text-slate-900')
                    : (darkMode ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')
              }`}
              title="Filter"
            >
              <Filter size={10} className={keywordFilter !== 'all' ? 'fill-current' : ''} />
              <span className="hidden xs:inline">{activeFilterMeta && keywordFilter !== 'all' ? activeFilterMeta.label : 'Filter'}</span>
              {keywordFilter !== 'all' && (
                <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
              )}
            </button>

            {/* New Rule Button */}
            <button
              onClick={() => setIsAddingNewRule(!isAddingNewRule)}
              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-black uppercase text-[8.5px] tracking-wider transition flex items-center gap-0.5 shadow-sm active:scale-95 flex-shrink-0"
            >
              <Plus size={10} />
              <span>{isAddingNewRule ? "Close" : "New"}</span>
            </button>
          </div>
        </div>

        {/* IMPROVED FILTER DROPDOWN / PANEL UI */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden border-t border-white/5 pt-2"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  <Filter size={10} /> Filter By Category & Mode
                </span>
                {keywordFilter !== 'all' && (
                  <button
                    onClick={() => setKeywordFilter('all')}
                    className="text-[9px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
                  >
                    <RotateCcw size={9} /> Reset Filter
                  </button>
                )}
              </div>

              {/* Grid of Micro Filter Buttons with live counts */}
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-1">
                {filterOptions.map(option => {
                  const Icon = option.icon;
                  const isSelected = keywordFilter === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        setKeywordFilter(option.id);
                      }}
                      className={`p-1.5 rounded-lg border text-left flex flex-col justify-between transition relative ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : (darkMode 
                              ? 'bg-white/[0.03] border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/15' 
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300')
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <Icon size={11} className={
                          isSelected 
                            ? 'text-white' 
                            : option.id === 'notify' ? 'text-emerald-400' : option.id === 'approval' ? 'text-amber-400' : 'text-slate-400'
                        } />
                        {option.count !== undefined && (
                          <span className={`text-[8px] font-mono font-black px-1 rounded ${
                            isSelected 
                              ? 'bg-white/20 text-white' 
                              : (darkMode ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-600')
                          }`}>
                            {option.count}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-bold leading-tight truncate">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add/Edit Rule Form Section */}
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

      {/* Active Filter Indicator Banner if filtered and filter panel closed */}
      {keywordFilter !== 'all' && !showFilters && (
        <div className={`px-2 py-1 rounded-lg border flex items-center justify-between text-[9px] ${
          darkMode ? 'bg-blue-950/40 border-blue-800/40 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          <div className="flex items-center gap-1.5">
            <Filter size={10} />
            <span>Showing filter: <strong>{activeFilterMeta?.label}</strong> ({filteredKeywords.length} rules)</span>
          </div>
          <button
            onClick={() => setKeywordFilter('all')}
            className="font-bold underline hover:opacity-80 transition ml-2"
          >
            Clear
          </button>
        </div>
      )}

      {/* Rules List (New Compact Look) */}
      {keywords.length > 0 ? (
        <div className="space-y-1.5">
          <div 
            className="space-y-1.5 max-h-[66vh] overflow-y-auto pr-1 custom-scrollbar" 
            onScroll={handleKeywordsScroll}
          >
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
                  className={`p-3 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
                    darkMode 
                      ? `${isEnabled ? 'bg-neutral-900/60' : 'bg-neutral-900/20 opacity-60'} border-white/10 hover:border-blue-500/30 shadow-xs` 
                      : `${isEnabled ? 'bg-white' : 'bg-slate-100 opacity-60'} border-slate-200 hover:border-blue-300 shadow-xs`
                  }`}
                >
                  {/* Top glowing top accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-0.5 ${
                    isEnabled 
                      ? (isNotify ? 'bg-emerald-500' : isApproval ? 'bg-amber-500' : `bg-blue-500`) 
                      : 'bg-slate-500'
                  }`} />

                  <div className="flex flex-col gap-2.5">
                    {/* Header Row: Index, Keywords, Status Chips */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        {/* Index Badge */}
                        <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                          darkMode ? 'bg-white/10 text-white' : 'bg-slate-900 text-white'
                        }`}>
                          #{String(index + 1).padStart(2, '0')}
                        </span>

                        {/* Keyword Tags */}
                        <div className="flex flex-wrap items-center gap-1">
                          {keywordsList.map((k: string, i: number) => (
                            <span 
                              key={i} 
                              className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.2 rounded border ${
                                darkMode 
                                  ? `bg-${colorName}-500/10 text-${colorName}-300 border-${colorName}-500/25` 
                                  : `bg-${colorName}-50 text-${colorName}-700 border-${colorName}-150`
                              }`}
                            >
                              🔑 #{k}
                            </span>
                          ))}
                        </div>

                        {/* Match Mode Pill */}
                        <span className={`text-[8.5px] font-bold uppercase tracking-wide px-1.5 py-0.2 rounded border ${
                          kw.match_mode === 'partial'
                            ? (darkMode ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-700')
                            : (darkMode ? 'bg-slate-800 border-white/5 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500')
                        }`}>
                          {kw.match_mode === 'partial' ? 'PARTIAL' : 'EXACT'}
                        </span>

                        {/* AI Badge */}
                        {isAi && (
                          <span className={`inline-flex items-center gap-0.5 text-[8.5px] font-bold uppercase px-1.5 py-0.2 rounded ${
                            darkMode ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            <Sparkles size={8} /> AI
                          </span>
                        )}

                        {/* Telegram Link Icon */}
                        {hasLinks && (
                          <span className={`inline-flex items-center gap-0.5 text-[8.5px] font-bold px-1.5 py-0.2 rounded ${
                            darkMode ? 'bg-indigo-500/10 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
                          }`} title="Telegram Message Link Attached">
                            <Link size={8} /> Forward
                          </span>
                        )}
                      </div>

                      {/* Power / Enabled Switch */}
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
                        <button
                          onClick={(e) => { 
                             e.stopPropagation(); 
                             handleToggleKeyword(kw._id, isEnabled === false); 
                          }}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wide transition border ${
                            isEnabled
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                              : (darkMode ? 'bg-white/5 text-slate-500 border-transparent' : 'bg-slate-100 text-slate-500 border-slate-200')
                          }`}
                          title={isEnabled ? "Rule Active (Click to Disable)" : "Rule Inactive (Click to Enable)"}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                          <span>{isEnabled ? 'ACTIVE' : 'OFF'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Chat Simulation Preview Box (Telegram Style) */}
                    <div className={`p-2 rounded-lg border flex flex-col gap-1.5 ${
                      darkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50/50 border-slate-200/50'
                    }`}>
                      {/* User Message Simulation */}
                      <div className="flex items-start gap-1.5">
                        <div className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold ${
                          darkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          U
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 text-[8.5px] opacity-60">
                            <span className="font-bold">Incoming Message</span>
                            <span>•</span>
                            <span>Trigger matched</span>
                          </div>
                          <div className={`mt-0.5 p-1.5 rounded text-[10.5px] font-mono inline-block ${
                            darkMode ? 'bg-blue-950/25 text-blue-200 border border-blue-900/30' : 'bg-blue-50/60 text-blue-900 border border-blue-100'
                          }`}>
                            {keywordsList.map(k => `/${k}`).join(' or ')} test message...
                          </div>
                        </div>
                      </div>

                      {/* Bot Auto-Reply Simulation */}
                      {kw.reply && (
                        <div className="flex items-start gap-1.5 pt-1.5 border-t border-dashed border-white/5">
                          <div className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold ${
                            darkMode ? 'bg-emerald-600/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            🤖
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 text-[8.5px] opacity-60">
                              <span className="font-bold">Bot Auto-Response</span>
                              <span>•</span>
                              <span>Instant Reply</span>
                            </div>
                            <p className={`mt-0.5 text-[10.5px] leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                              "{kw.reply}"
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Target Groups Info */}
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-bold ${
                        targetGroupsCount > 0 
                          ? (darkMode ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-150')
                          : (darkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500')
                      }`}>
                        <Users size={10} />
                        {targetGroupsCount > 0 ? `${targetGroupsCount} Telegram Group(s)` : 'All Target Groups'}
                      </span>

                      {typeof kw.max_replies === 'number' && kw.max_replies > 0 && (
                        <span className={`text-[8.5px] font-mono px-1.5 py-0.2 rounded ${
                          darkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'
                        }`}>
                          Limit: {kw.max_replies}
                        </span>
                      )}
                    </div>

                    {/* Bottom Action Bar: Notify, Approval, Copy, Edit, Delete */}
                    <div className={`pt-2 border-t flex flex-wrap items-center justify-between gap-1.5 ${
                      darkMode ? 'border-white/5' : 'border-slate-100'
                    }`}>
                      {/* Left: Quick Notification & Approval Toggles */}
                      <div className="flex flex-wrap items-center gap-1">
                        {/* Notify on Hit Toggle Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (handleToggleNotifyOnHit) {
                              handleToggleNotifyOnHit(kw._id, !isNotify);
                            }
                          }}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[8.5px] font-bold uppercase tracking-wider transition ${
                            isNotify
                              ? 'bg-emerald-500 text-white'
                              : (darkMode ? 'bg-white/5 text-slate-400 hover:bg-emerald-500/15 border border-white/5' : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200')
                          }`}
                          title={isNotify ? "Notification Active" : "Notification Inactive"}
                        >
                          <Bell size={10} />
                          <span>NOTIFY: {isNotify ? 'ON' : 'OFF'}</span>
                        </button>

                        {/* Approval Mode Toggle Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (handleToggleApprovalMode) {
                              handleToggleApprovalMode(kw._id, !isApproval);
                            }
                          }}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[8.5px] font-bold uppercase tracking-wider transition ${
                            isApproval
                              ? 'bg-amber-500 text-slate-950'
                              : (darkMode ? 'bg-white/5 text-slate-400 hover:bg-amber-500/15 border border-white/5' : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-800 border border-slate-200')
                          }`}
                          title={isApproval ? "Approval Mode Active" : "Approval Mode Inactive"}
                        >
                          <Zap size={10} />
                          <span>APPROVAL: {isApproval ? 'ON' : 'OFF'}</span>
                        </button>
                      </div>

                      {/* Right: Actions Cluster (Copy, Edit, Delete) */}
                      <div className="flex items-center gap-1 ml-auto">
                        {targetGroupsCount > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(kw.target_groups.join(', '));
                              setCopiedId(kw._id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className={`px-2 py-1 rounded text-[8.5px] font-bold transition flex items-center gap-0.5 border ${
                              copiedId === kw._id 
                                ? (darkMode ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-emerald-50 text-emerald-600 border-emerald-200')
                                : (darkMode ? 'bg-blue-500/5 text-blue-400 hover:bg-blue-500/15 border-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-150')
                            }`}
                            title="Copy Target Groups"
                          >
                            {copiedId === kw._id ? <Check size={11} /> : <Copy size={11} />}
                            <span className="hidden xs:inline">Groups</span>
                          </button>
                        )}

                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleEditKeyword(kw); 
                          }}
                          className={`px-2 py-1 rounded text-[8.5px] font-bold transition flex items-center gap-1 border ${
                            darkMode 
                              ? 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border-white/10' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border-slate-200'
                          }`}
                          title="Edit Rule Settings"
                        >
                          <Settings size={11} />
                          <span>Edit</span>
                        </button>

                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleDeleteKeyword(kw._id); 
                          }}
                          className={`p-1 rounded transition flex items-center border ${
                            darkMode 
                              ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/15 border-rose-500/20' 
                              : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200'
                          }`}
                          title="Delete Rule"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

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
              <div className="py-2 text-center">
                <RefreshCw className="animate-spin mx-auto text-blue-500" size={16} />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className={`text-center py-8 rounded-xl border border-dashed ${
          darkMode ? 'border-white/10 bg-neutral-900/30' : 'border-slate-200 bg-slate-50/50'
        }`}>
          <Sliders size={28} className="mx-auto mb-1.5 text-blue-500 opacity-60" />
          <h3 className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            No Auto-Reply Rules Configured
          </h3>
          <p className={`text-[10px] max-w-xs mx-auto mt-0.5 mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Create your first auto-reply rule to trigger automated replies, forwards, approvals or alerts.
          </p>
          <button
            onClick={() => setIsAddingNewRule(true)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-black uppercase text-[9px] tracking-wider transition inline-flex items-center gap-1 shadow-md shadow-blue-500/20"
          >
            <Plus size={11} />
            <span>Create Rule</span>
          </button>
        </div>
      )}

      {/* Floating Add Button for Mobile */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsAddingNewRule(!isAddingNewRule)}
        className="sm:hidden fixed bottom-20 right-4 z-40 p-2.5 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-900/50 flex items-center justify-center"
        title="Add New Rule"
      >
        <Plus size={18} />
      </motion.button>
    </motion.div>
  );
};

export default memo(KeywordsManager);
