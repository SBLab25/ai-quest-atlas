-- Add location tracking to profiles table for AI quest generation
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_last_updated TIMESTAMP WITH TIME ZONE;

-- Create table to store AI-generated quests
CREATE TABLE IF NOT EXISTS public.ai_generated_quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  quest_type TEXT NOT NULL DEFAULT 'discovery',
  difficulty SMALLINT NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  generated_by TEXT NOT NULL DEFAULT 'gemini',
  generation_prompt TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ai_generated_quests
ALTER TABLE public.ai_generated_quests ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_generated_quests
CREATE POLICY "AI generated quests are viewable by everyone" 
ON public.ai_generated_quests 
FOR SELECT 
USING (true);

CREATE POLICY "Users can view their own AI generated quests" 
ON public.ai_generated_quests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates on ai_generated_quests
CREATE TRIGGER update_ai_generated_quests_updated_at
BEFORE UPDATE ON public.ai_generated_quests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance on location-based queries
CREATE INDEX IF NOT EXISTS idx_ai_generated_quests_user_location 
ON public.ai_generated_quests(user_id, latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_ai_generated_quests_active 
ON public.ai_generated_quests(is_active, created_at);

-- Enable pg_cron extension for scheduled tasks
SELECT cron.schedule(
  'generate-daily-ai-quests',
  '0 0 * * *', -- Every day at midnight UTC
  $$
  select
    net.http_post(
        url:='https://afglpoufxxgdxylvgeex.supabase.co/functions/v1/generate-daily-ai-quests',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmZ2xwb3VmeHhnZHh5bHZnZWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNDc3ODQsImV4cCI6MjA2OTYyMzc4NH0.zS-liSt8emGixeRJUTDgl7RR0767fcNSlzDPC8kzUUs"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);