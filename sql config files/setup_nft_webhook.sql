-- ============================================
-- NFT MINTING WEBHOOK SETUP (BADGE-BASED)
-- ============================================
-- This SQL creates a database trigger that automatically calls
-- the mint-achievement-nft edge function when a new badge is earned
--
-- IMPORTANT: Replace the placeholders before running:
-- 1. YOUR_PROJECT_REF - Your Supabase project reference ID
-- 2. YOUR_SERVICE_ROLE_KEY - Your service role key from Project Settings > API
-- ============================================

-- Step 1: Create the webhook function
CREATE OR REPLACE FUNCTION public.handle_new_badge()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_url TEXT;
  service_key TEXT;
BEGIN
  -- Set your project URL (replace YOUR_PROJECT_REF)
  webhook_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/mint-achievement-nft';
  
  -- Set your service role key (replace YOUR_SERVICE_ROLE_KEY)
  service_key := 'YOUR_SERVICE_ROLE_KEY';
  
  -- Make HTTP POST request to edge function
  PERFORM
    net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object(
        'record', row_to_json(NEW)
      )
    );
  
  RETURN NEW;
END;
$$;

-- Step 2: Create the trigger
-- This will fire AFTER a new row is inserted into "User Badges"
DROP TRIGGER IF EXISTS on_badge_earned ON public."User Badges";

CREATE TRIGGER on_badge_earned
  AFTER INSERT ON public."User Badges"
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_badge();

-- Step 3: Verify the trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'User Badges'
  AND trigger_name = 'on_badge_earned';

-- ============================================
-- TESTING
-- ============================================
-- Uncomment and run this to test the webhook (replace with real UUIDs):
/*
INSERT INTO public."User Badges" (user_id, badge_id, earned_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',  -- Replace with real user UUID
  '00000000-0000-0000-0000-000000000002',  -- Replace with real badge UUID
  NOW()
);
*/

-- Check if webhook was triggered (check verification_ledger):
-- SELECT * FROM public.verification_ledger ORDER BY created_at DESC LIMIT 5;

