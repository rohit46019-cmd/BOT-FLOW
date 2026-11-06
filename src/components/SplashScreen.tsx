import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Bot, Sparkles, Zap } from 'lucide-react';

interface SplashScreenProps {
  key?: string;
  onFinish?: () => void;
  appName?: string;
  appLogo?: string;
}

export function SplashScreen({ onFinish, appName = "UserBot Pro", appLogo }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      key="splash-screen"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.35, ease: 'easeOut' } }}
      className="fixed inset-0 z-[9999] bg-gradient-to-b from-[#001b69] via-[#001242] to-[#00081d] flex flex-col items-center justify-center p-6 select-none overflow-hidden text-white"
    >
      {/* Background Glowing Ambient Light Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/25 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-xs">
        {/* Animated App Logo Frame */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative w-24 h-24 mb-6 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-[0_0_50px_rgba(34,211,238,0.35)]"
        >
          <div className="w-full h-full rounded-[22px] bg-[#001242] flex items-center justify-center overflow-hidden relative">
            {appLogo ? (
              <img src={appLogo} alt="Logo" className="w-16 h-16 object-contain rounded-xl" />
            ) : (
              <Bot size={44} className="text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
            )}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              className="absolute inset-0 rounded-[22px] border border-cyan-400/30 border-t-cyan-400"
            />
          </div>
        </motion.div>

        {/* App Title */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center"
        >
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-cyan-300">
              {appName}
            </h1>
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <p className="text-xs font-semibold text-blue-200/80 mt-1 uppercase tracking-widest flex items-center gap-1">
            <Zap size={12} className="text-cyan-400" /> Premium Control Center
          </p>
        </motion.div>

        {/* Loading Spinner Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 w-44 h-1.5 rounded-full bg-blue-950 border border-blue-400/20 overflow-hidden relative"
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            className="w-full h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 rounded-full shadow-[0_0_10px_#22d3ee]"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

export default SplashScreen;
