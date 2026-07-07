import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Send, Loader2, MessageCircle, User, Crown, Lock, Heart, CornerDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { checkContent } from '@/lib/contentFilter';
import ModerationAlert from '@/components/feed/ModerationAlert';

// ─── Upgrade Bottom Sheet ─────────────────────────────────────────────────────
function ReplyUpgradeSheet({ onClose, isPremiumActive }) {
  return (
    <div className="fixed inset-0 z-[500] bg-black/70 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl p-6 pb-10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-5" />
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Crown className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Want to join the conversation?</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
          Upgrade to <strong>Tailorix AI Pro</strong> to reply to threads and connect directly with other creators in the community.
        </p>
        <button
          onClick={() => { onClose(); window.location.href = '/Payment'; }}
          className="w-full py-3.5 rounded-2xl font-bold text-base bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 hover:opacity-90 transition-opacity"
        >
          Upgrade to Pro
        </button>
        <button onClick={onClose} className="w-full mt-3 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
          Maybe later
        </button>
      </div>
    </div>
  );
}

// ─── Comment Item ─────────────────────────────────────────────────────────────
function CommentItem({ comment, currentUser, isPremiumActive, onReply, onLikeComment }) {
  const isLiked = currentUser && (comment.liked_by || []).includes(currentUser.id);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [postingReply, setPostingReply] = useState(false);

  const subColor = isPremiumActive ? 'text-slate-400' : 'text-slate-500';

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    setPostingReply(true);
    await onReply(comment, replyText.trim());
    setReplyText('');
    setShowReplyInput(false);
    setPostingReply(false);
  };

  return (
    <div className="flex items-start gap-2.5">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isPremiumActive ? 'bg-amber-500/20' : 'bg-rose-100'}`}>
        <User className={`w-3.5 h-3.5 ${isPremiumActive ? 'text-amber-400' : 'text-rose-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold ${isPremiumActive ? 'text-slate-300' : 'text-slate-700'}`}>{comment.user_name}</p>
        <p className={`text-sm mt-0.5 ${isPremiumActive ? 'text-slate-400' : 'text-slate-600'}`}>{comment.comment}</p>

        {/* Action row */}
        <div className="flex items-center gap-3 mt-1.5">
          {/* Like comment — all users */}
          <button
            onClick={() => onLikeComment(comment)}
            className={`flex items-center gap-1 text-[11px] transition-colors ${
              isLiked
                ? 'text-rose-500'
                : isPremiumActive ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Heart className={`w-3 h-3 ${isLiked ? 'fill-rose-500' : ''}`} />
            {(comment.likes || 0) > 0 && <span>{comment.likes}</span>}
          </button>

          {/* Reply button */}
          {isPremiumActive ? (
            <button
              onClick={() => setShowReplyInput(v => !v)}
              className={`flex items-center gap-1 text-[11px] transition-colors ${isPremiumActive ? 'text-slate-500 hover:text-amber-400' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <CornerDownRight className="w-3 h-3" />
              Reply
            </button>
          ) : (
            <button
              onClick={() => onReply(comment, null)} // null signals "show upgrade sheet"
              className="flex items-center gap-1 text-[11px] text-slate-400 opacity-60 cursor-pointer"
            >
              <CornerDownRight className="w-3 h-3" />
              Reply
              <Crown className="w-2.5 h-2.5 text-amber-500 ml-0.5" />
            </button>
          )}
        </div>

        {/* Reply input — premium only */}
        {isPremiumActive && showReplyInput && (
          <div className="flex items-center gap-2 mt-2">
            <input
              autoFocus
              type="text"
              className="flex-1 rounded-xl px-3 py-1.5 text-xs border outline-none bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              placeholder={`Reply to ${comment.user_name}...`}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleReplySubmit()}
            />
            <button
              onClick={handleReplySubmit}
              disabled={postingReply || !replyText.trim()}
              className="p-1.5 rounded-lg bg-amber-500 text-slate-900 disabled:opacity-50"
            >
              {postingReply ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            </button>
          </div>
        )}

        {/* Replies (threaded) */}
        {(comment.replies || []).length > 0 && (
          <div className="mt-2 space-y-2 pl-3 border-l-2 border-slate-200 dark:border-slate-700">
            {comment.replies.map((reply, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isPremiumActive ? 'bg-amber-500/20' : 'bg-rose-100'}`}>
                  <User className={`w-2.5 h-2.5 ${isPremiumActive ? 'text-amber-400' : 'text-rose-500'}`} />
                </div>
                <div>
                  <p className={`text-[11px] font-bold ${isPremiumActive ? 'text-slate-300' : 'text-slate-700'}`}>{reply.user_name}</p>
                  <p className={`text-xs ${isPremiumActive ? 'text-slate-400' : 'text-slate-600'}`}>{reply.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function FeedCommentModal({ post, currentUser, onClose, isPremiumActive, onCommentPosted, onCommentCountChange }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [moderationMsg, setModerationMsg] = useState(null);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);

  const cardBg = isPremiumActive ? 'bg-[#121212]' : 'bg-white';
  const titleColor = isPremiumActive ? 'text-white' : 'text-slate-900';
  const subColor = isPremiumActive ? 'text-slate-400' : 'text-slate-500';
  const inputCls = isPremiumActive
    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
    : 'bg-slate-50 border-slate-200 text-slate-900';

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.DesignComment.filter({ design_id: post.id }, '-created_date', 50);
      setComments(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handlePost = async () => {
    if (!text.trim() || !currentUser) return;
    const { blocked, reason } = checkContent(text.trim());
    if (blocked) { setModerationMsg(reason); return; }
    setPosting(true);
    try {
      const newComment = await base44.entities.DesignComment.create({
        design_id: post.id,
        user_id: currentUser.id,
        user_name: currentUser.full_name || 'User',
        comment: text.trim(),
        likes: 0,
        liked_by: [],
        replies: [],
      });
      const updatedComments = [newComment, ...comments];
      setComments(updatedComments);
      setText('');
      // Update comment_count on the post entity so feed cards reflect it immediately
      const newCount = updatedComments.length + updatedComments.reduce((sum, c) => sum + (c.replies?.length || 0), 0);
      base44.entities.InspirationPost.update(post.id, { comment_count: newCount }).catch(console.error);
      if (onCommentCountChange) onCommentCountChange(post.id, newCount);
      if (onCommentPosted) onCommentPosted(post);
    } catch (e) {
      console.error(e);
    }
    setPosting(false);
  };

  // Like a comment — all users
  const handleLikeComment = async (comment) => {
    if (!currentUser) return;
    const alreadyLiked = (comment.liked_by || []).includes(currentUser.id);
    const newLikedBy = alreadyLiked
      ? (comment.liked_by || []).filter(id => id !== currentUser.id)
      : [...(comment.liked_by || []), currentUser.id];
    const updated = { ...comment, liked_by: newLikedBy, likes: newLikedBy.length };
    setComments(prev => prev.map(c => c.id === comment.id ? updated : c));
    base44.entities.DesignComment.update(comment.id, { liked_by: newLikedBy, likes: newLikedBy.length }).catch(console.error);
  };

  // Reply to a comment — premium only; null replyText = free user clicked → show upgrade
  const handleReply = async (comment, replyText) => {
    if (!isPremiumActive || replyText === null) {
      setShowUpgradeSheet(true);
      return;
    }
    if (!currentUser || !replyText.trim()) return;
    const newReply = { user_name: currentUser.full_name || 'User', text: replyText.trim(), created_at: new Date().toISOString() };
    const updatedReplies = [...(comment.replies || []), newReply];
    const updatedComment = { ...comment, replies: updatedReplies };
    setComments(prev => prev.map(c => c.id === comment.id ? updatedComment : c));
    base44.entities.DesignComment.update(comment.id, { replies: updatedReplies }).catch(console.error);
  };

  return (
    <>
      <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
        <div
          className={`relative w-full max-w-lg rounded-t-3xl md:rounded-2xl ${cardBg} shadow-2xl flex flex-col`}
          style={{ maxHeight: '85vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-5 pt-5 pb-3 border-b ${isPremiumActive ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <MessageCircle className={`w-5 h-5 ${isPremiumActive ? 'text-amber-400' : 'text-rose-500'}`} />
              <span className={`font-bold text-base ${titleColor}`}>Comments</span>
              <span className={`text-xs ${subColor}`}>({comments.length})</span>
            </div>
            <button onClick={onClose}><X className={`w-5 h-5 ${subColor}`} /></button>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className={`w-6 h-6 animate-spin ${isPremiumActive ? 'text-amber-400' : 'text-rose-500'}`} />
              </div>
            ) : comments.length === 0 ? (
              <p className={`text-center text-sm py-8 ${subColor}`}>No comments yet. Be the first! ✂️</p>
            ) : (
              comments.map(c => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  currentUser={currentUser}
                  isPremiumActive={isPremiumActive}
                  onReply={handleReply}
                  onLikeComment={handleLikeComment}
                />
              ))
            )}
          </div>

          {/* Comment input — all users */}
          <div className={`px-4 py-3 border-t flex items-center gap-2 ${isPremiumActive ? 'border-slate-800' : 'border-slate-100'}`}>
            <input
              type="text"
              className={`flex-1 rounded-xl px-3 py-2 text-sm border outline-none ${inputCls}`}
              placeholder="Write a comment... ✂️"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePost()}
            />
            <Button
              size="icon"
              onClick={handlePost}
              disabled={posting || !text.trim()}
              className={isPremiumActive ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-rose-500 hover:bg-rose-600 text-white'}
            >
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>

          {/* Free user hint */}
          {!isPremiumActive && (
            <div className={`px-4 py-2 text-center border-t border-slate-100`}>
              <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <Crown className="w-3 h-3 text-amber-500" />
                Upgrade to Pro to reply in threads & remix designs
              </p>
            </div>
          )}
        </div>
      </div>

      {showUpgradeSheet && (
        <ReplyUpgradeSheet
          onClose={() => setShowUpgradeSheet(false)}
          isPremiumActive={isPremiumActive}
        />
      )}

      <ModerationAlert message={moderationMsg} onClose={() => setModerationMsg(null)} />
    </>
  );
}