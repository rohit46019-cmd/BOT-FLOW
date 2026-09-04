import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  User, 
  Plus, 
  Check, 
  Trash2, 
  X, 
  Sparkles, 
  ChevronDown, 
  ShieldCheck, 
  Lock, 
  Smartphone, 
  RefreshCw,
  Layers,
  Bot,
  Pencil
} from 'lucide-react';

export interface Profile {
  id: string;
  name: string;
  avatarColor?: string;
  isMain?: boolean;
}

const PRESET_COLORS = [
  'from-blue-600 to-indigo-600',
  'from-emerald-600 to-teal-600',
  'from-purple-600 to-pink-600',
  'from-amber-600 to-orange-600',
  'from-rose-600 to-red-600',
  'from-cyan-600 to-blue-600'
];

interface ProfileSelectorProps {
  isConnected?: boolean;
}

export default function ProfileSelector({ isConnected }: ProfileSelectorProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string>('default');
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [mounted, setMounted] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editProfileName, setEditProfileName] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load profiles from localStorage
  useEffect(() => {
    try {
      const savedProfiles = JSON.parse(localStorage.getItem('profiles') || '[]');
      const savedCurrent = localStorage.getItem('currentProfileId') || localStorage.getItem('activeAccountId');
      
      if (!savedProfiles || savedProfiles.length === 0) {
        const defaultProfile: Profile = { 
          id: 'default', 
          name: 'Main Account', 
          avatarColor: PRESET_COLORS[0],
          isMain: true
        };
        localStorage.setItem('profiles', JSON.stringify([defaultProfile]));
        localStorage.setItem('currentProfileId', 'default');
        localStorage.setItem('activeAccountId', 'default');
        setProfiles([defaultProfile]);
        setCurrentProfileId('default');
      } else {
        // Ensure default profile is permanently marked isMain
        const sanitized = savedProfiles.map((p: Profile) => {
          if (p.id === 'default' || p.name === 'Main Account') {
            return { ...p, id: 'default', isMain: true };
          }
          return p;
        });
        setProfiles(sanitized);
        const activeId = savedCurrent || 'default';
        setCurrentProfileId(activeId);
        localStorage.setItem('currentProfileId', activeId);
        localStorage.setItem('activeAccountId', activeId);
      }
    } catch (e) {
      console.error('Error loading profiles:', e);
    }
  }, []);

  // Focus input when adding
  useEffect(() => {
    if (isAdding && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isAdding]);

  const handleCreateProfile = (nameToUse?: string) => {
    const finalName = (nameToUse || newProfileName).trim();
    if (!finalName) {
      setErrorMsg('Please enter an account name');
      return;
    }

    const newId = `acc_${Date.now()}`;
    const randomColor = PRESET_COLORS[profiles.length % PRESET_COLORS.length];
    const newProfile: Profile = {
      id: newId,
      name: finalName,
      avatarColor: randomColor,
      isMain: false
    };

    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    setCurrentProfileId(newProfile.id);

    localStorage.setItem('profiles', JSON.stringify(updatedProfiles));
    localStorage.setItem('currentProfileId', newProfile.id);
    localStorage.setItem('activeAccountId', newProfile.id);

    setNewProfileName('');
    setIsAdding(false);
    setErrorMsg('');
    setIsOpen(false);

    // Refresh so all components cleanly re-fetch fresh isolated state for this account
    window.location.reload();
  };

  const handleSwitchProfile = (id: string) => {
    if (id === currentProfileId) {
      setIsOpen(false);
      return;
    }
    setCurrentProfileId(id);
    localStorage.setItem('currentProfileId', id);
    localStorage.setItem('activeAccountId', id);
    setIsOpen(false);
    window.location.reload();
  };

  const handleDeleteProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === 'default') {
      alert('The Main Account is permanent and cannot be deleted.');
      return;
    }
    if (profiles.length <= 1) return;

    if (!window.confirm('Are you sure you want to delete this account? All its settings, keywords, and bot sessions will be removed.')) {
      return;
    }

    const remaining = profiles.filter(p => p.id !== id);
    setProfiles(remaining);
    localStorage.setItem('profiles', JSON.stringify(remaining));

    if (currentProfileId === id) {
      const nextId = 'default';
      setCurrentProfileId(nextId);
      localStorage.setItem('currentProfileId', nextId);
      localStorage.setItem('activeAccountId', nextId);
      window.location.reload();
    }
  };

  const handleStartEdit = (p: Profile, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProfileId(p.id);
    setEditProfileName(p.name);
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 100);
  };

  const handleSaveEdit = (id: string, e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.stopPropagation();
    const trimmed = editProfileName.trim();
    if (!trimmed) {
      setEditingProfileId(null);
      return;
    }

    const updatedProfiles = profiles.map(p => {
      if (p.id === id) {
        return { ...p, name: trimmed };
      }
      return p;
    });

    setProfiles(updatedProfiles);
    localStorage.setItem('profiles', JSON.stringify(updatedProfiles));
    setEditingProfileId(null);
    setEditProfileName('');
  };

  const handleCancelEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProfileId(null);
    setEditProfileName('');
  };

  const currentProfile = profiles.find(p => p.id === currentProfileId) || profiles[0] || {
    id: 'default',
    name: 'Main Account',
    avatarColor: PRESET_COLORS[0],
    isMain: true
  };

  return (
    <>
      {/* Header Account Switcher Button */}
      <button 
        type="button"
        id="profile-switcher-btn"
        onClick={() => {
          setIsOpen(true);
          setIsAdding(false);
          setErrorMsg('');
        }}
        className="flex items-center gap-2 py-1 px-2.5 rounded-xl transition-all duration-300 border bg-neutral-900 border-white/15 hover:border-blue-500/50 hover:bg-neutral-800 text-white shadow-md group active:scale-95 shrink-0"
        title="Switch Account & Telegram Login"
      >
        <div className="relative shrink-0">
          <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr ${currentProfile.avatarColor || 'from-blue-600 to-indigo-600'} flex items-center justify-center text-white shadow-md border border-white/20 group-hover:scale-105 transition-transform`}>
            <User size={13} className="text-white" strokeWidth={2.5} />
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-2 border-neutral-900 ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
        </div>

        <div className="flex flex-col text-left max-w-[80px] sm:max-w-[120px]">
          <span className="text-[11px] font-bold truncate text-white group-hover:text-blue-300 transition-colors leading-tight">
            {currentProfile.name}
          </span>
          <span className="text-[8.5px] font-medium text-slate-400 truncate leading-none mt-0.5">
            {currentProfile.id === 'default' ? 'Main' : 'Account'} • {isConnected ? 'Online' : 'Offline'}
          </span>
        </div>

        <ChevronDown size={13} className="text-slate-400 group-hover:text-white shrink-0 ml-0.5 transition-transform" />
      </button>

      {/* FULL PORTAL MODAL (Completely detached from header CSS bounding box) */}
      {isOpen && mounted && createPortal(
        <div 
          id="account-modal-backdrop"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md transition-opacity duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOpen(false);
              setIsAdding(false);
              setErrorMsg('');
            }
          }}
        >
          <div 
            id="account-modal-card"
            className="relative w-full max-w-[420px] rounded-2xl bg-neutral-950 border border-white/20 shadow-2xl p-4 sm:p-5 text-white flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-inner">
                  <Layers size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-wide text-white uppercase flex items-center gap-1.5">
                    Telegram Accounts
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">100% Isolated Sessions & Rules</p>
                </div>
              </div>
              <button 
                type="button"
                id="close-account-modal-btn"
                onClick={() => {
                  setIsOpen(false);
                  setIsAdding(false);
                  setErrorMsg('');
                }}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            {/* Account Isolation Notice */}
            <div className="mb-3 px-3 py-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-start gap-2.5 text-[11px] text-blue-200 shrink-0">
              <ShieldCheck size={16} className="shrink-0 text-blue-400 mt-0.5" />
              <div className="leading-tight space-y-0.5">
                <p className="font-bold text-blue-300">Complete Multi-Account Isolation:</p>
                <p className="text-blue-200/80">New account mein Telegram session, rules (keywords), target groups aur stats bilkul fresh honge aur dusre accounts ko affect nahi karenge.</p>
              </div>
            </div>

            {/* Scrollable Profiles List */}
            <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-[140px] max-h-[300px]">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                <span>Available Accounts ({profiles.length})</span>
                <span>Click to Switch</span>
              </div>
              
              {profiles.map((p, idx) => {
                const isSelected = p.id === currentProfileId;
                const isMainAccount = p.id === 'default' || p.isMain;
                const colorClass = p.avatarColor || PRESET_COLORS[idx % PRESET_COLORS.length];
                const isEditingThis = editingProfileId === p.id;

                return (
                  <div
                    key={p.id}
                    id={`account-item-${p.id}`}
                    onClick={() => {
                      if (!isEditingThis) handleSwitchProfile(p.id);
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl transition duration-150 border ${
                      isSelected 
                        ? 'bg-blue-600/20 border-blue-500/60 text-white shadow-md ring-1 ring-blue-500/30' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 text-slate-300'
                    } ${!isEditingThis ? 'cursor-pointer' : ''}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${colorClass} flex items-center justify-center text-white shrink-0 shadow-md border border-white/20`}>
                        <User size={16} strokeWidth={2.4} />
                      </div>
                      
                      {isEditingThis ? (
                        <div className="flex items-center gap-1.5 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                          <input
                            ref={editInputRef}
                            id={`edit-account-input-${p.id}`}
                            type="text"
                            value={editProfileName}
                            onChange={(e) => setEditProfileName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(p.id, e);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="w-full px-2 py-1 text-xs rounded-lg bg-neutral-900 border border-blue-500 text-white font-bold focus:outline-none focus:ring-1 focus:ring-blue-400"
                            placeholder="Account name"
                          />
                          <button
                            type="button"
                            id={`save-account-edit-${p.id}`}
                            onClick={(e) => handleSaveEdit(p.id, e)}
                            className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shrink-0 transition shadow"
                            title="Save Name"
                          >
                            <Check size={13} strokeWidth={2.5} />
                          </button>
                          <button
                            type="button"
                            id={`cancel-account-edit-${p.id}`}
                            onClick={(e) => handleCancelEdit(e)}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 shrink-0 transition"
                            title="Cancel"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold truncate leading-tight text-white">{p.name}</p>
                            {isMainAccount && (
                              <span className="px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                MAIN
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                            {isSelected ? (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Account
                              </span>
                            ) : (
                              <span className="text-slate-400">Click to switch</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    {!isEditingThis && (
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Edit Account Name Button */}
                        <button
                          type="button"
                          id={`edit-account-btn-${p.id}`}
                          onClick={(e) => handleStartEdit(p, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-blue-500/20 transition"
                          title="Rename account"
                        >
                          <Pencil size={13} />
                        </button>

                        {isSelected && (
                          <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <Check size={14} strokeWidth={3} />
                          </span>
                        )}

                        {/* Main account is permanent and CANNOT be deleted */}
                        {isMainAccount ? (
                          <span className="p-1 text-slate-500 opacity-60" title="Main account is permanent">
                            <Lock size={13} />
                          </span>
                        ) : (
                          <button
                            type="button"
                            id={`delete-account-${p.id}`}
                            onClick={(e) => handleDeleteProfile(p.id, e)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/20 transition"
                            title="Delete secondary account"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Account Section */}
            <div className="mt-3 pt-3 border-t border-white/10 shrink-0">
              {!isAdding ? (
                <button
                  type="button"
                  id="start-add-account-btn"
                  onClick={() => {
                    setIsAdding(true);
                    setErrorMsg('');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition active:scale-95"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span>+ Add New Account</span>
                </button>
              ) : (
                <div className="space-y-3 bg-neutral-900/80 p-3 rounded-xl border border-white/15 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                      <Sparkles size={13} /> New Account Name
                    </span>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsAdding(false);
                        setErrorMsg('');
                      }}
                      className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <input
                    ref={inputRef}
                    id="new-account-name-input"
                    type="text"
                    value={newProfileName}
                    onChange={(e) => {
                      setNewProfileName(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateProfile();
                      if (e.key === 'Escape') setIsAdding(false);
                    }}
                    placeholder="e.g. Account 2, Work Bot, Support..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-950 border border-white/20 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                  />

                  {errorMsg && (
                    <p className="text-[11px] text-rose-400 font-semibold">{errorMsg}</p>
                  )}

                  {/* Quick Suggestions */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-medium">Quick Suggestions:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Telegram 2', 'Support Bot', 'Work Account', 'Personal 2'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleCreateProfile(preset)}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-blue-600/30 text-slate-300 hover:text-blue-200 border border-white/10 transition"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      id="confirm-create-account-btn"
                      onClick={() => handleCreateProfile()}
                      className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition active:scale-95"
                    >
                      Create & Switch
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdding(false);
                        setErrorMsg('');
                      }}
                      className="py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-slate-300 font-bold text-xs transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
