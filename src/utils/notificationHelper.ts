import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 
  | 'quest_approved'
  | 'quest_rejected'
  | 'badge_earned'
  | 'comment_received'
  | 'like_received'
  | 'team_invite'
  | 'challenge_completed'
  | 'daily_challenge_reset';

interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
}

export const sendNotification = async (params: SendNotificationParams) => {
  // Use database function directly (more reliable than edge function)
  // Edge function has CORS issues in some environments
  try {
    const { data: functionData, error: functionError } = await supabase.rpc(
      'create_notification',
      {
        p_user_id: params.userId,
        p_type: params.type,
        p_title: params.title,
        p_message: params.message,
        p_related_id: params.relatedId || null,
        p_related_type: params.relatedType || null,
      }
    );

    if (functionError) {
      console.warn('⚠️ Database function failed, trying edge function:', functionError);
      throw functionError;
    }

    // Fetch the created notification
    const { data: fetchedNotification } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', functionData)
      .single();

    if (!fetchedNotification) {
      throw new Error('Notification created but could not be fetched');
    }

    console.log('✅ Notification created via database function:', fetchedNotification);
    
    // Play notification sound if enabled
    playNotificationSound();
    
    // Show browser push notification if enabled
    showBrowserNotification(params.title, params.message);
    
    return fetchedNotification;
  } catch (error) {
    // Fallback: Try edge function if database function fails
    console.warn('⚠️ Database function failed, trying edge function:', error);
    
    try {
      const { data, error: edgeError } = await supabase.functions.invoke('send-notification', {
        body: {
          user_id: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          related_id: params.relatedId,
          related_type: params.relatedType,
        },
      });

      if (edgeError) throw edgeError;
      
      // Play notification sound if enabled
      playNotificationSound();
      
      // Show browser push notification if enabled
      showBrowserNotification(params.title, params.message);
      
      return data;
    } catch (edgeError) {
      console.error('❌ All notification methods failed:', edgeError);
      // Don't throw - notifications are not critical, just log the error
      console.error('Failed to send notification:', params);
      return null;
    }
  }
};

export const playNotificationSound = () => {
  const soundEnabled = localStorage.getItem('notification_sound_enabled') !== 'false';
  if (!soundEnabled) return;
  
  try {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.3;
    audio.play().catch(err => console.log('Audio play prevented:', err));
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

export const showBrowserNotification = async (title: string, body: string) => {
  if (!('Notification' in window)) return;
  
  const pushEnabled = localStorage.getItem('push_notifications_enabled') !== 'false';
  if (!pushEnabled) return;
  
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/discovery-atlas-logo.png',
        badge: '/discovery-atlas-logo.png',
        tag: 'discovery-atlas-notification',
      });
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};
