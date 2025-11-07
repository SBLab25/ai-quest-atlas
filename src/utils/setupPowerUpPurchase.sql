-- First, update the powerups table constraint to allow all effect types
ALTER TABLE powerups DROP CONSTRAINT IF EXISTS powerups_effect_type_check;
ALTER TABLE powerups ADD CONSTRAINT powerups_effect_type_check 
  CHECK (effect_type IN ('double_xp', 'instant_verify', 'bonus_badge', 'point_multiplier', 'streak_freeze', 'location_hint', 'lucky_charm', 'quest_radar'));

-- Function to purchase a power-up with points
CREATE OR REPLACE FUNCTION purchase_powerup(
  p_user_id UUID,
  p_powerup_id UUID,
  p_cost INTEGER
) RETURNS JSON AS $$
DECLARE
  v_current_points INTEGER;
  v_powerup_exists BOOLEAN;
BEGIN
  -- Check if power-up exists
  SELECT EXISTS(
    SELECT 1 FROM powerups WHERE id = p_powerup_id
  ) INTO v_powerup_exists;
  
  IF NOT v_powerup_exists THEN
    RETURN json_build_object(
      'success', FALSE, 
      'error', 'Power-up does not exist'
    );
  END IF;

  -- Get user's current shopping_points (currency for shop)
  SELECT COALESCE(shopping_points, 0) INTO v_current_points
  FROM profiles 
  WHERE id = p_user_id;
  
  -- Check if user has enough shopping points
  IF v_current_points IS NULL OR v_current_points < p_cost THEN
    RETURN json_build_object(
      'success', FALSE, 
      'error', 'Insufficient shopping points',
      'current_points', v_current_points,
      'required_points', p_cost
    );
  END IF;
  
  -- Deduct shopping_points from user (not total_points/score)
  UPDATE profiles
  SET shopping_points = shopping_points - p_cost
  WHERE id = p_user_id;
  
  -- Add power-up to user's inventory
  INSERT INTO user_powerups (user_id, powerup_id, is_active)
  VALUES (p_user_id, p_powerup_id, FALSE);
  
  -- Return success
  RETURN json_build_object(
    'success', TRUE,
    'remaining_points', v_current_points - p_cost
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Handle any errors
  RETURN json_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION purchase_powerup(UUID, UUID, INTEGER) TO authenticated;

-- Ensure shopping_points column exists (for currency)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'shopping_points'
  ) THEN
    ALTER TABLE profiles ADD COLUMN shopping_points INTEGER DEFAULT 0;
    CREATE INDEX IF NOT EXISTS idx_profiles_shopping_points ON profiles(shopping_points DESC);
  END IF;
END $$;

-- Add cost column to powerups table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'powerups' AND column_name = 'cost'
  ) THEN
    ALTER TABLE powerups ADD COLUMN cost INTEGER DEFAULT 100;
    COMMENT ON COLUMN powerups.cost IS 'Cost in shopping points to purchase this power-up';
  END IF;
END $$;

-- Seed power-ups with proper data and costs (if not exists)
-- Note: Use ON CONFLICT to update existing powerups with costs
INSERT INTO powerups (name, description, effect_type, rarity, duration_hours, multiplier, cost)
VALUES
  ('Double XP Boost', 'Doubles XP earned on all quest completions for 24 hours', 'double_xp', 'rare', 24, 2.0, 200),
  ('Instant Verify', 'Skip AI verification wait time for one quest', 'instant_verify', 'epic', 0, 1.0, 150),
  ('Point Multiplier', 'Triple points on all activities for 12 hours', 'point_multiplier', 'legendary', 12, 3.0, 500),
  ('Streak Freeze', 'Protect your streak for 1 missed day', 'streak_freeze', 'common', 24, 1.0, 50),
  ('Location Hint', 'Reveals 3 nearby uncompleted quests on map', 'location_hint', 'common', 0, 1.0, 30),
  ('Lucky Charm', '50% higher chance of rare badge drops for 6 hours', 'lucky_charm', 'rare', 6, 1.5, 100),
  ('Quest Radar', 'Shows all quests within 5km radius on map for 2 hours', 'quest_radar', 'rare', 2, 1.0, 80)
ON CONFLICT DO NOTHING;

-- Update existing powerups with costs if they don't have one
UPDATE powerups SET cost = CASE effect_type
  WHEN 'double_xp' THEN 200
  WHEN 'instant_verify' THEN 150
  WHEN 'point_multiplier' THEN 500
  WHEN 'streak_freeze' THEN 50
  WHEN 'location_hint' THEN 30
  WHEN 'lucky_charm' THEN 100
  WHEN 'quest_radar' THEN 80
  ELSE 100
END
WHERE cost IS NULL OR cost = 0;
