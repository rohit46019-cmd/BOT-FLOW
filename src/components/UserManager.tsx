import React, { memo } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Smartphone, RefreshCw, Smartphone as PhoneIcon, ShieldCheck, Key } from 'lucide-react';

interface UserManagerProps {
  darkMode: boolean;
  stats: any;
  timer: { days: number; time: string };
  fetchStats: () => void;
  setShowLogoutConfirm: (show: boolean) => void;
  deferredPrompt: any;
  handleInstallApp: () => void;
  authStep: 'credentials' | 'code' | '2fa';
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
  handleVerifyTwoFactor: () => void;
  isVerifyingTwoFactor: boolean;
  direction: number;
  slideVariants: any;
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
  handleVerifyTwoFactor,
  isVerifyingTwoFactor,
  direction,
  slideVariants,
}) => {
  return (
    <motion.div
      key="user"
      custom={direction}
      variants={slideVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 w-full"
    >
      <div className={`border p-8 rounded-[2.5rem] space-y-6 transition-colors duration-500 glow-pink relative overflow-hidden group ${darkMode ? 'bg-pink-950/40 border-pink-500/30' : 'bg-pink-50 border-pink-200 shadow-xl shadow-pink-500/10'}`}>
        <div className={`absolute inset-0 pattern-lines opacity-[0.05] pointer-events-none ${darkMode ? 'text-pink-400' : 'text-pink-600'}`} />
        <div className="relative z-10 pointer-events-auto">
          {stats?.isUserBotConnected ? (
            <div className="text-center py-8 space-y-6">
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto border transition ${darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600'}`}>
                <CheckCircle2 size={48} />
              </div>
              <div>
                <h3 className={`text-xl font-bold tracking-tight mb-2 transition-colors duration-500 ${darkMode ? 'text-white' : 'text-slate-900'}`}>System Connected</h3>
                <p className={`text-sm max-w-[200px] mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Your Telegram session is active and ready for auto-replies.</p>
              </div>
              
              <div className="pt-4 flex flex-col space-y-3">
                <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Session Running:
                  <motion.div 
                    className="flex items-center space-x-3 mt-2"
                    animate={{ opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <motion.div 
                      key={timer.days}
                      initial={{ scale: 0.8, color: "#10b981" }}
                      animate={{ scale: 1, color: "#059669" }}
                      className="font-black text-4xl text-emerald-500"
                    >
                      {timer.days}d
                    </motion.div>
                    <motion.span 
                      className="text-2xl font-mono font-bold text-slate-700 dark:text-slate-300"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {timer.time}
                    </motion.span>
                  </motion.div>
                </div>

                {stats?.lastLoginTime && (
                  <div className="flex flex-col items-center pt-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      Last Login:
                    </span>
                    <span className={`text-[10px] font-mono font-bold mt-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {stats?.lastLoginTime ? new Date(stats.lastLoginTime).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      }) : 'Never'}
                    </span>
                  </div>
                )}

                <button 
                  onClick={fetchStats}
                  className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest hover:underline"
                >
                  Refresh Status
                </button>
                <button 
                  onClick={() => setShowLogoutConfirm(true)}
                  className={`text-[9px] font-bold uppercase tracking-widest transition-colors pt-4 opacity-40 hover:opacity-100 ${darkMode ? 'text-slate-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'}`}
                >
                  Logout Session
                </button>
              </div>
              
              {deferredPrompt && (
                <div className={`pt-8 border-t transition-colors duration-500 ${darkMode ? 'border-neutral-800' : 'border-slate-100'}`}>
                  <button
                    onClick={handleInstallApp}
                    className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition flex items-center justify-center space-x-2 border ${darkMode ? 'bg-neutral-950 border-neutral-800 text-slate-300 hover:bg-neutral-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                  >
                    <Smartphone size={16} />
                    <span>Install Application</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {authStep === 'credentials' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>API ID</label>
                    <input
                      type="text"
                      value={apiIdInput}
                      onChange={(e) => setApiIdInput(e.target.value)}
                      placeholder="Enter API ID"
                      className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm transition ${darkMode ? 'bg-pink-500/5 border-pink-500/20 text-white placeholder-white/20' : 'bg-pink-50 border-pink-200 text-slate-900 placeholder-slate-400'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>API Hash</label>
                    <input
                      type="text"
                      value={apiHashInput}
                      onChange={(e) => setApiHashInput(e.target.value)}
                      placeholder="Enter API Hash"
                      className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm transition ${darkMode ? 'bg-pink-500/5 border-pink-500/20 text-white placeholder-white/20' : 'bg-pink-50 border-pink-200 text-slate-900 placeholder-slate-400'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Phone Number</label>
                    <input
                      type="text"
                      value={phoneNumberInput}
                      onChange={(e) => setPhoneNumberInput(e.target.value)}
                      placeholder="+1234567890"
                      className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm transition ${darkMode ? 'bg-pink-500/5 border-pink-500/20 text-white placeholder-white/20' : 'bg-pink-50 border-pink-200 text-slate-900 placeholder-slate-400'}`}
                    />
                  </div>
                  <button
                    onClick={handleSendCode}
                    disabled={isSendingCode || !apiIdInput || !apiHashInput || !phoneNumberInput}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition flex items-center justify-center space-x-2 shadow-lg ${
                      isSendingCode || !apiIdInput || !apiHashInput || !phoneNumberInput
                        ? (darkMode ? 'bg-neutral-800 text-neutral-500' : 'bg-slate-200 text-slate-400') 
                        : 'bg-pink-500 text-white shadow-pink-500/20 hover:bg-pink-600'
                    }`}
                  >
                    {isSendingCode ? <RefreshCw className="animate-spin" size={16} /> : <PhoneIcon size={16} />}
                    <span>Send Login Code</span>
                  </button>
                </div>
              )}

              {authStep === 'code' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Verification Code</label>
                    <input
                      type="text"
                      value={phoneCodeInput}
                      onChange={(e) => setPhoneCodeInput(e.target.value)}
                      placeholder="Enter 5-digit code"
                      className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm transition ${darkMode ? 'bg-pink-500/5 border-pink-500/20 text-white placeholder-white/20' : 'bg-pink-50 border-pink-200 text-slate-900 placeholder-slate-400'}`}
                    />
                  </div>
                  <button
                    onClick={handleVerifyCode}
                    disabled={isVerifyingCode || !phoneCodeInput}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition flex items-center justify-center space-x-2 shadow-lg ${
                      isVerifyingCode || !phoneCodeInput
                        ? (darkMode ? 'bg-neutral-800 text-neutral-500' : 'bg-slate-200 text-slate-400') 
                        : 'bg-pink-500 text-white shadow-pink-500/20 hover:bg-pink-600'
                    }`}
                  >
                    {isVerifyingCode ? <RefreshCw className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                    <span>Verify Code</span>
                  </button>
                </div>
              )}

              {authStep === '2fa' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>2FA Password</label>
                    <input
                      type="password"
                      value={twoFactorInput}
                      onChange={(e) => setTwoFactorInput(e.target.value)}
                      placeholder="Enter your 2FA password"
                      className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm transition ${darkMode ? 'bg-pink-500/5 border-pink-500/20 text-white placeholder-white/20' : 'bg-pink-50 border-pink-200 text-slate-900 placeholder-slate-400'}`}
                    />
                  </div>
                  <button
                    onClick={handleVerifyTwoFactor}
                    disabled={isVerifyingTwoFactor || !twoFactorInput}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition flex items-center justify-center space-x-2 shadow-lg ${
                      isVerifyingTwoFactor || !twoFactorInput
                        ? (darkMode ? 'bg-neutral-800 text-neutral-500' : 'bg-slate-200 text-slate-400') 
                        : 'bg-pink-500 text-white shadow-pink-500/20 hover:bg-pink-600'
                    }`}
                  >
                    {isVerifyingTwoFactor ? <RefreshCw className="animate-spin" size={16} /> : <Key size={16} />}
                    <span>Verify 2FA</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default memo(UserManager);
