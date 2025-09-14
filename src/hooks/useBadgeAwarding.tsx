import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { useStreak } from '@/hooks/useStreak';
import { useUserBadges } from '@/hooks/useUserBadges';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BadgeRequirement {
  badge_name: string;
  condition: (data: any) => boolean;
}

export const useBadgeAwarding = () => {
  const { user } = useAuth();
  const { points } = usePoints();
  const { streak } = useStreak();
  const { badges, refetch: refetchBadges } = useUserBadges();

  const badgeRequirements: BadgeRequirement[] = [
    {
      badge_name: "Welcome Adventurer",
      condition: () => true // Always award on first use
    },
    {
      badge_name: "First Steps", 
      condition: (data) => data.points.total_points >= 1
    },
    {
      badge_name: "Early Explorer",
      condition: (data) => data.points.quest_completion_points >= 30 // 3 quests * 10 points
    },
    {
      badge_name: "Daily Visitor",
      condition: (data) => data.points.daily_visit_points >= 7
    },
    {
      badge_name: "First Quest Complete!",
      condition: (data) => data.points.quest_completion_points >= 10 // 1 quest * 10 points
    },
    {
      badge_name: "Streak Keeper",
      condition: (data) => data.streak >= 10
    },
    {
      badge_name: "Streak Master", 
      condition: (data) => data.streak >= 30
    },
    {
      badge_name: "Point Collector",
      condition: (data) => data.points.total_points >= 100
    }
  ];

  const checkAndAwardBadges = async () => {
    if (!user || !points) return;

    try {
      const currentBadgeNames = badges.map(b => b.badge.name);
      const userData = { points, streak };

      for (const requirement of badgeRequirements) {
        // Skip if user already has this badge
        if (currentBadgeNames.includes(requirement.badge_name)) continue;

        // Check if condition is met
        if (requirement.condition(userData)) {
          await awardBadge(requirement.badge_name);
        }
      }
    } catch (error) {
      console.error('Error checking badge requirements:', error);
    }
  };

  const awardBadge = async (badgeName: string) => {
    try {
      // First get the badge ID
      const { data: badgeData, error: badgeError } = await supabase
        .from('Badges')
        .select('id, name')
        .eq('name', badgeName)
        .single();

      if (badgeError || !badgeData) {
        console.error('Badge not found:', badgeName);
        return;
      }

      // Check if user already has this badge
      const { data: existingBadge } = await supabase
        .from('User Badges')
        .select('id')
        .eq('user_id', user.id)
        .eq('badge_id', badgeData.id)
        .single();

      if (existingBadge) return; // Already has this badge

      // Award the badge
      const { error: awardError } = await supabase
        .from('User Badges')
        .insert({
          user_id: user.id,
          badge_id: badgeData.id,
          earned_at: new Date().toISOString()
        });

      if (awardError) {
        console.error('Error awarding badge:', awardError);
        return;
      }

      // Show success toast
      toast.success(`🏆 New Badge Earned: ${badgeName}!`, {
        description: "Check your badge collection in the Crew tab.",
        duration: 5000,
      });

      // Refresh badges
      refetchBadges();

    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  };

  useEffect(() => {
    if (user && points && !isNaN(streak)) {
      checkAndAwardBadges();
    }
  }, [user, points, streak]);

  return { checkAndAwardBadges };
};