import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Clock, MessageSquare, Tag, Globe, Loader2 } from 'lucide-react';

interface ApprovalDashboardProps {
  darkMode: boolean;
  direction: number;
  slideVariants: any;
}

const ApprovalDashboard: React.FC<ApprovalDashboardProps> = ({ darkMode, direction, slideVariants }) => {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      const res = await fetch('/api/approvals');
      const data = await res.json();
      setApprovals(data);
    } catch (err) {
      console.error("Failed to fetch approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
    const interval = setInterval(fetchApprovals, 4000); // Poll every 4s
    return () => clearInterval(interval);
  }, []);

  const handleDecision = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/approvals/${id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setApprovals(prev => prev.filter(a => a._id !== id));
      } else {
        setErrorMsg(data.error || "Failed to process decision");
        fetchApprovals();
      }
    } catch (err: any) {
      console.error("Failed to process approval:", err);
      setErrorMsg(err.message || "Network error");
      fetchApprovals();
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <motion.div
      key="approvals"
      custom={direction}
      variants={slideVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6 w-full"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-black uppercase tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Pending Approvals
          </h2>
          <p className={`text-xs font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Review keyword matches before they are sent
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
          {approvals.length} Pending
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-2xl font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-xs font-bold hover:underline">Dismiss</button>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {approvals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvals.map((approval) => {
              const isProcessing = processingId === approval._id;
              return (
                <motion.div
                  layout
                  key={approval._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`p-5 rounded-3xl border transition duration-300 ${darkMode ? 'bg-neutral-900/50 border-white/5 hover:border-amber-500/30' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50 hover:border-amber-200'}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-xl ${darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                        <Tag size={18} />
                      </div>
                      <div>
                        <h3 className={`text-sm font-black uppercase tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {approval.matched_keyword}
                        </h3>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <Clock size={10} className="text-slate-500" />
                          <span className={`text-[10px] font-bold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            {new Date(approval.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className={`p-3 rounded-2xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <Globe size={12} className="text-blue-500" />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Location
                        </span>
                      </div>
                      <p className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        {approval.chat_title || 'Group'} <span className="text-slate-400 mx-1">/</span> {approval.topic_name || 'Topic'}
                      </p>
                    </div>

                    <div className={`p-3 rounded-2xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <MessageSquare size={12} className="text-emerald-500" />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          User Message
                        </span>
                      </div>
                      <p className={`text-xs italic ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        "{approval.original_text}"
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      disabled={isProcessing}
                      onClick={() => handleDecision(approval._id, 'approve')}
                      className="flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition shadow-lg shadow-emerald-500/20"
                    >
                      {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      <span>Approve</span>
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={() => handleDecision(approval._id, 'reject')}
                      className={`flex items-center justify-center space-x-2 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition disabled:opacity-50 ${darkMode ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                    >
                      {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                      <span>Reject</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className={`flex flex-col items-center justify-center py-20 rounded-[3rem] border border-dashed ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
            <div className={`p-6 rounded-full mb-4 ${darkMode ? 'bg-white/5 text-slate-600' : 'bg-white text-slate-300'}`}>
              <Check size={48} />
            </div>
            <h3 className={`text-lg font-black uppercase tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              All Caught Up!
            </h3>
            <p className={`text-xs font-medium mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              No pending approvals at the moment.
            </p>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default memo(ApprovalDashboard);
