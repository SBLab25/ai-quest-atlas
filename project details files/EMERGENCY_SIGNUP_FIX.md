# Emergency Fix: "500: Database error saving new user"

## Quick Fix (Run This First)

Open Supabase SQL Editor and run:

```sql
-- File: supabase/migrations/fix_signup_emergency.sql
```

This makes the `handle_new_user()` function **completely non-blocking** - it will never fail signup, even if profile creation fails.

## What This Does

The emergency fix:
- ✅ **Never fails signup** - All errors are silently caught
- ✅ **Allows signups to succeed** - Even if profile creation fails
- ✅ **Profiles can be created later** - Via admin panel or manually

## After Running Emergency Fix

1. **Try signup again** - It should work now
2. **Check if profile was created**:
   ```sql
   SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5;
   ```
3. **If profile wasn't created**, you can create it manually or use the admin panel

## If Emergency Fix Doesn't Work

### Option 1: Temporarily Disable Trigger

```sql
-- Disable the trigger completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Test signup (should work now)

-- Re-enable after fixing
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();
```

### Option 2: Check What's Actually Failing

Run this to see the actual error:

```sql
-- Enable detailed logging
SET log_min_messages = 'WARNING';

-- Then try signup and check Database Logs
-- Look for WARNING messages from handle_new_user
```

### Option 3: Manual Profile Creation Test

```sql
-- Test if you can manually create a profile
-- Replace with a test UUID
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (test_id, 'test_user', 'Test User');
  
  RAISE NOTICE 'Success! Profile created for: %', test_id;
  
  -- Clean up
  DELETE FROM public.profiles WHERE id = test_id;
END $$;
```

If this fails, you'll see the exact error.

## Root Cause Analysis

The "500: Database error saving new user" means:
1. User is created in `auth.users` ✅
2. Trigger fires `handle_new_user()` ❌
3. Function fails → Signup fails

Common causes:
- **RLS blocking** (even though SECURITY DEFINER should bypass)
- **Missing columns** (wallet_address, etc.)
- **Username conflict** (unique constraint violation)
- **Function error** (syntax, permissions, etc.)

## Permanent Fix

After emergency fix works, run the comprehensive fix:

```sql
-- File: supabase/migrations/fix_signup_comprehensive.sql
```

This adds proper error handling while still allowing signups to succeed.

## Verify Signup Works

After running emergency fix:
1. ✅ Signup should succeed
2. ✅ User should be created in `auth.users`
3. ✅ Profile may or may not be created (but signup still works)
4. ✅ You can create profile manually later if needed

## Next Steps

1. **Run emergency fix** → Signup works
2. **Run comprehensive fix** → Better error handling
3. **Test signup** → Should work reliably
4. **Monitor** → Check if profiles are being created

