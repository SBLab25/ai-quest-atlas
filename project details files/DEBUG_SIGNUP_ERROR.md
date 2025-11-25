# Debug: "database error saving new user"

## Quick Fix

Run this comprehensive migration:

```sql
-- File: supabase/migrations/fix_signup_comprehensive.sql
```

This fixes:
- ✅ Wallet columns (ensures nullable)
- ✅ RLS policies (allows profile creation)
- ✅ handle_new_user function (better error handling)
- ✅ Trigger setup (ensures it exists)

## Common Causes

### 1. RLS Policy Blocking Insert
The `handle_new_user()` function runs as `SECURITY DEFINER`, which should bypass RLS, but sometimes policies can still interfere.

**Fix**: The migration adds explicit policies for service role inserts.

### 2. Missing or NOT NULL Wallet Columns
If wallet columns were added with NOT NULL constraints, signup will fail.

**Fix**: Migration ensures they're nullable.

### 3. Function Error Not Handled
If the function throws an error, it can cause signup to fail.

**Fix**: Migration adds exception handling.

### 4. Username Conflict
If username is required and there's a conflict, signup fails.

**Fix**: Migration uses COALESCE to provide defaults.

## Manual Debugging

### Check 1: Test Profile Insert Manually
```sql
-- Try to insert a test profile (replace UUID)
INSERT INTO public.profiles (id, username, full_name)
VALUES (
  gen_random_uuid(),
  'test_' || substr(gen_random_uuid()::text, 1, 8),
  'Test User'
);
```

If this fails, you'll see the exact error.

### Check 2: Check Function Logs
```sql
-- Enable logging for the function
ALTER FUNCTION public.handle_new_user() SET log_statement = 'all';
```

Then try signup and check Supabase Dashboard → Logs → Database Logs.

### Check 3: Check Auth Logs
Go to Supabase Dashboard → Authentication → Logs
Look for the signup attempt and any error messages.

### Check 4: Verify Trigger
```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

Should return 1 row.

### Check 5: Test Function Directly
```sql
-- Create a test user record (won't actually create auth user)
-- This tests if the function logic works
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
BEGIN
  -- Simulate what the trigger does
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    test_user_id,
    'test_user',
    'Test User'
  );
  
  RAISE NOTICE 'Profile created successfully for: %', test_user_id;
  
  -- Clean up
  DELETE FROM public.profiles WHERE id = test_user_id;
END $$;
```

## Alternative: Disable Trigger Temporarily

If you need to test signup without the trigger:

```sql
-- Disable trigger
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Test signup

-- Re-enable trigger
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
```

## Expected Behavior After Fix

1. User fills signup form
2. `supabase.auth.signUp()` called
3. `auth.users` record created
4. `on_auth_user_created` trigger fires
5. `handle_new_user()` function runs
6. Profile created in `public.profiles` (wallet fields = NULL)
7. User role assigned (if that trigger exists)
8. Signup succeeds ✅

## If Still Failing

1. **Check Supabase Dashboard → Logs → Database Logs**
   - Look for errors at the time of signup
   - Copy the exact error message

2. **Check for other triggers**
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE event_object_table = 'users' 
     AND event_manipulation = 'INSERT';
   ```
   Multiple triggers might conflict.

3. **Check table constraints**
   ```sql
   SELECT 
     conname,
     contype,
     pg_get_constraintdef(oid) as definition
   FROM pg_constraint
   WHERE conrelid = 'public.profiles'::regclass;
   ```
   Look for constraints that might block inserts.

4. **Check for missing columns**
   ```sql
   SELECT column_name, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'profiles'
   ORDER BY ordinal_position;
   ```
   Ensure all required columns have defaults or are nullable.

## Next Steps

After running the comprehensive migration:
1. ✅ Try signing up a new user
2. ✅ Check if profile was created: `SELECT * FROM profiles ORDER BY created_at DESC LIMIT 1;`
3. ✅ If still failing, check Database Logs for the exact error

