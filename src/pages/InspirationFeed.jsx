import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import {
  Heart, Shuffle, Sparkles, Loader2, User, ImageOff,
  MessageCircle, Share2, Scissors, Wand2, Lock, Crown,
  TrendingUp, Clock, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePremium } from '@/components/PremiumProvider';
import PostFullViewModal from '@/components/feed/PostFullViewModal';
import FeedSearchBar from '@/components/feed/FeedSearchBar';
import ShareMenu from '@/components/feed/ShareMenu';
import NotificationBell from '@/components/feed/NotificationBell';
import ModerationAlert from '@/components/feed/ModerationAlert';

const PAGE_SIZE = 12;

// ─── Trending Score ────────────────────────────────────────────────────────────
function trendingScore(post) {
  const ageHours = (Date.now() - new Date(post.created_date).getTime()) / (1000 * 60 * 60);
  const likes = post.likes || 0;
  const comments = post.comment_count || 0;
  const remixes = post.remix_count || 0;
  const engagement = likes * 3 + comments * 5 + remixes * 2;
  return engagement / Math.pow(ageHours + 2, 1.5);
}

// ─── Source Label ──────────────────────────────────────────────────────────────
function SourceLabel({ designType }) {
  const isPattern = designType === 'pattern';
  return isPattern ?
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-100/90 text-indigo-700 border border-indigo-200">
      <Scissors className="w-2.5 h-2.5" /> Pattern
    </span> :
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-rose-50 text-rose-600 border border-rose-200">
      <Wand2 className="w-2.5 h-2.5" /> Illustration
    </span>;
}

