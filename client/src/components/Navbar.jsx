import React from 'react';
import { Sparkles, History, BookOpen, Globe, User, LogIn, ChevronDown } from 'lucide-react';

export default function Navbar({
  selectedModel,
  onOpenSettings,
  onOpenHistory,
  historyCount,
  language,
  onLanguageChange,
  user,
  onOpenAuth,
  onOpenProfile,
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">Homework Check AI</span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                APInex Free Tier
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Photo & Text AI Tutor • Instant Step-by-Step Corrections
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Language Selector */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 text-xs font-medium text-slate-700">
            <Globe className="w-3.5 h-3.5 ml-1 mr-1 text-slate-500 hidden sm:inline" />
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              aria-label="Language selection"
              className="bg-transparent border-none text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              <option value="hinglish">🇮🇳 Hinglish</option>
              <option value="english">🇬🇧 English</option>
              <option value="hindi">🇮🇳 हिन्दी</option>
            </select>
          </div>

          {/* Active Model Pill */}
          <div
            onClick={onOpenSettings}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition cursor-pointer border border-slate-200"
            title="Click to view or change APInex free models"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="max-w-[150px] truncate">{selectedModel}</span>
          </div>

          {/* History button */}
          <button
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer"
            title="Past checked homework"
          >
            <History className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-indigo-600 text-[10px] text-white font-bold">
                {historyCount}
              </span>
            )}
          </button>

          {/* USER LOGIN / SIGNUP or PROFILE BUTTON */}
          {user ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 text-indigo-950 border border-indigo-200/80 transition cursor-pointer shadow-xs"
              title="View Profile & Account"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-semibold max-w-[100px] truncate hidden sm:inline">
                {user.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold transition cursor-pointer shadow-sm shadow-indigo-200 active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Login / Sign Up</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
