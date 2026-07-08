import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ChatTab({ workspaceId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    
    // Subscribe to real-time chat messages for this workspace
    const channel = supabase
      .channel(`workspace-chat-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workspace_messages',
          filter: `workspace_id=eq.${workspaceId}`
        },
        (payload) => {
          const newMsg = payload.new;
          // Trigger toast alert if message is from another team member
          if (newMsg.sender_user_id !== currentUser.id) {
            toast.success(`${newMsg.sender_name}: ${newMsg.message_text.substring(0, 50)}...`);
            setMessages(prev => {
              // Avoid duplicate insertion if pulled quickly by a reload callback
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('workspace_messages')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Could not sync chat records');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return;

    const tempId = `temp_${Date.now()}`;
    const senderName = currentUser.full_name || currentUser.email;
    const optimisticMessage = {
      id: tempId,
      workspace_id: workspaceId,
      sender_user_id: currentUser.id,
      sender_name: senderName,
      message_text: messageText,
      created_at: new Date().toISOString(),
      _optimistic: true
    };

    // Optimistic UI push for responsive mobile handling
    setMessages(prev => [...prev, optimisticMessage]);
    const currentMessage = messageText;
    setMessageText('');
    setSending(true);

    try {
      const { data, error } = await supabase
        .from('workspace_messages')
        .insert([
          {
            workspace_id: workspaceId,
            sender_user_id: currentUser.id,
            sender_name: senderName,
            message_text: currentMessage
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Swap our temporary layout record for the verified db item
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? data : msg
      ));
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to deliver message');
      // Revert states cleanly if request drops offline
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setMessageText(currentMessage);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border-2 border-amber-500/20 h-[600px] flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-amber-200/60">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.sender_user_id === currentUser.id;
            const timeStamp = msg.created_at || msg.created_date;
            
            return (
              <div
                key={msg.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl p-3 ${
                    isCurrentUser
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900'
                      : 'bg-slate-700/50 text-white'
                  }`}
                >
                  {!isCurrentUser && (
                    <p className="text-xs font-semibold mb-1 text-amber-300">
                      {msg.sender_name}
                    </p>
                  )}
                  <p className="text-sm">{msg.message_text}</p>
                  <p className={`text-xs mt-1 ${isCurrentUser ? 'text-slate-700' : 'text-amber-200/40'}`}>
                    {new Date(timeStamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t-2 border-amber-500/20 p-4">
        <div className="flex gap-3">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-slate-900/50 border-amber-500/20 text-white"
          />
          <Button
            onClick={sendMessage}
            disabled={sending || !messageText.trim()}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-900 font-bold"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
