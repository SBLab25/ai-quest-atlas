-- Allow admins to update any submission (for approval/rejection)
CREATE POLICY "Admins can update any submission"
ON public."Submissions"
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));