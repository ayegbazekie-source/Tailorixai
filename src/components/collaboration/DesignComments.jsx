import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DesignComments({ design, currentUser, canComment }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (!design?.id || !showComments) return;

    loadComments();

    // Listen to real-time additions and removals for this specific pattern or garment blueprint
    const channel = supabase
      .channel(`design-comments-${design.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'design_comments',
          filter: `design_id=eq.${design.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setComments(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setComments(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [design?.id, showComments]);

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('design_comments')
        .select('*')
        .eq('design_id', design.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading design comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !canComment) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('design_comments')
        .insert([
          {
            design_id: design.id,
            user_id: currentUser.id,
            user_name: currentUser.full_name || currentUser.email,
            comment: newComment.trim()
          }
        ]);

      if (error) throw error;
      setNewComment('');
      toast.success('Comment posted successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const { error } = await supabase
        .from('design_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      toast.success('Comment removed');
    } catch (error) {
      console.error('Error removing comment:', error);
      toast.error('Failed to remove comment');
    }
  };

  // Protect the collaborative feature block for Pro members
  if (!currentUser?.is_pro && !currentUser?.isPro) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {showComments ? (
        <div className="bg-slate-900 rounded-2xl shadow-2xl border border-amber-500/20 w-80 max-h-[500px] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-amber-500/10">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white">Comments ({comments.length})</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowComments(false)}
              className="text-amber-200/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {comments.length === 0 ? (
              <p className="text-sm text-amber-200/40 text-center py-8">
                No design notes here yet.
              </p>
            ) : (
              comments.map((comment) => {
                const timeStamp = comment.created_at || comment.created_date;
                return (
                  <div key={comment.id} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm font-bold text-amber-200">
                        {comment.user_name}
                      </span>
                      {comment.user_id === currentUser.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-amber-200/40 hover:text-red-400 hover:bg-red-950/20"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-slate-200 break-words">{comment.comment}</p>
                    <p className="text-[10px] text-amber-200/30 mt-2">
                      {new Date(timeStamp).toLocaleString()}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {canComment && (
            <div className="p-4 border-t border-amber-500/10 bg-slate-950/30 rounded-b-2xl">
              <div className="flex gap-2 items-end">
                <Textarea
                  placeholder="Type a feedback point..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px] bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-amber-500/30 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={loading || !newComment.trim()}
                  size="icon"
                  className="shrink-0 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 hover:from-amber-400"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Button
          onClick={() => setShowComments(true)}
          className="rounded-full h-14 w-14 shadow-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 hover:scale-105 transition-transform relative"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
          {comments.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
              {comments.length}
            </span>
          )}
        </Button>
      )}
    </div>
  );
          }
