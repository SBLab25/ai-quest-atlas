-- ============================================
-- DISCOVERY ATLAS ENHANCED GAMIFICATION SYSTEM
-- ============================================

-- 1. Add XP and Level to User Profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- 2. Create Achievements Table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('exploration', 'consistency', 'creativity', 'social')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  xp_reward INTEGER NOT NULL DEFAULT 0,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create User Achievements Table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- 4. Create Challenges Table
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reward_points INTEGER NOT NULL DEFAULT 0,
  reward_xp INTEGER NOT NULL DEFAULT 0,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create User Challenges Table
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- 6. Create Events Table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  theme TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reward_type TEXT,
  reward_value INTEGER,
  banner_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create Event Quests Table
CREATE TABLE IF NOT EXISTS public.event_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES public."Quests"(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, quest_id)
);

-- 8. Create Power-Ups Table
CREATE TABLE IF NOT EXISTS public.powerups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_hours INTEGER NOT NULL,
  effect_type TEXT NOT NULL CHECK (effect_type IN ('double_xp', 'instant_verify', 'bonus_badge', 'point_multiplier')),
  multiplier NUMERIC DEFAULT 1.0,
  icon_url TEXT,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create User Power-Ups Table
CREATE TABLE IF NOT EXISTS public.user_powerups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  powerup_id UUID NOT NULL REFERENCES public.powerups(id) ON DELETE CASCADE,
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Create XP Logs Table
CREATE TABLE IF NOT EXISTS public.xp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  points INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Add Difficulty Level to Quests
ALTER TABLE public."Quests" ADD COLUMN IF NOT EXISTS difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'epic'));
ALTER TABLE public."Quests" ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 25;
ALTER TABLE public."Quests" ADD COLUMN IF NOT EXISTS is_limited_time BOOLEAN DEFAULT false;
ALTER TABLE public."Quests" ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Update XP rewards based on difficulty
UPDATE public."Quests" SET xp_reward = 10 WHERE difficulty_level = 'easy';
UPDATE public."Quests" SET xp_reward = 25 WHERE difficulty_level = 'medium';
UPDATE public."Quests" SET xp_reward = 50 WHERE difficulty_level = 'hard';
UPDATE public."Quests" SET xp_reward = 100 WHERE difficulty_level = 'epic';

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.powerups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_powerups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;

-- Achievements: Everyone can read, admin can write
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

-- User Achievements: Users can view their own, insert is handled by functions
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);

-- Challenges: Everyone can read active challenges
CREATE POLICY "Anyone can view active challenges" ON public.challenges FOR SELECT USING (is_active = true);

-- User Challenges: Users can view and update their own
CREATE POLICY "Users can view their own challenges" ON public.user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own challenges" ON public.user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own challenges" ON public.user_challenges FOR UPDATE USING (auth.uid() = user_id);

-- Events: Everyone can read active events
CREATE POLICY "Anyone can view active events" ON public.events FOR SELECT USING (is_active = true);

-- Event Quests: Everyone can read
CREATE POLICY "Anyone can view event quests" ON public.event_quests FOR SELECT USING (true);

-- Power-ups: Everyone can read
CREATE POLICY "Anyone can view powerups" ON public.powerups FOR SELECT USING (true);

-- User Power-ups: Users can view and manage their own
CREATE POLICY "Users can view their own powerups" ON public.user_powerups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own powerups" ON public.user_powerups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own powerups" ON public.user_powerups FOR UPDATE USING (auth.uid() = user_id);

