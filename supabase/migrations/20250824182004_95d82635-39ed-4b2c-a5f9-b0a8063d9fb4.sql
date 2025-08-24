-- Fix remaining RLS policy issues for User Badges and Users tables

-- Add policies for User Badges table
CREATE POLICY "User badges are viewable by authenticated users" 
ON public."User Badges" 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can manage their own badges" 
ON public."User Badges" 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add policies for Users table  
CREATE POLICY "Users are viewable by authenticated users" 
ON public."Users" 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can update their own user record" 
ON public."Users" 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own user record" 
ON public."Users" 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);