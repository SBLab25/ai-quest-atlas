-- =====================================================
-- AI ENHANCEMENTS - DATABASE SETUP
-- =====================================================
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Create moderation_logs table
CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type text NOT NULL,
  is_allowed boolean NOT NULL,
  flagged boolean NOT NULL,
  categories text[],
  confidence numeric(3,2),
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Update ai_logs table to add missing columns (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ai_logs' AND column_name = 'task_type') THEN
    ALTER TABLE public.ai_logs ADD COLUMN task_type text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ai_logs' AND column_name = 'input_id') THEN
    ALTER TABLE public.ai_logs ADD COLUMN input_id uuid;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ai_logs' AND column_name = 'output') THEN
    ALTER TABLE public.ai_logs ADD COLUMN output jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ai_logs' AND column_name = 'confidence') THEN
    ALTER TABLE public.ai_logs ADD COLUMN confidence numeric(3,2);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for moderation_logs
CREATE POLICY "Users can view their own moderation logs"
  ON public.moderation_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all moderation logs"
  ON public.moderation_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert moderation logs"
  ON public.moderation_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for ai_logs
CREATE POLICY "Users can view their own AI logs"
  ON public.ai_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all AI logs"
  ON public.ai_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert AI logs"
  ON public.ai_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_moderation_logs_user_id ON public.moderation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_flagged ON public.moderation_logs(flagged);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON public.ai_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_task_type ON public.ai_logs(task_type);
CREATE INDEX IF NOT EXISTS idx_ai_logs_status ON public.ai_logs(status);

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
