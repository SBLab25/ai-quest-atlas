# Fix: Duplicate Webhook Triggers

## Problem
The webhook is triggering multiple times for the same badge, causing:
- Multiple NFT minting attempts
- "already known" blockchain errors
- Duplicate entries in `verification_ledger`
- Wasted gas fees

## Solution

I've implemented multiple layers of protection:

### 1. Edge Function Idempotency
The edge function now checks for:
- ✅ **Successful verifications**: Returns immediately if already minted
- ✅ **Pending verifications**: Skips if created within last 5 minutes
- ✅ **Old pending verifications**: Allows retry if >5 minutes old (might be stuck)

### 2. Database-Level Protection
- ✅ **Unique constraint**: Prevents duplicate (user_id, badge_id) combinations for active records
- ✅ **Webhook function check**: Checks before calling edge function
- ✅ **Helper function**: `is_verification_in_progress()` to check status

## Implementation Steps

### Step 1: Run the Migration

Open Supabase SQL Editor and run:

```sql
-- File: supabase/migrations/prevent_duplicate_webhook_processing.sql
```

**Important**: Before running, update the placeholders:
- Replace `YOUR_PROJECT_REF` with your actual project reference
- Replace `YOUR_SERVICE_ROLE_KEY` with your service role key

### Step 2: Redeploy Edge Function

```bash
supabase functions deploy mint-achievement-nft
```

### Step 3: Clean Up Existing Duplicates (Optional)

If you have existing duplicate verifications, you can clean them up:

```sql
-- Find duplicates
SELECT 
  user_id,
  badge_id,
  COUNT(*) as duplicate_count
FROM verification_ledger
GROUP BY user_id, badge_id
HAVING COUNT(*) > 1;

-- Keep only the most recent successful verification per user/badge
-- (Run this carefully, test first!)
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
        CASE WHEN status = 'success' THEN 1 ELSE 2 END,
        created_at DESC
    ) as rn
  FROM verification_ledger
)
DELETE FROM verification_ledger
WHERE id IN (
  SELECT id FROM ranked_verifications WHERE rn > 1
);
```

## How It Works

### Layer 1: Database Webhook Function
Before calling the edge function, the webhook checks:
1. Is verification already in progress? → Skip
2. Is verification already successful? → Skip
3. Otherwise → Call edge function

### Layer 2: Edge Function
When the edge function receives a request:
1. Check for existing successful verification → Return success
2. Check for recent pending verification (<5 min) → Return "already processing"
3. Check for old pending verification (>5 min) → Allow retry
4. Otherwise → Process normally

### Layer 3: Database Constraint
The unique index prevents duplicate active records:
- Only one `pending` or `success` record per (user_id, badge_id)
- Multiple `failed` records are allowed (for retry purposes)

## Testing

### Test 1: Verify Unique Constraint
```sql
-- This should fail if constraint is working
INSERT INTO verification_ledger (user_id, badge_id, status)
VALUES 
  ('test-user-id', 'test-badge-id', 'pending'),
  ('test-user-id', 'test-badge-id', 'pending'); -- Should fail
```

### Test 2: Verify Webhook Skips Duplicates
1. Earn a badge (triggers webhook)
2. Immediately earn the same badge again (should skip)
3. Check logs: Should see "Skipping webhook call" message

### Test 3: Check for Duplicates
```sql
SELECT 
  user_id,
  badge_id,
  COUNT(*) as count
FROM verification_ledger
GROUP BY user_id, badge_id
HAVING COUNT(*) > 1;
-- Should return 0 rows (or only old duplicates)
```

## Monitoring

### Check Webhook Activity
```sql
-- View recent verifications with processing status
SELECT 
  vl.id,
  vl.user_id,
  vl.badge_id,
  vl.status,
  vl.transaction_hash,
  vl.created_at,
  p.username,
  b.name as badge_name,
  CASE 
    WHEN vl.status = 'pending' AND vl.created_at > NOW() - INTERVAL '5 minutes'
    THEN 'Processing'
    WHEN vl.status = 'success'
    THEN 'Completed'
    ELSE 'Failed/Stuck'
  END as processing_status
FROM verification_ledger vl
LEFT JOIN profiles p ON p.id = vl.user_id
LEFT JOIN "Badges" b ON b.id = vl.badge_id
ORDER BY vl.created_at DESC
LIMIT 20;
```

## Troubleshooting

### Issue: Still seeing duplicates

1. **Check if migration ran**:
   ```sql
   SELECT indexname FROM pg_indexes 
   WHERE tablename = 'verification_ledger' 
     AND indexname = 'idx_verification_ledger_user_badge_unique';
   ```
   Should return 1 row.

2. **Check webhook function**:
   ```sql
   SELECT proname, prosrc 
   FROM pg_proc 
   WHERE proname = 'handle_new_badge';
   ```
   Should show the updated function with checks.

3. **Check edge function logs**:
   - Look for "Verification already in progress" messages
   - Should see these when duplicates are prevented

### Issue: Webhook not triggering at all

1. **Check trigger exists**:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_badge_earned';
   ```

2. **Check webhook URL and key**:
   - Verify placeholders are replaced in `handle_new_badge()` function
   - Test the edge function URL manually

### Issue: Old duplicates still exist

Run the cleanup query (Step 3) to remove old duplicates. The unique constraint will prevent new ones.

## Benefits

✅ **Prevents duplicate NFT minting**
✅ **Saves gas fees** (no duplicate transactions)
✅ **Faster processing** (skips unnecessary work)
✅ **Better error handling** (handles stuck verifications)
✅ **Database-level protection** (can't be bypassed)

## Status

✅ Edge function idempotency added
✅ Database unique constraint added
✅ Webhook function checks added
⏳ **Ready to deploy and test**

