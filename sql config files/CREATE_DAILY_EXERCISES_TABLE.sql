-- ===================================================================
-- CREATE DAILY EXERCISES TABLE
-- Run this in Supabase SQL Editor
-- ===================================================================

-- Create daily_exercises table
CREATE TABLE IF NOT EXISTS public.daily_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  exercises_completed text[] DEFAULT '{}',
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_daily_exercises_user_date ON daily_exercises(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_exercises_date ON daily_exercises(date);

-- Enable RLS
ALTER TABLE daily_exercises ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own exercises" ON daily_exercises;
CREATE POLICY "Users can view their own exercises"
  ON daily_exercises FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own exercises" ON daily_exercises;
CREATE POLICY "Users can insert their own exercises"
  ON daily_exercises FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own exercises" ON daily_exercises;
CREATE POLICY "Users can update their own exercises"
  ON daily_exercises FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

