-- Add gamification columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON public.profiles(xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_level ON public.profiles(level DESC);

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.add_xp_to_user(uuid, integer, text, text);
DROP FUNCTION IF EXISTS public.activate_powerup(uuid);

-- Function to add XP to user and auto-level up
CREATE OR REPLACE FUNCTION public.add_xp_to_user(
  p_user_id UUID,
  p_xp INTEGER,
  p_source TEXT DEFAULT 'quest',
  p_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_xp INTEGER;
  v_current_level INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_xp_for_next_level INTEGER;
  v_leveled_up BOOLEAN := FALSE;
BEGIN
  -- Get current XP and level
  SELECT xp, level INTO v_current_xp, v_current_level
  FROM public.profiles
  WHERE id = p_user_id;

  -- Add XP
  v_new_xp := v_current_xp + p_xp;
  v_new_level := v_current_level;

  -- Calculate level-ups (each level requires level * 100 XP)
  v_xp_for_next_level := v_new_level * 100;
  
  WHILE v_new_xp >= v_xp_for_next_level LOOP
    v_new_xp := v_new_xp - v_xp_for_next_level;
    v_new_level := v_new_level + 1;
    v_xp_for_next_level := v_new_level * 100;
    v_leveled_up := TRUE;
  END LOOP;

  -- Update user profile
  UPDATE public.profiles
  SET 
    xp = v_new_xp,
    level = v_new_level,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Log XP transaction
  INSERT INTO public.xp_logs (user_id, xp_amount, source, description)
  VALUES (p_user_id, p_xp, p_source, p_description);

  -- Return result
  RETURN json_build_object(
    'success', TRUE,
    'previous_xp', v_current_xp,
    'previous_level', v_current_level,
    'new_xp', v_new_xp,
    'new_level', v_new_level,
    'leveled_up', v_leveled_up,
    'xp_added', p_xp
  );
END;
$$;

-- Function to activate a power-up
CREATE OR REPLACE FUNCTION public.activate_powerup(
  p_user_powerup_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_powerup_duration INTEGER;
  v_activated_at TIMESTAMP WITH TIME ZONE;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get power-up duration
  SELECT p.duration_hours INTO v_powerup_duration
  FROM public.user_powerups up
  JOIN public.powerups p ON p.id = up.powerup_id
  WHERE up.id = p_user_powerup_id;

  IF v_powerup_duration IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'Power-up not found');
  END IF;

  -- Calculate activation and expiration times
  v_activated_at := NOW();
  v_expires_at := v_activated_at + (v_powerup_duration || ' hours')::INTERVAL;

  -- Update user power-up
  UPDATE public.user_powerups
  SET 
    is_active = TRUE,
    activated_at = v_activated_at,
    expires_at = v_expires_at,
    updated_at = NOW()
  WHERE id = p_user_powerup_id;

  RETURN json_build_object(
    'success', TRUE,
    'activated_at', v_activated_at,
    'expires_at', v_expires_at
  );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.add_xp_to_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_powerup TO authenticated;
