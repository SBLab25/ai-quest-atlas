import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

      // Get users with their badge and submission counts
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url");

      if (usersError) throw usersError;

      // Get badge counts for each user
      const { data: badgeCounts, error: badgeError } = await supabase
        .from("User Badges")
        .select("user_id");

      if (badgeError) throw badgeError;

      // Get submission counts for each user
      const { data: submissionCounts, error: submissionError } = await supabase
        .from("Submissions")
        .select("user_id");

      if (submissionError) throw submissionError;

      // Calculate scores and build leaderboard
      const leaderboardData: LeaderboardUser[] = (users || []).map((user) => {
        const badges = badgeCounts?.filter(b => b.user_id === user.id).length || 0;
        const submissions = submissionCounts?.filter(s => s.user_id === user.id).length || 0;
        
        // Score calculation: badges worth 10 points, submissions worth 2 points
        const score = badges * 10 + submissions * 2;
        
        return {
          id: user.id,
          username: user.full_name || 'Anonymous',
          avatar_url: user.avatar_url,
          total_badges: badges,
          total_submissions: submissions,
          score,
          rank: 0 // Will be set below
        };
      });

      // Sort by score and assign ranks
      leaderboardData.sort((a, b) => b.score - a.score);
      leaderboardData.forEach((user, index) => {
        user.rank = index + 1;
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