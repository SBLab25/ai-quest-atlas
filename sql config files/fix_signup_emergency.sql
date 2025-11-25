-- ============================================
-- EMERGENCY FIX: Make handle_new_user non-blocking
-- ============================================
-- If signup is completely broken, this makes the function
-- never fail, allowing signups to succeed even if profile creation fails
-- ============================================

-- Option 1: Make function completely non-blocking
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try to create profile, but don't fail if it doesn't work
  BEGIN
    INSERT INTO public.profiles (id, username, full_name)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'username', 'user_' || substr(NEW.id::text, 1, 8)),
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User')
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN others THEN
      -- Silently ignore all errors - don't log, don't fail
      -- This ensures signup always succeeds
      NULL;
  END;
  
  RETURN NEW;
END;
$$;

-- Option 2: If you want to temporarily disable the trigger entirely
-- Uncomment these lines:
/*
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
*/

-- Option 3: Re-enable trigger (if you disabled it)
/*
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();
*/

