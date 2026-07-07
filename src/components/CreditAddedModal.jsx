import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CreditAddedModal({ isOpen, onClose, adsWatched, maxAds }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-[var(--card-bg)] rounded-3xl p-10 max-w-sm w-full shadow-2xl text-center"
        >
          {/* Animated checkmark circle */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
            className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30"
          >
            <Check className="w-12 h-12 text-white" strokeWidth={3} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">✅ Credit Added!</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-2">
              1 Design Credit has been added to your account. You can now safely close the ad tab and continue designing.
            </p>
            {adsWatched != null && maxAds != null && (
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                {adsWatched} / {maxAds} bonus credits earned today
              </p>
            )}
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl py-3 text-base font-semibold shadow-lg shadow-green-500/20"
            >
              Continue Designing
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}