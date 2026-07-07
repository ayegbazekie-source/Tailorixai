import React from 'react';
import { Sparkles, Crown } from 'lucide-react';
import { IS_AMAZON } from '@/lib/platform';

export default function CreditDisplay({ credits, featureName, isPremium }) {
  // Amazon tablets: always show Unlimited (no credit economy on Amazon)
  if (IS_AMAZON) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-full border border-amber-200 dark:border-amber-800">
        <Crown className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Unlimited Credits</span>
      </div>
    );
  }

  // Web / PlayStore premium users: show Unlimited Credits badge
  if (isPremium) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-full border border-amber-200 dark:border-amber-800">
        <Crown className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Unlimited Credits</span>
      </div>
    );
  }

  // Free web / PlayStore users: show real credit count
  const displayCredits = credits === null ? '...' : credits;
  const showZeroState = credits === 0;

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm ${
      showZeroState
        ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
    }`}>
      <Sparkles className={`w-4 h-4 ${showZeroState ? 'text-red-500' : 'text-blue-500'}`} />
      <span className={`text-sm font-medium ${
        showZeroState
          ? 'text-red-700 dark:text-red-400'
          : 'text-slate-700 dark:text-slate-300'
      }`}>
        {displayCredits} {credits === 1 ? 'Credit' : 'Credits'} Left
      </span>
    </div>
  );
}