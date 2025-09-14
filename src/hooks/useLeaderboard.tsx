import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { recalculateUserPoints } from "@/utils/recalculateUserPoints";

export interface LeaderboardUser {
  id: string;
  username: string;
  avatar_url: string | null;
  total_badges: number;
  total_submissions: number;
  score: number;
  rank: number;
}

export const useLeaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);

      // Get all users who have submissions (active users)
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url");

      if (usersError) throw usersError;

      // Calculate points for each user using the same system as treasure tab
      const leaderboardPromises = (users || []).map(async (user) => {
        try {
          // First try to get existing points from localStorage
          const storageKey = `user_points_${user.id}`;
          let userPoints;
          
          try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              userPoints = JSON.parse(stored);
            }
          } catch (e) {
            console.log(`No stored points for user ${user.id}, recalculating...`);
          }
          
          // If no stored points, recalculate
          if (!userPoints) {
            userPoints = await recalculateUserPoints(user.id);
          }
          
          // Get badge and submission counts for display
          const [badgeCountResult, submissionCountResult] = await Promise.all([
            supabase.from("User Badges").select("user_id").eq("user_id", user.id),
            supabase.from("Submissions").select("user_id, status").eq("user_id", user.id).eq("status", "verified")
          ]);
          
          const badges = badgeCountResult.data?.length || 0;
          const submissions = submissionCountResult.data?.length || 0;
          
          return {
            id: user.id,
            username: user.full_name || 'Anonymous',
            avatar_url: user.avatar_url,
            total_badges: badges,
            total_submissions: submissions,
            score: userPoints.total_points || 0,
            rank: 0
          };
        } catch (error) {
          console.error(`Error calculating points for user ${user.id}:`, error);
          return {
            id: user.id,
            username: user.full_name || 'Anonymous',
            avatar_url: user.avatar_url,
            total_badges: 0,
            total_submissions: 0,
            score: 0,
            rank: 0
          };
        }
      });

      const leaderboardData = await Promise.all(leaderboardPromises);

      // Sort by score and assign ranks
      leaderboardData.sort((a, b) => b.score - a.score);
      leaderboardData.forEach((u, index) => {
        u.rank = index + 1;
      });

      setLeaderboard(leaderboardData);

      // Find current user's rank
      if (user) {
        const currentUserData = leaderboardData.find(u => u.id === user.id);
        setUserRank(currentUserData?.rank || null);
      }

    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    leaderboard,
    userRank,
    loading,
    refetch: fetchLeaderboard
  };
};