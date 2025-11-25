# Fix for Notification CORS and RLS Issues

## Problem Summary

When approving submissions in the admin panel, notifications were failing with:
1. **CORS Error**: Edge function preflight request failing
2. **RLS Policy Error**: Direct database insert blocked by Row Level Security
3. **Fallback Working**: Database function `create_notification` works but was only used as fallback

## Root Causes

1. **CORS Issue**: The Edge Function's OPTIONS response wasn't explicitly returning status 200
2. **RLS Policy**: No policy allowing admins to insert notifications for other users
3. **Inefficient Fallback Chain**: Edge function was tried first, causing unnecessary CORS errors

## Fixes Applied

### 1. Fixed Edge Function CORS (`supabase/functions/send-notification/index.ts`)
- ✅ Added explicit `status: 200` to OPTIONS response
- ✅ Added `Access-Control-Max-Age` header
- ✅ Improved error handling

### 2. Updated Notification Helper (`src/utils/notificationHelper.ts`)
- ✅ **Changed primary method**: Now uses database function `create_notification` first (most reliable)
- ✅ Edge function is now fallback only
- ✅ Removed unnecessary direct insert attempt (always fails due to RLS)
- ✅ Better error handling - doesn't throw if notifications fail (non-critical)

### 3. Database Function (Already Exists)
The `create_notification` RPC function in `FIX_NOTIFICATION_RLS.sql` already exists and works correctly. It bypasses RLS using `SECURITY DEFINER`.

## How It Works Now

1. **Primary**: Database function `create_notification` (fast, reliable, no CORS)
2. **Fallback**: Edge function `send-notification` (if database function fails)
3. **Error Handling**: Logs errors but doesn't break the flow

## Testing

After these changes:
1. Approve a submission in admin panel
2. Check browser console - should see: `✅ Notification created via database function`
3. No CORS errors should appear
4. Notification should appear in user's notification center

## If Issues Persist

If you still see CORS errors:
1. The edge function fix should resolve it, but if not, the database function will handle it
2. Make sure `FIX_NOTIFICATION_RLS.sql` has been run in Supabase SQL Editor
3. Verify the `create_notification` function exists and is callable

## Notes

- Notifications are now more reliable (database function is primary)
- CORS errors are avoided by using database function first
- Edge function is kept as fallback for edge cases
- The system gracefully handles failures without breaking the approval flow

