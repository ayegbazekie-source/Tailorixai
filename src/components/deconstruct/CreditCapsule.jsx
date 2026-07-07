import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Crown } from 'lucide-react';

export default function CreditCapsule({ credits, isPremium, loading }) {
  if (isPremium) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-600/30 to-yellow-500/20 border border-yellow-500/40 shadow-sm">
        <Crown className="w-3.5 h-3.5 text-yellow-400" />
        <span className="text-xs font-bold text-yellow-300">Pro · Unlimited</span>
      </div>
    );
  }

  return (
    <Link to={createPageUrl('Payment')}>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-400 transition-all shadow-sm cursor-pointer">
        <span className="text-base leading-none">💎</span>
        {loading ? (
          <span className="text-xs text-slate-400">...</span>
        ) : (
          <>
            <span className="text-xs font-bold text-[var(--text-primary)]">{credits ?? 0}</span>
            <span className="text-xs text-[var(--text-secondary)]">credits</span>
          </>
        )}
      </div>
    </Link>
  );
}