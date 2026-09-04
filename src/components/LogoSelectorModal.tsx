import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Check, RefreshCw, Sparkles, Image as ImageIcon, Trash2 } from 'lucide-react';

export interface LogoPreset {
  id: string;
  name: string;
  category: string;
  url: string;
  accent: string;
}

export const LOGO_PRESETS: LogoPreset[] = [
  {
    id: 'preset1',
    name: 'Cyber Bot',
    category: 'AI Assistant',
    url: '/logos/preset1.svg',
    accent: '#10b981'
  },
  {
    id: 'preset2',
    name: 'Telegram Rocket',
    category: 'Speed & Messenger',
    url: '/logos/preset2.svg',
    accent: '#0284c7'
  },
  {
    id: 'preset3',
    name: 'Quantum Core',
    category: 'Neural Pulse',
    url: '/logos/preset3.svg',
    accent: '#c084fc'
  },
  {
    id: 'preset4',
    name: 'Golden Shield',
    category: 'VIP Security',
    url: '/logos/preset4.svg',
    accent: '#eab308'
  },
  {
    id: 'preset5',
    name: 'Ruby Falcon',
    category: 'High Performance',
    url: '/logos/preset5.svg',
    accent: '#f43f5e'
  },
  {
    id: 'preset6',
    name: 'Neon Hexagon',
    category: 'Matrix Tech',
    url: '/logos/preset6.svg',
    accent: '#059669'
  },
  {
    id: 'default',
    name: 'Classic BotFlow',
    category: 'Original Logo',
    url: '/pwa-192x192.png',
    accent: '#3b82f6'
  }
];

interface LogoSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogo: string;
  onSaveLogo: (logoUrl: string) => Promise<void> | void;
  darkMode: boolean;
}

export const LogoSelectorModal: React.FC<LogoSelectorModalProps> = ({
  isOpen,
  onClose,
  currentLogo,
  onSaveLogo,
  darkMode
}) => {
  const [selectedLogo, setSelectedLogo] = useState<string>(currentLogo || '/pwa-192x192.png');
  const [previewCustom, setPreviewCustom] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with currentLogo when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedLogo(currentLogo || '/pwa-192x192.png');
      setPreviewCustom('');
    }
  }, [isOpen, currentLogo]);

  // Handle local file upload and resize to safe max 512x512
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 512;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.9);
          setSelectedLogo(dataUrl);
          setPreviewCustom(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApply = async () => {
    setIsSaving(true);
    try {
      await onSaveLogo(selectedLogo);
      onClose();
    } catch (err) {
      console.error('Failed to save logo:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setSelectedLogo('/pwa-192x192.png');
    setPreviewCustom('');
  };

  if (!isOpen) return null;

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

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden z-10 my-auto ${
            darkMode ? 'bg-neutral-900 border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Header */}
          <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Choose App Logo</h3>
                <p className="text-xs text-slate-400">Select a curated theme icon or upload your custom logo</p>
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
          <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Live Preview Bar */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center space-x-3">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/20 shadow-md bg-neutral-950 flex items-center justify-center shrink-0">
                  <img src={selectedLogo || '/pwa-192x192.png'} alt="Selected Logo Preview" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider">Active Selection</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">Live Preview</span>
                  </div>
                  <p className="text-[11px] text-slate-400">App header, login screen, & app icon will use this logo</p>
                </div>
              </div>

              {selectedLogo !== '/pwa-192x192.png' && (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center space-x-1 transition ${
                    darkMode ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Reset to default"
                >
                  <RefreshCw size={12} />
                  <span>Default</span>
                </button>
              )}
            </div>

            {/* Curated Presets Grid */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Curated Logo Collection
                </span>
                <span className="text-[10px] text-slate-400">Click any icon to select</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {LOGO_PRESETS.map((preset) => {
                  const isCurrent = selectedLogo === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedLogo(preset.url)}
                      className={`group relative p-2.5 rounded-xl border text-left flex items-center space-x-2.5 transition-all ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500 shadow-sm'
                          : darkMode
                          ? 'border-white/10 bg-neutral-800/60 hover:bg-neutral-800 hover:border-white/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-black/10 bg-black/20 flex items-center justify-center">
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate group-hover:text-emerald-400 transition-colors">
                          {preset.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{preset.category}</div>
                      </div>
                      {isCurrent && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Upload Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Upload Custom Image
                </span>
                <span className="text-[10px] text-slate-400">PNG, JPG, WEBP, SVG</span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                  darkMode
                    ? 'border-white/15 bg-black/20 hover:bg-white/5 hover:border-emerald-500/50'
                    : 'border-slate-300 bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-500'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Upload size={18} />
                </div>
                <div className="text-xs font-semibold">Click here or tap to choose file from device</div>
                <div className="text-[10px] text-slate-400">Your photo will be automatically optimized to 512x512 for fast loading</div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className={`p-4 border-t flex items-center justify-end space-x-2.5 ${darkMode ? 'border-white/10 bg-neutral-950/40' : 'border-slate-100 bg-slate-50'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                darkMode ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Check size={14} />}
              <span>{isSaving ? 'Saving...' : 'Apply & Save Logo'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
