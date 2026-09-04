import React, { memo } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, Smartphone, RefreshCw, Key, ShieldCheck, 
  User, Lock, ArrowRight, ExternalLink, Hash, Phone, Sparkles, Clock
} from 'lucide-react';

interface UserManagerProps {
  darkMode: boolean;
  stats: any;
  timer: { days: number; time: string };
  fetchStats: () => void;
  setShowLogoutConfirm: (show: boolean) => void;
  deferredPrompt: any;
  handleInstallApp: () => void;
  authStep: 'credentials' | 'phone' | 'code';
  setAuthStep: (step: 'credentials' | 'phone' | 'code') => void;
  apiIdInput: string;
  setApiIdInput: (val: string) => void;
  apiHashInput: string;
  setApiHashInput: (val: string) => void;
  phoneNumberInput: string;
  setPhoneNumberInput: (val: string) => void;
  handleSendCode: () => void;
  isSendingCode: boolean;
  phoneCodeInput: string;
  setPhoneCodeInput: (val: string) => void;
  handleVerifyCode: () => void;
  isVerifyingCode: boolean;
  twoFactorInput: string;
  setTwoFactorInput: (val: string) => void;
  direction?: number;
  slideVariants?: any;
  handleSaveApiCredentials?: () => void;
}

const UserManager: React.FC<UserManagerProps> = ({
  darkMode,
  stats,
  timer,
  fetchStats,
  setShowLogoutConfirm,
  deferredPrompt,
  handleInstallApp,
  authStep,
  setAuthStep,
  apiIdInput,
  setApiIdInput,
  apiHashInput,
  setApiHashInput,
  phoneNumberInput,
  setPhoneNumberInput,
  handleSendCode,
  isSendingCode,
  phoneCodeInput,
  setPhoneCodeInput,
  handleVerifyCode,
  isVerifyingCode,
  twoFactorInput,
  setTwoFactorInput,
  direction = 0,
  slideVariants,
  handleSaveApiCredentials,
}) => {
  // Get active account info
  const profiles = JSON.parse(localStorage.getItem('profiles') || '[]');
  const currentProfileId = localStorage.getItem('currentProfileId') || 'default';
  const currentProfile = profiles.find((p: any) => p.id === currentProfileId) || {
    id: 'default',
    name: 'Main Account'
  };

  const isConnected = stats?.isUserBotConnected;

  return (
    <motion.div
      key="user"
      custom={direction}
      variants={slideVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-5 w-full max-w-xl mx-auto pb-12"
    >
      {/* Account Info & Isolation Banner */}
      <div className={`p-4 rounded-2xl border transition-all ${
        darkMode 
          ? 'bg-neutral-900/90 border-white/10 shadow-xl' 
          : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isConnected 
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
            }`}>
              <User size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className={`text-sm font-black truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {currentProfile.name}
                </h2>
                {currentProfile.id === 'default' && (
                  <span className="px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Main
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {isConnected ? '● Connected & Ready' : '○ Not connected for this profile'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 shrink-0">
            <ShieldCheck size={13} />
            <span>Isolated Session</span>
          </div>
        </div>
      </div>

      {/* Main Telegram Card */}
      <div className={`border p-6 sm:p-7 rounded-3xl space-y-6 transition-all relative overflow-hidden ${
        darkMode 
          ? 'bg-neutral-900/80 border-white/10 shadow-2xl' 
          : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
      }`}>
        {isConnected ? (
          /* Connected State */
          <div className="text-center py-4 space-y-6">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto border transition ${
              darkMode ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}>
              <CheckCircle2 size={42} strokeWidth={2.2} />
            </div>

            <div className="space-y-1">
              <h3 className={`text-xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Telegram Session Active
              </h3>
              <p className={`text-xs max-w-xs mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Auto-replies and keyword triggers are running for <strong className="text-emerald-400">{currentProfile.name}</strong>.
              </p>
            </div>

            {/* Telegram User Details if available */}
            {stats?.loginUser && (
              <div className={`p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 ${
                darkMode ? 'bg-black/30 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {stats.loginUser.firstName} {stats.loginUser.lastName || ''}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {stats.loginUser.phone ? `+${stats.loginUser.phone}` : (stats.loginUser.username ? `@${stats.loginUser.username}` : `ID: ${stats.loginUser.id}`)}
                  </p>
                </div>
                <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  Online
                </span>
              </div>
            )}
            
            {/* Session Uptime Timer */}
            <div className="pt-2 flex flex-col space-y-3">
              <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Session Running:
                <div className="flex items-center justify-center space-x-3 mt-1.5">
                  <div className="font-black text-3xl text-emerald-400">
                    {timer.days}d
                  </div>
                  <span className={`text-2xl font-mono font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    {timer.time}
                  </span>
                </div>
              </div>

              {stats?.sessionStartTime && (
                <div className="flex flex-col items-center pb-2">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    Connected Since:
                  </span>
                  <span className={`text-[11px] font-mono font-bold mt-0.5 ${darkMode ? 'text-emerald-400/80' : 'text-emerald-600'}`}>
                    {new Date(stats.sessionStartTime).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', hour12: true
                    })}
                  </span>
                </div>
              )}

              {stats?.lastLoginTime && (
                <div className="flex flex-col items-center pt-1 border-t border-white/5 pt-3 border-b pb-3">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    Last Login:
                  </span>
                  <span className={`text-[11px] font-mono font-bold mt-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {new Date(stats.lastLoginTime).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
              )}
              
              {stats?.sessionHistory && stats.sessionHistory.length > 0 && (
                <div className="pt-1">
                  <div className={`text-[9px] font-black uppercase tracking-widest mb-2 flex items-center justify-center gap-1.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    <Clock size={10} />
                    <span>Past Session History</span>
                  </div>
                  <div className={`space-y-1.5 max-h-32 overflow-y-auto pr-1 ${darkMode ? 'scrollbar-dark' : 'scrollbar-light'}`}>
                    {stats.sessionHistory.map((hist: any, idx: number) => {
                      const d = Math.floor(hist.duration_seconds / (3600 * 24));
                      const h = Math.floor((hist.duration_seconds % (3600 * 24)) / 3600);
                      const m = Math.floor((hist.duration_seconds % 3600) / 60);
                      let durStr = '';
                      if (d > 0) durStr += `${d}d `;
                      if (h > 0 || d > 0) durStr += `${h}h `;
                      durStr += `${m}m`;
                      
                      const endStr = new Date(hist.end_time).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
                      });
                      
                      return (
                        <div key={idx} className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${darkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`text-[10px] font-mono ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Ended: {endStr}
                          </div>
                          <div className={`text-[10px] font-bold ${darkMode ? 'text-emerald-400/80' : 'text-emerald-600'}`}>
                            {durStr}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button 
                  type="button"
                  onClick={fetchStats}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={13} />
                  <span>Refresh Status</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Lock size={13} />
                  <span>Logout Session</span>
                </button>
              </div>
            </div>
            
            {deferredPrompt && (
              <div className={`pt-4 border-t ${darkMode ? 'border-neutral-800' : 'border-slate-100'}`}>
                <button
                  onClick={handleInstallApp}
                  className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition flex items-center justify-center space-x-2 border ${darkMode ? 'bg-neutral-950 border-neutral-800 text-slate-300 hover:bg-neutral-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                  <Smartphone size={15} />
                  <span>Install Application</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Multi-Step Login Wizard */
          <div className="space-y-6">
            {/* Step Indicators */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              {[
                { id: 'credentials', label: '1. API Info', icon: Key },
                { id: 'phone', label: '2. Mobile No', icon: Phone },
                { id: 'code', label: '3. OTP Code', icon: Lock },
              ].map((step, idx) => {
                const isActive = authStep === step.id;
                const isPassed = (authStep === 'phone' && idx === 0) || (authStep === 'code' && idx <= 1);
                const Icon = step.icon;

                return (
                  <div key={step.id} className="flex items-center gap-1.5 text-xs font-bold">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-500/40' 
                        : isPassed 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-white/5 text-slate-500'
                    }`}>
                      <Icon size={12} />
                    </div>
                    <span className={`hidden sm:inline ${isActive ? (darkMode ? 'text-white' : 'text-slate-900') : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Step 1: API ID & API Hash */}
            {authStep === 'credentials' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Key size={14} className="text-blue-400" /> Telegram App Credentials
                  </span>
                  <a 
                    href="https://my.telegram.org" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 underline underline-offset-2"
                  >
                    <span>Get from my.telegram.org</span>
                    <ExternalLink size={11} />
                  </a>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-[11px] font-bold ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    API ID
                  </label>
                  <div className="relative">
                    <Hash size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={apiIdInput}
                      onChange={(e) => setApiIdInput(e.target.value)}
                      placeholder="e.g. 12345678"
                      className={`w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition ${
                        darkMode ? 'bg-neutral-950 border-white/15 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-[11px] font-bold ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    API Hash
                  </label>
                  <div className="relative">
                    <Key size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={apiHashInput}
                      onChange={(e) => setApiHashInput(e.target.value)}
                      placeholder="e.g. 0123456789abcdef0123456789abcdef"
                      className={`w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono transition ${
                        darkMode ? 'bg-neutral-950 border-white/15 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                      }`}
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    if (handleSaveApiCredentials) handleSaveApiCredentials();
                    setAuthStep('phone');
                  }}
                  className="w-full mt-2 py-3.5 rounded-xl font-black uppercase tracking-wider text-xs transition shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center gap-2"
                >
                  <span>Next: Enter Phone Number</span>
                  <ArrowRight size={14} />
                </motion.button>
              </div>
            )}

            {/* Step 2: Phone Number */}
            {authStep === 'phone' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Enter Mobile Number for {currentProfile.name}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Include country code (e.g. +91 9876543210 or +1 2345678900)
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-[11px] font-bold ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={phoneNumberInput}
                      onChange={(e) => setPhoneNumberInput(e.target.value)}
                      placeholder="+919876543210"
                      className={`w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono transition ${
                        darkMode ? 'bg-neutral-950 border-white/15 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                      }`}
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleSendCode}
                  disabled={isSendingCode || !phoneNumberInput.trim()}
                  className={`w-full py-3.5 rounded-xl font-black uppercase tracking-wider text-xs transition flex items-center justify-center space-x-2 shadow-lg ${
                    isSendingCode || !phoneNumberInput.trim()
                      ? 'bg-neutral-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
                  }`}
                >
                  {isSendingCode ? <RefreshCw className="animate-spin" size={15} /> : <Phone size={15} />}
                  <span>{isSendingCode ? 'Sending OTP Code...' : 'Request Telegram Code'}</span>
                </motion.button>

                <button 
                  type="button"
                  onClick={() => setAuthStep('credentials')} 
                  className="w-full text-slate-400 hover:text-white text-[11px] font-bold uppercase tracking-wider transition py-1 text-center"
                >
                  ← Back to API Credentials
                </button>
              </div>
            )}

            {/* Step 3: Telegram Verification Code & 2FA */}
            {authStep === 'code' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Verification Code Sent
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Check your Telegram app on phone/desktop for the 5-digit login code.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-[11px] font-bold ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Login Code
                  </label>
                  <input
                    type="text"
                    value={phoneCodeInput}
                    onChange={(e) => setPhoneCodeInput(e.target.value)}
                    placeholder="Enter 5-digit code"
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono text-center tracking-widest text-lg font-bold transition ${
                      darkMode ? 'bg-neutral-950 border-white/15 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={`text-[11px] font-bold ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    2FA Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={twoFactorInput}
                    onChange={(e) => setTwoFactorInput(e.target.value)}
                    placeholder="If 2-step verification is enabled"
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition ${
                      darkMode ? 'bg-neutral-950 border-white/15 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleVerifyCode}
                  disabled={isVerifyingCode || !phoneCodeInput.trim()}
                  className={`w-full py-3.5 rounded-xl font-black uppercase tracking-wider text-xs transition flex items-center justify-center space-x-2 shadow-lg ${
                    isVerifyingCode || !phoneCodeInput.trim()
                      ? 'bg-neutral-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white'
                  }`}
                >
                  {isVerifyingCode ? <RefreshCw className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
                  <span>{isVerifyingCode ? 'Connecting UserBot...' : 'Verify & Connect Session'}</span>
                </motion.button>

                <button 
                  type="button"
                  onClick={() => setAuthStep('phone')} 
                  className="w-full text-slate-400 hover:text-white text-[11px] font-bold uppercase tracking-wider transition py-1 text-center"
                >
                  ← Back to Phone Number
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default memo(UserManager);
