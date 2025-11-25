-- ============================================
-- PREVENT DUPLICATE WEBHOOK PROCESSING
-- ============================================
-- This migration adds idempotency to prevent duplicate NFT minting
-- when the webhook triggers multiple times
-- ============================================

-- Step 1: Drop the unique constraint if it exists (in case we need to re-run)
DROP INDEX IF EXISTS idx_verification_ledger_user_badge_unique;

-- Step 2: Clean up existing duplicates before adding constraint
-- Keep only the most recent successful verification, or the most recent pending if no success exists
WITH ranked_verifications AS (
  SELECT 
    id,
    user_id,
    badge_id,
    status,
    transaction_hash,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, badge_id 
      ORDER BY 
        CASE WHEN status = 'success' AND transaction_hash IS NOT NULL THEN 1 
             WHEN status = 'success' THEN 2
             WHEN status = 'pending' THEN 3
             ELSE 4 END,
        created_at DESC
    ) as rn
  FROM public.verification_ledger
  WHERE status IN ('pending', 'success')
)
DELETE FROM public.verification_ledger
WHERE id IN (
  SELECT id FROM ranked_verifications WHERE rn > 1
);

-- Step 3: Add a unique constraint to prevent duplicate verifications
-- This ensures only one verification record per user+badge combination
-- Note: We use a partial unique index to allow multiple records only if they're old failed ones
-- But for active/pending records, we want uniqueness

-- Add a unique constraint on (user_id, badge_id) for active records
-- We'll use a partial unique index that only applies to non-failed records
CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_ledger_user_badge_unique
ON public.verification_ledger(user_id, badge_id)
WHERE status IN ('pending', 'success');

-- Step 3: Add a function to check if processing is already in progress
CREATE OR REPLACE FUNCTION public.is_verification_in_progress(
  p_user_id UUID,
  p_badge_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Check if there's a pending verification created in the last 5 minutes
  SELECT COUNT(*) INTO v_count
  FROM public.verification_ledger
  WHERE user_id = p_user_id
    AND badge_id = p_badge_id
    AND status = 'pending'
    AND created_at > NOW() - INTERVAL '5 minutes';
  
  RETURN v_count > 0;
END;
$$;

-- Step 4: Update the webhook function to check before calling
-- This prevents the webhook from even calling the edge function if processing is in progress
CREATE OR REPLACE FUNCTION public.handle_new_badge()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_url TEXT;
  service_key TEXT;
  is_processing BOOLEAN;
BEGIN
  -- Check if verification is already in progress
  is_processing := public.is_verification_in_progress(NEW.user_id, NEW.badge_id);
  
  IF is_processing THEN
    -- Log that we're skipping duplicate webhook
    RAISE NOTICE 'Skipping webhook call for user % badge % - verification already in progress', NEW.user_id, NEW.badge_id;
    RETURN NEW;
  END IF;
  
  -- Check if verification already succeeded
  IF EXISTS (
    SELECT 1 
    FROM public.verification_ledger 
    WHERE user_id = NEW.user_id 
      AND badge_id = NEW.badge_id 
      AND status = 'success'
      AND transaction_hash IS NOT NULL
  ) THEN
    -- Already minted, skip webhook
    RAISE NOTICE 'Skipping webhook call for user % badge % - already minted', NEW.user_id, NEW.badge_id;
    RETURN NEW;
  END IF;
  
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

-- Step 5: Verify the changes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'verification_ledger'
  AND indexname = 'idx_verification_ledger_user_badge_unique';

-- Step 6: Check for existing duplicates (for cleanup)
SELECT 
  user_id,
  badge_id,
  COUNT(*) as duplicate_count,
  STRING_AGG(status::text, ', ') as statuses
FROM public.verification_ledger
GROUP BY user_id, badge_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

