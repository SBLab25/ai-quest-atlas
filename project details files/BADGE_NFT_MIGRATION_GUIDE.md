# Badge-Based NFT Minting Migration Guide

This guide explains the changes made to switch from achievement-based to badge-based NFT minting.

## What Changed?

### 1. Function Updates
- **File**: `supabase/functions/mint-achievement-nft/index.ts`
- **Changes**:
  - Now expects `badge_id` instead of `achievement_id` from webhook payload
  - Uses `badge_id` for tokenId generation
  - Uses `badge_id` in verification_ledger queries

### 2. Database Schema Updates
- **New Migration**: `supabase/migrations/update_verification_ledger_for_badges.sql`
- **Changes**:
  - Adds `badge_id` column to `verification_ledger` table
  - Creates indexes for better performance
  - Updates RLS policies

### 3. Webhook Updates
- **File**: `supabase/migrations/setup_nft_webhook.sql`
- **Changes**:
  - Trigger now fires on `User Badges` table INSERT
  - Function renamed to `handle_new_badge()`
  - Trigger renamed to `on_badge_earned`

## Migration Steps

### Step 1: Run Database Migration

Run the migration to update the `verification_ledger` table:

```sql
-- Run this in Supabase SQL Editor
\i supabase/migrations/update_verification_ledger_for_badges.sql
```

Or copy and paste the contents of `supabase/migrations/update_verification_ledger_for_badges.sql` into the SQL Editor.

### Step 2: Update Webhook

**Option A: Using Dashboard**
1. Go to Database → Webhooks
2. Delete old webhook (if exists) for `user_achievements`
3. Create new webhook:
   - Table: `User Badges`
   - Event: INSERT
   - URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/mint-achievement-nft`

**Option B: Using SQL**
Run the updated `setup_nft_webhook.sql` file (it's already updated for badges).

### Step 3: Deploy Updated Function

```bash
supabase functions deploy mint-achievement-nft
```

### Step 4: Test

Test by awarding a badge to a user:

```sql
-- Get a real user ID and badge ID first
INSERT INTO public."User Badges" (user_id, badge_id, earned_at)
VALUES (
  'your-user-uuid',
  'your-badge-uuid',
  NOW()
);
```

Check the function logs and `verification_ledger` table to verify it worked.

## Table Structure

### User Badges Table
```sql
CREATE TABLE public."User Badges" (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL,
  earned_at TIMESTAMPTZ
);
```

### Verification Ledger Table (Updated)
```sql
CREATE TABLE public.verification_ledger (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID,  -- NEW: For badge-based minting
  achievement_id BIGINT,  -- OLD: Can be removed if not needed
  status TEXT NOT NULL,
  transaction_hash TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Important Notes

1. **Table Name**: The `User Badges` table name has spaces, so it must be quoted in SQL: `"User Badges"`

2. **Backward Compatibility**: The migration keeps `achievement_id` column for now. You can drop it later if you don't need it:
   ```sql
   ALTER TABLE public.verification_ledger DROP COLUMN IF EXISTS achievement_id;
   ```

3. **Function Name**: The function is still named `mint-achievement-nft` for now (to avoid breaking existing webhooks). You can rename it later if desired.

4. **Badge ID Format**: Badge IDs are UUIDs (same as achievement IDs were), so the tokenId generation logic remains the same.

## Verification

After migration, verify:

1. ✅ `verification_ledger` table has `badge_id` column
2. ✅ Webhook triggers on `User Badges` INSERT
3. ✅ Function receives `badge_id` in payload
4. ✅ NFT minting works when badge is earned
5. ✅ Transaction hash is saved to `verification_ledger`

## Troubleshooting

### Issue: Webhook not triggering
- Check table name is exactly `User Badges` (with space and quotes)
- Verify trigger exists: `SELECT * FROM information_schema.triggers WHERE event_object_table = 'User Badges';`

### Issue: Function error "Missing badge_id"
- Check webhook payload includes the new row data
- Verify the table column is named `badge_id` (not `achievement_id`)

### Issue: Verification ledger error
- Ensure migration ran successfully
- Check `badge_id` column exists: `\d verification_ledger` in psql

