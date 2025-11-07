-- ============================================
-- FOLLOW/UNFOLLOW SYSTEM
-- ============================================

-- 1. Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- 2. Add follower counts to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- 3. Create follow_requests table (for private profiles)
CREATE TABLE IF NOT EXISTS public.follow_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(requester_id, target_id)
);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_requests ENABLE ROW LEVEL SECURITY;

-- Follows: Public read access
DROP POLICY IF EXISTS "Anyone can view follows" ON follows;
CREATE POLICY "Anyone can view follows"
ON follows FOR SELECT USING (true);

-- Follows: Users can follow others
DROP POLICY IF EXISTS "Users can follow others" ON follows;
CREATE POLICY "Users can follow others"
ON follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

-- Follows: Users can unfollow
DROP POLICY IF EXISTS "Users can unfollow" ON follows;
CREATE POLICY "Users can unfollow"
ON follows FOR DELETE
USING (auth.uid() = follower_id);

-- Follow requests: Users can view their own requests
DROP POLICY IF EXISTS "Users can view follow requests" ON follow_requests;
CREATE POLICY "Users can view follow requests"
ON follow_requests FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- Follow requests: Users can create requests
DROP POLICY IF EXISTS "Users can create follow requests" ON follow_requests;
CREATE POLICY "Users can create follow requests"
ON follow_requests FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Follow requests: Target users can update requests
DROP POLICY IF EXISTS "Users can respond to follow requests" ON follow_requests;
CREATE POLICY "Users can respond to follow requests"
ON follow_requests FOR UPDATE
USING (auth.uid() = target_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Toggle follow/unfollow
CREATE OR REPLACE FUNCTION toggle_follow(
  p_target_user_id UUID
) RETURNS JSON AS $$
DECLARE
  v_is_following BOOLEAN;
  v_is_private BOOLEAN;
BEGIN
  -- Prevent self-follow
  IF auth.uid() = p_target_user_id THEN
    RETURN json_build_object('success', FALSE, 'error', 'Cannot follow yourself');
  END IF;

  -- Check if already following
  SELECT EXISTS(
    SELECT 1 FROM follows
    WHERE follower_id = auth.uid()
    AND following_id = p_target_user_id
  ) INTO v_is_following;
  
  IF v_is_following THEN
    -- Unfollow
    DELETE FROM follows
    WHERE follower_id = auth.uid()
    AND following_id = p_target_user_id;
    
    -- Update counts
    UPDATE profiles SET following_count = GREATEST(following_count - 1, 0)
    WHERE id = auth.uid();
    
    UPDATE profiles SET follower_count = GREATEST(follower_count - 1, 0)
    WHERE id = p_target_user_id;
    
    RETURN json_build_object('success', TRUE, 'action', 'unfollowed');
  ELSE
    -- Check if target profile is private
    SELECT COALESCE(is_private, false) INTO v_is_private
    FROM profiles WHERE id = p_target_user_id;
    
    IF v_is_private THEN
      -- Create follow request
      INSERT INTO follow_requests (requester_id, target_id)
      VALUES (auth.uid(), p_target_user_id)
      ON CONFLICT (requester_id, target_id) DO NOTHING;
      
      RETURN json_build_object('success', TRUE, 'action', 'requested');
    ELSE
      -- Follow directly
      INSERT INTO follows (follower_id, following_id)
      VALUES (auth.uid(), p_target_user_id);
      
      -- Update counts
      UPDATE profiles SET following_count = following_count + 1
      WHERE id = auth.uid();
      
      UPDATE profiles SET follower_count = follower_count + 1
      WHERE id = p_target_user_id;
      
      RETURN json_build_object('success', TRUE, 'action', 'followed');
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get suggested users to follow
CREATE OR REPLACE FUNCTION get_suggested_users(p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  follower_count INTEGER,
  mutual_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.avatar_url,
    COALESCE(p.follower_count, 0) as follower_count,
    (
      SELECT COUNT(*)::INTEGER
      FROM follows f1
      JOIN follows f2 ON f1.following_id = f2.follower_id
      WHERE f1.follower_id = auth.uid()
      AND f2.following_id = p.id
    ) as mutual_count
  FROM profiles p
  WHERE p.id != auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM follows
    WHERE follower_id = auth.uid()
    AND following_id = p.id
  )
  ORDER BY
    COALESCE(p.follower_count, 0) DESC,
    RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get follower list with mutual follow info
CREATE OR REPLACE FUNCTION get_followers(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  is_mutual BOOLEAN,
  followed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.avatar_url,
    EXISTS(
      SELECT 1 FROM follows f2
      WHERE f2.follower_id = p_user_id
      AND f2.following_id = p.id
    ) as is_mutual,
    f.created_at as followed_at
  FROM follows f
  JOIN profiles p ON p.id = f.follower_id
  WHERE f.following_id = p_user_id
  ORDER BY is_mutual DESC, f.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get following list
CREATE OR REPLACE FUNCTION get_following(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  is_mutual BOOLEAN,
  followed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.avatar_url,
    EXISTS(
      SELECT 1 FROM follows f2
      WHERE f2.follower_id = p.id
      AND f2.following_id = p_user_id
    ) as is_mutual,
    f.created_at as followed_at
  FROM follows f
  JOIN profiles p ON p.id = f.following_id
  WHERE f.follower_id = p_user_id
  ORDER BY is_mutual DESC, f.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION toggle_follow(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_suggested_users(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_followers(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_following(UUID, INTEGER, INTEGER) TO authenticated;