-- XP Logs: Users can view their own
CREATE POLICY "Users can view their own xp logs" ON public.xp_logs FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to add XP to user
CREATE OR REPLACE FUNCTION public.add_xp_to_user(
  p_user_id UUID,
  p_xp INTEGER,
  p_source TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_old_level INTEGER;
BEGIN
  -- Get current level
  SELECT level INTO v_old_level FROM profiles WHERE id = p_user_id;
  
  -- Add XP
  UPDATE profiles 
  SET xp = xp + p_xp
  WHERE id = p_user_id
  RETURNING xp INTO v_new_xp;
  
  -- Calculate new level (every 100 XP = 1 level)
  v_new_level := FLOOR(v_new_xp / 100.0) + 1;
  
  -- Update level if changed
  IF v_new_level > v_old_level THEN
    UPDATE profiles SET level = v_new_level WHERE id = p_user_id;
  END IF;
  
  -- Log XP transaction
  INSERT INTO xp_logs (user_id, source, points, description)
  VALUES (p_user_id, p_source, p_xp, p_description);
END;
$$;

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION public.check_and_unlock_achievement(
  p_user_id UUID,
  p_achievement_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_xp_reward INTEGER;
  v_already_unlocked BOOLEAN;
BEGIN
  -- Check if already unlocked
  SELECT EXISTS(
    SELECT 1 FROM user_achievements 
    WHERE user_id = p_user_id AND achievement_id = p_achievement_id
  ) INTO v_already_unlocked;
  
  IF v_already_unlocked THEN
    RETURN false;
  END IF;
  
  -- Get XP reward
  SELECT xp_reward INTO v_xp_reward FROM achievements WHERE id = p_achievement_id;
  
  -- Unlock achievement
  INSERT INTO user_achievements (user_id, achievement_id)
  VALUES (p_user_id, p_achievement_id);
  
  -- Award XP
  PERFORM add_xp_to_user(p_user_id, v_xp_reward, 'achievement', 'Achievement unlocked');
  
  RETURN true;
END;
$$;

-- Function to activate power-up
CREATE OR REPLACE FUNCTION public.activate_powerup(
  p_user_powerup_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_duration_hours INTEGER;
BEGIN
  -- Get duration
  SELECT p.duration_hours INTO v_duration_hours
  FROM user_powerups up
  JOIN powerups p ON up.powerup_id = p.id
  WHERE up.id = p_user_powerup_id;
  
  -- Activate and set expiry
  UPDATE user_powerups
  SET 
    is_active = true,
    activated_at = NOW(),
    expires_at = NOW() + (v_duration_hours || ' hours')::INTERVAL
  WHERE id = p_user_powerup_id;
END;
$$;

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default achievements
INSERT INTO public.achievements (title, description, category, rarity, xp_reward, requirement_type, requirement_value) VALUES
  ('First Steps', 'Complete your first quest', 'exploration', 'common', 10, 'quests_completed', 1),
  ('Explorer', 'Visit 10 different locations', 'exploration', 'common', 25, 'locations_visited', 10),
  ('Master Explorer', 'Visit 50 different locations', 'exploration', 'rare', 100, 'locations_visited', 50),
  ('Streak Starter', 'Maintain a 3-day quest streak', 'consistency', 'common', 15, 'streak_days', 3),
  ('Dedicated', 'Maintain a 7-day quest streak', 'consistency', 'rare', 50, 'streak_days', 7),
  ('Unstoppable', 'Maintain a 30-day quest streak', 'consistency', 'epic', 200, 'streak_days', 30),
  ('Photographer', 'Upload 5 verified photos', 'creativity', 'common', 20, 'verified_photos', 5),
  ('Influencer', 'Get 10 followers', 'social', 'rare', 30, 'followers', 10),
  ('Community Leader', 'Get 50 followers', 'social', 'epic', 150, 'followers', 50)
ON CONFLICT DO NOTHING;

-- Insert default power-ups
INSERT INTO public.powerups (name, description, duration_hours, effect_type, multiplier, rarity) VALUES
  ('Double XP Boost', 'Earn 2x XP for 24 hours', 24, 'double_xp', 2.0, 'rare'),
  ('Instant Verify', 'Skip AI verification wait once', 0, 'instant_verify', 1.0, 'epic'),
  ('Bonus Badge', 'Get a random badge on quest completion', 0, 'bonus_badge', 1.0, 'rare'),
  ('Triple Points', 'Earn 3x points for 12 hours', 12, 'point_multiplier', 3.0, 'legendary')
ON CONFLICT DO NOTHING;

-- Create initial daily challenges
INSERT INTO public.challenges (type, title, description, start_date, end_date, reward_points, reward_xp, requirement_type, requirement_value) VALUES
  ('daily', 'Complete 2 Quests Today', 'Finish any 2 quests before midnight', NOW(), NOW() + INTERVAL '1 day', 50, 20, 'quests_completed', 2),
  ('daily', 'Earn an AI Verification', 'Get at least one AI-verified submission', NOW(), NOW() + INTERVAL '1 day', 30, 15, 'verified_submissions', 1)
ON CONFLICT DO NOTHING;

-- Create initial weekly challenge
INSERT INTO public.challenges (type, title, description, start_date, end_date, reward_points, reward_xp, requirement_type, requirement_value) VALUES
  ('weekly', 'Weekly Explorer', 'Complete 5 quests this week', NOW(), NOW() + INTERVAL '7 days', 200, 100, 'quests_completed', 5)
ON CONFLICT DO NOTHING;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to expire limited-time quests
CREATE OR REPLACE FUNCTION public.archive_expired_quests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public."Quests"
  SET is_active = false
  WHERE is_limited_time = true
    AND expires_at < NOW()
    AND is_active = true;
END;
$$;
