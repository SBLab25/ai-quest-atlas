# NFT Minting Setup - Status & Next Steps

## ✅ What's Been Completed

### 1. Database Setup
- ✅ `verification_ledger` table updated for badges
- ✅ `achievement_id` made nullable
- ✅ `badge_id` column added
- ✅ Unique constraint added to prevent duplicates
- ✅ Duplicate cleanup completed

### 2. Edge Functions
- ✅ `mint-achievement-nft` function created
- ✅ Idempotency checks added (prevents duplicate processing)
- ✅ "Already known" error handling added
- ✅ Pending verification retry logic added

### 3. Wallet Management
- ✅ `create-user-wallets-batch` function created
- ✅ Admin panel component for wallet creation
- ✅ Wallets created for existing users

### 4. Webhook Setup
- ✅ Database trigger created (`on_badge_earned`)
- ✅ Webhook function with duplicate prevention
- ✅ Idempotency checks in webhook function

---

## 🔄 What Needs to Be Done

### Step 1: Verify Current Status

Run these checks to see what's working:

```sql
-- Check if unique constraint exists
SELECT indexname FROM pg_indexes 
WHERE tablename = 'verification_ledger' 
  AND indexname = 'idx_verification_ledger_user_badge_unique';

-- Check if webhook trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_badge_earned';

-- Check for any remaining duplicates
SELECT user_id, badge_id, COUNT(*) 
FROM verification_ledger
WHERE status IN ('pending', 'success')
GROUP BY user_id, badge_id
HAVING COUNT(*) > 1;
-- Should return 0 rows
```

### Step 2: Deploy Edge Function (If Not Done)

```bash
supabase functions deploy mint-achievement-nft
```

### Step 3: Set Edge Function Secrets

Make sure these secrets are set in Supabase:

```bash
# Check if secrets are set (you'll need to verify in dashboard)
# Required secrets:
# - MINTER_PRIVATE_KEY
# - NFT_CONTRACT_ADDRESS
# - OPTIMISM_SEPOLIA_RPC (optional, defaults to https://sepolia.optimism.io)
```

**To set secrets:**
1. Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
2. Or use CLI: `supabase secrets set SECRET_NAME=value`

### Step 4: Update Webhook Function

Make sure the webhook function has your actual project details:

```sql
-- Check current webhook function
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_badge';

-- If it still has placeholders, update it:
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
    RAISE NOTICE 'Skipping webhook - verification already in progress';
    RETURN NEW;
  END IF;
  
  -- Check if already succeeded
  IF EXISTS (
    SELECT 1 FROM verification_ledger 
    WHERE user_id = NEW.user_id 
      AND badge_id = NEW.badge_id 
      AND status = 'success'
      AND transaction_hash IS NOT NULL
  ) THEN
    RAISE NOTICE 'Skipping webhook - already minted';
    RETURN NEW;
  END IF;
  
  -- REPLACE THESE WITH YOUR ACTUAL VALUES:
  webhook_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/mint-achievement-nft';
  service_key := 'YOUR_SERVICE_ROLE_KEY';
  
  PERFORM net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object('record', row_to_json(NEW))
  );
  
  RETURN NEW;
END;
$$;
```

---

## 🧪 Testing Checklist

### Test 1: Verify Webhook Trigger
```sql
-- Check trigger exists and is active
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_badge_earned';
```

