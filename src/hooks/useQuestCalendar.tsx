import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface QuestCompletionDate {
  date: string;
  count: number;
}

export const useQuestCalendar = () => {
  const { user } = useAuth();
  const [completionDates, setCompletionDates] = useState<QuestCompletionDate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuestCompletions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: submissions, error } = await supabase
        .from('Submissions')
        .select('submitted_at, status')
        .eq('user_id', user.id)
        .eq('status', 'verified')
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      if (submissions) {
        // Group submissions by date
        const dateMap = new Map<string, number>();
        
        submissions.forEach(submission => {
          const date = new Date(submission.submitted_at).toISOString().split('T')[0];
          dateMap.set(date, (dateMap.get(date) || 0) + 1);
        });

        const completions = Array.from(dateMap.entries()).map(([date, count]) => ({
          date,
          count
        }));

        setCompletionDates(completions);
      }
    } catch (error) {
      console.error('Error fetching quest completions:', error);
    } finally {
      setLoading(false);
    }
  };

  const isQuestCompletionDate = (date: Date): boolean => {
    const dateString = date.toISOString().split('T')[0];
    return completionDates.some(completion => completion.date === dateString);
  };

  const getQuestCountForDate = (date: Date): number => {
    const dateString = date.toISOString().split('T')[0];
    const completion = completionDates.find(c => c.date === dateString);
    return completion?.count || 0;
  };

  useEffect(() => {
    fetchQuestCompletions();
  }, [user]);

  return {
    completionDates,
    loading,
    isQuestCompletionDate,
    getQuestCountForDate,
    refetch: fetchQuestCompletions
  };
};