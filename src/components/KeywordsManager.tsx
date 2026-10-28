import React, { memo, useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  X, 
  RefreshCw, 
  Hash, 
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
  Sliders,
  Edit3,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  MessageSquare
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
  setActiveTab?: (tab: any) => void;
}

// Account-scoped cache to prevent unnecessary re-fetching while properly supporting multiple accounts
const cachedGroupsByAccount = new Map<string, Record<string, string>>();

// Extracted, memoized RuleCard component to prevent heavy re-renders and eliminate layout thrashing
interface RuleCardProps {
  kw: any;
  index: number;
  darkMode: boolean;
  isAdvanceExpanded: boolean;
  copiedKeywordsId: string | null;
  copiedId: string | null;
  onToggleAdvance: (id: string) => void;
  onCopyKeyword: (kwId: string, idx: number, text: string) => void;
  onCopyGroups: (kwId: string, groups: string[]) => void;
  onToggleKeyword: (id: string, enabled: boolean) => void;
  onToggleNotify?: (id: string, notify: boolean) => void;
  onToggleApproval?: (id: string, approval: boolean) => void;
  onEdit: (kw: any) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (kw: any) => void;
}

const RuleCard = memo(function RuleCard({
  kw,
  index,
  darkMode,
  isAdvanceExpanded,
  copiedKeywordsId,
  copiedId,
  onToggleAdvance,
  onCopyKeyword,
  onCopyGroups,
  onToggleKeyword,
  onToggleNotify,
  onToggleApproval,
  onEdit,
  onDelete,
  onDuplicate
}: RuleCardProps) {
  const colorName = ['blue', 'emerald', 'indigo', 'amber', 'purple', 'rose'][index % 6];
  const isEnabled = kw.enabled !== false;
  const isApproval = !!kw.approval_mode;
  const isNotify = !!kw.notify_on_hit;
  const isAi = !!kw.ai_reply_enabled;
  const hasLinks = (kw.message_links && kw.message_links.length > 0) || !!kw.message_link;
  const targetGroupsCount = kw.target_groups?.length || 0;
  const keywordsList = kw.keywords && kw.keywords.length > 0 ? kw.keywords : (kw.keyword ? [kw.keyword] : []);

  return (
    <div 
      className={`p-3.5 rounded-2xl border transition-all duration-200 relative overflow-hidden group shadow-sm hover:shadow-lg will-change-transform transform-gpu ${
        darkMode 
          ? `${isEnabled ? 'bg-gradient-to-br from-neutral-900/95 via-neutral-900/90 to-neutral-950/95' : 'bg-neutral-900/40 opacity-60'} border-white/10 hover:border-blue-500/50 shadow-black/60` 
          : `${isEnabled ? 'bg-gradient-to-br from-white via-slate-50/50 to-white' : 'bg-slate-100 opacity-60'} border-slate-200/90 hover:border-blue-400 shadow-slate-200/80`
      }`}
    >
      {/* Top professional gradient accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        isEnabled 
          ? (isNotify ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : isApproval ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500') 
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

        {/* Compact Keywords Box: ONLY 2 lines max of keywords */}
        <div className={`p-1.5 rounded-lg border transition-all relative ${
          darkMode 
            ? 'bg-black/30 border-white/5' 
            : 'bg-slate-50 border-slate-200/70'
        }`}>
          <div className="flex flex-wrap items-center gap-1 transition-all duration-200 max-h-[38px] overflow-hidden">
            {keywordsList.map((k: string, i: number) => {
              const copyKey = `${kw._id}-${i}`;
              return (
                <span 
                  key={i} 
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyKeyword(kw._id, i, k);
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
                  {copiedKeywordsId === copyKey ? <Check size={8} className="text-emerald-400 shrink-0" /> : null}
                </span>
              );
            })}
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
              onToggleKeyword(kw._id, isEnabled === false); 
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
              if (onToggleNotify) {
                onToggleNotify(kw._id, !isNotify);
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
              if (onToggleApproval) {
                onToggleApproval(kw._id, !isApproval);
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
              onEdit(kw); 
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

          {/* 5. Rule Advanced Options Toggle */}
          <button 
            type="button"
            onClick={(e) => { 
              e.stopPropagation(); 
              onToggleAdvance(kw._id); 
            }}
            className={`h-6 px-2 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border active:scale-95 shrink-0 ${
              isAdvanceExpanded
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                : (darkMode ? 'bg-neutral-800 hover:bg-neutral-700 text-slate-300 border-white/10' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200')
            }`}
            title="Advanced Rule Options"
          >
            <SlidersHorizontal size={10} className={isAdvanceExpanded ? 'text-white' : 'text-slate-400'} />
            <span>Options</span>
            {isAdvanceExpanded ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
          </button>

          {/* 6. Delete Button - Red */}
          <button 
            type="button"
            onClick={(e) => { 
              e.stopPropagation(); 
              onDelete(kw._id); 
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
          {isAdvanceExpanded && (
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
                <div className="flex items-center gap-2">
                  {typeof kw.max_replies === 'number' && kw.max_replies > 0 && (
                    <span>Limit: {kw.max_replies}</span>
                  )}
                  {typeof kw.cooldown_minutes === 'number' && kw.cooldown_minutes > 0 && (
                    <span className="text-amber-500 font-bold">Cooldown: {kw.cooldown_minutes}m</span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1 pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDuplicate) {
                      onDuplicate(kw);
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
                      onCopyGroups(kw._id, kw.target_groups);
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
    </div>
  );
});

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
  setActiveTab
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedKeywordsId, setCopiedKeywordsId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [availableGroupsMap, setAvailableGroupsMap] = useState<Record<string, string>>(() => 
    cachedGroupsByAccount.get(localStorage.getItem('currentProfileId') || 'default') || {}
  );
  const [expandedAdvanceIds, setExpandedAdvanceIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isAddingNewRule || editingKeywordId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAddingNewRule, editingKeywordId]);

  const toggleAdvance = useCallback((id: string) => {
    setExpandedAdvanceIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  const handleCopyKeyword = useCallback((kwId: string, idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeywordsId(`${kwId}-${idx}`);
    setTimeout(() => setCopiedKeywordsId(null), 1500);
  }, []);

  const handleCopyGroups = useCallback((kwId: string, groups: string[]) => {
    navigator.clipboard.writeText(groups.join(', '));
    setCopiedId(kwId);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Fetch groups and update map on mount or when account/settings change
  const fetchAndSetGroups = useCallback((force = false) => {
    const activeAcc = localStorage.getItem('currentProfileId') || 'default';
    if (!force && cachedGroupsByAccount.has(activeAcc)) {
      setAvailableGroupsMap(cachedGroupsByAccount.get(activeAcc)!);
      return;
    }
    fetch("/api/groups")
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.groups)) {
          const map: Record<string, string> = {};
          data.groups.forEach((g: any) => {
            if (g.id) map[g.id] = g.title || g.id;
            if (g.normalizedId) map[g.normalizedId] = g.title || g.id;
          });
          cachedGroupsByAccount.set(activeAcc, map);
          setAvailableGroupsMap(map);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAndSetGroups();

    const handleRefresh = () => {
      fetchAndSetGroups(true);
    };

    window.addEventListener('groups_updated', handleRefresh);
    window.addEventListener('account_changed', handleRefresh);

    return () => {
      window.removeEventListener('groups_updated', handleRefresh);
      window.removeEventListener('account_changed', handleRefresh);
    };
  }, [fetchAndSetGroups]);

  // Single-loop O(N) counts computation for extreme speed
  const counts = useMemo(() => {
    let active = 0, notify = 0, approval = 0, forward = 0, message = 0;
    const total = keywords.length;
    for (let i = 0; i < total; i++) {
      const k = keywords[i];
      if (k.enabled !== false) active++;
      if (k.notify_on_hit) notify++;
      if (k.approval_mode) approval++;
      if (k.message_link || (k.message_links && k.message_links.length > 0)) forward++;
      if (k.reply) message++;
    }
    return { total, active, inactive: total - active, notify, approval, forward, message };
  }, [keywords]);

  // Filter option items configuration
  const filterOptions: { id: KeywordFilterType; label: string; icon: any; count?: number; color: string }[] = [
    { id: 'all', label: 'All Rules', icon: Sliders, count: counts.total, color: 'blue' },
    { id: 'active', label: 'Active', icon: Zap, count: counts.active, color: 'emerald' },
    { id: 'inactive', label: 'Disabled', icon: X, count: counts.inactive, color: 'slate' },
    { id: 'approval', label: 'Approval Mode', icon: Zap, count: counts.approval, color: 'amber' },
    { id: 'notify', label: 'Notify Alert', icon: Bell, count: counts.notify, color: 'emerald' },
    { id: 'forward', label: 'Has Forwards', icon: Link, count: counts.forward, color: 'indigo' },
    { id: 'message', label: 'Has Reply Text', icon: MessageSquare, count: counts.message, color: 'purple' },
  ];

  return (
    <>
      <motion.div
        key="keywords"
        ref={keywordsTopRef}
        custom={direction}
        variants={slideVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="space-y-3 pb-24 will-change-transform transform-gpu"
      >
      {/* Sticky Header: Search Bar & Filter Bar */}
      <div className={`sticky top-0 z-20 pb-2 pt-1 transition-colors ${
        darkMode ? 'bg-neutral-950/90 backdrop-blur-md' : 'bg-slate-50/90 backdrop-blur-md'
      }`}>
        {/* Search Bar Row */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`relative flex-1 rounded-xl border transition-all flex items-center ${
            isSearchFocused
              ? (darkMode ? 'border-blue-500 ring-2 ring-blue-500/20 bg-neutral-900' : 'border-blue-500 ring-2 ring-blue-500/20 bg-white')
              : (darkMode ? 'border-white/10 bg-neutral-900/60' : 'border-slate-200 bg-white')
          }`}>
            <Search size={14} className={`ml-3 mr-2 shrink-0 ${isSearchFocused ? 'text-blue-500' : 'text-slate-400'}`} />
            <input
              type="text"
              value={keywordSearch}
              onChange={(e) => setKeywordSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search by keywords, replies, rules or group ID..."
              className={`w-full py-2 pr-8 text-xs bg-transparent focus:outline-none ${
                darkMode ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
              }`}
            />
            {keywordSearch && (
              <button
                onClick={() => setKeywordSearch('')}
                className="absolute right-2.5 p-1 rounded-full text-slate-400 hover:text-white transition"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl border transition-all flex items-center justify-center shrink-0 active:scale-95 ${
              showFilters || keywordFilter !== 'all'
                ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                : (darkMode ? 'bg-neutral-900 border-white/10 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900')
            }`}
            title="Filter options"
          >
            <Filter size={15} />
          </button>
        </div>

        {/* Expandable Filter Chips Drawer */}
        {showFilters && (
          <div className={`p-2 rounded-xl border mb-2 flex flex-wrap gap-1.5 transition-all ${
            darkMode ? 'bg-neutral-900/90 border-white/10' : 'bg-slate-100 border-slate-200'
          }`}>
            {filterOptions.map(option => (
              <button
                key={option.id}
                onClick={() => {
                  setKeywordFilter(option.id);
                  setShowFilters(false);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 ${
                  keywordFilter === option.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : (darkMode ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200')
                }`}
              >
                <option.icon size={11} />
                <span>{option.label}</span>
                {typeof option.count === 'number' && (
                  <span className={`text-[9px] px-1 py-0.2 rounded-full font-mono font-bold ${
                    keywordFilter === option.id ? 'bg-white/20 text-white' : (darkMode ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-600')
                  }`}>
                    {option.count}
                  </span>
                )}
              </button>
            ))}
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

      {/* RULES LIST: Compact, Responsive, Ultra-Fast Memoized Cards */}
      {keywords.length > 0 ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <AnimatePresence mode="popLayout">
              {displayedKeywords.map((kw, index) => (
                <motion.div
                  key={kw._id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8,
                    delay: Math.min(index * 0.01, 0.1) 
                  }}
                  className="will-change-transform transform-gpu"
                >
                  <RuleCard
                    kw={kw}
                    index={index}
                    darkMode={darkMode}
                    isAdvanceExpanded={!!expandedAdvanceIds[kw._id]}
                    copiedKeywordsId={copiedKeywordsId}
                    copiedId={copiedId}
                    onToggleAdvance={toggleAdvance}
                    onCopyKeyword={handleCopyKeyword}
                    onCopyGroups={handleCopyGroups}
                    onToggleKeyword={handleToggleKeyword}
                    onToggleNotify={handleToggleNotifyOnHit}
                    onToggleApproval={handleToggleApprovalMode}
                    onEdit={handleEditKeyword}
                    onDelete={handleDeleteKeyword}
                    onDuplicate={handleDuplicateKeyword}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
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
                onClick={() => handleKeywordsScroll({ currentTarget: { scrollTop: 1000, clientHeight: 100, scrollHeight: 1000 } } as any)}
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

    {/* Add/Edit Rule Form Section (Full Screen Modal - Portaled to body to prevent container clipping) */}
    {createPortal(
      <AnimatePresence>
        {(isAddingNewRule || editingKeywordId) && (
          <motion.div
            initial={{ opacity: 0, x: '100%', scale: 1 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: '100%', scale: 1 }}
            transition={{ 
              type: 'spring',
              stiffness: 280,
              damping: 30,
              mass: 1
            }}
            className={`fixed inset-0 z-[10000] flex flex-col overflow-hidden ${
              darkMode ? 'bg-neutral-950' : 'bg-slate-50'
            }`}
          >
            <div className="flex-1 w-full flex flex-col h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-4 mt-6 px-6 shrink-0">
                <div className="flex-1">
                  <h2 className={`text-2xl font-black uppercase tracking-tight flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {editingKeywordId ? <><Edit3 size={24} className="text-amber-500" /> Edit Rule</> : <><Plus size={24} className="text-emerald-500" /> New Rule</>}
                  </h2>
                  <p className={`text-xs font-bold opacity-50 uppercase tracking-widest mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {editingKeywordId ? 'Modify existing automation' : 'Create automated trigger'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    cancelEdit();
                    setIsAddingNewRule(false);
                  }}
                  className={`p-3 rounded-2xl transition-all active:scale-90 shadow-xl border ${
                    darkMode ? 'bg-white/10 hover:bg-white/20 text-white border-white/10' : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 min-h-0 pb-32 px-1 sm:px-2">
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
      </AnimatePresence>,
      document.body
    )}
  </>
);
};

export default memo(KeywordsManager);
