import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Smartphone, Check, Copy, ExternalLink, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onTriggerInstall: () => Promise<void> | void;
  darkMode: boolean;
  appLogo?: string;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onTriggerInstall,
  darkMode,
  appLogo
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden z-10 my-auto ${
            darkMode ? 'bg-neutral-900 border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Header */}
          <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Smartphone size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Install BotFlow on Phone</h3>
                <p className="text-xs text-slate-400">Install as native Android APK / Home Screen App</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition ${
                darkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
              }`}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* App Card Preview */}
            <div className={`p-4 rounded-xl border flex items-center space-x-3.5 ${
              darkMode ? 'bg-black/30 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-black border border-white/20 shrink-0 flex items-center justify-center shadow-md">
                <img src={appLogo || '/pwa-192x192.png'} alt="BotFlow App" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h4 className="font-bold text-sm truncate">BotFlow Premium</h4>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase">WebAPK</span>
                </div>
                <p className="text-[11px] text-slate-400">Telegram Topic & Userbot Manager</p>
                <div className="flex items-center space-x-2 mt-1 text-[10px] text-emerald-400">
                  <ShieldCheck size={12} />
                  <span>Full Screen • Offline Support • 0MB APK</span>
                </div>
              </div>
            </div>

            {/* If native prompt available */}
            {deferredPrompt && (
              <button
                type="button"
                onClick={async () => {
                  await onTriggerInstall();
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-lg shadow-blue-500/25 hover:brightness-110 active:scale-98 transition flex items-center justify-center space-x-2"
              >
                <Download size={18} />
                <span>Install App Now (1-Click)</span>
              </button>
            )}

            {/* Step-by-Step Guide for Chrome */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                <Sparkles size={13} className="text-emerald-400" />
                <span>Chrome में Install / APK कैसे डाउनलोड करें:</span>
              </div>

              <div className={`p-3 rounded-xl border space-y-3 text-xs ${
                darkMode ? 'bg-neutral-800/40 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                {/* Step 1 */}
                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-semibold">Google Chrome में खोलें</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      सुनिश्चित करें कि यह लिंक सीधे Google Chrome ब्राउज़र में खुला है।
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="font-semibold">Chrome के 3 डॉट्स (⋮) पर टैप करें</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      ऊपर दाईं ओर (Top-right) दिए गए Chrome के 3 डॉट्स वाले मेनू आइकन पर क्लिक करें।
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="font-semibold">"Add to Home screen" या "Create shortcut"</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      मेनू में <strong>"Add to Home screen"</strong> चुनें। अगर <strong>"Create shortcut"</strong> का पॉपअप आए, तो सीधे <strong>"Add" (जोड़ें)</strong> पर क्लिक करें।
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <span className="font-semibold">✅ Full-Screen App की तरह चलेगा</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      "Add" करते ही BotFlow आपके फ़ोन की Home Screen पर असली App की तरह आ जाएगा। जब आप उस पर क्लिक करेंगे, तो यह बिना ब्राउज़र बार के फुल स्क्रीन में एक दम स्मूथ चलेगा!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Copy Link Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition ${
                  copied
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                    : darkMode
                    ? 'border-white/10 text-slate-300 hover:bg-white/5'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Link Copied! Open in Chrome' : 'Copy Website Link to open in Chrome'}</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className={`p-4 border-t flex items-center justify-end ${darkMode ? 'border-white/10 bg-neutral-950/40' : 'border-slate-100 bg-slate-50'}`}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
