# AI Photo Verification Setup Guide

## Overview
This guide will help you set up the AI photo verification system for your Discovery Atlas application.

## Prerequisites
- Lovable Cloud enabled
- Admin access to your Supabase dashboard

## Step 1: Enable Lovable AI
The AI verification system uses Lovable AI (Gemini 2.5 Pro) to analyze photos.

1. Go to your project Settings
2. Navigate to the Integrations tab
3. Enable "Lovable AI"
4. The `LOVABLE_API_KEY` will be automatically configured

## Step 2: Create Database Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- =====================================================
-- AI PHOTO VERIFICATION SYSTEM - DATABASE SETUP
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own verifications" ON public.ai_verifications;
DROP POLICY IF EXISTS "Admins can view all verifications" ON public.ai_verifications;
DROP POLICY IF EXISTS "System can insert verifications" ON public.ai_verifications;
DROP POLICY IF EXISTS "Admins can update verifications" ON public.ai_verifications;
DROP POLICY IF EXISTS "Users can view their own logs" ON public.ai_logs;
DROP POLICY IF EXISTS "Admins can view all logs" ON public.ai_logs;
DROP POLICY IF EXISTS "System can insert logs" ON public.ai_logs;

-- RLS Policies for ai_verifications
CREATE POLICY "Users can view their own verifications"
  ON public.ai_verifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all verifications"
  ON public.ai_verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert verifications"
  ON public.ai_verifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update verifications"
  ON public.ai_verifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for ai_logs
CREATE POLICY "Users can view their own logs"
  ON public.ai_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all logs"
  ON public.ai_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_ai_verifications_timestamp ON public.ai_verifications;

CREATE TRIGGER update_ai_verifications_timestamp
  BEFORE UPDATE ON public.ai_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_verification_timestamp();

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
```

## Step 3: Add Delete Permission for Quests

Run this additional SQL to allow admins to delete quests:

```sql
-- Add admin delete policy for Quests
DROP POLICY IF EXISTS "Admins can delete quests" ON public."Quests";

CREATE POLICY "Admins can delete quests"
  ON public."Quests" FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

## Step 4: Test the System

1. Submit a quest with a photo
2. Go to Admin Panel > AI Verifications tab
3. You should see the verification results
4. Try deleting a quest from the Admin Panel > Quests tab

## Features

### Automatic Photo Verification
- When users submit a quest with a photo, it's automatically analyzed by AI
- The AI checks:
  - **Quest Match**: Does the photo match the quest description?
  - **Geolocation**: Does the location make sense?
  - **Authenticity**: Is this a real photo or AI-generated?
  - **Scene Relevance**: How relevant is the photo to the quest?

### Verdicts
- **Verified** (85%+ confidence): Auto-approved
- **Uncertain** (60-85% confidence): Pending manual review
- **Rejected** (<60% confidence): Auto-rejected

### Admin Override
Admins can manually override AI decisions if needed.

## Troubleshooting

### No verifications showing up
1. Check if the tables were created successfully
2. Verify Lovable AI is enabled
3. Check the edge function logs for errors

### Delete not working
1. Make sure you ran the delete policy SQL
2. Verify you have admin role in `user_roles` table
3. Check console logs for specific error messages

## Cost Information

AI verification uses Lovable AI which has usage-based pricing. Check your workspace usage in Settings > Workspace > Usage.
