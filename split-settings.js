const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsPanel.tsx', 'utf-8');

// Add activeTab state
if (!code.includes('activeTabSettings')) {
  code = code.replace(
    'const SettingsPanel: React.FC<SettingsPanelProps> = ({',
    'const SettingsPanel: React.FC<SettingsPanelProps> = ({\n'
  );
  code = code.replace(
    /const \[showToken, setShowToken\] = useState\(false\);/,
    'const [activeTabSettings, setActiveTabSettings] = useState("general");\n  const [showToken, setShowToken] = useState(false);'
  );
}

// Add Tabs UI before the content wrapper
const tabsUI = `
          {/* Tabs */}
          <div className={\`flex overflow-x-auto hide-scrollbar border-b \${darkMode ? 'border-white/10' : 'border-slate-200'} mb-4\`}>
            {[
              { id: 'general', label: 'General', icon: Bot },
              { id: 'ai', label: 'AI Reply', icon: Sparkles },
              { id: 'photo', label: 'Photo', icon: ImageIcon },
              { id: 'notifications', label: 'Alerts', icon: Bell },
              { id: 'advanced', label: 'Data & Advanced', icon: Database }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTabSettings(tab.id)}
                className={\`flex items-center gap-1.5 px-3 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 \${
                  activeTabSettings === tab.id 
                    ? (darkMode ? 'border-emerald-500 text-emerald-400' : 'border-emerald-600 text-emerald-600') 
                    : \`border-transparent \${darkMode ? 'text-slate-400 hover:text-slate-300 hover:bg-white/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}\`
                }\`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-6">
`;

// Now find where to insert this:
// It should go right after the `<div className="flex-1 overflow-y-auto p-4 sm:p-5">` wrapper.
// Actually, let's look at the structure.
