import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getISTDateString } from '@/utils/timezoneUtils';

export const useDailyExercise = () => {
  const { user } = useAuth();
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [hasShownToday, setHasShownToday] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Add small delay to prevent blocking page load
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        checkDailyExerciseStatus();
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkDailyExerciseStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const today = getISTDateString();
      
      // Check if user has completed exercises today
      // Wrap in try-catch to handle if table doesn't exist
      try {
        const { data: completed, error: completedError } = await supabase
          .from('daily_exercises')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (completedError) {
          // If table doesn't exist (PGRST116) or other errors, just log and continue
          if (completedError.code !== 'PGRST116') {
            console.warn('Error checking daily exercise (table may not exist):', completedError);
          }
          setHasCompletedToday(false);
        } else {
          setHasCompletedToday(!!completed);
        }
      } catch (tableError: any) {
        // Table might not exist yet - this is okay
        console.warn('Daily exercises table may not exist yet:', tableError);
        setHasCompletedToday(false);
      }

      // Check if we've already shown the popup today (using localStorage)
      const lastShownKey = `daily_exercise_shown_${user.id}_${today}`;
      const hasShown = localStorage.getItem(lastShownKey) === 'true';
      setHasShownToday(hasShown);

    } catch (error) {
      console.error('Error checking daily exercise status:', error);
      // Set defaults on error to prevent blocking
      setHasCompletedToday(false);
      setHasShownToday(false);
    } finally {
      setLoading(false);
    }
  };

  const markAsShown = () => {
    if (!user) return;
    
    const today = getISTDateString();
    const lastShownKey = `daily_exercise_shown_${user.id}_${today}`;
    localStorage.setItem(lastShownKey, 'true');
    setHasShownToday(true);
  };

  const shouldShowPopup = () => {
    if (!user || loading) return false;
    return !hasCompletedToday && !hasShownToday;
  };

  return {
    hasCompletedToday,
    hasShownToday,
    loading,
    shouldShowPopup,
    markAsShown,
    refetch: checkDailyExerciseStatus
  };
};

