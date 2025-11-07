-- Fix for Submissions table - Add updated_at column if it doesn't exist
-- This fixes the error: column "updated_at" does not exist

-- Add updated_at column to Submissions table if it doesn't exist
ALTER TABLE public."Submissions" 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create or replace trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_submissions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_submissions_updated_at ON public."Submissions";

-- Create trigger to automatically update updated_at on UPDATE
CREATE TRIGGER trigger_update_submissions_updated_at
BEFORE UPDATE ON public."Submissions"
FOR EACH ROW
EXECUTE FUNCTION public.update_submissions_updated_at();

-- Update existing rows to have updated_at = submitted_at (or now if submitted_at is null)
UPDATE public."Submissions"
SET updated_at = COALESCE(submitted_at, NOW())
WHERE updated_at IS NULL;

