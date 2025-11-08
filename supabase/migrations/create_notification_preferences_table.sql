-- ============================================
-- CREATE NOTIFICATION_PREFERENCES TABLE
-- ============================================
-- This table is referenced by a trigger but doesn't exist
-- This migration creates it and fixes the signup error
-- ============================================

-- Step 1: Create notification_preferences table
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

-- Step 2: Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies
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

-- Step 4: Update the trigger function to handle errors gracefully
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create default notification preferences for new user
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- CRITICAL: Don't fail signup if this fails
    RAISE WARNING 'Error creating notification preferences for user %: %', NEW.id, SQLERRM;
    RETURN NEW; -- Still return NEW to allow signup to succeed
END;
$$;

-- Step 5: Ensure trigger exists (it should already exist, but make sure)
DROP TRIGGER IF EXISTS on_auth_user_created_notification_preferences ON auth.users;

CREATE TRIGGER on_auth_user_created_notification_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_notification_preferences();

-- Step 6: Create default preferences for existing users who don't have them
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Step 7: Verify
SELECT 
  'Table exists' as check_type,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'notification_preferences'
  ) THEN 'YES' ELSE 'NO' END as status
UNION ALL
SELECT 
  'Trigger exists' as check_type,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created_notification_preferences'
  ) THEN 'YES' ELSE 'NO' END as status;

