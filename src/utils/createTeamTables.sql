-- Run this SQL in your Supabase SQL Editor to create the team tables

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  max_members INTEGER DEFAULT 6,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(team_id, user_id)
);

-- Create team_quest_completions table
CREATE TABLE IF NOT EXISTS team_quest_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES public."Quests"(id) ON DELETE CASCADE,
  completed_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(team_id, quest_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_quest_completions_team_id ON team_quest_completions(team_id);
CREATE INDEX IF NOT EXISTS idx_team_quest_completions_quest_id ON team_quest_completions(quest_id);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_quest_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Users can view all teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Users can create teams" ON teams FOR INSERT WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Team leaders can update their teams" ON teams FOR UPDATE USING (auth.uid() = leader_id);
CREATE POLICY "Team leaders can delete their teams" ON teams FOR DELETE USING (auth.uid() = leader_id);

-- RLS Policies for team_members
CREATE POLICY "Users can view team members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Users can join teams" ON team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave teams" ON team_members FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Team leaders can manage members" ON team_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = team_members.team_id 
    AND teams.leader_id = auth.uid()
  )
);

-- RLS Policies for team_quest_completions
CREATE POLICY "Users can view team quest completions" ON team_quest_completions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_members.team_id = team_quest_completions.team_id 
    AND team_members.user_id = auth.uid()
  )
);
CREATE POLICY "Team members can mark quests complete" ON team_quest_completions FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_members.team_id = team_quest_completions.team_id 
    AND team_members.user_id = auth.uid()
  ) AND auth.uid() = completed_by
);