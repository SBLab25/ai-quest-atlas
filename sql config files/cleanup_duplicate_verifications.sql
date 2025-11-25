-- ============================================
-- CLEANUP DUPLICATE VERIFICATIONS
-- ============================================
-- This script cleans up duplicate verification_ledger entries
-- Run this BEFORE the unique constraint is added, or if you get
-- duplicate key errors after adding the constraint
-- ============================================

-- Step 1: Temporarily drop the unique constraint if it exists
DROP INDEX IF EXISTS idx_verification_ledger_user_badge_unique;

-- Step 2: Find and display duplicates
SELECT 
  user_id,
  badge_id,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::text, ', ') as verification_ids,
  STRING_AGG(status::text, ', ') as statuses,
  STRING_AGG(created_at::text, ', ') as created_dates
FROM public.verification_ledger
WHERE status IN ('pending', 'success')
GROUP BY user_id, badge_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 3: Clean up duplicates
-- Keep only the most recent successful verification, or the most recent pending if no success exists
-- Delete all others
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

-- Step 4: Verify cleanup (should return 0 rows)
SELECT 
  user_id,
  badge_id,
  COUNT(*) as duplicate_count
FROM public.verification_ledger
WHERE status IN ('pending', 'success')
GROUP BY user_id, badge_id
HAVING COUNT(*) > 1;

-- Step 5: Recreate the unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_ledger_user_badge_unique
ON public.verification_ledger(user_id, badge_id)
WHERE status IN ('pending', 'success');

-- Step 6: Verify the constraint was created
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'verification_ledger'
  AND indexname = 'idx_verification_ledger_user_badge_unique';

