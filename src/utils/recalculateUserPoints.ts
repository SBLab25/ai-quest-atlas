import { supabase } from "@/integrations/supabase/client";

interface PointsData {
  total_points: number;
  daily_visit_points: number;
  quest_completion_points: number;
  exercise_quota_points: number;
  streak_bonus_points: number;
  last_visit_date: string | null;
  last_quest_date: string | null;
  last_exercise_date: string | null;
}

export const recalculateUserPoints = async (userId: string): Promise<PointsData> => {
  try {
    // Fetch user submissions to calculate quest completion points
    const { data: submissions, error: submissionsError } = await supabase
      .from('Submissions')
      .select('submitted_at, status')
      .eq('user_id', userId)
      .eq('status', 'approved');

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
    }

    // Group submissions by date to count daily completions
    const submissionsByDate = new Map<string, number>();
    let totalQuestCompletions = 0;
    let lastQuestDate: string | null = null;

    if (submissions) {
      submissions.forEach(submission => {
        const date = new Date(submission.submitted_at || '').toISOString().split('T')[0];
        submissionsByDate.set(date, (submissionsByDate.get(date) || 0) + 1);
        totalQuestCompletions++;
        
        if (!lastQuestDate || date > lastQuestDate) {
          lastQuestDate = date;
        }
      });
    }

    // Calculate daily visit points (estimate based on submission activity)
    // This is an approximation since we don't track actual daily visits
    const uniqueActiveDays = submissionsByDate.size;
    
    // Calculate quest completion points (10 points per approved submission)
    const questCompletionPoints = totalQuestCompletions * 10;

    // Calculate exercise quota points (estimate 5 points per active day)
    // This is an approximation - in reality you'd track actual exercise activities
    const exerciseQuotaPoints = uniqueActiveDays * 5;

    // Calculate streak bonus points
    // For now, we'll use the current streak value from the streak system
    const currentStreak = await getCurrentStreak(userId);
    let streakBonusPoints = 0;
    
    if (currentStreak >= 30) {
      streakBonusPoints = 50; // 1 month streak
    } else if (currentStreak >= 10) {
      streakBonusPoints = 10; // 10+ days streak
    }

    // Calculate total points
    const totalPoints = uniqueActiveDays + questCompletionPoints + exerciseQuotaPoints + streakBonusPoints;

    const calculatedPoints: PointsData = {
      total_points: totalPoints,
      daily_visit_points: uniqueActiveDays,
      quest_completion_points: questCompletionPoints,
      exercise_quota_points: exerciseQuotaPoints,
      streak_bonus_points: streakBonusPoints,
      last_visit_date: lastQuestDate, // Approximation based on last activity
      last_quest_date: lastQuestDate,
      last_exercise_date: lastQuestDate, // Approximation
    };

    // Save to localStorage
    const storageKey = `user_points_${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(calculatedPoints));

    return calculatedPoints;

  } catch (error) {
    console.error('Error recalculating user points:', error);
    throw error;
  }
};

const getCurrentStreak = async (userId: string): Promise<number> => {
  try {
    const { data: submissions } = await supabase
      .from('Submissions')
      .select('submitted_at, status')
      .eq('user_id', userId)
      .neq('status', 'rejected')
      .order('submitted_at', { ascending: false });

    if (!submissions || submissions.length === 0) return 0;

    const submissionDates = submissions
      .map(sub => new Date(sub.submitted_at || '').toISOString().split('T')[0])
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort((a, b) => b.localeCompare(a));

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let currentDate = new Date(today);

    for (const submissionDate of submissionDates) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      if (submissionDate === dateStr || 
          (streak === 0 && submissionDate === new Date(Date.now() - 86400000).toISOString().split('T')[0])) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
};

export const recalculateAllUserPoints = async (): Promise<void> => {
  try {
    // Get all user IDs who have submissions
    const { data: users, error } = await supabase
      .from('Submissions')
      .select('user_id')
      .neq('status', 'rejected');

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    if (!users) return;

    // Get unique user IDs
    const uniqueUserIds = [...new Set(users.map(u => u.user_id))];

    // Recalculate points for each user
    const recalculationPromises = uniqueUserIds.map(userId => 
      recalculateUserPoints(userId).catch(error => {
        console.error(`Error recalculating points for user ${userId}:`, error);
        return null;
      })
    );

    await Promise.all(recalculationPromises);
    console.log(`Recalculated points for ${uniqueUserIds.length} users`);

  } catch (error) {
    console.error('Error in recalculateAllUserPoints:', error);
  }
};