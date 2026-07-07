import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Send, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-2 justify-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
        >
          <Star
            className={`w-9 h-9 transition-all ${star <= (hovered || value) ? 'fill-amber-400 text-amber-400 scale-110' : 'fill-transparent text-slate-400'}`}
          />
        </button>
      ))}
    </div>
  );
}

/**
 * Usage: <RateReviewModal trigger={true} onDismiss={() => {}} />
 * Set trigger=true after a successful task (e.g. pattern generated).
 * The component handles frequency capping internally via localStorage.
 */
export default function RateReviewModal({ trigger, onDismiss, isPremiumActive }) {
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    shouldShow().then(show => { if (show) setVisible(true); });
  }, [trigger]);

  const shouldShow = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) return false;

      // Check if user already has a review
      const reviews = await base44.entities.Review.filter({ user_id: user.id }, '-created_date', 1);
      if (reviews.length > 0) {
        // Has reviewed — only re-prompt after 6 months
        const lastReviewed = new Date(reviews[0].created_date).getTime();
        if (Date.now() - lastReviewed < SIX_MONTHS_MS) return false;
      } else {
        // No review yet — throttle using localStorage (max once per week)
        const lastPrompt = parseInt(localStorage.getItem('tailorix_review_prompt') || '0', 10);
        if (Date.now() - lastPrompt < 7 * 24 * 60 * 60 * 1000) return false;
        localStorage.setItem('tailorix_review_prompt', Date.now().toString());
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!rating) return;
    setPosting(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.Review.create({
        user_id: user.id,
        user_name: user.full_name || user.email?.split('@')[0] || 'User',
        is_premium: isPremiumActive,
        rating,
        comment: comment.trim(),
      });
      setDone(true);
      setTimeout(() => { setVisible(false); onDismiss?.(); }, 1800);
    } catch (e) {
      console.error(e);
    }
    setPosting(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  const cardBg = isPremiumActive
    ? 'bg-gradient-to-br from-[#1a1a2e] to-[#111127] border-amber-500/20'
    : 'bg-white border-slate-200';
  const titleColor = isPremiumActive ? 'text-white' : 'text-slate-900';
  const subColor = isPremiumActive ? 'text-slate-400' : 'text-slate-500';
  const inputCls = isPremiumActive
    ? 'bg-slate-800 border-slate-600 text-white placeholder:text-slate-500'
    : '';
  const btnCls = isPremiumActive
    ? 'bg-amber-500 hover:bg-amber-400 text-black font-bold'
    : 'bg-rose-500 hover:bg-rose-600 text-white';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.35 }}
            className={`relative w-full max-w-sm rounded-3xl border p-6 shadow-2xl ${cardBg}`}
          >
            <button
              onClick={handleDismiss}
              className={`absolute top-4 right-4 p-1 rounded-full ${isPremiumActive ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <X className="w-5 h-5" />
            </button>

            {done ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className={`text-lg font-bold mb-1 ${titleColor}`}>Thank you!</h3>
                <p className={`text-sm ${subColor}`}>Your review helps the Tailorix community grow.</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-5">
                  <div className="text-3xl mb-2">✂️</div>
                  <h3 className={`text-lg font-bold mb-1 ${titleColor}`}>Enjoying Tailorix AI?</h3>
                  <p className={`text-sm ${subColor}`}>Take a moment to share your experience with the community.</p>
                </div>

                <StarRating value={rating} onChange={setRating} />

                {rating > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4"
                  >
                    <Textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="What do you love? What could be better?"
                      className={`min-h-[80px] mb-3 text-sm resize-none ${inputCls}`}
                    />
                    <Button
                      onClick={handleSubmit}
                      disabled={posting || !rating}
                      className={`w-full ${btnCls}`}
                    >
                      {posting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Posting...</> : <><Send className="w-4 h-4 mr-2" />Submit Review</>}
                    </Button>
                  </motion.div>
                )}

                <button
                  onClick={handleDismiss}
                  className={`w-full mt-3 text-xs text-center ${subColor} hover:underline`}
                >
                  Maybe later
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}