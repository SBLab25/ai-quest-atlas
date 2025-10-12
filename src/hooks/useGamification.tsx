import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon_url?: string;
  category: string;
  rarity: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
}

export interface UserAchievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
  achievements?: Achievement;
}

export interface Challenge {
  id: string;
  type: 'daily' | 'weekly';
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  reward_points: number;
  reward_xp: number;
  requirement_type: string;
  requirement_value: number;
  is_active: boolean;
}

export interface UserChallenge {
  id: string;
  challenge_id: string;
  progress: number;
  status: 'in_progress' | 'completed';
  completed_at?: string;
  challenges?: Challenge;
}

export interface Event {
  id: string;
  name: string;
  theme: string;
  description: string;
  start_date: string;
  end_date: string;
  reward_type?: string;
  reward_value?: number;
  banner_url?: string;
  is_active: boolean;
}

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  duration_hours: number;
  effect_type: string;
  multiplier: number;
  icon_url?: string;
  rarity: string;
}

export interface UserPowerUp {
  id: string;
  powerup_id: string;
  activated_at?: string;
  expires_at?: string;
  is_active: boolean;
  powerups?: PowerUp;
}

export const useGamification = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [userPowerUps, setUserPowerUps] = useState<UserPowerUp[]>([]);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGamificationData();
    }
  }, [user]);

  const fetchGamificationData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all achievements using type assertion for new tables
      const { data: achievementsData } = await supabase
        .from('achievements' as any)
        .select('*')
        .order('xp_reward', { ascending: false });

      // Fetch user's unlocked achievements
      const { data: userAchievementsData } = await supabase
        .from('user_achievements' as any)
        .select(`
          *,
          achievements(*)
        `)
        .eq('user_id', user.id);

      // Fetch active challenges
      const { data: challengesData } = await supabase
        .from('challenges' as any)
        .select('*')
        .eq('is_active', true)
        .order('end_date', { ascending: true });

      // Fetch user's challenges
      const { data: userChallengesData } = await supabase
        .from('user_challenges' as any)
        .select(`
          *,
          challenges(*)
        `)
        .eq('user_id', user.id);

      // Fetch active events
      const { data: eventsData } = await supabase
        .from('events' as any)
        .select('*')
        .eq('is_active', true)
        .order('end_date', { ascending: true });

      // Fetch all power-ups
      const { data: powerUpsData } = await supabase
        .from('powerups' as any)
        .select('*');

      // Fetch user's power-ups
      const { data: userPowerUpsData } = await supabase
        .from('user_powerups' as any)
        .select(`
          *,
          powerups(*)
        `)
        .eq('user_id', user.id);

      // Fetch user's XP and level
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      setAchievements((achievementsData as any) || []);
      setUserAchievements((userAchievementsData as any) || []);
      setChallenges((challengesData as any) || []);
      setUserChallenges((userChallengesData as any) || []);
      setEvents((eventsData as any) || []);
      setPowerUps((powerUpsData as any) || []);
      setUserPowerUps((userPowerUpsData as any) || []);
      setXp((profileData as any)?.xp || 0);
      setLevel((profileData as any)?.level || 1);
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAchievements = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-achievements');
      
      if (error) throw error;
      
      if (data?.unlockedAchievements?.length > 0) {
        await fetchGamificationData();
        return data.unlockedAchievements;
      }
      
      return [];
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  };

  const activatePowerUp = async (userPowerUpId: string) => {
    if (!user) return false;

    try {
      const { error } = await (supabase.rpc as any)('activate_powerup', {
        p_user_powerup_id: userPowerUpId
      });

      if (error) throw error;

      await fetchGamificationData();
      return true;
    } catch (error) {
      console.error('Error activating power-up:', error);
      return false;
    }
  };

  const updateChallengeProgress = async (challengeId: string, progress: number) => {
    if (!user) return;

    try {
      const userChallenge = userChallenges.find(uc => uc.challenge_id === challengeId);
      const challenge = challenges.find(c => c.id === challengeId);

      if (!challenge) return;

      const isCompleted = progress >= challenge.requirement_value;

      if (userChallenge) {
        // Update existing
        await supabase
          .from('user_challenges' as any)
          .update({
            progress,
            status: isCompleted ? 'completed' : 'in_progress',
            completed_at: isCompleted ? new Date().toISOString() : null
          })
          .eq('id', userChallenge.id);
      } else {
        // Insert new
        await supabase
          .from('user_challenges' as any)
          .insert({
            user_id: user.id,
            challenge_id: challengeId,
            progress,
            status: isCompleted ? 'completed' : 'in_progress',
            completed_at: isCompleted ? new Date().toISOString() : null
          });
      }

      // Award rewards if completed
      if (isCompleted && !userChallenge?.completed_at) {
        await (supabase.rpc as any)('add_xp_to_user', {
          p_user_id: user.id,
          p_xp: challenge.reward_xp,
          p_source: 'challenge',
          p_description: `Completed challenge: ${challenge.title}`
        });
      }

      await fetchGamificationData();
    } catch (error) {
      console.error('Error updating challenge progress:', error);
    }
  };

  const getActivePowerUps = () => {
    return userPowerUps.filter(up => up.is_active && up.expires_at && new Date(up.expires_at) > new Date());
  };

  const getXPMultiplier = () => {
    const activePowerUps = getActivePowerUps();
    const xpBoost = activePowerUps.find(up => up.powerups?.effect_type === 'double_xp');
    return xpBoost?.powerups?.multiplier || 1;
  };

  const getPointsMultiplier = () => {
    const activePowerUps = getActivePowerUps();
    const pointsBoost = activePowerUps.find(up => up.powerups?.effect_type === 'point_multiplier');
    return pointsBoost?.powerups?.multiplier || 1;
  };

  return {
    achievements,
    userAchievements,
    challenges,
    userChallenges,
    events,
    powerUps,
    userPowerUps,
    xp,
    level,
    loading,
    checkAchievements,
    activatePowerUp,
    updateChallengeProgress,
    getActivePowerUps,
    getXPMultiplier,
    getPointsMultiplier,
    refresh: fetchGamificationData
  };
};