### Test 2: Test Badge Earning
1. Have a user earn a badge in your app
2. Check `verification_ledger` table:
   ```sql
   SELECT * FROM verification_ledger 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
3. Should see a new entry with `status = 'pending'`

### Test 3: Check Edge Function Logs
1. Go to Supabase Dashboard → Edge Functions → `mint-achievement-nft` → Logs
2. Look for:
   - ✅ "Processing NFT mint for user..."
   - ✅ "Transaction sent: 0x..."
   - ✅ "Transaction confirmed in block..."
   - ❌ Any error messages

### Test 4: Verify NFT on Blockchain
1. Get transaction hash from `verification_ledger`
2. View on Optimism Sepolia Explorer:
   ```
   https://sepolia-optimism.etherscan.io/tx/YOUR_TRANSACTION_HASH
   ```

### Test 5: Test Duplicate Prevention
1. Try to earn the same badge twice (should skip second attempt)
2. Check logs for "Skipping duplicate webhook call" message
3. Verify only one verification record exists

---

## 📋 Complete Setup Checklist

- [ ] **Database**
  - [ ] Unique constraint exists
  - [ ] No duplicate records
  - [ ] Webhook trigger active
  - [ ] Webhook function updated with real project details

- [ ] **Edge Function**
  - [ ] Function deployed
  - [ ] `MINTER_PRIVATE_KEY` secret set
  - [ ] `NFT_CONTRACT_ADDRESS` secret set
  - [ ] `OPTIMISM_SEPOLIA_RPC` secret set (optional)

- [ ] **Wallets**
  - [ ] All users have wallet addresses
  - [ ] Admin panel wallet creation works

- [ ] **Testing**
  - [ ] Badge earning triggers webhook
  - [ ] NFT minting succeeds
  - [ ] Transaction hash saved to ledger
  - [ ] Duplicate prevention works
  - [ ] NFT visible on blockchain explorer

---

## 🚀 Next Steps After Setup

### 1. Monitor Minting
Set up monitoring for:
- Failed mints (check `verification_ledger` where `status = 'failed'`)
- Pending mints stuck > 10 minutes
- Gas fee costs

### 2. User Experience
- ✅ Already implemented: `VerifiedTrophyLink` component shows verification status
- Users can click to view their NFTs on blockchain explorer

### 3. Admin Tools
Consider adding:
- Admin panel to view all verifications
- Retry failed mints
- Manual mint trigger for edge cases

### 4. Production Considerations
- [ ] Use production-grade encryption for wallet private keys (currently XOR)
- [ ] Set up alerts for failed mints
- [ ] Monitor gas costs
- [ ] Consider batching mints if volume is high
- [ ] Set up rate limiting on webhook

---

## 🔍 Troubleshooting

### Issue: Webhook not triggering
- Check trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_badge_earned';`
- Check webhook URL and service key are correct
- Check edge function logs for incoming requests

### Issue: NFT minting fails
- Check edge function logs for error details
- Verify secrets are set correctly
- Check minter wallet has enough ETH for gas
- Verify contract address is correct
- Check contract ABI matches your contract

### Issue: Duplicates still happening
- Verify unique constraint exists
- Check webhook function has duplicate prevention
- Check edge function has idempotency checks

### Issue: "Already known" errors
- This is now handled automatically
- Function will check for existing transaction hash
- If hash found, waits for confirmation
- If not found, marks as pending for retry

---

## 📊 Monitoring Queries

### Check Recent Activity
```sql
SELECT 
  vl.*,
  p.username,
  b.name as badge_name,
  CASE 
    WHEN vl.transaction_hash IS NOT NULL 
    THEN 'https://sepolia-optimism.etherscan.io/tx/' || vl.transaction_hash 
    ELSE NULL 
  END as explorer_link
FROM verification_ledger vl
LEFT JOIN profiles p ON p.id = vl.user_id
LEFT JOIN "Badges" b ON b.id = vl.badge_id
ORDER BY vl.created_at DESC
LIMIT 20;
```

### Check Status Distribution
```sql
SELECT 
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN transaction_hash IS NOT NULL THEN 1 END) as with_hash
FROM verification_ledger
GROUP BY status;
```

### Find Stuck Pending Verifications
```sql
SELECT * FROM verification_ledger
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;
```

---

## 🎉 You're Almost There!

Once you complete the checklist above, your NFT minting system will be fully operational. The main things left are:

1. **Set secrets** (if not done)
2. **Update webhook function** with real project details
3. **Test end-to-end** (earn badge → check NFT minted)
4. **Monitor** for any issues

Everything else is already set up and ready to go! 🚀

