-- Add shopping_points column to profiles table
-- This stores the shopping currency separately from score (total_points)

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS shopping_points INTEGER DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_shopping_points ON public.profiles(shopping_points DESC);

-- Add comment to document the column
COMMENT ON COLUMN public.profiles.shopping_points IS 'Shopping currency points (separate from score/XP). Used for purchasing items in the shop.';

