-- ===================================================================
-- CREATE DIRECT MESSAGES TABLE FOR USER-TO-USER CHAT
-- Run this in Supabase SQL Editor
-- ===================================================================

-- Create direct_messages table
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  reply_to uuid REFERENCES public.direct_messages(id) ON DELETE SET NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CHECK (sender_id != receiver_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at DESC);

-- Enable RLS
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for direct_messages
DROP POLICY IF EXISTS "Users can view their own messages" ON direct_messages;
CREATE POLICY "Users can view their own messages"
  ON direct_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages to their connections" ON direct_messages;
CREATE POLICY "Users can send messages to their connections"
  ON direct_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      -- Can message if they follow each other (mutual follow)
      EXISTS (
        SELECT 1 FROM follows f1
        JOIN follows f2 ON f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id
        WHERE f1.follower_id = auth.uid() AND f1.following_id = receiver_id
        AND f2.follower_id = receiver_id AND f2.following_id = auth.uid()
      )
      OR
      -- Or if either person follows the other (simplified check)
      EXISTS (
        SELECT 1 FROM follows
        WHERE follower_id = auth.uid() AND following_id = receiver_id
      )
      OR
      EXISTS (
        SELECT 1 FROM follows
        WHERE follower_id = receiver_id AND following_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON direct_messages;
CREATE POLICY "Users can update their own messages"
  ON direct_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can mark messages as read" ON direct_messages;
CREATE POLICY "Users can mark messages as read"
  ON direct_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Enable realtime for direct_messages
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

