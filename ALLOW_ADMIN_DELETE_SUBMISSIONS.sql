-- =====================================================
-- ALLOW ADMINS TO DELETE SUBMISSIONS
-- =====================================================
-- This creates an RLS policy and a database function
-- to allow admins to delete submissions when rejecting them
-- =====================================================

-- Option 1: Create RLS policy for admins to delete submissions
CREATE POLICY "Admins can delete any submission"
ON public."Submissions"
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Option 2: Create a SECURITY DEFINER function for deletion (more secure)
CREATE OR REPLACE FUNCTION delete_submission_admin(
  p_submission_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_quest_id UUID;
  v_deleted_count INTEGER;
BEGIN
  -- Get submission details before deletion
  SELECT user_id, quest_id
  INTO v_user_id, v_quest_id
  FROM public."Submissions"
  WHERE id = p_submission_id;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Submission not found'
    );
  END IF;
  
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Unauthorized: Admin access required'
    );
  END IF;
  
  -- Delete related records first (foreign key constraints)
  DELETE FROM public.post_likes WHERE submission_id = p_submission_id;
  DELETE FROM public.post_comments WHERE submission_id = p_submission_id;
  DELETE FROM public.post_shares WHERE submission_id = p_submission_id;
  
  -- Delete the submission
  DELETE FROM public."Submissions" WHERE id = p_submission_id;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  IF v_deleted_count = 0 THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'No rows deleted'
    );
  END IF;
  
  -- Return success with quest_id for event broadcasting
  RETURN json_build_object(
    'success', TRUE,
    'quest_id', v_quest_id,
    'user_id', v_user_id
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_submission_admin(UUID) TO authenticated;

-- =====================================================
-- COMPLETE!
-- =====================================================
-- Now admins can delete submissions using either:
-- 1. Direct DELETE with RLS policy, or
-- 2. The delete_submission_admin() function
-- =====================================================

