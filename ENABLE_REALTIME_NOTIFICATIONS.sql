-- ===================================================================
-- ENABLE REALTIME FOR NOTIFICATIONS TABLE
-- Run this in Supabase SQL Editor if realtime is not working
-- ===================================================================

-- Check if notifications table is already in the publication
DO $$
BEGIN
  -- Try to add table to publication (only if not already added)
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    RAISE NOTICE '✅ Notifications table added to realtime publication';
  ELSE
    RAISE NOTICE '✅ Notifications table is already in realtime publication';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE '✅ Notifications table is already in realtime publication';
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error: %', SQLERRM;
END $$;

-- Verify realtime is enabled (check if table appears in publication)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'notifications'
    ) THEN '✅ Realtime is ENABLED for notifications table'
    ELSE '❌ Realtime is NOT enabled for notifications table'
  END AS status;

