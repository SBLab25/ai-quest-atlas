-- Create suggested_quests table for AI-powered personalized recommendations
CREATE TABLE IF NOT EXISTS public.suggested_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty SMALLINT NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),
  estimated_duration INTEGER NOT NULL, -- in minutes
  quest_type TEXT NOT NULL DEFAULT 'discovery',
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_accepted BOOLEAN NOT NULL DEFAULT false,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  generation_context JSONB, -- stores user interests, past quests data used for generation
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suggested_quests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own suggested quests"
ON public.suggested_quests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own suggested quests"
ON public.suggested_quests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suggested quests"
ON public.suggested_quests
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suggested quests"
ON public.suggested_quests
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for efficient queries
CREATE INDEX idx_suggested_quests_user_id ON public.suggested_quests(user_id);
CREATE INDEX idx_suggested_quests_is_active ON public.suggested_quests(is_active);
CREATE INDEX idx_suggested_quests_expires_at ON public.suggested_quests(expires_at);

-- Add trigger for updated_at
CREATE TRIGGER update_suggested_quests_updated_at
BEFORE UPDATE ON public.suggested_quests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();