// ─── Time Ago ─────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Thread Post ───────────────────────────────────────────────────────────────
function PostCard({ post, currentUser, isPremiumActive, onLike, onRemix, onOpen, onDelete, index }) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const isLiked = currentUser && (post.liked_by || []).includes(currentUser.id);

  const bgPost = isPremiumActive ? 'bg-[#1a1a1a]' : 'bg-white';
  const dividerCls = isPremiumActive ? 'border-slate-700' : 'border-rose-100';
  const textPrimary = isPremiumActive ? 'text-white' : 'text-slate-900';
  const textMuted = isPremiumActive ? 'text-slate-400' : 'text-slate-500';
  const iconBtnCls = isPremiumActive ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      className={`${bgPost} border-b ${dividerCls}`}
    >
      {/* Full-width image */}
      <div className="relative cursor-pointer" onClick={() => onOpen(post)}>
        <img
          src={post.image_url}
          alt={post.prompt}
          className="w-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <SourceLabel designType={post.design_type} />
        </div>
      </div>

      {/* Post body */}
      <div className="px-4 pt-3 pb-4">
        {/* Author + timestamp */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isPremiumActive ? 'bg-amber-500/20' : 'bg-rose-100'}`}>
              <User className={`w-3.5 h-3.5 ${isPremiumActive ? 'text-amber-400' : 'text-rose-500'}`} />
            </div>
            <span className={`text-sm font-semibold ${textPrimary}`}>
              {post.user_name || 'Anonymous'}
            </span>
          </div>
          <span className={`text-xs ${textMuted}`}>{timeAgo(post.created_date)}</span>
        </div>

        {/* Prompt text */}
        <p className={`text-sm leading-snug mb-3 line-clamp-2 ${textPrimary}`}>
          {post.prompt}
        </p>

        {/* Action row */}
        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onLike(post)}
            className={`flex items-center gap-1.5 text-sm mr-5 transition-colors ${isLiked ? 'text-rose-500' : iconBtnCls}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
            <span>{post.likes || 0}</span>
          </button>

          <button
            onClick={() => onOpen(post)}
            className={`flex items-center gap-1.5 text-sm mr-5 transition-colors ${iconBtnCls}`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post.comment_count || 0}</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); setShowShareMenu(true); }}
            className={`flex items-center text-sm transition-colors ${iconBtnCls}`}
          >
            <Share2 className="w-4 h-4" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            {currentUser && (currentUser.id === post.user_id || currentUser.role === 'admin') && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(post); }}
                className={`transition-colors ${iconBtnCls} hover:text-rose-500`}
                title="Delete post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {isPremiumActive ? (
              <button
                onClick={() => onRemix(post)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:opacity-90 transition-opacity"
              >
                <Shuffle className="w-3 h-3" /> Remix
              </button>
            ) : (
              <button
                onClick={() => onOpen(post)}
                title="Upgrade to Pro to Remix"
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-colors"
              >
                <Lock className="w-3 h-3" />
                <Crown className="w-3 h-3 text-yellow-300" />
                Remix
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showShareMenu && (
          <ShareMenu
            post={post}
            imageUrl={post.image_url}
            isPremiumActive={isPremiumActive}
            onClose={() => setShowShareMenu(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function InspirationFeed() {
  const navigate = useNavigate();
  const { user: currentUser, isPremiumActive } = usePremium();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef(null);
  const [sortMode, setSortMode] = useState('trending');
  const [page, setPage] = useState(1);
  const [moderationMsg, setModerationMsg] = useState(null);

  // Auto-open post from notification redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openPostId = params.get('open_post');
    if (openPostId && posts.length > 0) {
      const found = posts.find((p) => p.id === openPostId);
      if (found) setSelectedPost(found);
    }
  }, [posts]);

  useEffect(() => {
    loadPosts();

    const unsubPost = base44.entities.InspirationPost.subscribe((event) => {
      if (event.type === 'update') {
        setPosts((prev) => prev.map((p) => p.id === event.id ? { ...p, ...event.data } : p));
        setSelectedPost((prev) => prev && prev.id === event.id ? { ...prev, ...event.data } : prev);
      } else if (event.type === 'create' && event.data) {
        setPosts((prev) => {
          if (prev.some((p) => p.id === event.id)) return prev;
          return [{ ...event.data, comment_count: 0 }, ...prev];
        });
      } else if (event.type === 'delete') {
        setPosts((prev) => prev.filter((p) => p.id !== event.id));
      }
    });

    const unsubComment = base44.entities.DesignComment.subscribe((event) => {
      if (event.type === 'create' && event.data?.design_id) {
        setPosts((prev) => prev.map((p) =>
          p.id === event.data.design_id ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p
        ));
      } else if (event.type === 'delete' && event.data?.design_id) {
        setPosts((prev) => prev.map((p) =>
          p.id === event.data.design_id ? { ...p, comment_count: Math.max(0, (p.comment_count || 1) - 1) } : p
        ));
      }
    });

    return () => { unsubPost(); unsubComment(); };
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const [data, allComments] = await Promise.all([
        base44.entities.InspirationPost.list('-created_date', 100),
        base44.entities.DesignComment.list('-created_date', 500)
      ]);

      const countMap = {};
      allComments.forEach((c) => {
        countMap[c.design_id] = (countMap[c.design_id] || 0) + 1 + (c.replies?.length || 0);
      });

      const postsWithCounts = data.map((p) => {
        const realCount = countMap[p.id] || 0;
        if (p.comment_count !== realCount) {
          base44.entities.InspirationPost.update(p.id, { comment_count: realCount }).catch(() => {});
        }
        return { ...p, comment_count: realCount };
      });

      setPosts(postsWithCounts);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const createNotification = useCallback(async (post, type) => {
    if (!currentUser) return;
    if (post.user_id === currentUser.id) return;
    base44.entities.Notification.create({
      recipient_id: post.user_id,
      actor_name: currentUser.full_name || 'Someone',
      actor_id: currentUser.id,
      type,
      post_id: post.id,
      post_preview: (post.prompt || '').substring(0, 60),
      post_image_url: post.image_url || '',
      is_read: false
    }).catch(() => {});
  }, [currentUser]);

  const handleLike = useCallback(async (post) => {
    if (!currentUser) return;
    const alreadyLiked = (post.liked_by || []).includes(currentUser.id);
    const newLikedBy = alreadyLiked ?
      (post.liked_by || []).filter((id) => id !== currentUser.id) :
      [...(post.liked_by || []), currentUser.id];
    const newLikes = newLikedBy.length;
    const updated = { ...post, liked_by: newLikedBy, likes: newLikes };
    setPosts((prev) => prev.map((p) => p.id === post.id ? updated : p));
    if (selectedPost?.id === post.id) setSelectedPost(updated);
    try {
      await base44.entities.InspirationPost.update(post.id, { liked_by: newLikedBy, likes: newLikes });
      if (!alreadyLiked) createNotification(post, 'like');
    } catch (e) { console.error(e); loadPosts(); }
  }, [currentUser, selectedPost, createNotification]);

  const handleDelete = useCallback(async (post) => {
    if (!currentUser) return;
    if (currentUser.id !== post.user_id && currentUser.role !== 'admin') return;
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    if (selectedPost?.id === post.id) setSelectedPost(null);
    base44.entities.InspirationPost.delete(post.id).catch(console.error);
  }, [currentUser, selectedPost]);

  const handleRemix = useCallback(async (post) => {
    if (!isPremiumActive) return;
    try {
      await base44.entities.InspirationPost.update(post.id, { remix_count: (post.remix_count || 0) + 1 });
      createNotification(post, 'remix');
    } catch (e) { console.error(e); }
    const params = new URLSearchParams({
      remix_tab: 'modify',
      remix_image_url: post.image_url || '',
      remix_prompt: post.prompt || '',
      remix_body_type: post.body_type || '',
      remix_fabric_type: post.fabric_type || '',
      remix_occasion: post.occasion || ''
    });
    navigate(`/DesignGenerator?${params.toString()}`);
  }, [isPremiumActive, navigate]);

  const filteredSorted = useMemo(() => {
    let list = [...posts];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) =>
        (p.user_name || '').toLowerCase().includes(q) ||
        (p.prompt || '').toLowerCase().includes(q) ||
        (p.fabric_type || '').toLowerCase().includes(q) ||
        (p.occasion || '').toLowerCase().includes(q) ||
        (p.body_type || '').toLowerCase().includes(q)
      );
    }
    if (sortMode === 'trending') {
      list.sort((a, b) => trendingScore(b) - trendingScore(a));
    } else {
      list.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
    return list;
  }, [posts, searchQuery, sortMode]);

  const visiblePosts = filteredSorted.slice(0, page * PAGE_SIZE);
  const hasMore = visiblePosts.length < filteredSorted.length;

  const pageBg = isPremiumActive ? 'bg-[#121212]' : 'bg-[#f5f5f7]';
  const badgeCls = isPremiumActive
    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
    : 'bg-rose-50 text-rose-600 border border-rose-200';
  const ctaBtnCls = isPremiumActive
    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold'
    : 'bg-rose-500 hover:bg-rose-600 text-white';

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${pageBg}`}>
        <Loader2 className={`w-10 h-10 animate-spin ${isPremiumActive ? 'text-amber-400' : 'text-rose-500'}`} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className="max-w-2xl mx-auto">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-4 pt-8 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div />
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium ${badgeCls}`}>
              <Sparkles className="w-3.5 h-3.5" />
              Community Designs
            </div>
            <NotificationBell
              currentUser={currentUser}
              isPremiumActive={isPremiumActive}
              onOpenPost={(postId) => {
                const found = posts.find((p) => p.id === postId);
                if (found) setSelectedPost(found);
              }}
            />
          </div>
          <div className="text-center mb-4">
            <h1 className={`text-3xl font-bold mb-1 ${isPremiumActive ? 'text-white' : 'text-slate-900'}`}>
              Inspiration Feed
            </h1>
            <p className={`text-sm ${isPremiumActive ? 'text-slate-400' : 'text-slate-500'}`}>
              Browse AI-generated designs & patterns. Like, comment, remix, or download what inspires you.
            </p>
          </div>

          {/* ── Search + Sort ── */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <FeedSearchBar
                value={searchInput}
                onChange={(v) => {
                  setSearchInput(v);
                  setPage(1);
                  if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                  if (!v.trim()) { setSearchQuery(''); setSearchLoading(false); return; }
                  setSearchLoading(true);
                  searchTimeoutRef.current = setTimeout(() => {
                    setSearchQuery(v);
                    setSearchLoading(false);
                  }, 300);
                }}
                isPremiumActive={isPremiumActive}
                isSearching={searchLoading}
              />
            </div>
            <div className={`flex items-center rounded-full p-1 flex-shrink-0 ${isPremiumActive ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <button
                onClick={() => { setSortMode('trending'); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  sortMode === 'trending'
                    ? isPremiumActive ? 'bg-amber-500 text-black' : 'bg-rose-500 text-white'
                    : isPremiumActive ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Trending
              </button>
              <button
                onClick={() => { setSortMode('recent'); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  sortMode === 'recent'
                    ? isPremiumActive ? 'bg-amber-500 text-black' : 'bg-rose-500 text-white'
                    : isPremiumActive ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> Recent
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Thread Feed ── */}
        {filteredSorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <ImageOff className={`w-16 h-16 mb-4 ${isPremiumActive ? 'text-slate-600' : 'text-slate-300'}`} />
            {searchQuery ? (
              <>
                <h3 className={`text-xl font-semibold mb-2 ${isPremiumActive ? 'text-white' : 'text-slate-900'}`}>No results found</h3>
                <p className={`mb-4 ${isPremiumActive ? 'text-slate-400' : 'text-slate-500'}`}>Try searching for something else.</p>
                <Button variant="outline" onClick={() => setSearchQuery('')}>Clear Search</Button>
              </>
            ) : (
              <>
                <h3 className={`text-xl font-semibold mb-2 ${isPremiumActive ? 'text-white' : 'text-slate-900'}`}>No posts yet</h3>
                <p className={`mb-6 ${isPremiumActive ? 'text-slate-400' : 'text-slate-500'}`}>Be the first to share your design!</p>
                <Button
                  onClick={() => navigate(createPageUrl(isPremiumActive ? 'DesignGenerator' : 'FreeDesignIllustrator'))}
                  className={`rounded-xl ${ctaBtnCls}`}
                >
                  <Sparkles className="w-4 h-4 mr-2" /> Create a Design
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className={`${isPremiumActive ? 'border-slate-700' : 'border-rose-100'} border-t`}>
              <AnimatePresence>
                {visiblePosts.map((post, i) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    isPremiumActive={isPremiumActive}
                    onLike={handleLike}
                    onRemix={handleRemix}
                    onOpen={setSelectedPost}
                    onDelete={handleDelete}
                    index={i}
                  />
                ))}
              </AnimatePresence>
            </div>

            {hasMore && (
              <div className="flex justify-center py-8">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  className={`rounded-full px-8 gap-2 ${isPremiumActive ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : ''}`}
                >
                  <ChevronDown className="w-4 h-4" />
                  See More ({filteredSorted.length - visiblePosts.length} remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Full View Modal ── */}
      <AnimatePresence>
        {selectedPost && (
          <PostFullViewModal
            post={selectedPost}
            currentUser={currentUser}
            isPremiumActive={isPremiumActive}
            onClose={() => setSelectedPost(null)}
            onLike={handleLike}
            onRemix={handleRemix}
            onDelete={handleDelete}
            onCommentPosted={(post) => createNotification(post, 'comment')}
            onCommentCountChange={(postId, newCount) => {
              setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comment_count: newCount } : p));
              setSelectedPost((prev) => prev && prev.id === postId ? { ...prev, comment_count: newCount } : prev);
            }}
          />
        )}
      </AnimatePresence>

      <ModerationAlert message={moderationMsg} onClose={() => setModerationMsg(null)} />
    </div>
  );
}