-- Team Messages Table
CREATE TABLE IF NOT EXISTS team_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  reply_to uuid REFERENCES team_messages(id) ON DELETE SET NULL,
  attachments jsonb,
  created_at timestamptz DEFAULT now()
);

-- Team Challenges Table
CREATE TABLE IF NOT EXISTS team_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  quest_id uuid REFERENCES "Quests"(id) ON DELETE SET NULL,
  required_completions integer DEFAULT 5,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  reward_points integer DEFAULT 0,
  reward_badge_id uuid REFERENCES "Badges"(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Team Challenge Progress Table
CREATE TABLE IF NOT EXISTS team_challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES team_challenges(id) ON DELETE CASCADE NOT NULL,
  completions integer DEFAULT 0,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  UNIQUE(team_id, challenge_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_messages_team_id ON team_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_created_at ON team_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_challenges_active ON team_challenges(is_active, end_date);
CREATE INDEX IF NOT EXISTS idx_team_challenge_progress_team ON team_challenge_progress(team_id, challenge_id);

-- Enable RLS
ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_challenge_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_messages
CREATE POLICY "Team members can view team messages"
ON team_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = team_messages.team_id
    AND team_members.user_id = auth.uid()
  )
);

CREATE POLICY "Team members can send messages"
ON team_messages FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = team_messages.team_id
    AND team_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own messages"
ON team_messages FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for team_challenges
CREATE POLICY "Everyone can view active challenges"
ON team_challenges FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage challenges"
ON team_challenges FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for team_challenge_progress
CREATE POLICY "Team members can view team progress"
ON team_challenge_progress FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = team_challenge_progress.team_id
    AND team_members.user_id = auth.uid()
  )
);

CREATE POLICY "System can update progress"
ON team_challenge_progress FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Enable realtime for team_messages
ALTER PUBLICATION supabase_realtime ADD TABLE team_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE team_challenge_progress;

-- Function to automatically track team challenge progress
CREATE OR REPLACE FUNCTION track_team_challenge_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- When a quest submission is approved, update team challenge progress
  IF NEW.status = 'approved' THEN
    UPDATE team_challenge_progress tcp
    SET 
      completions = completions + 1,
      is_completed = CASE 
        WHEN completions + 1 >= tc.required_completions THEN true 
        ELSE false 
      END,
      completed_at = CASE 
        WHEN completions + 1 >= tc.required_completions THEN now() 
        ELSE completed_at 
      END
    FROM team_challenges tc
    INNER JOIN team_members tm ON tm.user_id = NEW.user_id
    WHERE tcp.challenge_id = tc.id
      AND tcp.team_id = tm.team_id
      AND tc.quest_id = NEW.quest_id
      AND tc.is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to track challenge progress when submissions are approved
DROP TRIGGER IF EXISTS trigger_track_team_challenges ON "Submissions";
CREATE TRIGGER trigger_track_team_challenges
AFTER UPDATE OF status ON "Submissions"
FOR EACH ROW
WHEN (NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved')
EXECUTE FUNCTION track_team_challenge_progress();

-- Function to award rewards when team completes challenge
CREATE OR REPLACE FUNCTION award_team_challenge_rewards()
RETURNS TRIGGER AS $$
DECLARE
  challenge_reward_points integer;
  challenge_badge_id uuid;
BEGIN
  IF NEW.is_completed = true AND OLD.is_completed IS DISTINCT FROM true THEN
    -- Get challenge rewards
    SELECT reward_points, reward_badge_id 
    INTO challenge_reward_points, challenge_badge_id
    FROM team_challenges
    WHERE id = NEW.challenge_id;
    
    -- Award points to all team members
    IF challenge_reward_points > 0 THEN
      UPDATE profiles
      SET total_points = COALESCE(total_points, 0) + challenge_reward_points
      WHERE id IN (
        SELECT user_id FROM team_members WHERE team_id = NEW.team_id
      );
    END IF;
    
    -- Award badge to all team members
    IF challenge_badge_id IS NOT NULL THEN
      INSERT INTO "User Badges" (user_id, badge_id)
      SELECT tm.user_id, challenge_badge_id
      FROM team_members tm
      WHERE tm.team_id = NEW.team_id
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to award rewards when challenge is completed
DROP TRIGGER IF EXISTS trigger_award_challenge_rewards ON team_challenge_progress;
CREATE TRIGGER trigger_award_challenge_rewards
AFTER UPDATE OF is_completed ON team_challenge_progress
FOR EACH ROW
EXECUTE FUNCTION award_team_challenge_rewards();
