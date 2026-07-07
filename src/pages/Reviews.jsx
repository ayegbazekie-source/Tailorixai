import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { usePremium } from '@/components/PremiumProvider';
import { Star, Crown, ArrowLeft, Send, Loader2, MessageSquare, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

function StarRating({ value, onChange, readonly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0);
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-7 h-7';
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={readonly ? 'cursor-default' : 'cursor-pointer focus:outline-none'}
        >
          <Star
            className={`${sz} transition-colors ${
              star <= (hovered || value)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-transparent text-slate-500'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review, isAdmin, isPremiumActive, onAdminReply }) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState(review.admin_response || '');
  const [saving, setSaving] = useState(false);

  const handleSaveReply = async () => {
    setSaving(true);
    await onAdminReply(review.id, replyText);
    setSaving(false);
    setReplying(false);
  };

  const cardBg = isPremiumActive
    ? 'bg-[#1e1e1e] border-slate-700'
    : 'bg-[var(--card-bg)] border-[var(--card-border)]';

  const nameCls = isPremiumActive ? 'text-white' : 'text-[var(--text-primary)]';
  const commentCls = isPremiumActive ? 'text-slate-300' : 'text-[var(--text-secondary)]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-2xl p-5 ${cardBg}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-black font-bold text-sm">
            {review.user_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold text-sm ${nameCls}`}>{review.user_name}</span>
              {review.is_premium && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <Crown className="w-3 h-3" /> Bespoke
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs">{new Date(review.created_date).toLocaleDateString()}</p>
          </div>
        </div>
        <StarRating value={review.rating} readonly size="sm" />
      </div>

      {/* Comment */}
      <p className={`text-sm leading-relaxed mb-3 ${commentCls}`}>{review.comment}</p>

      {/* Admin Response */}
      {review.admin_response && (
        <div className="border border-amber-500/50 bg-amber-500/5 rounded-xl p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wide">Official Response</span>
            {review.response_at && (
              <span className="text-slate-500 text-xs ml-auto">{new Date(review.response_at).toLocaleDateString()}</span>
            )}
          </div>
          <p className="text-amber-100/80 text-sm leading-relaxed">{review.admin_response}</p>
        </div>
      )}

      {/* Admin Reply Controls */}
      {isAdmin && (
        <div className="mt-2">
          {replying ? (
            <div className="space-y-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your official response..."
                className="bg-slate-800 border-slate-600 text-white text-sm min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveReply}
                  disabled={saving || !replyText.trim()}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold border-none"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save Response'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setReplying(false)} className="text-slate-400">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReplying(true)}
              className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 text-xs"
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              {review.admin_response ? 'Edit Response' : 'Reply'}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function Reviews() {
  const { user, isPremiumActive } = usePremium();
  const isAdmin = user?.role === 'admin';

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [myExistingReview, setMyExistingReview] = useState(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const highlightId = new URLSearchParams(window.location.search).get('highlight');
  const highlightRef = useRef(null);

  useEffect(() => {
    loadReviews();
  }, []);

  // Scroll to highlighted review after load
  useEffect(() => {
    if (!loading && highlightId && highlightRef.current) {
      setTimeout(() => highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    }
  }, [loading, highlightId]);

  const loadReviews = async () => {
    setLoading(true);
    const all = await base44.entities.Review.list('-created_date', 200);
    // Pin top reviews (4-5 stars) first, then the rest by date
    const top = all.filter(r => r.rating >= 4).sort((a, b) => b.rating - a.rating);
    const rest = all.filter(r => r.rating < 4).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    setReviews([...top, ...rest]);
    if (user) {
      const mine = all.find((r) => r.user_id === user.id);
      if (mine) {
        setMyExistingReview(mine);
        setMyRating(mine.rating);
        setMyComment(mine.comment);
      }
    }
    setLoading(false);
  };

  const handlePost = async () => {
    if (!myRating || !myComment.trim()) return;
    setPosting(true);
    const payload = {
      user_id: user.id,
      user_name: user.full_name || user.email?.split('@')[0] || 'User',
      is_premium: isPremiumActive,
      rating: myRating,
      comment: myComment.trim(),
    };
    let reviewId;
    if (myExistingReview) {
      await base44.entities.Review.update(myExistingReview.id, payload);
      reviewId = myExistingReview.id;
    } else {
      const created = await base44.entities.Review.create(payload);
      reviewId = created.id;
      // Notify all admin users about the new review
      try {
        const admins = await base44.entities.User.filter({ role: 'admin' });
        const stars = '⭐'.repeat(myRating);
        admins.forEach(admin => {
          if (admin.id === user.id) return;
          base44.entities.Notification.create({
            recipient_id: admin.id,
            actor_name: payload.user_name,
            actor_id: user.id,
            type: 'review_response',
            post_id: reviewId,
            post_preview: `${stars} "${myComment.trim().substring(0, 50)}"`,
            post_image_url: '',
            is_read: false,
          }).catch(() => {});
        });
      } catch (e) { console.error(e); }
    }
    await loadReviews();
    setPosting(false);
  };

  const handleAdminReply = async (reviewId, text) => {
    const review = reviews.find(r => r.id === reviewId);
    await base44.entities.Review.update(reviewId, {
      admin_response: text,
      response_at: new Date().toISOString(),
    });
    // Notify the review author
    if (review && review.user_id) {
      base44.entities.Notification.create({
        recipient_id: review.user_id,
        actor_name: 'Tailorix AI Team',
        actor_id: 'admin',
        type: 'review_response',
        post_id: reviewId, // used by NotificationBell to redirect to the review
        post_preview: (review.comment || '').substring(0, 60),
        post_image_url: '',
        is_read: false,
      }).catch(() => {});
    }
    await loadReviews();
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const bgCls = isPremiumActive ? 'bg-[#121212]' : 'bg-[var(--bg-primary)]';
  const titleCls = isPremiumActive ? 'text-white' : 'text-[var(--text-primary)]';
  const subtitleCls = isPremiumActive ? 'text-slate-400' : 'text-[var(--text-secondary)]';
  const formBgCls = isPremiumActive
    ? 'bg-[#1e1e1e] border-amber-500/30'
    : 'bg-[var(--card-bg)] border-[var(--card-border)]';
  const inputCls = isPremiumActive
    ? 'bg-slate-800 border-slate-600 text-white placeholder:text-slate-500'
    : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)]';
  const submitBtnCls = isPremiumActive
    ? 'bg-amber-500 hover:bg-amber-600 text-black font-bold border-none'
    : 'bg-rose-500 hover:bg-rose-600 text-white border-none';
  const backBtnCls = isPremiumActive ? 'text-slate-400 hover:text-white' : 'text-[var(--text-secondary)]';

  return (
    <div className={`min-h-screen py-10 px-4 ${bgCls}`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to={createPageUrl('UserProfile')}>
            <Button variant="ghost" size="icon" className={backBtnCls}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className={`text-2xl font-bold ${titleCls}`}>Reviews</h1>
            <p className={`text-sm ${subtitleCls}`}>What tailors are saying about Tailorix AI</p>
          </div>
          {avgRating && (
            <div className="ml-auto flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-xl">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="text-amber-400 font-bold text-lg">{avgRating}</span>
              <span className={`text-xs ${subtitleCls}`}>/ 5</span>
            </div>
          )}
        </div>

        {/* Post / Edit Review */}
        <div className={`border rounded-2xl p-6 mb-8 ${formBgCls}`}>
          <h2 className={`font-semibold mb-4 ${titleCls}`}>
            {myExistingReview ? 'Update Your Review' : 'Leave a Review'}
          </h2>
          <div className="mb-4">
            <p className={`text-sm mb-2 ${subtitleCls}`}>Your Rating</p>
            <StarRating value={myRating} onChange={setMyRating} />
          </div>
          <Textarea
            value={myComment}
            onChange={(e) => setMyComment(e.target.value)}
            placeholder="Share your experience with Tailorix AI..."
            className={`min-h-[100px] mb-4 ${inputCls}`}
          />
          <Button
            onClick={handlePost}
            disabled={posting || !myRating || !myComment.trim()}
            className={`w-full ${submitBtnCls}`}
          >
            {posting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting...</>
            ) : (
              <><Send className="w-4 h-4 mr-2" /> {myExistingReview ? 'Update Review' : 'Post Review'}</>
            )}
          </Button>
        </div>

        {/* Review List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className={`w-8 h-8 animate-spin ${isPremiumActive ? 'text-amber-400' : 'text-rose-500'}`} />
          </div>
        ) : reviews.length === 0 ? (
          <div className={`text-center py-16 ${subtitleCls}`}>
            <Star className={`w-12 h-12 mx-auto mb-3 ${isPremiumActive ? 'text-slate-700' : 'text-[var(--text-tertiary)]'}`} />
            <p>No reviews yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className={`text-sm ${subtitleCls}`}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
            <AnimatePresence>
              {reviews.slice(0, visibleCount).map((review) => (
                <div
                  key={review.id}
                  ref={review.id === highlightId ? highlightRef : null}
                  className={review.id === highlightId ? 'ring-2 ring-amber-400 ring-offset-2 rounded-2xl' : ''}
                >
                  <ReviewCard
                    review={review}
                    isAdmin={isAdmin}
                    isPremiumActive={isPremiumActive}
                    onAdminReply={handleAdminReply}
                  />
                </div>
              ))}
            </AnimatePresence>
            {visibleCount < reviews.length && (
              <button
                onClick={() => setVisibleCount(v => v + 10)}
                className={`w-full py-3 rounded-xl border text-sm font-semibold transition-colors ${isPremiumActive ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10' : 'border-rose-300 text-rose-500 hover:bg-rose-50'}`}
              >
                See More ({reviews.length - visibleCount} remaining)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}