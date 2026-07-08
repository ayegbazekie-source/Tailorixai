import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export function useWorkspaceNotifications(user, isPremium) {
  const [hasPermission, setHasPermission] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [unreadCount, setUnreadCount] = useState(0);
  const audioRef = useRef(null);
  const activeWorkspaceRef = useRef(null);
  const channelRef = useRef(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setHasPermission(true);
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setHasPermission(granted);
      return granted;
    }

    return false;
  };

  // Play notification sound
  const playNotificationSound = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZTA0OVqzn77BdGAg+ltryxnMpBSh+zPDajzkHGGS56+mjUhELTKXh8bllHAU2jdXzz38uBSp3xu/bkUAKFl223+qnVRQLQ5zd8sFuJAU1htDy0oI0Bx1qvOzjm08NDFSq5O+vYBgJPJTY8sh0LAUrfdDv3I0+ChVftdvqp1UUC0Kd3fK/biMFMoXP8s5/LgUrdsbv2o9ACBVcttvqp1QUD0Ka3fK+bSMFMoXP8s5/LQYqdsbv2o9ACBVcttvqp1QUD0Ka3fK+bSMFMoXP8s5/LQYqdsbv2o9ACBZcttvqp1QUD0Ka3fK+bSMFMoXP8s5/LQYqdsbv2o9ACBZcttvqp1QUD0Ka3fK+bSMFMoXP8s5/LQYqdsbv2o9ACBZdttvqp1QUEEKa3fK+bSMFMoXP8s5/LQYqdsbv2o9ACBZdttvqp1QUEEKa3fK+bSMFMoXP8s5/LQYqdsbv2o9ACBZdttvqp1QUEEKa3fK+bSMFMoXP8s5/LQYqdsbv2o9ACBZdttvqp1QUEEKa3fK+bSMFMoXP8s5/LQYqdsbv2o9ACBZdttvqp1QUEEKa3fK+bSMFMoXP8s5/LQYqdsbv2o9ACBZdttvqp1QUEEKa3fK+bSMFMoXP8s5/LQYqdsbv2o9ACBZdttvqp1QUEEKa3fK+');
    }
    audioRef.current.play().catch(() => {
      // Ignore autoplay roadblocks cleanly
    });
  };

  // Show message notification
  const showMessageNotification = (message, workspaceName) => {
    if (!isOnline || !isPremium) return;

    // Don't notify if user is actively in this chat screen
    if (activeWorkspaceRef.current === message.workspace_id) return;

    playNotificationSound();

    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-gradient-to-br from-[#1e1e1e] to-[#121212] shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-[#D4AF37]/30 border border-[#D4AF37]/20`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-black font-bold text-sm">
                {message.sender_name?.charAt(0).toUpperCase() || 'T'}
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-semibold text-[#D4AF37]">
                {message.sender_name}
              </p>
              <p className="mt-1 text-xs text-[#F8F8F2]/60">
                {workspaceName}
              </p>
              <p className="mt-1 text-sm text-[#F8F8F2]">
                {message.message_text.length > 50
                  ? message.message_text.substring(0, 50) + '...'
                  : message.message_text}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-[#D4AF37]/20">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-[#D4AF37] hover:text-[#F8F8F2] focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-right',
    });

    setUnreadCount(prev => prev + 1);
  };

  // Subscribe to workspace messages using Supabase Realtime
  useEffect(() => {
    if (!user?.id || !isPremium) return;

    const setupSubscriptions = async () => {
      try {
        // Fetch all workspaces this user belongs to, including the workspace name
        const { data: membershipData, error } = await supabase
          .from('workspace_members')
          .select(`
            workspace_id,
            workspaces!inner (
              id,
              title
            )
          `)
          .eq('user_id', user.id);

        if (error) throw error;
        if (!membershipData || membershipData.length === 0) return;

        const workspaceIds = membershipData.map(m => m.workspace_id);
        
        // Build an easy-access map for looking up title descriptions
        const workspaceMap = {};
        membershipData.forEach(m => {
          if (m.workspaces) {
            workspaceMap[m.workspaces.id] = m.workspaces.title;
          }
        });

        // Initialize Supabase Global Realtime Broadcast for incoming messages
        channelRef.current = supabase
          .channel(`global-workspace-notifications-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'workspace_messages'
            },
            (payload) => {
              const message = payload.new;

              // Don't notify for messages authored by the current user
              if (message.sender_user_id === user.id) return;

              // Verify the incoming insertion belongs to one of our active team channels
              if (workspaceIds.includes(message.workspace_id)) {
                const workspaceName = workspaceMap[message.workspace_id] || 'Workspace Channel';
                showMessageNotification(message, workspaceName);
              }
            }
          )
          .subscribe();

      } catch (error) {
        console.error('Failed to setup workspace subscriptions:', error);
      }
    };

    setupSubscriptions();

    // Cleanup channels on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user?.id, isPremium]);

  const setActiveWorkspace = (workspaceId) => {
    activeWorkspaceRef.current = workspaceId;
    if (workspaceId) {
      setUnreadCount(0);
    }
  };

  return {
    isOnline,
    hasPermission,
    requestNotificationPermission,
    unreadCount,
    setActiveWorkspace,
    setUnreadCount
  };
          }
