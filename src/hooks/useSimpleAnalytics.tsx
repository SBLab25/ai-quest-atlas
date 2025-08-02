export const useAnalytics = () => {
  const trackEvent = async (eventName: string, eventData?: Record<string, any>) => {
    // Will track to console for now
    console.log('Analytics event:', eventName, eventData);
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