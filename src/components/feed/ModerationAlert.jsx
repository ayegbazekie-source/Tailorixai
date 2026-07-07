import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X } from 'lucide-react';

export default function ModerationAlert({ message, onClose }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-rose-200 dark:border-rose-800">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Oops! Community Standards Check ✂️</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs mt-1 leading-relaxed">{message}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              Tailorix AI is a professional fashion community. Please edit your content and try again.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              Got it, I'll edit my post
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}