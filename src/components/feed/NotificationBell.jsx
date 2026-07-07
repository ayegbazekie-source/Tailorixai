import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Heart, MessageCircle, Shuffle, X, Loader2, ChevronRight, Users, Star, CornerDownRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow, subDays } from 'date-fns';

function NotifIcon({ type }) {
  if (type === 'like') return <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />;
  if (type === 'comment') return <MessageCircle className="w-5 h-5 text-blue-500" />;
  if (type === 'comment_like') return <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />;
  if (type === 'comment_reply') return <CornerDownRight className="w-5 h-5 text-indigo-400" />;
  if (type === 'remix') return <Shuffle className="w-5 h-5 text-amber-500" />;
  if (type === 'team_invite') return <Users className="w-5 h-5 text-amber-400" />;
  if (type === 'review_response') return <Star className="w-5 h-5 text-amber-400 fill-amber-400" />;
  return <Bell className="w-5 h-5 text-slate-400" />;
}

function notifMessage(n) {
  if (n.type === 'like') return `${n.actor_name} liked your design! 🎉`;
  if (n.type === 'comment') return `${n.actor_name} commented on your design ✂️`;
  if (n.type === 'comment_like') return `${n.actor_name} liked your comment ❤️`;
  if (n.type === 'comment_reply') return `${n.actor_name} replied to your comment 💬`;
  if (n.type === 'remix') return `${n.actor_name} remixed your design — great taste! 🌟`;
  if (n.type === 'team_invite') return n.post_preview || `${n.actor_name} invited you to a workspace 🤝`;
  if (n.type === 'review_response') return `Tailorix AI responded to your review ⭐`;
  return 'Someone engaged with your post';
}

const THIRTY_DAYS_AGO = subDays(new Date(), 30);

export default function NotificationBell({ currentUser, isPremiumActive, onOpenPost }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (!currentUser) return;
    loadNotifications();
  }, [currentUser]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const loadNotifications = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await base44.entities.Notification.filter(
        { recipient_id: currentUser.id },
        '-created_date',
        50
      );
      // Filter out notifications older than 30 days client-side
      const fresh = data.filter(n => new Date(n.created_date) > THIRTY_DAYS_AGO);
      setNotifications(fresh);

      // Silently delete stale ones
      const stale = data.filter(n => new Date(n.created_date) <= THIRTY_DAYS_AGO);
      stale.forEach(n => base44.entities.Notification.delete(n.id).catch(() => {}));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    for (const n of unread) {
      base44.entities.Notification.update(n.id, { is_read: true }).catch(() => {});
    }
  };

  const handleOpen = () => {
    setOpen(true);
    if (unreadCount > 0) markAllRead();
  };

  const handleNotifClick = (notif) => {
    setOpen(false);
    if (notif.type === 'team_invite' && notif.post_id) {
      navigate(`/WorkspaceDetail?id=${notif.post_id}`);
      return;
    }
    if (notif.type === 'review_response') {
      // post_id is reviewId — highlight it on the Reviews page
      navigate(`/Reviews?highlight=${notif.post_id}`);
      return;
    }
    // For all feed post notifications — open the post modal
    if (notif.post_id) {
      if (onOpenPost) {
        // We're already on the feed — open inline
        onOpenPost(notif.post_id);
      } else {
        // Navigate to feed and open the post
        navigate(`/InspirationFeed?open_post=${notif.post_id}`);
      }
    }
  };

  // Theme
  const overlayBg = isPremiumActive
    ? 'bg-gradient-to-br from-[#0a0a1a] via-[#0f0f28] to-[#0a0a1a]'
    : 'bg-white';
  const headerBorder = isPremiumActive ? 'border-slate-700/50' : 'border-slate-100';
  const titleColor = isPremiumActive ? 'text-white' : 'text-slate-900';
  const subColor = isPremiumActive ? 'text-slate-400' : 'text-slate-500';
  const timeColor = isPremiumActive ? 'text-slate-500' : 'text-slate-400';
  const itemBg = isPremiumActive
    ? 'bg-[#111127] border-slate-700/40 hover:bg-slate-800/60'
    : 'bg-white border-slate-100 hover:bg-slate-50';
  const unreadDot = isPremiumActive ? 'bg-amber-400' : 'bg-rose-500';
  const unreadHighlight = isPremiumActive ? 'ring-1 ring-amber-500/30' : 'ring-1 ring-rose-300/50';

  return (
    <>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className={`relative p-2 rounded-xl transition-colors ${isPremiumActive ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
        aria-label="Notifications"
      >
        <Bell className={`w-5 h-5 ${isPremiumActive ? 'text-amber-400' : 'text-slate-600 dark:text-slate-300'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Full-screen Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 z-[500] flex flex-col ${overlayBg}`}
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${headerBorder} flex-shrink-0`}>
              <div>
                <h2 className={`text-xl font-bold ${titleColor}`}>Notifications</h2>
                <p className={`text-xs mt-0.5 ${subColor}`}>
                  {notifications.length === 0 ? 'No new notifications' : `${notifications.length} notification${notifications.length !== 1 ? 's' : ''} · last 30 days`}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className={`p-2 rounded-xl ${isPremiumActive ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              ) : notifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full px-8 text-center"
                >
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-5 ${isPremiumActive ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <Bell className={`w-10 h-10 ${subColor}`} />
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${titleColor}`}>All quiet here!</h3>
                  <p className={`text-sm leading-relaxed ${subColor}`}>
                    When someone likes, comments on, or remixes your designs, you'll see it here.
                  </p>
                </motion.div>
              ) : (
                <div className="p-4 space-y-3">
                  {notifications.map((notif, i) => (
                    <motion.button
                      key={notif.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => handleNotifClick(notif)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${itemBg} ${!notif.is_read ? unreadHighlight : ''}`}
                    >
                      {/* Icon circle */}
                      <div className={`relative flex-shrink-0 w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center ${isPremiumActive ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        {notif.post_image_url ? (
                          <img src={notif.post_image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <NotifIcon type={notif.type} />
                        )}
                        {/* Type badge overlay */}
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 ${isPremiumActive ? 'border-[#111127] bg-slate-900' : 'border-white bg-white'}`}>
                          <NotifIcon type={notif.type} />
                        </div>
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold leading-snug ${titleColor}`}>
                          {notifMessage(notif)}
                        </p>
                        {notif.post_preview && (
                          <p className={`text-xs mt-1 truncate italic ${subColor}`}>
                            "{notif.post_preview}"
                          </p>
                        )}
                        <p className={`text-xs mt-1.5 font-medium ${timeColor}`}>
                          {formatDistanceToNow(new Date(notif.created_date), { addSuffix: true })}
                        </p>
                      </div>

                      {/* Unread dot + arrow */}
                      <div className="flex flex-col items-center gap-2 flex-shrink-0">
                        {!notif.is_read && <div className={`w-2.5 h-2.5 rounded-full ${unreadDot}`} />}
                        {notif.post_id && <ChevronRight className={`w-4 h-4 ${subColor}`} />}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className={`flex-shrink-0 px-5 py-3 border-t text-center ${headerBorder}`}>
                <p className={`text-xs ${timeColor}`}>Notifications older than 30 days are automatically removed.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}