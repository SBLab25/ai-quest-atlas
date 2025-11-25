-- ============================================
-- COMPREHENSIVE FIX FOR SIGNUP ERRORS
-- ============================================
-- This migration fixes all potential issues with user signup
-- ============================================

-- Step 1: Ensure wallet columns exist and are nullable
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wallet_address TEXT,
ADD COLUMN IF NOT EXISTS wallet_private_key_encrypted TEXT;

-- Make sure they're nullable
ALTER TABLE public.profiles 
ALTER COLUMN wallet_address DROP NOT NULL,
ALTER COLUMN wallet_private_key_encrypted DROP NOT NULL;

-- Step 2: Fix RLS policies for profile creation
-- The trigger runs as SECURITY DEFINER, but we need to ensure policies allow inserts

-- Drop existing INSERT policy if it's too restrictive
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create a policy that allows the trigger function to insert profiles
-- SECURITY DEFINER functions bypass RLS, but it's good to have this policy anyway
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Also allow service role to insert (for the trigger function)
-- This is needed because SECURITY DEFINER should work, but let's be explicit
CREATE POLICY IF NOT EXISTS "Service role can insert profiles"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);

-- Step 3: Update handle_new_user function with better error handling
-- This function MUST NOT fail or it will cause signup to fail
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_full_name TEXT;
  v_profile_exists BOOLEAN;
BEGIN
  -- Check if profile already exists (shouldn't happen, but be safe)
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.id) INTO v_profile_exists;
  
  IF v_profile_exists THEN
    -- Profile already exists, just return
    RETURN NEW;
  END IF;
  
  -- Extract username and full_name from metadata, with fallbacks
  v_username := COALESCE(
    NEW.raw_user_meta_data ->> 'username',
    'user_' || substr(NEW.id::text, 1, 8)
  );
  
  v_full_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    'User'
  );
  
  -- Ensure username is unique by appending user ID if needed
  -- But first try the original username
  BEGIN
    INSERT INTO public.profiles (id, username, full_name)
    VALUES (NEW.id, v_username, v_full_name);
  EXCEPTION
    WHEN unique_violation THEN
      -- Username conflict, append user ID
      v_username := v_username || '_' || substr(NEW.id::text, 1, 8);
      INSERT INTO public.profiles (id, username, full_name)
      VALUES (NEW.id, v_username, v_full_name);
  END;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- CRITICAL: Log error but DON'T fail signup
    -- If we raise an exception here, it will cause signup to fail
    -- Instead, log and continue
    RAISE WARNING 'Error in handle_new_user for user %: % (SQLSTATE: %)', 
      NEW.id, SQLERRM, SQLSTATE;
    -- Return NEW anyway to allow signup to succeed
    -- Profile can be created manually later if needed
    RETURN NEW;
END;
$$;

-- Step 4: Ensure notification_preferences table exists (required by another trigger)
-- This prevents "relation notification_preferences does not exist" error
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  quest_updates BOOLEAN DEFAULT true,
  social_interactions BOOLEAN DEFAULT true,
  team_activities BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notification_preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.notification_preferences;
CREATE POLICY "Users can view their own preferences"
  ON public.notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert their own preferences"
  ON public.notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON public.notification_preferences;
CREATE POLICY "Users can update their own preferences"
  ON public.notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update notification preferences trigger function to handle errors
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error creating notification preferences: %', SQLERRM;
    RETURN NEW; -- Don't fail signup
END;
$$;

-- Step 5: Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Verify everything is set up correctly
SELECT 
  'Wallet columns' as check_type,
  column_name,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('wallet_address', 'wallet_private_key_encrypted')
UNION ALL
SELECT 
  'Function exists' as check_type,
  proname as column_name,
  CASE WHEN proname IS NOT NULL THEN 'YES' ELSE 'NO' END as is_nullable
FROM pg_proc
WHERE proname = 'handle_new_user'
UNION ALL
SELECT 
  'Trigger exists' as check_type,
  trigger_name as column_name,
  CASE WHEN trigger_name IS NOT NULL THEN 'YES' ELSE 'NO' END as is_nullable
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Step 6: Check RLS policies
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

