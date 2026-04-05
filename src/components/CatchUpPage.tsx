import React, { memo } from 'react';
import { ArrowLeft, Send } from 'lucide-react';

interface CatchUpPageProps {
  darkMode: boolean;
  setActiveTab: (tab: string) => void;
  scannedItems: any[];
  handleClearAllMissed: () => void;
  handleReplyToSingleMissed: (id: string) => void;
  replyingIds: string[];
  handleScanMissed: () => void;
  isScanningMissed: boolean;
}

const CatchUpPage: React.FC<CatchUpPageProps> = ({
  darkMode,
  setActiveTab,
  scannedItems,
  handleClearAllMissed,
  handleReplyToSingleMissed,
  replyingIds,
  handleScanMissed,
  isScanningMissed,
}) => (
  <div
    className={`min-h-screen p-4 ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}
  >
    <div className="flex items-center justify-between mb-6">
      <button onClick={() => setActiveTab('dashboard')} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`}>
        <ArrowLeft size={24} />
      </button>
      <h2 className="text-xl font-black">Manual Catch Up</h2>
      <div className="flex items-center space-x-2">
        <button 
          onClick={handleScanMissed}
          disabled={isScanningMissed}
          className={`px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500 text-white ${isScanningMissed ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isScanningMissed ? 'Scanning...' : 'Scan'}
        </button>
        <button 
          onClick={handleClearAllMissed}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600"
        >
          Clear All
        </button>
      </div>
    </div>

    <div className="space-y-3">
      {scannedItems.length === 0 ? (
        <div className="text-center py-12">
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>No missed keywords found.</p>
        </div>
      ) : (
        scannedItems.map((item: any) => (
          <div 
            key={item._id}
            className={`p-3 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
          >
            <div className="flex-1 min-w-0 mr-2">
              <div className="flex items-center space-x-2 mb-1">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                  {item.topicName}
                </span>
                <span className={`text-[9px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {new Date(item.date).toLocaleTimeString()}
                </span>
              </div>
              <p className={`text-xs font-medium truncate ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Keyword: <span className="text-amber-500">"{item.keyword}"</span>
              </p>
              <p className={`text-[10px] italic truncate ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                "{item.text}"
              </p>
            </div>
            <button
              onClick={() => {
                console.log("Reply clicked for item:", item);
                handleReplyToSingleMissed(item._id);
              }}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center space-x-1 transition ${
                darkMode ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              }`}
            >
              <Send size={10} />
              <span>Reply</span>
            </button>
          </div>
        ))
      )}
    </div>
  </div>
);

export default memo(CatchUpPage);
