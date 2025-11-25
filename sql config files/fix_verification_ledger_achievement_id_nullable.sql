-- ============================================
-- FIX VERIFICATION_LEDGER: Make achievement_id nullable
-- ============================================
-- This migration makes achievement_id nullable so that badge-based
-- NFT minting can work without requiring achievement_id
-- ============================================

-- Make achievement_id nullable (allows NULL values)
ALTER TABLE public.verification_ledger 
ALTER COLUMN achievement_id DROP NOT NULL;

-- Verify the change
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'verification_ledger'
  AND column_name IN ('achievement_id', 'badge_id');

