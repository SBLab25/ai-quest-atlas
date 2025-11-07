import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  related_id?: string;
  related_type?: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    fetchNotifications();
    
    // Set up periodic refetch as fallback (every 30 seconds)
    const refetchInterval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    
    // Set up real-time subscription
    const channel = supabase
      .channel(`notifications-channel-${user.id}`, {
        config: {
          broadcast: { self: false },
          presence: { key: user.id }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 New notification received:', payload);
          const newNotif = payload.new as Notification;
          setNotifications(prev => {
            // Avoid duplicates
            if (prev.some(n => n.id === newNotif.id)) {
              return prev;
            }
            return [newNotif, ...prev];
          });
          setUnreadCount(prev => prev + 1);
          
          // Play sound and show browser notification
          import('@/utils/notificationHelper').then(({ playNotificationSound, showBrowserNotification }) => {
            playNotificationSound();
            showBrowserNotification(newNotif.title, newNotif.message);
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 Notification updated:', payload);
          setNotifications(prev => {
            const updated = prev.map(n => 
              n.id === payload.new.id ? (payload.new as Notification) : n
            );
            // Recalculate unread count from updated notifications
            const newUnreadCount = updated.filter(n => !n.is_read).length;
            setUnreadCount(newUnreadCount);
            return updated;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 Notification deleted:', payload);
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          setUnreadCount(prev => {
            const deletedNotif = notifications.find(n => n.id === payload.old.id);
            return deletedNotif && !deletedNotif.is_read ? Math.max(0, prev - 1) : prev;
          });
        }
      )
      .subscribe((status) => {
        console.log('🔔 Notification subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to notifications');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Notification channel error');
        } else if (status === 'TIMED_OUT') {
          console.warn('⏱️ Notification subscription timed out');
        } else if (status === 'CLOSED') {
          console.warn('🔒 Notification channel closed');
        }
      });

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up notification subscription');
      clearInterval(refetchInterval);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      const fetchedNotifications = (data as any) || [];
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter((n: any) => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('notifications' as any)
        .update({ is_read: true } as any)
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('notifications' as any)
        .update({ is_read: true } as any)
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('notifications' as any)
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notif = notifications.find(n => n.id === notificationId);
        return notif && !notif.is_read ? prev - 1 : prev;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
};