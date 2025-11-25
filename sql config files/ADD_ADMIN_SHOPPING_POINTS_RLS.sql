-- Add RLS policy to allow admins to update shopping_points for any user
-- This allows admin panel to credit points to users

-- First, check if the shopping_points column exists (create it if not)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS shopping_points INTEGER DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_shopping_points ON public.profiles(shopping_points DESC);

-- Add comment to document the column
COMMENT ON COLUMN public.profiles.shopping_points IS 'Shopping currency points (separate from score/XP). Used for purchasing items in the shop.';

-- Note: has_role function already exists in the database
-- It expects: has_role(_user_id uuid, _role app_role)
-- where app_role is an enum type ('admin', 'moderator', 'user')
-- We'll use the existing function, so we don't need to recreate it

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can update shopping_points for any user" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update shopping_points simple" ON public.profiles;

-- Create RLS policy to allow admins to update shopping_points for any user
-- This allows admins to credit points to users via the admin panel
-- Note: 'admin' must be cast to app_role enum type
CREATE POLICY "Admins can update shopping_points for any user"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  -- Allow if user is updating their own profile
  auth.uid() = id
  OR
  -- Allow if user is an admin (can update any user's profile)
  -- Cast 'admin' string to app_role enum type
  public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  -- Same conditions for WITH CHECK clause
  auth.uid() = id
  OR
  -- Cast 'admin' string to app_role enum type
  public.has_role(auth.uid(), 'admin'::app_role)
);

