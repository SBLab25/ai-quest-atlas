-- ============================================
-- FIX SIGNUP: Ensure wallet columns are nullable
-- ============================================
-- This migration ensures wallet_address and wallet_private_key_encrypted
-- are nullable so new user signups don't fail
-- ============================================

-- Step 1: Add wallet columns if they don't exist (make them nullable)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wallet_address TEXT,
ADD COLUMN IF NOT EXISTS wallet_private_key_encrypted TEXT;

-- Step 2: Ensure they are nullable (remove NOT NULL if it exists)
ALTER TABLE public.profiles 
ALTER COLUMN wallet_address DROP NOT NULL,
ALTER COLUMN wallet_private_key_encrypted DROP NOT NULL;

-- Step 3: Verify the columns are nullable
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('wallet_address', 'wallet_private_key_encrypted');

-- Step 4: Update handle_new_user function to ensure it doesn't require wallet fields
-- The function should work fine as-is since it only inserts id, username, and full_name
-- But let's make sure it's correct
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'full_name'
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
  RETURN NEW;
END;
$function$;

-- Step 5: Verify the function
SELECT 
  proname,
  prosrc
FROM pg_proc
WHERE proname = 'handle_new_user';

