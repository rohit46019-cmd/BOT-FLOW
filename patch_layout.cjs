const fs = require('fs');
let code = fs.readFileSync('src/components/KeywordsManager.tsx', 'utf8');

// First, remove the button from the bottom row
code = code.replace(/<button\s*onClick=\{\(e\) => \{\s*e.stopPropagation\(\);\s*if \(handleToggleNotifyOnHit\) \{\s*handleToggleNotifyOnHit\(kw._id, !isNotify\);\s*\}\s*\}\}\s*className=\{\`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition \$\{\s*isNotify\s*\?\s*'bg-emerald-500 text-white shadow-lg shadow-emerald-500\/30 font-black'\s*:\s*\(darkMode \? 'bg-white\/5 text-slate-400 hover:bg-emerald-500\/20 hover:text-emerald-400' : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700'\)\s*\}\`\}\s*title=\{isNotify \? "Notification is ON \(Click to disable\)" : "Notification is OFF \(Click to enable\)"\}\s*>\s*<Bell size=\{13\} className=\{isNotify \? 'animate-pulse' : ''\} \/>\s*<span>\{isNotify \? 'Notify ON' : 'Notify OFF'\}<\/span>\s*<\/button>/, '');

// Second, put it next to the keywords tags
const newToggle = `
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (handleToggleNotifyOnHit) {
                              handleToggleNotifyOnHit(kw._id, !isNotify);
                            }
                          }}
                          className={\`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md \${
                            isNotify
                              ? 'bg-emerald-500 text-white shadow-emerald-500/40 ring-2 ring-emerald-500/50'
                              : (darkMode ? 'bg-slate-800 text-slate-400 shadow-transparent hover:bg-slate-700' : 'bg-slate-200 text-slate-500 shadow-transparent hover:bg-slate-300')
                          }\`}
                          title={isNotify ? "Notifications ENABLED for this keyword" : "Notifications DISABLED for this keyword"}
                        >
                          <Bell size={14} className={isNotify ? 'animate-bounce' : ''} />
                          <span>{isNotify ? '🔔 NOTIFY: ON' : '🔕 NOTIFY: OFF'}</span>
                        </button>
                      </div>
`;

code = code.replace(/{kw\.reply && \(/, newToggle + "\n                        {kw.reply && (");

fs.writeFileSync('src/components/KeywordsManager.tsx', code);
