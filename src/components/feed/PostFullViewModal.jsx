import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import {
  X, Heart, MessageCircle, Share2, Download, Shuffle,
  Send, Loader2, User, Lock, Crown, Scissors, Wand2, Trash2,
  CornerDownRight, ChevronDown, MoreHorizontal, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ShareMenu from '@/components/feed/ShareMenu';
import ModerationAlert from '@/components/feed/ModerationAlert';
import { checkContent } from '@/lib/contentFilter';

// ─── Count all engagements (comments + their replies) ────────────────────────
function totalEngagement(commentsList) {
  return commentsList.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);
}

// ─── Upgrade Bottom Sheet ─────────────────────────────────────────────────────
function ReplyUpgradeSheet({ onClose }) {
  return (
    <div className="fixed inset-0 z-[600] bg-black/70 flex items-end justify-center" onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl p-6 pb-10 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-5" />
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Crown className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Want to join the conversation?</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
          Upgrade to <strong>Tailorix AI Pro</strong> to reply to threads and connect with other creators.
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

// ─── Source Badge ─────────────────────────────────────────────────────────────
function SourceBadge({ designType }) {
  const isPattern = designType === 'pattern';
  return isPattern ? (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
      <Scissors className="w-3 h-3" /> Pattern
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-rose-50 text-rose-600 border border-rose-200">
      <Wand2 className="w-3 h-3" /> Illustration
    </span>
  );
}

// ─── Three-dot Menu ───────────────────────────────────────────────────────────
function ThreeDotMenu({ onEdit, onDelete, isPremiumActive }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative flex-shrink-0" ref={menuRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="p-1 rounded-full text-slate-400 hover:text-slate-500 transition-colors"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className={`absolute right-0 top-6 z-50 min-w-[110px] rounded-xl shadow-lg border overflow-hidden ${isPremiumActive ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          {onEdit && (
            <button
              onClick={() => { onEdit(); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${isPremiumActive ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
          )}
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Reply Item — like + delete ───────────────────────────────────────────────
function ReplyItem({ reply, replyIndex, comment, currentUser, isPremiumActive, titleColor, commentColor, onDeleteReply, onLikeReply, onEditReply }) {
  const isOwner = currentUser && (currentUser.id === reply.user_id || currentUser.role === 'admin');
  const isLiked = currentUser && (reply.liked_by || []).includes(currentUser.id);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(reply.text);

  return (
    <div className="flex items-start gap-2">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isPremiumActive ? 'bg-amber-500/20' : 'bg-rose-100'}`}>
        <User className={`w-2.5 h-2.5 ${isPremiumActive ? 'text-amber-400' : 'text-rose-500'}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-1">
          <p className={`text-[11px] font-bold ${titleColor}`}>{reply.user_name}</p>
          {isOwner && (
            <ThreeDotMenu
              isPremiumActive={isPremiumActive}
              onEdit={() => setEditing(true)}
              onDelete={() => onDeleteReply(comment, replyIndex)}
            />
          )}
        </div>
        {editing ? (
          <div className="flex items-center gap-1 mt-1">
            <input
              autoFocus
              type="text"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { onEditReply(comment, replyIndex, editText); setEditing(false); }
                if (e.key === 'Escape') setEditing(false);
              }}
              className={`flex-1 text-xs rounded-lg px-2 py-1 border outline-none ${isPremiumActive ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
            />
            <button onClick={() => { onEditReply(comment, replyIndex, editText); setEditing(false); }} className={`text-[10px] px-2 py-1 rounded-lg font-semibold ${isPremiumActive ? 'bg-amber-500 text-black' : 'bg-rose-500 text-white'}`}>Save</button>
          </div>
        ) : (
          <p className={`text-xs mt-0.5 ${commentColor}`}>{reply.text}</p>
        )}
        <button
          onClick={() => onLikeReply(comment, replyIndex)}
          className={`flex items-center gap-1 text-[10px] mt-1 transition-colors ${
            isLiked ? 'text-rose-500' : isPremiumActive ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Heart className={`w-2.5 h-2.5 ${isLiked ? 'fill-rose-500' : ''}`} />
          {(reply.likes || 0) > 0 && <span>{reply.likes}</span>}
          <span>Like</span>
        </button>
      </div>
    </div>
  );
}

// ─── Comment Item ─────────────────────────────────────────────────────────────
function CommentItem({ comment, currentUser, isPremiumActive, panelBg, onLike, onReply, onDelete, onDeleteReply, onLikeReply, onEditComment, onEditReply }) {
  const isLiked = currentUser && (comment.liked_by || []).includes(currentUser.id);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [postingReply, setPostingReply] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.comment);

  const titleColor = isPremiumActive ? 'text-slate-300' : 'text-slate-700';
  const commentColor = isPremiumActive ? 'text-slate-400' : 'text-slate-600';
  const isOwner = currentUser && (currentUser.id === comment.user_id || currentUser.role === 'admin');

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    setPostingReply(true);
    await onReply(comment, replyText.trim());
    setReplyText('');
    setShowReplyInput(false);
    setPostingReply(false);
  };

  return (
    <div className="flex items-start gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isPremiumActive ? 'bg-amber-500/20' : 'bg-rose-100'}`}>
        <User className={`w-3.5 h-3.5 ${isPremiumActive ? 'text-amber-400' : 'text-rose-500'}`} />
      </div>
      <div className={`rounded-2xl px-3 py-2.5 flex-1 ${panelBg}`}>
        {/* Name + three-dot menu */}
        <div className="flex items-center justify-between gap-1 mb-1">
          <p className={`text-xs font-bold ${titleColor}`}>{comment.user_name}</p>
          {isOwner && (
            <ThreeDotMenu
              isPremiumActive={isPremiumActive}
              onEdit={() => setEditing(true)}
              onDelete={() => onDelete(comment)}
            />
          )}
        </div>

        {/* Comment text or edit input */}
        {editing ? (
          <div className="flex items-center gap-1 mt-1 mb-1">
            <input
              autoFocus
              type="text"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { onEditComment(comment, editText); setEditing(false); }
                if (e.key === 'Escape') setEditing(false);
              }}
              className={`flex-1 text-sm rounded-lg px-2 py-1 border outline-none ${isPremiumActive ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
            />
            <button onClick={() => { onEditComment(comment, editText); setEditing(false); }} className={`text-xs px-2 py-1 rounded-lg font-semibold ${isPremiumActive ? 'bg-amber-500 text-black' : 'bg-rose-500 text-white'}`}>Save</button>
          </div>
        ) : (
          <p className={`text-sm leading-snug ${commentColor}`}>{comment.comment}</p>
        )}

        {/* Like + Reply actions */}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => onLike(comment)}
            className={`flex items-center gap-1 text-[11px] font-semibold transition-colors ${
              isLiked ? 'text-rose-500' : isPremiumActive ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Heart className={`w-3 h-3 ${isLiked ? 'fill-rose-500' : ''}`} />
            {(comment.likes || 0) > 0 && <span className="mr-0.5">{comment.likes}</span>}
            Like
          </button>

          {isPremiumActive ? (
            <button
              onClick={() => setShowReplyInput(v => !v)}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-amber-400 transition-colors"
            >
              <CornerDownRight className="w-3 h-3" /> Reply
            </button>
          ) : (
            <button
              onClick={() => onReply(comment, null)}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
            >
              <CornerDownRight className="w-3 h-3" /> Reply <Crown className="w-2.5 h-2.5 text-amber-500" />
            </button>
          )}
        </div>

        {/* Reply input */}
        {isPremiumActive && showReplyInput && (
          <div className="flex items-center gap-2 mt-2">
            <input
              autoFocus
              type="text"
              className={`flex-1 rounded-xl px-3 py-1.5 text-xs border outline-none ${
                isPremiumActive
                  ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
              placeholder={`Reply to ${comment.user_name}...`}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleReplySubmit()}
            />
            <button
              onClick={handleReplySubmit}
              disabled={postingReply || !replyText.trim()}
              className={`p-1.5 rounded-lg disabled:opacity-50 ${isPremiumActive ? 'bg-amber-500 text-slate-900' : 'bg-rose-500 text-white'}`}
            >
              {postingReply ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            </button>
          </div>
        )}

        {/* Threaded replies — each with like + delete */}
        {(comment.replies || []).length > 0 && (
          <div className="mt-3 space-y-3 pl-3 border-l-2 border-slate-200 dark:border-slate-700">
            {comment.replies.map((reply, i) => (
              <ReplyItem
                key={i}
                reply={reply}
                replyIndex={i}
                comment={comment}
                currentUser={currentUser}
                isPremiumActive={isPremiumActive}
                titleColor={titleColor}
                commentColor={commentColor}
                onDeleteReply={onDeleteReply}
                onLikeReply={onLikeReply}
                onEditReply={onEditReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function PostFullViewModal({
  post, currentUser, isPremiumActive,
  onClose, onLike, onRemix, onDelete, onCommentPosted, onCommentCountChange
}) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [posting, setPosting] = useState(false);
  const [imageCollapsed, setImageCollapsed] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [moderationMsg, setModerationMsg] = useState(null);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);
  const [postError, setPostError] = useState(null);
  const [zoomImage, setZoomImage] = useState(false);
  const commentsScrollRef = useRef(null);

  const isLiked = currentUser && (localPost.liked_by || []).includes(currentUser.id);

  const cardBg = isPremiumActive ? 'bg-[#1a1a2e]' : 'bg-white';
  const panelBg = isPremiumActive ? 'bg-[#111127]' : 'bg-slate-100';
  const titleColor = isPremiumActive ? 'text-white' : 'text-slate-900';
  const subColor = isPremiumActive ? 'text-slate-400' : 'text-slate-500';
  const borderCls = isPremiumActive ? 'border-slate-700/60' : 'border-slate-200';
  const inputCls = isPremiumActive
    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
    : 'bg-white border-slate-200 text-slate-900';
  const accentCls = isPremiumActive ? 'text-amber-400' : 'text-rose-500';
  const tagCls = isPremiumActive ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600';

  useEffect(() => { loadComments(); }, []);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const data = await base44.entities.DesignComment.filter({ design_id: post.id }, '-created_date', 50);
      setComments(data);
    } catch (e) { console.error(e); }
    setLoadingComments(false);
  };

  // Sync engagement count (comments + replies) back to feed AND persist to entity
  const syncCount = (updatedComments) => {
    const count = totalEngagement(updatedComments);
    if (onCommentCountChange) onCommentCountChange(post.id, count);
    base44.entities.InspirationPost.update(post.id, { comment_count: count }).catch(console.error);
  };

  // Sync count only after load completes (not on every keystroke/optimistic update)
  const didInitialLoad = React.useRef(false);
  useEffect(() => {
    if (loadingComments) return;
    if (!didInitialLoad.current) {
      didInitialLoad.current = true;
      syncCount(comments);
    }
  }, [loadingComments]);

  // ── Scroll handler: collapse image when scrolling down, expand at top ────────
  const handleCommentsScroll = (e) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop > 30 && !imageCollapsed) setImageCollapsed(true);
    if (scrollTop <= 5 && imageCollapsed) setImageCollapsed(false);
  };

  const handleLikeLocal = async () => {
    if (!currentUser) return;
    const alreadyLiked = (localPost.liked_by || []).includes(currentUser.id);
    const newLikedBy = alreadyLiked
      ? (localPost.liked_by || []).filter(id => id !== currentUser.id)
      : [...(localPost.liked_by || []), currentUser.id];
    const updated = { ...localPost, liked_by: newLikedBy, likes: newLikedBy.length };
    setLocalPost(updated);
    onLike(updated);
    base44.entities.InspirationPost.update(post.id, { liked_by: newLikedBy, likes: newLikedBy.length }).catch(console.error);
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || !currentUser) return;
    const { blocked, reason } = checkContent(commentText.trim());
    if (blocked) { setModerationMsg(reason); return; }
    setPosting(true);
    setPostError(null);
    const optimistic = {
      id: `temp-${Date.now()}`,
      design_id: post.id,
      user_id: currentUser.id,
      user_name: currentUser.full_name || 'User',
      comment: commentText.trim(),
      likes: 0, liked_by: [], replies: [],
      created_date: new Date().toISOString(),
    };
    const savedText = commentText;
    setCommentText('');
    const updated = [optimistic, ...comments];
    setComments(updated);
    syncCount(updated);
    try {
      const real = await base44.entities.DesignComment.create({
        design_id: post.id,
        user_id: currentUser.id,
        user_name: currentUser.full_name || 'User',
        comment: savedText,
        likes: 0, liked_by: [], replies: [],
      });
      setComments(prev => prev.map(c => c.id === optimistic.id ? real : c));
      if (onCommentPosted) onCommentPosted(localPost);
    } catch (e) {
      console.error(e);
      const reverted = comments.filter(c => c.id !== optimistic.id);
      setComments(reverted);
      syncCount(reverted);
      setCommentText(savedText);
      setPostError('Failed to post. Please try again.');
    }
    setPosting(false);
  };

  const createNotification = (recipientId, type) => {
    if (!currentUser || recipientId === currentUser.id) return;
    base44.entities.Notification.create({
      recipient_id: recipientId,
      actor_name: currentUser.full_name || 'Someone',
      actor_id: currentUser.id,
      type,
      post_id: localPost.id,
      post_preview: (localPost.prompt || '').substring(0, 60),
      post_image_url: localPost.image_url || '',
      is_read: false,
    }).catch(() => {});
  };

  const handleLikeComment = (comment) => {
    if (!currentUser) return;
    const alreadyLiked = (comment.liked_by || []).includes(currentUser.id);
    const newLikedBy = alreadyLiked
      ? (comment.liked_by || []).filter(id => id !== currentUser.id)
      : [...(comment.liked_by || []), currentUser.id];
    const updated = { ...comment, liked_by: newLikedBy, likes: newLikedBy.length };
    setComments(prev => prev.map(c => c.id === comment.id ? updated : c));
    base44.entities.DesignComment.update(comment.id, { liked_by: newLikedBy, likes: newLikedBy.length }).catch(console.error);
    if (!alreadyLiked) createNotification(comment.user_id, 'comment_like');
  };

  const handleReplyComment = async (comment, replyText) => {
    if (!isPremiumActive || replyText === null) { setShowUpgradeSheet(true); return; }
    if (!currentUser || !replyText.trim()) return;
    const newReply = {
      user_name: currentUser.full_name || 'User',
      user_id: currentUser.id,
      text: replyText.trim(),
      created_at: new Date().toISOString(),
      likes: 0, liked_by: [],
    };
    const updatedReplies = [...(comment.replies || []), newReply];
    const updatedComment = { ...comment, replies: updatedReplies };
    const updatedComments = comments.map(c => c.id === comment.id ? updatedComment : c);
    setComments(updatedComments);
    syncCount(updatedComments);
    base44.entities.DesignComment.update(comment.id, { replies: updatedReplies }).catch(console.error);
    createNotification(comment.user_id, 'comment_reply');
  };

  const handleDeleteComment = (comment) => {
    if (!currentUser) return;
    const updated = comments.filter(c => c.id !== comment.id);
    setComments(updated);
    syncCount(updated);
    base44.entities.DesignComment.delete(comment.id).catch(console.error);
  };

  const handleEditComment = (comment, newText) => {
    if (!newText.trim()) return;
    const updated = { ...comment, comment: newText.trim() };
    setComments(prev => prev.map(c => c.id === comment.id ? updated : c));
    base44.entities.DesignComment.update(comment.id, { comment: newText.trim() }).catch(console.error);
  };

  const handleEditReply = (comment, replyIndex, newText) => {
    if (!newText.trim()) return;
    const replies = [...(comment.replies || [])];
    replies[replyIndex] = { ...replies[replyIndex], text: newText.trim() };
    const updatedComment = { ...comment, replies };
    setComments(prev => prev.map(c => c.id === comment.id ? updatedComment : c));
    base44.entities.DesignComment.update(comment.id, { replies }).catch(console.error);
  };

  const handleDeleteReply = (comment, replyIndex) => {
    if (!currentUser) return;
    const updatedReplies = (comment.replies || []).filter((_, i) => i !== replyIndex);
    const updatedComment = { ...comment, replies: updatedReplies };
    const updatedComments = comments.map(c => c.id === comment.id ? updatedComment : c);
    setComments(updatedComments);
    syncCount(updatedComments);
    base44.entities.DesignComment.update(comment.id, { replies: updatedReplies }).catch(console.error);
  };

  const handleLikeReply = (comment, replyIndex) => {
    if (!currentUser) return;
    const replies = [...(comment.replies || [])];
    const reply = { ...replies[replyIndex] };
    const likedBy = reply.liked_by || [];
    const alreadyLiked = likedBy.includes(currentUser.id);
    reply.liked_by = alreadyLiked ? likedBy.filter(id => id !== currentUser.id) : [...likedBy, currentUser.id];
    reply.likes = reply.liked_by.length;
    replies[replyIndex] = reply;
    const updatedComment = { ...comment, replies };
    setComments(prev => prev.map(c => c.id === comment.id ? updatedComment : c));
    base44.entities.DesignComment.update(comment.id, { replies }).catch(console.error);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = localPost.image_url;
    a.download = `tailorix-design-${localPost.id}.png`;
    a.target = '_blank';
    a.click();
  };

  const engagementCount = totalEngagement(comments);

  return (
    <div
      className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className={`relative w-full max-w-4xl rounded-t-3xl md:rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row ${cardBg}`}
        style={{ height: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── IMAGE SECTION ──
            Mobile: sits above comments, collapses when scrolling
            Desktop: fixed left column, always visible
        ── */}
        <div
          className={`
            relative bg-black flex-shrink-0 overflow-hidden
            md:w-[52%] md:h-full
            transition-all duration-300 ease-in-out
            ${imageCollapsed ? 'h-14' : 'h-[38vh]'}
            md:h-full
          `}
        >
          {/* Mobile collapsed bar */}
          {imageCollapsed && (
            <div
              className="md:hidden flex items-center gap-3 h-full px-3 cursor-pointer"
              onClick={() => {
                setImageCollapsed(false);
                if (commentsScrollRef.current) commentsScrollRef.current.scrollTop = 0;
              }}
            >
              <img src={localPost.image_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
              <p className={`text-xs truncate flex-1 ${isPremiumActive ? 'text-slate-300' : 'text-slate-700'}`}>
                {localPost.prompt}
              </p>
              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 rotate-180" />
            </div>
          )}

          {/* Full image (always on desktop, conditionally on mobile) */}
          <img
            src={localPost.image_url}
            alt={localPost.prompt}
            onClick={() => setZoomImage(true)}
            className={`w-full h-full object-cover cursor-zoom-in ${imageCollapsed ? 'hidden md:block' : 'block'}`}
          />
          {/* Zoom hint */}
          {!imageCollapsed && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full pointer-events-none">
              Click to zoom
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: details + comments ── */}
        <div className={`flex flex-col flex-1 overflow-hidden border-l ${borderCls} min-h-0`}>
          {/* Meta header */}
          <div className={`px-4 pt-4 pb-3 border-b ${borderCls} flex-shrink-0`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isPremiumActive ? 'bg-amber-500/20' : 'bg-rose-100'}`}>
                <User className={`w-4 h-4 ${isPremiumActive ? 'text-amber-400' : 'text-rose-500'}`} />
              </div>
              <p className={`text-sm font-bold flex-1 truncate ${titleColor}`}>{localPost.user_name || 'Anonymous'}</p>
              <SourceBadge designType={localPost.design_type} />
            </div>
            <p className={`text-sm leading-relaxed mb-2 ${isPremiumActive ? 'text-slate-300' : 'text-slate-700'}`}>{localPost.prompt}</p>
            {(localPost.fabric_type || localPost.occasion || localPost.body_type) && (
              <div className="flex flex-wrap gap-1">
                {localPost.fabric_type && <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${tagCls}`}>{localPost.fabric_type}</span>}
                {localPost.occasion && <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${tagCls}`}>{localPost.occasion}</span>}
                {localPost.body_type && <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${tagCls}`}>{localPost.body_type}</span>}
              </div>
            )}
          </div>

          {/* Actions bar */}
          <div className={`px-4 py-2.5 flex items-center gap-2 border-b ${borderCls} flex-shrink-0`}>
            <button
              onClick={handleLikeLocal}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium transition-colors ${
                isLiked ? 'bg-rose-500 text-white' : isPremiumActive ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
              {localPost.likes || 0}
            </button>

            <div className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium ${isPremiumActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
              <MessageCircle className="w-4 h-4" />
              {engagementCount}
            </div>

            <button
              onClick={() => setShowShareMenu(true)}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium transition-colors ${isPremiumActive ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownload}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium transition-colors ${isPremiumActive ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <Download className="w-4 h-4" />
            </button>

            <div className="ml-auto flex items-center gap-2">
              {currentUser && (currentUser.id === localPost.user_id || currentUser.role === 'admin') && onDelete && (
                <button
                  onClick={() => { onDelete(localPost); onClose(); }}
                  className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {isPremiumActive ? (
                <Button
                  size="sm"
                  onClick={() => { onRemix(localPost); onClose(); }}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-xs rounded-full px-4"
                >
                  <Shuffle className="w-3 h-3 mr-1" /> Remix
                </Button>
              ) : (
                <Link to={createPageUrl('Payment')}>
                  <Button size="sm" className="bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-full px-3 gap-1">
                    <Lock className="w-3 h-3" />
                    <Crown className="w-3 h-3 text-amber-400" />
                    Remix
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Comments scrollable area */}
          <div
            ref={commentsScrollRef}
            onScroll={handleCommentsScroll}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
          >
            <p className={`text-xs font-bold uppercase tracking-wider ${accentCls}`}>
              {engagementCount} {engagementCount === 1 ? 'Comment' : 'Comments'}
            </p>

            {postError && (
              <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
                {postError}
              </div>
            )}

            {loadingComments ? (
              <div className="flex justify-center py-8">
                <Loader2 className={`w-5 h-5 animate-spin ${accentCls}`} />
              </div>
            ) : comments.length === 0 ? (
              <p className={`text-center text-sm py-8 ${subColor}`}>No comments yet — be the first!</p>
            ) : (
              comments.map(c => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  currentUser={currentUser}
                  isPremiumActive={isPremiumActive}
                  panelBg={panelBg}
                  onLike={handleLikeComment}
                  onReply={handleReplyComment}
                  onDelete={handleDeleteComment}
                  onDeleteReply={handleDeleteReply}
                  onLikeReply={handleLikeReply}
                  onEditComment={handleEditComment}
                  onEditReply={handleEditReply}
                />
              ))
            )}
          </div>

          {/* Comment input */}
          <div className={`px-4 py-3 border-t flex items-center gap-2 flex-shrink-0 ${borderCls}`}>
            <input
              type="text"
              className={`flex-1 rounded-xl px-3 py-2 text-sm border outline-none ${inputCls}`}
              placeholder="Write a comment..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePostComment()}
            />
            <Button
              size="icon"
              onClick={handlePostComment}
              disabled={posting || !commentText.trim()}
              className={isPremiumActive ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-rose-500 hover:bg-rose-600 text-white'}
            >
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showShareMenu && (
          <ShareMenu post={localPost} imageUrl={localPost.image_url} isPremiumActive={isPremiumActive} onClose={() => setShowShareMenu(false)} />
        )}
      </AnimatePresence>

      {/* Image Zoom Overlay */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[700] bg-black/95 flex items-center justify-center cursor-zoom-out"
            onClick={() => setZoomImage(false)}
          >
            <motion.img
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              src={localPost.image_url}
              alt={localPost.prompt}
              className="max-w-[95vw] max-h-[95vh] object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setZoomImage(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ModerationAlert message={moderationMsg} onClose={() => setModerationMsg(null)} />
      {showUpgradeSheet && <ReplyUpgradeSheet onClose={() => setShowUpgradeSheet(false)} />}
    </div>
  );
}