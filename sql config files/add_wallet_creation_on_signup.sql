-- ============================================
-- AUTO-CREATE WALLETS ON USER SIGNUP
-- ============================================
-- This migration adds automatic wallet creation when a new user signs up
-- It calls the create-user-wallet Edge Function via HTTP
-- ============================================

-- Step 1: Create function to call Edge Function for wallet creation
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  webhook_url TEXT;
  service_key TEXT;
  response_status INTEGER;
BEGIN
  -- Get project URL and service key from environment or set directly
  -- Replace these with your actual values:
  webhook_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-user-wallet';
  service_key := 'YOUR_SERVICE_ROLE_KEY';
  
  -- Call the Edge Function to create wallet
  -- We use net.http_post which is available in Supabase
  SELECT status INTO response_status
  FROM net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object(
      'user_id', NEW.id
    )
  );
  
  -- Log the result (but don't fail if it doesn't work)
  IF response_status >= 200 AND response_status < 300 THEN
    RAISE NOTICE 'Wallet creation triggered for user %', NEW.id;
  ELSE
    RAISE WARNING 'Wallet creation may have failed for user % (status: %)', NEW.id, response_status;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- CRITICAL: Don't fail signup if wallet creation fails
    -- Wallet can be created later via admin panel
    RAISE WARNING 'Error triggering wallet creation for user %: %', NEW.id, SQLERRM;
    RETURN NEW; -- Still return NEW to allow signup to succeed
END;
$$;

-- Step 2: Create trigger to call wallet creation function
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;

CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_wallet();

-- Step 3: Verify trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created_wallet';

-- ============================================
-- IMPORTANT: Update the function with your actual values
-- ============================================
-- After running this migration, you MUST update the function with:
-- 1. Your Supabase project reference ID (replace YOUR_PROJECT_REF)
-- 2. Your service role key (replace YOUR_SERVICE_ROLE_KEY)
--
-- Run this SQL to update:
/*
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  webhook_url TEXT;
  service_key TEXT;
  response_status INTEGER;
BEGIN
  webhook_url := 'https://YOUR_ACTUAL_PROJECT_REF.supabase.co/functions/v1/create-user-wallet';
  service_key := 'YOUR_ACTUAL_SERVICE_ROLE_KEY';
  
  SELECT status INTO response_status
  FROM net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object('user_id', NEW.id)
  );
  
  IF response_status >= 200 AND response_status < 300 THEN
    RAISE NOTICE 'Wallet created for user %', NEW.id;
  ELSE
    RAISE WARNING 'Wallet creation may have failed (status: %)', response_status;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error creating wallet: %', SQLERRM;
    RETURN NEW;
END;
$$;
*/

