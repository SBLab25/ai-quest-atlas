# Fix: achievement_id NOT NULL Constraint Error

## Problem
The error occurs because `verification_ledger.achievement_id` has a NOT NULL constraint, but the function is trying to insert records with only `badge_id`.

## Solution
Make `achievement_id` nullable so records can have either `achievement_id` OR `badge_id` (or both).

---

## Quick Fix (Run This SQL)

**Option 1: Run the standalone fix migration**

Open Supabase SQL Editor and run:

```sql
-- Make achievement_id nullable
ALTER TABLE public.verification_ledger 
ALTER COLUMN achievement_id DROP NOT NULL;
```

**Option 2: Run the complete updated migration**

Run the updated migration file:
```sql
-- File: supabase/migrations/update_verification_ledger_for_badges.sql
-- This includes the fix plus all other badge-related updates
```

---

## Steps to Fix

1. **Open Supabase Dashboard**
   - Go to your project
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New Query"**

2. **Run the SQL**
   ```sql
   ALTER TABLE public.verification_ledger 
   ALTER COLUMN achievement_id DROP NOT NULL;
   ```

3. **Verify the change**
   ```sql
   SELECT 
     column_name, 
     data_type, 
     is_nullable
   FROM information_schema.columns
   WHERE table_schema = 'public' 
     AND table_name = 'verification_ledger'
     AND column_name IN ('achievement_id', 'badge_id');
   ```
   
   You should see:
   - `achievement_id`: `is_nullable = YES` ✅
   - `badge_id`: `is_nullable = YES` ✅

4. **Test NFT Minting**
   - Have a user earn a badge
   - Check that the webhook triggers
   - Verify the `verification_ledger` entry is created successfully

---

## What This Does

- **Before**: `achievement_id` was required (NOT NULL), so every record needed it
- **After**: `achievement_id` is optional (nullable), so records can have:
  - Only `badge_id` (for badge-based NFTs) ✅
  - Only `achievement_id` (for legacy achievement-based NFTs)
  - Both (if needed for migration)

---

## Files Updated

1. ✅ `supabase/migrations/fix_verification_ledger_achievement_id_nullable.sql` - Standalone fix
2. ✅ `supabase/migrations/update_verification_ledger_for_badges.sql` - Updated with fix included

---

## After Running the Fix

The NFT minting should work! The function will be able to insert records with:
```json
{
  "user_id": "...",
  "badge_id": "...",
  "status": "pending"
}
```

Without needing `achievement_id`.

---

## Next Steps

After fixing this:
1. ✅ Test badge earning → NFT minting
2. ✅ Check `verification_ledger` table for new entries
3. ✅ Verify transaction hash is saved
4. ✅ View NFT on Optimism Sepolia Explorer

