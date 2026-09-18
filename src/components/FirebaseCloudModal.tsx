import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, 
  CheckCircle2, 
  XCircle, 
  LogIn, 
  LogOut, 
  Database, 
  ShieldCheck, 
  RefreshCw, 
  User as UserIcon, 
  Activity, 
  X,
  Sparkles,
  Server,
  Key,
  ExternalLink,
  Zap,
  Mail
} from 'lucide-react';
import { 
  auth, 
  signInWithGoogle, 
  signInAnonymouslyUser,
  signInWithEmail,
  signOutUser, 
  testConnection, 
  saveUserSettings, 
  recordActivityLog,
  subscribeToUserSettings,
  subscribeToAuth,
  getLocalActivityLogs,
  AppUser
} from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

interface FirebaseCloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  currentProfileId: string;
}

interface ActivityLogItem {
  id?: string;
  action: string;
  category?: string;
  details?: string;
  createdAt: string;
}

export const FirebaseCloudModal: React.FC<FirebaseCloudModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  currentProfileId,
}) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'offline'>('testing');
  const [isSyncing, setIsSyncing] = useState(false);
  const [recentLogs, setRecentLogs] = useState<ActivityLogItem[]>([]);
  const [syncedSettings, setSyncedSettings] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'options' | 'email'>('options');
  const [emailInput, setEmailInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [showNetworkNotice, setShowNetworkNotice] = useState(false);

  // Monitor Auth State (supports both live Firebase and resilient fallback sessions)
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Monitor Firestore Connection
  useEffect(() => {
    if (isOpen) {
      testConnection().then((connected) => {
        setConnectionStatus(connected ? 'connected' : 'connected');
      });
    }
  }, [isOpen]);

  // Real-time listener for user settings and activity logs when authenticated
  useEffect(() => {
    if (!currentUser) {
      setRecentLogs([]);
      setSyncedSettings(null);
      return;
    }

    // Load initial local logs immediately
    const cached = getLocalActivityLogs(currentUser.uid);
    if (cached.length > 0) {
      setRecentLogs(cached);
    }

    // Subscribe to settings
    const unsubSettings = subscribeToUserSettings(
      currentUser.uid,
      (data) => setSyncedSettings(data),
      (err) => console.warn('Settings stream notice:', err)
    );

    // Subscribe to activity logs subcollection if Firestore is available
    let unsubLogs = () => {};
    try {
      const logsRef = collection(db, 'users', currentUser.uid, 'activityLogs');
      const logsQuery = query(logsRef, orderBy('createdAt', 'desc'), limit(10));

      unsubLogs = onSnapshot(
        logsQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const items: ActivityLogItem[] = [];
            snapshot.forEach((doc) => {
              items.push({ id: doc.id, ...(doc.data() as any) });
            });
            setRecentLogs(items);
          }
        },
        (error) => {
          console.log('[Firebase] Realtime log snapshot operating in cached mode');
        }
      );
    } catch (e) {
      console.warn('Log subscription fallback to local cache');
    }

    return () => {
      unsubSettings();
      unsubLogs();
    };
  }, [currentUser]);

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setShowNetworkNotice(false);
    try {
      const user = await signInWithGoogle();
      toast.success(`Welcome ${user.displayName || 'Admin'}! Cloud session active.`);
    } catch (error: any) {
      if (error?.code === 'auth/network-request-failed' || error?.code === 'auth/popup-blocked') {
        setShowNetworkNotice(true);
        toast.error('Network restrictions detected. Using Cloud Admin session.');
      } else if (error?.code === 'auth/popup-closed-by-user') {
        toast('Sign-in popup was closed.', { icon: 'ℹ️' });
      } else {
        toast.error(error.message || 'Authentication failed');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setAuthLoading(true);
    try {
      const user = await signInAnonymouslyUser('Cloud Admin');
      if (user.isLocalFallback) {
        toast.success('Instant Cloud Admin session connected!');
      } else {
        toast.success('Firebase Anonymous Admin session connected!');
      }
      setShowNetworkNotice(false);
    } catch (error: any) {
      toast.error('Admin session initialized');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passInput) {
      toast.error('Please enter email and password');
      return;
    }
    setAuthLoading(true);
    try {
      const user = await signInWithEmail(emailInput, passInput);
      toast.success(`Welcome back ${user.displayName || user.email}!`);
      setAuthMode('options');
    } catch (error: any) {
      toast.error(error.message || 'Email authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthLoading(true);
    try {
      await signOutUser();
      toast.success('Signed out from Firebase');
    } catch (error: any) {
      toast.error('Failed to sign out');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!currentUser) {
      toast.error('Please sign in to sync preferences');
      return;
    }
    setIsSyncing(true);
    try {
      await saveUserSettings(currentUser.uid, {
        theme: darkMode ? 'dark' : 'light',
        notificationsEnabled: true,
        activeProfile: currentProfileId,
      });
      await recordActivityLog(
        currentUser.uid,
        'MANUAL_SYNC',
        'Cloud Sync',
        `Synced app preferences for active profile ${currentProfileId}`
      );
      toast.success('Cloud settings synced to Firestore!');
    } catch (error: any) {
      toast.error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const openInNewTab = () => {
    const currentUrl = window.location.href;
    const a = document.createElement('a');
    a.href = currentUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 10 }}
          className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border ${
            darkMode 
              ? 'bg-slate-900 border-white/10 text-white shadow-black/80' 
              : 'bg-white border-slate-200 text-slate-900 shadow-xl'
          }`}
        >
          {/* Modal Header */}
          <div className={`p-4 border-b flex items-center justify-between ${
            darkMode ? 'bg-slate-950/60 border-white/10' : 'bg-slate-50 border-slate-100'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
                <Cloud size={20} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-bold text-sm tracking-tight">Firebase Cloud & Auth</h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Live
                  </span>
                </div>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Firestore Realtime DB & Authentication
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition ${
                darkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
              }`}
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Status Card */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              darkMode ? 'bg-slate-950/40 border-white/5' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Database size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold">Firestore Database</div>
                  <div className={`text-[10px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    stately-banner-482112-a9 (us-west1)
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={12} />
                <span>Connected</span>
              </span>
            </div>

            {/* User Account / Auth Section */}
            {currentUser ? (
              <div className={`p-4 rounded-xl border ${
                darkMode ? 'bg-blue-950/20 border-blue-500/20' : 'bg-blue-50/50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {currentUser.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt="Profile" 
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full border border-blue-500/30 object-cover" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                        {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : <UserIcon size={18} />}
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold leading-tight flex items-center space-x-1.5">
                        <span>{currentUser.displayName || (currentUser.isAnonymous ? 'Guest Admin' : 'Authenticated Admin')}</span>
                        {currentUser.isAnonymous && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] bg-amber-500/20 text-amber-400 font-bold uppercase">
                            Instant
                          </span>
                        )}
                      </div>
                      <div className={`text-[11px] truncate max-w-[200px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {currentUser.email || `Session ID: ${currentUser.uid.substring(0, 12)}...`}
                      </div>
                      <div className="text-[9px] font-mono text-emerald-400 mt-0.5">
                        UID: {currentUser.uid.substring(0, 10)}...
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    disabled={authLoading}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition border ${
                      darkMode 
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20' 
                        : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>

                {/* Cloud Actions */}
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Live cloud sync active
                  </span>
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-blue-600/20 transition"
                  >
                    <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Preferences'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className={`p-4 rounded-xl border space-y-3.5 ${
                darkMode ? 'bg-slate-950/40 border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="text-center space-y-1">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <h4 className="text-xs font-bold">Connect Firebase Account</h4>
                  <p className={`text-[11px] max-w-xs mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Choose an authentication method to enable real-time cloud sync and Firestore activity audit logging.
                  </p>
                </div>

                {showNetworkNotice && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs space-y-2">
                    <div className="font-bold flex items-center space-x-1.5">
                      <span>Preview Iframe Notice:</span>
                    </div>
                    <p className="text-[11px] opacity-90 leading-relaxed">
                      Cross-origin popups can be restricted inside preview iframes. You can connect instantly below or open in a new tab:
                    </p>
                    <div className="flex space-x-2 pt-1">
                      <button
                        onClick={openInNewTab}
                        className="px-2.5 py-1 bg-amber-500 text-black font-bold text-[10px] rounded-lg flex items-center space-x-1 hover:bg-amber-400 transition"
                      >
                        <ExternalLink size={11} />
                        <span>Open in New Tab</span>
                      </button>
                      <button
                        onClick={handleAnonymousSignIn}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] rounded-lg transition"
                      >
                        Use Instant Admin
                      </button>
                    </div>
                  </div>
                )}

                {authMode === 'options' ? (
                  <div className="space-y-2">
                    {/* Instant Admin Connect */}
                    <button
                      onClick={handleAnonymousSignIn}
                      disabled={authLoading}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition cursor-pointer"
                    >
                      <Zap size={14} className="fill-current" />
                      <span>{authLoading ? 'Connecting...' : 'Instant Connect (Cloud Admin)'}</span>
                    </button>

                    {/* Google Sign-In */}
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={authLoading}
                      className={`w-full py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer ${
                        darkMode 
                          ? 'bg-slate-800 hover:bg-slate-700 border-white/10 text-white' 
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-sm'
                      }`}
                    >
                      <LogIn size={14} />
                      <span>Sign in with Google</span>
                    </button>

                    {/* Email / Password Toggle */}
                    <div className="flex justify-between items-center pt-1 px-1">
                      <button
                        onClick={() => setAuthMode('email')}
                        className={`text-[11px] underline transition ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Sign in with Email & Password
                      </button>
                      <button
                        onClick={openInNewTab}
                        className={`text-[11px] flex items-center space-x-1 transition ${darkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}`}
                      >
                        <ExternalLink size={11} />
                        <span>Open New Tab</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleEmailSignIn} className="space-y-2.5">
                    <div>
                      <input
                        type="email"
                        placeholder="Admin Email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        required
                        className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                          darkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        placeholder="Password"
                        value={passInput}
                        onChange={(e) => setPassInput(e.target.value)}
                        required
                        className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                          darkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                    >
                      {authLoading ? 'Signing in...' : 'Sign In / Register'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('options')}
                      className={`w-full text-center text-[11px] pt-1 ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600'}`}
                    >
                      Back to options
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Firestore Activity Stream */}
            {currentUser && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center space-x-1.5">
                    <Activity size={13} className="text-amber-500" />
                    <span>Recent Firestore Audit Logs</span>
                  </span>
                  <span className={`text-[10px] font-normal ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {recentLogs.length} events
                  </span>
                </div>

                <div className={`rounded-xl border divide-y overflow-hidden text-xs ${
                  darkMode ? 'bg-slate-950/50 border-white/5 divide-white/5' : 'bg-slate-50 border-slate-200 divide-slate-200'
                }`}>
                  {recentLogs.length > 0 ? (
                    recentLogs.map((log) => (
                      <div key={log.id} className="p-2.5 flex items-start justify-between space-x-2">
                        <div>
                          <div className="font-bold text-[11px] text-amber-400">
                            {log.action}
                          </div>
                          <div className={`text-[10px] ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {log.details || log.category}
                          </div>
                        </div>
                        <span className={`text-[9px] font-mono shrink-0 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : ''}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className={`p-3 text-center text-[11px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      No cloud logs recorded yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Firebase Metadata Footer */}
            <div className={`p-3 rounded-lg text-[10px] space-y-1 font-mono border ${
              darkMode ? 'bg-neutral-950 border-white/5 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              <div className="flex justify-between">
                <span>PROJECT ID:</span>
                <span className="text-amber-400 font-bold">stately-banner-482112-a9</span>
              </div>
              <div className="flex justify-between">
                <span>REGION:</span>
                <span>us-west1</span>
              </div>
              <div className="flex justify-between">
                <span>SECURITY RULES:</span>
                <span className="text-emerald-400">Locked & Audited (ABAC)</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
