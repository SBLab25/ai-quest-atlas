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
      .neq('status', 'rejected'); // Include pending and approved submissions

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
    }

    // Group submissions by date to count daily completions
    const submissionsByDate = new Map<string, number>();
    let approvedSubmissions = 0;
    let totalSubmissions = 0;
    let lastQuestDate: string | null = null;

    if (submissions) {
      submissions.forEach(submission => {
        const date = new Date(submission.submitted_at || '').toISOString().split('T')[0];
        submissionsByDate.set(date, (submissionsByDate.get(date) || 0) + 1);
        totalSubmissions++;
        
          if (submission.status === 'verified') {
            approvedSubmissions++;
          }
        
        if (!lastQuestDate || date > lastQuestDate) {
          lastQuestDate = date;
        }
      });
    }

    // More generous daily visit points calculation
    // Give points for each unique day they submitted + bonus days for active users
    const uniqueActiveDays = submissionsByDate.size;
    const bonusDailyVisits = Math.floor(totalSubmissions / 2); // Bonus visits estimated from activity level
    const dailyVisitPoints = uniqueActiveDays + bonusDailyVisits;
    
    // Calculate quest completion points (10 points per verified submission)
    const questCompletionPoints = approvedSubmissions * 10;

    // More generous exercise quota points 
    // Give points for active engagement - users who submit more get more exercise points
    const exerciseQuotaPoints = Math.max(uniqueActiveDays * 5, totalSubmissions * 3);

    // Calculate streak bonus points
    const currentStreak = await getCurrentStreak(userId);
    let streakBonusPoints = 0;
    
    if (currentStreak >= 30) {
      streakBonusPoints = 50; // 1 month streak
    } else if (currentStreak >= 10) {
      streakBonusPoints = 10; // 10+ days streak
    }

    // Calculate total points with more generous formula
    const totalPoints = dailyVisitPoints + questCompletionPoints + exerciseQuotaPoints + streakBonusPoints;

    const calculatedPoints: PointsData = {
      total_points: totalPoints,
      daily_visit_points: dailyVisitPoints,
      quest_completion_points: questCompletionPoints,
      exercise_quota_points: exerciseQuotaPoints,
      streak_bonus_points: streakBonusPoints,
      last_visit_date: lastQuestDate,
      last_quest_date: lastQuestDate,
      last_exercise_date: lastQuestDate,
    };

    // Save to localStorage
    const storageKey = `user_points_${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(calculatedPoints));

    console.log(`Recalculated points for user ${userId}:`, calculatedPoints);

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