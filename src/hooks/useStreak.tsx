import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useStreak = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchStreak = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // For now, calculate streak based on recent submissions
      // This is a simplified version that works with existing tables
      const { data: submissions } = await supabase
        .from('Submissions')
        .select('submitted_at')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(30);

      if (submissions && submissions.length > 0) {
        // Calculate streak based on consecutive days with submissions
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let currentStreak = 0;
        let checkDate = new Date(today);
        
        for (let i = 0; i < 30; i++) { // Check last 30 days
          const daySubmissions = submissions.filter(sub => {
            const subDate = new Date(sub.submitted_at);
            subDate.setHours(0, 0, 0, 0);
            return subDate.getTime() === checkDate.getTime();
          });
          
          if (daySubmissions.length > 0) {
            currentStreak++;
          } else if (currentStreak === 0 && i === 0) {
            // No submission today, but check if there was one yesterday
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          } else {
            // Streak broken
            break;
          }
          
          checkDate.setDate(checkDate.getDate() - 1);
        }
        
        setStreak(currentStreak);
      } else {
        setStreak(0);
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
      setStreak(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStreak();
    } else {
      setStreak(0);
      setLoading(false);
    }
  }, [user]);

  return {
    streak,
    loading,
    refreshStreak: fetchStreak
  };
};