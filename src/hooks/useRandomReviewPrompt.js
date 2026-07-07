import { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Returns { reviewTrigger, triggerReview, resetReviewTrigger }
 * Call triggerReview() after any successful task completion.
 * It randomly fires ~30% of the time (for users who haven't reviewed,
 * respecting the 1-week throttle) or ~10% (after review, respecting 6-month window).
 */
export function useRandomReviewPrompt() {
  const [reviewTrigger, setReviewTrigger] = useState(false);

  const triggerReview = useCallback(async () => {
    try {
      const user = await base44.auth.me();
      if (!user) return;

      const reviews = await base44.entities.Review.filter({ user_id: user.id }, '-created_date', 1);

      if (reviews.length > 0) {
        // Already reviewed — only re-prompt after 6 months, and only 10% chance
        const lastReviewed = new Date(reviews[0].created_date).getTime();
        if (Date.now() - lastReviewed < SIX_MONTHS_MS) return;
        if (Math.random() > 0.10) return;
      } else {
        // No review yet — throttle to once per week, 30% chance each eligible task
        const lastPrompt = parseInt(localStorage.getItem('tailorix_review_prompt') || '0', 10);
        if (Date.now() - lastPrompt < ONE_WEEK_MS) return;
        if (Math.random() > 0.30) return;
        localStorage.setItem('tailorix_review_prompt', Date.now().toString());
      }

      setReviewTrigger(true);
    } catch {
      // silently ignore
    }
  }, []);

  const resetReviewTrigger = useCallback(() => setReviewTrigger(false), []);

  return { reviewTrigger, triggerReview, resetReviewTrigger };
}