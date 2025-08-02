import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useAnalytics = () => {
  const { user } = useAuth();

  const trackEvent = async (eventName: string, eventData?: Record<string, any>) => {
    try {
      await supabase
        .from('analytics_events')
        .insert({
          user_id: user?.id || null,
          event_name: eventName,
          event_data: eventData || {},
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  const trackPageView = (page: string) => {
    trackEvent('page_view', { page });
  };

  const trackQuestView = (questId: string) => {
    trackEvent('quest_view', { quest_id: questId });
  };

  const trackQuestSubmission = (questId: string) => {
    trackEvent('quest_submission', { quest_id: questId });
  };

  const trackSocialAction = (action: string, targetId: string, targetType: string) => {
    trackEvent('social_action', { 
      action, 
      target_id: targetId, 
      target_type: targetType 
    });
  };

  return {
    trackEvent,
    trackPageView,
    trackQuestView,
    trackQuestSubmission,
    trackSocialAction
  };
};