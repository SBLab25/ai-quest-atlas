import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStreak } from '@/hooks/useStreak';
import { isNewDayInIST, getISTDateString } from '@/utils/timezoneUtils';

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

export const usePoints = () => {
  const [points, setPoints] = useState<PointsData>({
    total_points: 0,
    daily_visit_points: 0,
    quest_completion_points: 0,
    exercise_quota_points: 0,
    streak_bonus_points: 0,
    last_visit_date: null,
    last_quest_date: null,
    last_exercise_date: null,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { streak } = useStreak();

  const getStorageKey = () => `user_points_${user?.id || 'guest'}`;

  const loadPoints = () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(getStorageKey());
      if (stored) {
        const parsedPoints = JSON.parse(stored);
        setPoints(parsedPoints);
      }
    } catch (error) {
      console.error('Error loading points from localStorage:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePoints = (newPoints: PointsData) => {
    if (!user) return;
    
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(newPoints));
      setPoints(newPoints);
    } catch (error) {
      console.error('Error saving points to localStorage:', error);
    }
  };

  const addDailyVisitPoints = () => {
    if (!user) return;

    const today = getISTDateString();
    
    if (!isNewDayInIST(points.last_visit_date)) return; // Already awarded today in IST

    const newPoints = {
      ...points,
      daily_visit_points: points.daily_visit_points + 1,
      total_points: points.total_points + 1,
      last_visit_date: today,
    };

    savePoints(newPoints);
  };

  const addQuestCompletionPoints = () => {
    if (!user) return;

    const newPoints = {
      ...points,
      quest_completion_points: points.quest_completion_points + 10,
      total_points: points.total_points + 10,
      last_quest_date: getISTDateString(),
    };

    savePoints(newPoints);
  };

  const addExerciseQuotaPoints = () => {
    if (!user) return;

    const today = getISTDateString();
    
    if (!isNewDayInIST(points.last_exercise_date)) return; // Already awarded today in IST

    const newPoints = {
      ...points,
      exercise_quota_points: points.exercise_quota_points + 5,
      total_points: points.total_points + 5,
      last_exercise_date: today,
    };

    savePoints(newPoints);
  };

  const calculateStreakBonus = () => {
    if (!user || !streak) return;

    let bonusPoints = 0;

    // 10 days streak bonus
    if (streak >= 10 && streak < 30) {
      bonusPoints = 10;
    }
    // 30 days (1 month) streak bonus
    else if (streak >= 30) {
      bonusPoints = 50;
    }

    if (bonusPoints > 0 && bonusPoints !== points.streak_bonus_points) {
      const newPoints = {
        ...points,
        streak_bonus_points: bonusPoints,
        total_points: points.total_points - points.streak_bonus_points + bonusPoints,
      };

      savePoints(newPoints);
    }
  };

  useEffect(() => {
    loadPoints();
  }, [user]);

  useEffect(() => {
    if (user && !loading) {
      addDailyVisitPoints();
      calculateStreakBonus();
    }
  }, [user, loading, streak]);

  const recalculatePoints = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { recalculateUserPoints } = await import('@/utils/recalculateUserPoints');
      const recalculatedPoints = await recalculateUserPoints(user.id);
      setPoints(recalculatedPoints);
    } catch (error) {
      console.error('Error recalculating points:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    points,
    loading,
    addQuestCompletionPoints,
    addExerciseQuotaPoints,
    refetchPoints: loadPoints,
    recalculatePoints,
  };
};