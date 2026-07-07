import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';

export default function FeedSearchBar({ value, onChange, isPremiumActive, isSearching }) {
  const inputCls = isPremiumActive
    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500'
    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-rose-400';

  return (
    <div className="relative max-w-md mx-auto w-full">
      {isSearching
        ? <Loader2 className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin ${isPremiumActive ? 'text-amber-400' : 'text-rose-400'}`} />
        : <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isPremiumActive ? 'text-slate-500' : 'text-slate-400'}`} />
      }
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search by username, style, or fabric..."
        className={`w-full pl-10 pr-9 py-2.5 rounded-full border text-sm outline-none transition-colors ${inputCls}`}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className={`absolute right-3 top-1/2 -translate-y-1/2 ${isPremiumActive ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}