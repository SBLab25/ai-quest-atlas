# Fix: "already known" Blockchain Error

## Problem
The error `"already known"` occurs when a transaction is already in the blockchain mempool. This typically happens when:
- The webhook triggers multiple times for the same badge
- The same transaction (same nonce) is sent twice
- A previous transaction attempt didn't complete but was already broadcast

## Solution Applied

I've updated the `mint-achievement-nft` function to:

1. **Better Error Detection**: Now checks multiple error formats to catch "already known" errors
2. **Transaction Hash Recovery**: Checks the `verification_ledger` for existing transaction hashes
3. **Graceful Handling**: If a transaction hash exists, it waits for confirmation instead of failing
4. **Pending Status**: If no hash is found, marks the ledger as "pending" instead of "failed"

## What Changed

### Error Detection
- Now checks `error.code === -32000` AND `error.message === "already known"`
- Also checks `code === "UNKNOWN_ERROR"` format
- Logs full error details for debugging

### Recovery Logic
1. Checks current ledger entry for transaction hash
2. Falls back to checking any existing verification for the user/badge
3. If hash found: Waits for transaction confirmation
4. If hash not found: Marks as pending (202 status) instead of failing

## Next Steps

### 1. Redeploy the Function
```bash
supabase functions deploy mint-achievement-nft
```

### 2. Test Again
- Have a user earn a badge
- Check the function logs for the improved error handling
- The function should now handle "already known" errors gracefully

### 3. Monitor Results
Check the `verification_ledger` table:
```sql
SELECT * FROM verification_ledger 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 10;
```

## Expected Behavior After Fix

**Before**: Error thrown → Function fails → Badge shows as failed

**After**: 
- Error detected → Function checks for existing transaction hash
- If hash found → Waits for confirmation → Updates to "success"
- If hash not found → Marks as "pending" → Can be retried later

## Troubleshooting

### If errors persist:

1. **Check function logs** in Supabase Dashboard:
   - Edge Functions → mint-achievement-nft → Logs
   - Look for "Transaction send error details" log
   - Verify error detection is working

2. **Check for duplicate webhooks**:
   ```sql
   -- Replace 'YOUR-USER-UUID-HERE' and 'YOUR-BADGE-UUID-HERE' with actual UUIDs
   SELECT COUNT(*) 
   FROM verification_ledger 
   WHERE user_id = 'YOUR-USER-UUID-HERE' 
     AND badge_id = 'YOUR-BADGE-UUID-HERE';
   ```
   If count > 1, the webhook might be triggering multiple times
   
   **To find actual UUIDs:**
   ```sql
   -- Get recent verification ledger entries with user and badge info
   SELECT 
     vl.id,
     vl.user_id,
     vl.badge_id,
     vl.status,
     vl.transaction_hash,
     vl.created_at,
     p.username,
     b.name as badge_name
   FROM verification_ledger vl
   LEFT JOIN profiles p ON p.id = vl.user_id
   LEFT JOIN "Badges" b ON b.id = vl.badge_id
   ORDER BY vl.created_at DESC
   LIMIT 10;
   ```

3. **Check wallet nonce**:
   The "already known" error often indicates a nonce conflict. The wallet might need its nonce reset or transactions need better sequencing.

4. **Manual transaction check**:
   If a transaction is "pending" but you know it was sent, you can:
   - Check the blockchain explorer for the wallet address
   - Look for pending transactions
   - Manually update the `verification_ledger` with the transaction hash if found

## Prevention

To prevent "already known" errors in the future:

1. **Idempotency Check**: The function already checks for existing verifications before minting
2. **Webhook Deduplication**: Ensure the database trigger only fires once per badge
3. **Nonce Management**: Consider using a transaction manager that handles nonces automatically

## Status

✅ Error detection improved
✅ Recovery logic added
✅ Pending status handling added
⏳ **Ready to deploy and test**

