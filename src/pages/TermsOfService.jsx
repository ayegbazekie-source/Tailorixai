import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import AILoadingNotice from '@/components/AILoadingNotice';
import { Button } from '@/components/ui/button';
import { useLegalUrls } from '@/components/useLegalUrls';

const ACCEPT_TIMEOUT_MS = 5000;

export default function TermsOfService() {
  const navigate = useNavigate();
  const [accepting, setAccepting] = useState(false);
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);
  const [error, setError] = useState(null);
  const { privacyPolicyUrl } = useLegalUrls();

  // Check if already accepted — show "Back to Home" button instead of auto-redirecting
  useEffect(() => {
    base44.auth.me().then((user) => {
      if (user?.terms_accepted) setAlreadyAccepted(true);
    }).catch(() => {});
  }, []);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);

    // 5-second countdown — if still on page after it, show refresh prompt
    const slowTimer = setTimeout(() => {
      setError('Taking a bit longer than expected. Please refresh your browser to enter Tailorix AI.');
    }, ACCEPT_TIMEOUT_MS);

    try {
      await base44.auth.updateMe({ terms_accepted: true });
      clearTimeout(slowTimer);
      console.log('[TermsOfService] Terms accepted — redirecting to Home');
      // Force hard redirect to ensure fresh auth state
      window.location.replace('/');
    } catch (err) {
      clearTimeout(slowTimer);
      const statusCode = err?.status || err?.response?.status || 'Network Error';
      console.error(`[TermsOfService] Accept failed — Status: ${statusCode}`, err);
      setError(`Failed to save (${statusCode}). Please try again.`);
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/30 rounded-full text-rose-600 dark:text-rose-400 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Welcome to Tailorix AI
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
              Before You Continue
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Here's how Tailorix AI works — please review before continuing
            </p>
          </div>

          {/* Terms Summary */}
          <div className="space-y-4 mb-8">
            <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-6 border-l-4 border-rose-500">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-rose-500" />
                Daily Free Credits
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                You receive <strong>2 free credits every day</strong> (reset at midnight, Africa/Lagos time) usable across AI Design, Garment Analysis, and Fabric Visualizer.
                <span className="block mt-1 text-sm text-slate-500 dark:text-slate-400">Credits do not roll over. Tailorix AI Chat is always 100% free with no credit cost.</span>
              </p>
            </div>

            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-6 border-l-4 border-violet-500">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-violet-500" />
                Tailorix AI Pro — Unlimited Access
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Upgrade to <strong>Tailorix AI Pro</strong> for unlimited use of all tools, no credit deductions, team collaboration workspaces, and priority AI responses.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                AI-Powered Tools
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Tailorix AI uses advanced AI to power garment analysis, design illustration, and fabric visualization. Results are AI-generated and should be reviewed by a professional tailor before implementation.
              </p>
            </div>

            <AILoadingNotice className="rounded-2xl" />

            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border-l-4 border-emerald-500">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Your Privacy
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Your uploaded images and data are used <strong>only to power your requested AI analysis</strong>. They are not shared with third parties or used for advertising purposes.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Accept / Back Button */}
          {alreadyAccepted ? (
            <Button
              size="lg"
              onClick={() => navigate(createPageUrl('Home'), { replace: true })}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white py-6 text-lg rounded-2xl shadow-lg"
            >
              Back to Home
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleAccept}
              disabled={accepting}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white py-6 text-lg rounded-2xl shadow-lg"
            >
              {accepting ? 'Processing...' : 'I Accept & Continue'}
            </Button>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
            By clicking "I Accept & Continue", you agree to our Terms of Service and Privacy Policy
          </p>
          <p className="text-xs text-center mt-3">
            <a
              href={privacyPolicyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-500 hover:text-rose-600 underline underline-offset-2 font-medium"
            >
              View Full Legal Documents
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}