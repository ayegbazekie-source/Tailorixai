import React from 'react';
import { Clock } from 'lucide-react';

/**
 * AILoadingNotice — reusable awareness banner about AI processing times.
 * Place it near action buttons or at the top of AI-powered feature pages.
 */
export default function AILoadingNotice({ className = '', dark = false }) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${
      dark
        ? 'bg-blue-950/40 border-blue-500/30 text-blue-300'
        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300'
    } ${className}`}>
      <Clock className={`w-5 h-5 flex-shrink-0 mt-0.5 ${dark ? 'text-blue-400' : 'text-blue-500'}`} />
      <div>
        <p className={`text-sm font-semibold ${dark ? 'text-blue-200' : 'text-blue-800 dark:text-blue-200'}`}>
          ⏳ AI Processing Time Notice
        </p>
        <p className={`text-xs mt-0.5 leading-relaxed ${dark ? 'text-blue-300/80' : 'text-blue-700 dark:text-blue-400'}`}>
          AI-powered tasks — such as garment analysis, design generation, pattern drafting, and problem solving — may take <strong>15 to 60 seconds</strong> to complete depending on complexity. Please be patient and <strong>do not close or leave the app</strong> while the AI is working.
        </p>
      </div>
    </div>
  );
}