# Quick Fix: Duplicate Key Constraint Error

## Error
```
ERROR: 23505: duplicate key value violates unique constraint "idx_verification_ledger_user_badge_unique"
```

## Cause
The unique constraint was added, but there are still duplicate records in the database that weren't cleaned up.

## Quick Fix

### Option 1: Run the Cleanup Script (Recommended)

Open Supabase SQL Editor and run:

```sql
-- File: supabase/migrations/cleanup_duplicate_verifications.sql
```

This script will:
1. ✅ Drop the constraint temporarily
2. ✅ Show you what duplicates exist
3. ✅ Clean them up (keeps the best one)
4. ✅ Recreate the constraint

### Option 2: Manual Cleanup

If you prefer manual control:

```sql
-- Step 1: Drop the constraint
DROP INDEX IF EXISTS idx_verification_ledger_user_badge_unique;

-- Step 2: See what duplicates exist
SELECT 
  user_id,
  badge_id,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as ids,
  STRING_AGG(status::text, ', ') as statuses
FROM verification_ledger
WHERE status IN ('pending', 'success')
GROUP BY user_id, badge_id
HAVING COUNT(*) > 1;

-- Step 3: Clean up (keeps the best record per user/badge)
WITH ranked AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, badge_id 
      ORDER BY 
        CASE WHEN status = 'success' AND transaction_hash IS NOT NULL THEN 1 
             WHEN status = 'success' THEN 2
             WHEN status = 'pending' THEN 3
             ELSE 4 END,
        created_at DESC
    ) as rn
  FROM verification_ledger
  WHERE status IN ('pending', 'success')
)
DELETE FROM verification_ledger
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Step 4: Recreate the constraint
CREATE UNIQUE INDEX idx_verification_ledger_user_badge_unique
ON verification_ledger(user_id, badge_id)
WHERE status IN ('pending', 'success');
```

## What Gets Kept?

The cleanup keeps the **best** record for each (user_id, badge_id) combination:

1. **First priority**: Successful verification with transaction hash
2. **Second priority**: Successful verification without hash
3. **Third priority**: Most recent pending verification
4. **Deleted**: All other duplicates

## After Cleanup

Once duplicates are removed:
- ✅ The unique constraint will work
- ✅ New duplicates will be prevented
- ✅ Webhook will skip duplicates automatically

## Prevention

The updated migration (`prevent_duplicate_webhook_processing.sql`) now:
- Drops the constraint first (if exists)
- Cleans up duplicates properly
- Then adds the constraint

If you already ran the migration and got this error, just run the cleanup script above.

