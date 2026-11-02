import React from 'react';
import { X, Trash2, Clock, FileText, ChevronRight, User, ShieldCheck } from 'lucide-react';

export default function HistoryDrawer({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
  onClearHistory,
  onDeleteHistoryItem,
  user,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                {user ? `${user.name.split(' ')[0]}'s Saved Homework` : 'Homework History'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {user ? 'Synced with your account' : 'Saved in this browser'}
              </p>
            </div>
            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-semibold ml-1">
              {history.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account Sync Notice */}
        {user ? (
          <div className="px-4 py-2 bg-emerald-50/70 border-b border-emerald-100 flex items-center gap-2 text-xs text-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Saved to account: <b>{user.email}</b></span>
          </div>
        ) : (
          <div className="px-4 py-2 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between text-xs text-amber-800">
            <span>Log in to sync homework across all devices</span>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-medium">No checked homework yet</p>
              <p className="text-xs text-slate-400">
                Your checked homework submissions and doubts will appear here for easy review anytime.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectHistoryItem(item);
                  onClose();
                }}
                className="group p-3 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 transition cursor-pointer shadow-2xs space-y-2 relative"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {item.subject}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
                      {item.checkMode}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteHistoryItem(item.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Excerpt */}
                <p className="text-xs text-slate-700 font-medium line-clamp-2">
                  {item.text || '(Homework submitted via Photo)'}
                </p>

                {/* Photo indicator */}
                {item.images && item.images.length > 0 && (
                  <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-medium">
                    <span>📷 {item.images.length} photo(s) attached</span>
                  </div>
                )}

                {/* Chat conversation turns count */}
                {item.chatHistory && item.chatHistory.length > 2 && (
                  <div className="text-[10px] text-slate-500 font-medium">
                    💬 {item.chatHistory.length - 2} follow-up doubt(s) answered
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-400">
                  <span className="truncate max-w-[150px]">{item.modelUsed || 'APInex'}</span>
                  <span className="flex items-center text-indigo-600 font-semibold group-hover:translate-x-0.5 transition">
                    View Solution <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {user ? 'Saved in cloud account' : 'Saved in local storage'}
            </span>
            <button
              onClick={onClearHistory}
              className="text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
