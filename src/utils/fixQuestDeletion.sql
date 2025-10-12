-- =====================================================
-- FIX QUEST DELETION - CASCADE DELETE FOR SUBMISSIONS
-- =====================================================
-- This will allow admins to delete quests even if they have submissions
-- When a quest is deleted, all related submissions will be automatically deleted
-- =====================================================

-- First, drop the existing foreign key constraint
ALTER TABLE public."Submissions"
DROP CONSTRAINT IF EXISTS "Submissions_quest_id_fkey";

-- Recreate the foreign key constraint with CASCADE DELETE
ALTER TABLE public."Submissions"
ADD CONSTRAINT "Submissions_quest_id_fkey"
FOREIGN KEY (quest_id)
REFERENCES public."Quests"(id)
ON DELETE CASCADE;

-- =====================================================
-- COMPLETE!
-- =====================================================
-- Now admins can delete quests and all related submissions
-- will be automatically removed
-- =====================================================
