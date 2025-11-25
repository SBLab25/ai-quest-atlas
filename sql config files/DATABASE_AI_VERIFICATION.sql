-- =====================================================
-- AI PHOTO VERIFICATION SYSTEM - DATABASE SETUP
-- =====================================================
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- Create ai_verifications table
CREATE TABLE IF NOT EXISTS public.ai_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quest_id uuid REFERENCES public."Quests"(id) ON DELETE CASCADE,
  submission_id uuid REFERENCES public."Submissions"(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  
  -- AI Analysis Results
  quest_match_score numeric(3,2) CHECK (quest_match_score >= 0 AND quest_match_score <= 1),
  geolocation_match_score numeric(3,2) CHECK (geolocation_match_score >= 0 AND geolocation_match_score <= 1),
  authenticity_score numeric(3,2) CHECK (authenticity_score >= 0 AND authenticity_score <= 1),
  scene_relevance_score numeric(3,2) CHECK (scene_relevance_score >= 0 AND scene_relevance_score <= 1),
  final_confidence numeric(3,2) CHECK (final_confidence >= 0 AND final_confidence <= 1),
  
  -- Verdict and reasoning
  verdict text CHECK (verdict IN ('verified', 'uncertain', 'rejected')) NOT NULL,
  reason text NOT NULL,
  
  -- EXIF metadata
  exif_latitude numeric,
  exif_longitude numeric,
  exif_timestamp timestamptz,
  
  -- AI model used
  model_used text DEFAULT 'google/gemini-2.5-pro',
  
  -- Admin override
  admin_override boolean DEFAULT false,
  admin_override_by uuid REFERENCES auth.users(id),
  admin_override_reason text,
  
  verified_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ai_logs table for debugging and analytics
CREATE TABLE IF NOT EXISTS public.ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  submission_id uuid REFERENCES public."Submissions"(id) ON DELETE CASCADE NOT NULL,
  verification_id uuid REFERENCES public.ai_verifications(id) ON DELETE CASCADE,
  
  model_used text NOT NULL,
  confidence_score numeric(3,2),
  execution_time_ms integer,
  status text CHECK (status IN ('success', 'error', 'timeout')) NOT NULL,
  error_message text,
  
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_verifications
CREATE POLICY "Users can view their own verifications"
  ON public.ai_verifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all verifications"
  ON public.ai_verifications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert verifications"
  ON public.ai_verifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update verifications"
  ON public.ai_verifications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ai_logs
CREATE POLICY "Users can view their own logs"
  ON public.ai_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all logs"
  ON public.ai_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert logs"
  ON public.ai_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_verifications_user_id ON public.ai_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_verifications_submission_id ON public.ai_verifications(submission_id);
CREATE INDEX IF NOT EXISTS idx_ai_verifications_verdict ON public.ai_verifications(verdict);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON public.ai_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_submission_id ON public.ai_logs(submission_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_verification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_verifications_timestamp
  BEFORE UPDATE ON public.ai_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_verification_timestamp();

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Next steps:
-- 1. Photos uploaded through quest submissions will now be automatically verified
-- 2. Check the Admin Panel > AI Verifications tab to view results
-- 3. Admin can override AI decisions for edge cases
-- =====================================================
