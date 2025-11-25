# Fix: "relation notification_preferences does not exist"

## Problem
The error shows:
```
ERROR: relation "notification_preferences" does not exist (SQLSTATE 42P01)
```

This happens because there's a trigger `on_auth_user_created_notification_preferences` that runs on user signup and tries to insert into `notification_preferences` table, but the table doesn't exist.

## Solution

### Quick Fix: Run This Migration

Open Supabase SQL Editor and run:

```sql
-- File: supabase/migrations/create_notification_preferences_table.sql
```

This will:
- ✅ Create the `notification_preferences` table
- ✅ Set up RLS policies
- ✅ Update the trigger function to handle errors gracefully
- ✅ Create preferences for existing users

### Alternative: Run Full Notification Setup

If you want the complete notification system:

```sql
-- File: DATABASE_NOTIFICATIONS_SETUP.sql
```

This creates both `notifications` and `notification_preferences` tables with full setup.

## What Was Happening

1. User signs up → `auth.users` record created
2. Multiple triggers fire:
   - `on_auth_user_created` → Creates profile ✅
   - `on_auth_user_created_role` → Assigns role ✅
   - `on_auth_user_created_notification_preferences` → Tries to create preferences ❌
3. Last trigger fails because table doesn't exist
4. Signup fails with 500 error

## After Running the Fix

1. ✅ `notification_preferences` table will exist
2. ✅ Trigger will work correctly
3. ✅ Signup will succeed
4. ✅ New users will get default notification preferences

## Verify It Works

```sql
-- Check table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'notification_preferences';

-- Check trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created_notification_preferences';

-- Check function exists
SELECT proname FROM pg_proc 
WHERE proname = 'create_default_notification_preferences';
```

## Test Signup

After running the migration:
1. Try signing up a new user
2. Should succeed now ✅
3. Check if preferences were created:
   ```sql
   SELECT * FROM notification_preferences ORDER BY created_at DESC LIMIT 5;
   ```

