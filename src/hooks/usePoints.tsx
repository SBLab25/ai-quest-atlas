import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStreak } from '@/hooks/useStreak';
import { isNewDayInIST, getISTDateString } from '@/utils/timezoneUtils';
import { supabase } from '@/integrations/supabase/client';

interface PointsData {
  total_points: number; // Score/XP for leveling
  shopping_points: number; // Currency for shopping (separate from score)
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
    shopping_points: 0, // Separate currency for shop purchases
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
  const getHistoryKey = () => `user_points_history_${user?.id || 'guest'}`;

  const loadPoints = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // First, try to load from database (profiles table) for shopping_points
      // Database is the source of truth for shopping_points
      let shoppingPointsFromDB: number | null = null;
      let dbQuerySuccessful = false;
      
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("shopping_points")
          .eq("id", user.id)
          .single();
        
        if (!profileError && profile) {
          // Database query succeeded - use the value (even if it's 0 or null)
          dbQuerySuccessful = true;
          shoppingPointsFromDB = profile.shopping_points ?? 0;
          console.log(`Loaded shopping_points from database: ${shoppingPointsFromDB} for user ${user.id}`);
        } else if (profileError) {
          // Column might not exist or other error
          console.warn("Could not fetch shopping_points from database:", profileError);
        }
      } catch (dbError) {
        // Column might not exist, that's okay - use localStorage
        console.warn("Database query exception for shopping_points:", dbError);
      }

      // Load from localStorage
      const stored = localStorage.getItem(getStorageKey());
      let parsedPoints;
      const oldShoppingPoints = stored ? JSON.parse(stored)?.shopping_points : 0;
      
      if (stored) {
        parsedPoints = JSON.parse(stored);
        // Ensure shopping_points exists (for backward compatibility)
        if (parsedPoints.shopping_points === undefined) {
          parsedPoints.shopping_points = 0;
        }
      } else {
        // Initialize if doesn't exist
        parsedPoints = {
          total_points: 0,
          shopping_points: 0,
          daily_visit_points: 0,
          quest_completion_points: 0,
          exercise_quota_points: 0,
          streak_bonus_points: 0,
          last_visit_date: null,
          last_quest_date: null,
          last_exercise_date: null,
        };
      }
      
      // Always sync shopping_points from database if query was successful
      // Database is the source of truth for shopping_points
      if (dbQuerySuccessful && shoppingPointsFromDB !== null) {
        const pointsChanged = parsedPoints.shopping_points !== shoppingPointsFromDB;
        parsedPoints.shopping_points = shoppingPointsFromDB;
        if (pointsChanged) {
          console.log(`✅ Synced shopping_points from database: ${shoppingPointsFromDB} (was ${oldShoppingPoints} in localStorage)`);
        }
      } else if (!dbQuerySuccessful) {
        console.warn("⚠️ Could not load shopping_points from database, using localStorage value:", parsedPoints.shopping_points);
      }
      
      // Save back to localStorage to keep it in sync
      localStorage.setItem(getStorageKey(), JSON.stringify(parsedPoints));
      setPoints(parsedPoints);
    } catch (error) {
      console.error('Error loading points:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePoints = (newPoints: PointsData) => {
    if (!user) return;
    
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(newPoints));
      // write per-day history for calendar display
      const today = getISTDateString();
      const histRaw = localStorage.getItem(getHistoryKey());
      const hist = histRaw ? JSON.parse(histRaw) : {};
      hist[today] = {
        total: newPoints.total_points,
        shopping: newPoints.shopping_points,
        daily: newPoints.daily_visit_points,
        quest: newPoints.quest_completion_points,
        exercise: newPoints.exercise_quota_points,
        streak: newPoints.streak_bonus_points,
      };
      localStorage.setItem(getHistoryKey(), JSON.stringify(hist));
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

  const addShoppingPoints = async (pointsToAdd: number) => {
    if (!user) return;

    const newShoppingPoints = (points.shopping_points || 0) + pointsToAdd;
    const newPoints = {
      ...points,
      shopping_points: newShoppingPoints,
    };

    // Save to database (profiles table) if possible
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ shopping_points: newShoppingPoints })
        .eq("id", user.id);

      if (updateError) {
        console.warn("Could not update shopping_points in database:", updateError);
      }
    } catch (dbError) {
      console.warn("Database update failed for shopping_points:", dbError);
    }

    savePoints(newPoints);
  };

  return {
    points,
    loading,
    addQuestCompletionPoints,
    addExerciseQuotaPoints,
    addShoppingPoints,
    refetchPoints: loadPoints,
    recalculatePoints,
    getPointsHistory: () => {
      try {
        const histRaw = localStorage.getItem(getHistoryKey());
        return histRaw ? JSON.parse(histRaw) : {};
      } catch {
        return {};
      }
    }
  };
};