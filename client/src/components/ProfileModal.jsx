import React from 'react';
import { X, User, Mail, Phone, Calendar, LogOut, CheckCircle2, ShieldCheck, FileCheck } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, user, onLogout, historyCount }) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 p-6 text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 p-1 mx-auto mb-3 shadow-lg">
            <div className="w-full h-full rounded-full bg-white text-indigo-900 font-extrabold text-xl flex items-center justify-center">
              {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
            </div>
          </div>

          <h3 className="text-xl font-bold tracking-tight">{user.name}</h3>
          <p className="text-xs text-indigo-200 mt-0.5">{user.email}</p>

          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Active Student Account</span>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-200 text-[11px] font-semibold border border-teal-400/30">
              <span>⚡ Supabase</span>
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span>Full Name</span>
              </span>
              <span className="font-semibold text-slate-800">{user.name}</span>
            </div>

            <div className="flex items-center justify-between text-xs border-t border-slate-200/60 pt-2.5">
              <span className="text-slate-500 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>Mobile Number</span>
              </span>
              <span className="font-semibold text-slate-800">{user.phone || 'Not provided'}</span>
            </div>

            <div className="flex items-center justify-between text-xs border-t border-slate-200/60 pt-2.5">
              <span className="text-slate-500 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>Email Address</span>
              </span>
              <span className="font-semibold text-slate-800">{user.email}</span>
            </div>

            <div className="flex items-center justify-between text-xs border-t border-slate-200/60 pt-2.5">
              <span className="text-slate-500 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Member Since</span>
              </span>
              <span className="font-semibold text-slate-800">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-950">Saved Homework</p>
                <p className="text-[11px] text-indigo-700">Stored safely in your account</p>
              </div>
            </div>
            <span className="text-lg font-extrabold text-indigo-900">{historyCount}</span>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out from Account</span>
          </button>
        </div>

      </div>
    </div>
  );
}

