import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { usePremium } from '@/components/PremiumProvider';
import { ArrowLeft, Crown, Check, Loader2, Sparkles, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initiatePurchase } from '@/lib/amazon-iap';

export default function Payment() {
  const navigate = useNavigate();
  const { user: currentUser, isPremiumActive, refreshPremiumStatus } = usePremium();
  const [processing, setProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubscribe = async () => {
    if (!currentUser) return;
    setProcessing(true);
    try {
      const nativeLaunched = initiatePurchase();
      if (nativeLaunched) {
        // Result comes back via AmazonIAPHandler window.__onAmazonPurchaseSuccess
      } else {
        // Dev/web simulation fallback
        const res = await base44.functions.invoke('verifyAmazonPurchase', {});
        if (res.data?.success) {
          await refreshPremiumStatus();
          setShowSuccessModal(true);
          setTimeout(() => navigate(createPageUrl('PremiumHome'), { replace: true }), 3000);
        }
      }
    } catch (e) {
      console.error('Purchase failed:', e);
    }
    setProcessing(false);
  };

  const benefits = [
    '7-Day Free Trial Included',
    'Unlimited Garment Analysis',
    'Unlimited Fashion Illustrations',
    'Unlimited Fabric Visualizations',
    'Unlock Modify & Convert Styles',
    'Premium Garment Templates',
    'Team Collaboration Workspaces',
    'Priority Support',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--gradient-start)] via-[var(--gradient-middle)] to-[var(--gradient-end)] transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to={createPageUrl(isPremiumActive ? 'PremiumHome' : 'FreeHome')}>
          <Button variant="ghost" className="mb-6 text-[var(--text-secondary)] -ml-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Crown className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
            Upgrade to Premium
          </h1>
          <p className="text-xl text-[var(--text-secondary)]">
            Start your 7-day free trial, then $9.99/month
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Benefits */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="bg-[var(--card-bg)] rounded-3xl p-8 border border-[var(--card-border)] h-full">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">What You Get</h2>
              <div className="space-y-4">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[var(--text-primary)]">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Payment Panel */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="bg-[var(--card-bg)] rounded-3xl p-8 border border-[var(--card-border)] flex flex-col gap-6">

              {/* Product Card */}
              <div className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-2xl border-2 border-amber-200 dark:border-amber-700 text-center">
                <Crown className="w-12 h-12 mx-auto mb-3 text-amber-600" />
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">Tailorix AI Pro</h3>
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-3">$9.99</div>
                <div className="text-sm text-amber-700 dark:text-amber-500">per month</div>
                <div className="mt-2 text-xs text-[var(--text-secondary)] bg-amber-100 dark:bg-amber-900/30 rounded-full px-3 py-1 inline-block">
                  7-day free trial included
                </div>
              </div>

              {/* CTA */}
              {isPremiumActive ? (
                <div className="flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-2 border-amber-400 rounded-2xl">
                  <BadgeCheck className="w-7 h-7 text-amber-500" />
                  <div>
                    <div className="font-bold text-amber-600 dark:text-amber-400 text-lg">Premium Active</div>
                    <div className="text-xs text-[var(--text-secondary)]">You have unlimited access</div>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleSubscribe}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl py-6 text-lg shadow-lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Crown className="w-5 h-5 mr-2" />
                      Start Free Trial
                    </>
                  )}
                </Button>
              )}

              <p className="text-xs text-center text-[var(--text-tertiary)]">
                {isPremiumActive
                  ? '✓ Your subscription is active'
                  : 'Free for 7 days, then $9.99/month. Cancel anytime.'}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <div className="flex items-center justify-center gap-6 text-[var(--text-tertiary)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">7-Day Free Trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span className="text-sm">Instant Activation</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <span className="text-sm">Premium Support</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-10 max-w-sm w-full text-center border-2 border-amber-500/40 shadow-2xl shadow-amber-500/20"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="w-24 h-24 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/40"
              >
                <Crown className="w-12 h-12 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-3">
                🎉 Welcome to<br />
                <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                  Tailorix AI Pro!
                </span>
              </h2>
              <p className="text-amber-200/80 mb-6">
                Your premium subscription is now active. Taking you to your Pro experience...
              </p>
              <div className="flex justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-amber-400 rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.3 }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}