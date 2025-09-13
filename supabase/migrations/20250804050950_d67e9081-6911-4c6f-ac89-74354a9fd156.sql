-- First, let's check the current constraints and fix the foreign key issue

-- Drop the existing foreign key constraint that's causing issues
ALTER TABLE public."Submissions" DROP CONSTRAINT IF EXISTS "Submissions_user_id_fkey";

-- Add the correct foreign key constraint referencing auth.users
ALTER TABLE public."Submissions" 
ADD CONSTRAINT "Submissions_user_id_fkey" 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Also fix the post_likes table to reference auth.users
ALTER TABLE public.post_likes DROP CONSTRAINT IF EXISTS "post_likes_user_id_fkey";
ALTER TABLE public.post_likes 
ADD CONSTRAINT "post_likes_user_id_fkey" 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix post_comments table
ALTER TABLE public.post_comments DROP CONSTRAINT IF EXISTS "post_comments_user_id_fkey";
ALTER TABLE public.post_comments 
ADD CONSTRAINT "post_comments_user_id_fkey" 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix post_shares table
ALTER TABLE public.post_shares DROP CONSTRAINT IF EXISTS "post_shares_user_id_fkey";
ALTER TABLE public.post_shares 
ADD CONSTRAINT "post_shares_user_id_fkey" 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;