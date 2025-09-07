-- Create storage bucket for quest submissions
INSERT INTO storage.buckets (id, name, public) VALUES ('quest-submissions', 'quest-submissions', true);

-- Create storage policies for quest submissions
CREATE POLICY "Users can view all quest submission images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'quest-submissions');

CREATE POLICY "Users can upload their own quest submissions" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'quest-submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own quest submissions" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'quest-submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own quest submissions" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'quest-submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable RLS on existing tables
ALTER TABLE public."Quests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Badges" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for Quests (publicly viewable)
CREATE POLICY "Quests are viewable by everyone" 
ON public."Quests" 
FOR SELECT 
USING (true);

-- Create RLS policies for Submissions (users can view all but only manage their own)
CREATE POLICY "Submissions are viewable by everyone" 
ON public."Submissions" 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own submissions" 
ON public."Submissions" 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions" 
ON public."Submissions" 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for Badges (publicly viewable)
CREATE POLICY "Badges are viewable by everyone" 
ON public."Badges" 
FOR SELECT 
USING (true);

-- Insert some sample quests for testing
INSERT INTO public."Quests" (title, description, quest_type, difficulty, location, is_active) VALUES
('Urban Photography Challenge', 'Capture the hidden beauty in your city. Find and photograph interesting architectural details, street art, or unique urban landscapes.', 'photography', 2, 'Any city worldwide', true),
('Nature''s Geometry', 'Discover geometric patterns in nature. Look for spirals, fractals, symmetry, or repeating patterns in plants, rocks, or landscapes.', 'nature', 1, 'Outdoor natural spaces', true),
('Local History Mystery', 'Research and visit a historical site in your area. Learn about its significance and share the story behind it.', 'history', 3, 'Your local area', true),
('Sunset Science', 'Document a sunset and explain the science behind the colors you observe. Include weather conditions and their impact.', 'science', 2, 'Open area with horizon view', true),
('Community Helper', 'Perform a random act of kindness in your community and document the positive impact it creates.', 'community', 1, 'Your local community', true);