import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Hash, Link, Trash2, Sparkles, Zap, MessageSquare } from 'lucide-react';

export const KeywordInput = memo(({ value, onChange, onRemove, showRemove, darkMode, index }: any) => {
  const colors = ['emerald', 'blue', 'rose', 'amber', 'purple', 'indigo'];
  const color = colors[(index || 0) % 6];

  return (
    <div className="flex items-center space-x-2 group">
      <div className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${darkMode ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>
        {(index || 0) + 1}
      </div>
      <div className="relative flex-1">
        <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-${color}-500`}>
          <Hash size={16} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter keyword..."
          className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-${color}-500 outline-none text-sm transition ${darkMode ? `bg-${color}-500/10 border-${color}-500/30 text-white placeholder-white/20` : `bg-${color}-50 border-${color}-200 text-slate-900 placeholder-slate-400`}`}
        />
      </div>
      {showRemove && (
        <button onClick={onRemove} className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition">
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );
});

export const ReplyInput = memo(({ value, onChange, darkMode }: any) => {
  return (
    <div className="relative">
      <div className="absolute left-3 top-3 text-blue-500">
        <MessageSquare size={18} />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What should the bot say?"
        rows={4}
        className={`w-full pl-10 pr-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition resize-none ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'}`}
      />
    </div>
  );
});

interface AddKeywordSectionProps {
  editingKeyword: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  darkMode: boolean;
}

const AddKeywordSection: React.FC<AddKeywordSectionProps> = ({ 
  editingKeyword, 
  onSave, 
  onCancel, 
  darkMode 
}) => {
  const [isExpanded, setIsExpanded] = useState(!!editingKeyword);
  const [newKeywords, setNewKeywords] = useState<string[]>([""]);
  const [newReply, setNewReply] = useState("");
  const [newMatchMode, setNewMatchMode] = useState<'exact' | 'partial'>('exact');
  const [newMessageLinks, setNewMessageLinks] = useState<string[]>([""]);
  const [newMaxReplies, setNewMaxReplies] = useState<number | string>(0);
  const [newAiReplyEnabled, setNewAiReplyEnabled] = useState(false);

  useEffect(() => {
    if (editingKeyword) {
      setIsExpanded(true);
      const kws = editingKeyword.keywords && editingKeyword.keywords.length > 0 
        ? [...editingKeyword.keywords] 
        : (editingKeyword.keyword ? [editingKeyword.keyword] : [""]);
      setNewKeywords(kws);
      setNewReply(editingKeyword.reply || "");
      const links = editingKeyword.message_links && editingKeyword.message_links.length > 0 
        ? [...editingKeyword.message_links] 
        : (editingKeyword.message_link ? [editingKeyword.message_link] : [""]);
      setNewMessageLinks(links);
      setNewMaxReplies(editingKeyword.max_replies !== undefined ? editingKeyword.max_replies : 0);
      setNewMatchMode(editingKeyword.match_mode || 'exact');
      setNewAiReplyEnabled(!!editingKeyword.ai_reply_enabled);
    } else {
      setNewKeywords([""]);
      setNewReply("");
      setNewMessageLinks([""]);
      setNewMaxReplies(0);
      setNewMatchMode('exact');
      setNewAiReplyEnabled(false);
    }
  }, [editingKeyword]);

  const addKeywordField = () => setNewKeywords([...newKeywords, ""]);
  const updateKeywordField = (index: number, value: string) => {
    const updated = [...newKeywords];
    updated[index] = value;
    setNewKeywords(updated);
  };
  const removeKeywordField = (index: number) => {
    if (newKeywords.length > 1) {
      setNewKeywords(newKeywords.filter((_, i) => i !== index));
    }
  };

  const addMessageLinkField = () => setNewMessageLinks([...newMessageLinks, ""]);
  const updateMessageLinkField = (index: number, value: string) => {
    const updated = [...newMessageLinks];
    updated[index] = value;
    setNewMessageLinks(updated);
  };
  const removeMessageLinkField = (index: number) => {
    if (newMessageLinks.length > 1) {
      setNewMessageLinks(newMessageLinks.filter((_, i) => i !== index));
    }
  };

  const handleSave = () => {
    onSave({
      keywords: newKeywords,
      reply: newReply,
      match_mode: newMatchMode,
      message_links: newMessageLinks,
      max_replies: newMaxReplies,
      ai_reply_enabled: newAiReplyEnabled
    });
  };

  return (
    <div 
      className={`p-3 rounded-none border transition duration-500 ${darkMode ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}
      onFocus={() => setIsExpanded(true)}
    >
      <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 rounded-none ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
            <Plus className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h2 className={`text-xs font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {editingKeyword ? "Edit Rule" : "Create New Rule"}
            </h2>
          </div>
        </div>
        {editingKeyword && (
          <button onClick={onCancel} className={`p-1 rounded-none transition ${darkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            <X size={14} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <div className="space-y-6">
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Keywords to Match
                  </label>
                  <div className="space-y-3">
                    {newKeywords.map((kw, index) => (
                      <KeywordInput 
                        key={index}
                        index={index}
                        value={kw}
                        onChange={(val: string) => updateKeywordField(index, val)}
                        onRemove={() => removeKeywordField(index)}
                        showRemove={newKeywords.length > 1}
                        darkMode={darkMode}
                      />
                    ))}
                    <button 
                      onClick={addKeywordField}
                      className={`w-full p-3 border-2 border-dashed rounded-xl text-sm font-bold transition flex items-center justify-center space-x-2 ${darkMode ? 'border-white/10 text-slate-400 hover:border-blue-500/50 hover:text-blue-400' : 'border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-500'}`}
                    >
                      <Plus size={16} />
                      <span>Add Another Keyword</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Auto-Reply Message
                  </label>
                  <ReplyInput 
                    value={newReply}
                    onChange={setNewReply}
                    darkMode={darkMode}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Match Mode
                    </label>
                    <div className={`p-1 rounded-xl flex ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                      <button 
                        onClick={() => setNewMatchMode('exact')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition ${newMatchMode === 'exact' ? (darkMode ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white text-blue-600 shadow-md') : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}
                      >
                        Exact
                      </button>
                      <button 
                        onClick={() => setNewMatchMode('partial')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition ${newMatchMode === 'partial' ? (darkMode ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white text-blue-600 shadow-md') : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}
                      >
                        Partial
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Max Replies
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        value={newMaxReplies}
                        onChange={(e) => setNewMaxReplies(e.target.value)}
                        placeholder="0 = Unlimited"
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Message Links (Optional)
                  </label>
                  <div className="space-y-3">
                    {newMessageLinks.map((link, index) => {
                      const colors = ['emerald', 'blue', 'rose', 'amber', 'purple', 'indigo'];
                      const color = colors[index % 6];
                      return (
                        <div key={index} className="flex items-center space-x-2">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${darkMode ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {index + 1}
                          </div>
                          <div className="relative flex-1">
                            <Link className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-${color}-500`} />
                            <input
                              type="text"
                              value={link}
                              onChange={(e) => updateMessageLinkField(index, e.target.value)}
                              placeholder="https://t.me/..."
                              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-${color}-500 outline-none text-sm transition ${darkMode ? `bg-${color}-500/10 border-${color}-500/30 text-white placeholder-white/20` : `bg-${color}-50 border-${color}-200 text-slate-900 placeholder-slate-400`}`}
                            />
                          </div>
                          {newMessageLinks.length > 1 && (
                            <button onClick={() => removeMessageLinkField(index)} className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition">
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    <button 
                      onClick={addMessageLinkField}
                      className={`w-full p-2.5 border-2 border-dashed rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${darkMode ? 'border-white/10 text-slate-400 hover:border-blue-500/50 hover:text-blue-400' : 'border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-500'}`}
                    >
                      <Plus size={14} />
                      <span>Add Another Link</span>
                    </button>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border transition ${newAiReplyEnabled ? (darkMode ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200') : (darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${newAiReplyEnabled ? 'bg-blue-500 text-white' : (darkMode ? 'bg-white/10 text-slate-400' : 'bg-white text-slate-400')}`}>
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>AI Smart Reply</p>
                        <p className={`text-[10px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Use Gemini AI to enhance responses</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setNewAiReplyEnabled(!newAiReplyEnabled)}
                      className={`w-12 h-6 rounded-full p-1 transition duration-300 ${newAiReplyEnabled ? 'bg-blue-500' : (darkMode ? 'bg-white/10' : 'bg-slate-300')}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition duration-300 ${newAiReplyEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex space-x-2">
              <button 
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-none font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center space-x-2"
              >
                <Zap size={14} />
                <span>{editingKeyword ? "Update Rule" : "Create Rule"}</span>
              </button>
              {editingKeyword && (
                <button 
                  onClick={onCancel}
                  className={`px-4 py-2 rounded-none font-black uppercase tracking-widest text-xs transition ${darkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  Cancel
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(AddKeywordSection);
