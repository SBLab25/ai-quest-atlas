-- Fix admin approval: ensure admins can UPDATE with WITH CHECK as well
DROP POLICY IF EXISTS "Admins can update any submission" ON public."Submissions";

CREATE POLICY "Admins can update any submission"
ON public."Submissions"
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));