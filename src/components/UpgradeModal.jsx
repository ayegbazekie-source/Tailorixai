import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Check, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { usePremium } from '@/components/PremiumProvider';
import { initiatePurchase } from '@/lib/amazon-iap';

const BENEFITS = [
  '7-Day Free Trial Included',
  'Unlimited Garment Analysis',
  'Unlimited Fashion Illustrations',
  'Unlimited Fabric Visualizations',
  'Unlock Modify & Convert Styles',
  'Premium Garment Templates',
  'Team Collaboration Workspaces',
  'Priority Support',
];

const REASONS = {
  default: 'Unlock unlimited access to all features',
  adLimit: "You've reached today's free limit",
  locked: 'This feature is Premium only',
  noCredits: 'Out of credits — wait for tomorrow\'s reset or upgrade to Pro',
};

export default function UpgradeModal({ isOpen, onClose, reason = 'default' }) {
  const { isPremiumActive, refreshPremiumStatus } = usePremium();
  const [purchasing, setPurchasing] = useState(false);

  const handleSubscribe = async () => {
    setPurchasing(true);
    try {
      const nativeLaunched = initiatePurchase();
      if (nativeLaunched) {
        // Result arrives via AmazonIAPHandler window.__onAmazonPurchaseSuccess
        onClose();
      } else {
        // Dev/web simulation fallback
        const res = await base44.functions.invoke('verifyAmazonPurchase', {});
        if (res.data?.success) {
          await refreshPremiumStatus();
          onClose();
        }
      }
    } catch (e) {
      console.error('Purchase failed:', e);
    }
    setPurchasing(false);
  };

  if (!isOpen) return null;

  if (isPremiumActive) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-10 max-w-md w-full shadow-2xl border-2 border-amber-400"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 mb-6 shadow-2xl animate-pulse">
                <Crown className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Tailorix AI Pro Active</h2>
              <p className="text-amber-300 text-base mb-8">
                You already have unlimited access to all Tailorix AI Pro features!
              </p>
              <Button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 hover:from-amber-400 hover:to-yellow-400 font-bold py-6 text-lg shadow-xl"
              >
                Continue Using Premium
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[var(--card-bg)] rounded-3xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>

          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Upgrade to Tailorix AI Pro
            </h2>
            <p className="text-[var(--text-secondary)]">{REASONS[reason]}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-2xl p-6 mb-6 border border-amber-200 dark:border-amber-800">
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">$9.99</div>
              <div className="text-sm text-amber-700 dark:text-amber-500">per month</div>
              <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 rounded-full px-3 py-1 inline-block">
                7-day free trial included
              </div>
            </div>

            <div className="space-y-3">
              {BENEFITS.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-[var(--text-primary)]">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSubscribe}
            disabled={purchasing}
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl py-6 text-lg shadow-lg"
          >
            {purchasing ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Zap className="w-5 h-5 mr-2" />
            )}
            {purchasing ? 'Processing...' : 'Start Free Trial'}
          </Button>

          <p className="text-xs text-center text-[var(--text-tertiary)] mt-4">
            Free for 7 days, then $9.99/month. Cancel anytime.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}