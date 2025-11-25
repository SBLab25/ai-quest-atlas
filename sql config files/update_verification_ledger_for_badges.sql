-- ============================================
-- UPDATE VERIFICATION_LEDGER FOR BADGES
-- ============================================
-- This migration updates the verification_ledger table to use badge_id
-- instead of achievement_id to support badge-based NFT minting
-- ============================================

-- Step 1: Make achievement_id nullable (required for badge-based minting)
-- This allows records to have either achievement_id OR badge_id (or both)
ALTER TABLE public.verification_ledger 
ALTER COLUMN achievement_id DROP NOT NULL;

-- Step 2: Add badge_id column if it doesn't exist
ALTER TABLE public.verification_ledger 
ADD COLUMN IF NOT EXISTS badge_id UUID REFERENCES public."Badges"(id) ON DELETE CASCADE;

-- Step 3: Migrate existing data (if any) - this is optional if you're starting fresh
-- If you have existing achievement-based records, you might want to handle them differently
-- For now, we'll just add the new column and keep achievement_id for backward compatibility
-- You can drop achievement_id later if you don't need it

-- Step 4: Make badge_id NOT NULL after migration (optional - comment out if you want to keep both)
-- ALTER TABLE public.verification_ledger ALTER COLUMN badge_id SET NOT NULL;

-- Step 5: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_verification_ledger_badge_id 
ON public.verification_ledger(badge_id);

CREATE INDEX IF NOT EXISTS idx_verification_ledger_user_badge 
ON public.verification_ledger(user_id, badge_id);

-- Step 6: Update RLS policy to allow users to view their own badge verifications
-- (The existing policy should work, but we can add a specific one if needed)
DROP POLICY IF EXISTS "Users can view their own badge verifications" ON public.verification_ledger;
CREATE POLICY "Users can view their own badge verifications"
ON public.verification_ledger
FOR SELECT USING (auth.uid() = user_id);

-- Note: If you want to completely remove achievement_id support, uncomment these:
-- ALTER TABLE public.verification_ledger DROP COLUMN IF EXISTS achievement_id;

