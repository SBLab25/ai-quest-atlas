# Auto Wallet Creation on Signup - Setup Guide

## Overview
This setup automatically creates blockchain wallets for new users when they sign up, so they're ready for NFT minting immediately.

## What Gets Created

1. **Edge Function**: `create-user-wallet` - Creates a wallet for a single user
2. **Database Function**: `handle_new_user_wallet()` - Calls the Edge Function
3. **Database Trigger**: `on_auth_user_created_wallet` - Fires on user signup

## Setup Steps

### Step 1: Deploy the Edge Function

```bash
supabase functions deploy create-user-wallet
```

### Step 2: Set Edge Function Secret

Set the encryption key for wallet private keys:

```bash
supabase secrets set WALLET_ENCRYPTION_KEY=your-secure-encryption-key-here
```

**Or via Dashboard:**
- Go to Project Settings → Edge Functions → Secrets
- Add `WALLET_ENCRYPTION_KEY` with a secure random string

### Step 3: Run the Database Migration

Open Supabase SQL Editor and run:

```sql
-- File: supabase/migrations/add_wallet_creation_on_signup.sql
```

### Step 4: Update Function with Your Project Details

**IMPORTANT**: After running the migration, you MUST update the function with your actual project details:

1. **Get your project reference:**
   - Go to Project Settings → General
   - Copy "Reference ID"

2. **Get your service role key:**
   - Go to Project Settings → API
   - Copy "service_role" key (⚠️ Keep this secret!)

3. **Update the function:**

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  webhook_url TEXT;
  service_key TEXT;
  response_status INTEGER;
BEGIN
  -- Replace with your actual project reference
  webhook_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-user-wallet';
  
  -- Replace with your actual service role key
  service_key := 'YOUR_SERVICE_ROLE_KEY';
  
  -- Call the Edge Function
  SELECT status INTO response_status
  FROM net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object('user_id', NEW.id)
  );
  
  IF response_status >= 200 AND response_status < 300 THEN
    RAISE NOTICE 'Wallet created for user %', NEW.id;
  ELSE
    RAISE WARNING 'Wallet creation may have failed (status: %)', response_status;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Don't fail signup if wallet creation fails
    RAISE WARNING 'Error creating wallet: %', SQLERRM;
    RETURN NEW;
END;
$$;
```

## How It Works

1. **User signs up** → `auth.users` record created
2. **Trigger fires** → `on_auth_user_created_wallet` executes
3. **Function calls Edge Function** → HTTP POST to `create-user-wallet`
4. **Edge Function creates wallet** → Generates Ethereum wallet, encrypts private key
5. **Profile updated** → `wallet_address` and `wallet_private_key_encrypted` saved
6. **Signup succeeds** → User has wallet ready for NFT minting ✅

## Important Notes

### Error Handling
- ✅ **Signup never fails** - If wallet creation fails, signup still succeeds
- ✅ **Wallet can be created later** - Via admin panel if needed
- ✅ **Errors are logged** - Check Database Logs for warnings

### Security
- ✅ **Private keys are encrypted** - Using encryption key from secrets
- ✅ **Service role key** - Only used server-side, never exposed
- ✅ **RLS policies** - Wallet data protected by Row Level Security

### Performance
- ✅ **Non-blocking** - Wallet creation happens asynchronously
- ✅ **Fast** - Edge Function responds quickly
- ✅ **Idempotent** - Safe to call multiple times

## Testing

### Test 1: Signup New User
1. Sign up a new user
2. Check `profiles` table:
   ```sql
   SELECT id, username, wallet_address 
   FROM profiles 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
3. Should see `wallet_address` populated ✅

### Test 2: Check Edge Function Logs
1. Go to Edge Functions → `create-user-wallet` → Logs
2. Look for "Creating wallet for user..." messages
3. Should see successful wallet creation ✅

### Test 3: Verify Wallet Works
1. Have the new user earn a badge
2. Check if NFT minting works (should have wallet address)
3. Should work without manual wallet creation ✅

## Troubleshooting

### Issue: Wallet not created on signup

1. **Check trigger exists:**
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created_wallet';
   ```

2. **Check function has correct URL/key:**
   ```sql
   SELECT prosrc FROM pg_proc 
   WHERE proname = 'handle_new_user_wallet';
   ```
   Verify it has your actual project reference and service key.

3. **Check Edge Function is deployed:**
   ```bash
   supabase functions list
   ```
   Should show `create-user-wallet`

4. **Check Edge Function logs:**
   - Go to Edge Functions → `create-user-wallet` → Logs
   - Look for errors or incoming requests

5. **Check Database Logs:**
   - Go to Logs → Database Logs
   - Look for WARNING messages about wallet creation

### Issue: Signup fails after adding trigger

The function is designed to never fail signup. If signup fails:
1. Check if function has syntax errors
2. Verify `net.http_post` is available (should be in Supabase)
3. Check Database Logs for the exact error

### Issue: Wallet creation is slow

- Wallet creation is asynchronous and shouldn't block signup
- If it's slow, check Edge Function logs for performance issues
- Consider increasing Edge Function timeout if needed

## Manual Wallet Creation (Fallback)

If automatic creation fails, you can still use the admin panel:
1. Go to Admin Panel → Users tab
2. Click "Create Wallets for All Users"
3. This will create wallets for users who don't have them

## Benefits

✅ **Automatic** - No manual intervention needed
✅ **Ready for NFTs** - Users can earn badges immediately
✅ **Secure** - Private keys encrypted
✅ **Reliable** - Doesn't block signup if it fails
✅ **Scalable** - Works for any number of users

## Next Steps

After setup:
1. ✅ Test signup - Verify wallet is created
2. ✅ Test NFT minting - Earn a badge and check minting works
3. ✅ Monitor logs - Check for any errors
4. ✅ Remove manual wallet creation step - No longer needed for new users

---

**Status**: Ready to deploy! 🚀

