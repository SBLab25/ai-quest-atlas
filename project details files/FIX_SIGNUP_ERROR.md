# Fix: Signup Error - "Invalid Refresh Token" / "database error signup new user"

## Problem
When signing up a new user, you get:
- "Invalid Refresh Token: Refresh Token Not Found"
- "database error signup new user"
- Auth state changes to SIGNED_OUT

## Root Cause
The `handle_new_user()` trigger function is likely failing when trying to create a profile. This could be due to:
1. **Wallet columns** - If `wallet_address` or `wallet_private_key_encrypted` have NOT NULL constraints
2. **RLS policies** - The trigger might not have proper permissions
3. **Missing columns** - The function might be trying to insert into columns that don't exist

## Solution

### Step 1: Run the Fix Migration

Open Supabase SQL Editor and run:

```sql
-- File: supabase/migrations/fix_signup_wallet_columns.sql
```

This will:
- ✅ Ensure wallet columns exist and are nullable
- ✅ Update `handle_new_user()` function with better error handling
- ✅ Add `ON CONFLICT DO NOTHING` to prevent duplicate errors

### Step 2: Check RLS Policies

Verify the profiles table has the correct policies:

```sql
-- Check current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';
```

Should see:
- "Profiles are viewable by authenticated users" (SELECT)
- "Users can insert their own profile" (INSERT)
- "Users can update their own profile" (UPDATE)

### Step 3: Test Signup

Try signing up a new user again. The error should be resolved.

## Alternative: Manual Check

If the migration doesn't work, check these manually:

### Check 1: Wallet Columns
```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('wallet_address', 'wallet_private_key_encrypted');
```

Both should show `is_nullable = YES`.

### Check 2: Handle New User Function
```sql
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
```

Should show the function that inserts into profiles.

### Check 3: Trigger Exists
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

Should return 1 row.

## If Still Failing

### Check Database Logs
1. Go to Supabase Dashboard → Logs → Database Logs
2. Look for errors around the time of signup
3. Check for specific error messages

### Check Auth Logs
1. Go to Supabase Dashboard → Authentication → Logs
2. Look for signup attempts and their status

### Manual Profile Creation Test
```sql
-- Try to manually create a profile (replace with test UUID)
INSERT INTO public.profiles (id, username, full_name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'testuser',
  'Test User'
);
```

If this fails, you'll see the exact error.

## Expected Behavior After Fix

1. User signs up → `auth.users` record created
2. Trigger fires → `handle_new_user()` runs
3. Profile created → `profiles` record inserted (wallet fields are NULL)
4. User role assigned → `user_roles` record created
5. Signup succeeds → User receives confirmation email

## Next Steps

After fixing signup:
1. ✅ New users can sign up successfully
2. ✅ Profiles are created automatically
3. ✅ Wallets can be created later using the admin panel
4. ✅ NFT minting will work once wallets are created

