import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { useStreak } from '@/hooks/useStreak';
import { useUserBadges } from '@/hooks/useUserBadges';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addNewBadges } from '@/utils/addNewBadges';

interface BadgeRequirement {
  badge_name: string;
  condition: (data: any) => boolean;
}

export const useBadgeAwarding = () => {
  const { user } = useAuth();
  const { points } = usePoints();
  const { streak } = useStreak();
  const { badges, refetch: refetchBadges } = useUserBadges();
  const hasRunRef = useRef(false);

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
      if (hasRunRef.current) return; // prevent duplicate awards on rerenders
      hasRunRef.current = true;
      // Ensure badge catalog exists to prevent "Badge not found" errors
      try {
        await addNewBadges();
      } catch (e) {
        // Ignore if they already exist
      }

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
      // 1) Try to find badge by exact name
      let badgeDataRes = await supabase
        .from('Badges')
        .select('id, name')
        .eq('name', badgeName)
        .limit(1);
      let badgeData = (badgeDataRes.data && badgeDataRes.data[0]) || null;

      // 2) If not found, insert it explicitly (no upsert to avoid ON CONFLICT requirement)
      if (!badgeData) {
        const { data: inserted, error: insertError } = await supabase
          .from('Badges')
          .insert({ name: badgeName, description: '', icon_url: '🏅', quest_id: null })
          .select('id, name')
          .single();
        if (insertError) {
          console.error('Badge insert failed:', insertError);
          return;
        }
        badgeData = inserted;
      }

      // Ensure a corresponding public."Users" row exists for FK satisfaction
      try {
        await supabase
          .from('Users')
          .upsert({ id: user.id, username: user.email || user.id, avatar_url: null, bio: null }, { onConflict: 'id' });
      } catch (e) {
        // ignore; if FK still fails we'll see the error
      }

      // Check if user already has this badge
      const { data: existingBadge } = await supabase
        .from('User Badges')
        .select('id')
        .eq('user_id', user.id)
        .eq('badge_id', badgeData.id)
        .limit(1)
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

      // Send badge notification
      if (user?.id && badgeData) {
        const { sendNotification } = await import('@/utils/notificationHelper');
        await sendNotification({
          userId: user.id,
          type: 'badge_earned',
          title: `New Badge Earned! 🏆`,
          message: `You've earned the "${badgeName}" badge!`,
          relatedId: badgeData.id,
          relatedType: 'badge',
        });
      }

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