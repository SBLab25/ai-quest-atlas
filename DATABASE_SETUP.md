# Database Setup Required

To enable image uploads in the Community tab, you need to run these SQL commands in your Supabase SQL Editor:

## 1. Add image_url column to community_posts table

```sql
ALTER TABLE community_posts ADD COLUMN image_url TEXT;
```

## 2. Create storage bucket and policies

```sql
-- Create community-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-images', 'community-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'community-images');

-- Allow public access to view images
CREATE POLICY "Allow public access to community images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'community-images');

-- Allow users to delete their own images
CREATE POLICY "Allow users to delete their own images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'community-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 3. (Optional) Enhanced Streak Tracking

If you want enhanced streak tracking with a dedicated table, run this SQL:

```sql
-- Create user_streaks table for enhanced streak tracking
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own streak data
CREATE POLICY "Users can view own streak data" ON user_streaks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy to allow users to update their own streak data
CREATE POLICY "Users can update own streak data" ON user_streaks
  FOR ALL
  USING (auth.uid() = user_id);
```

## Steps to apply:
1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Copy and paste the SQL commands above
5. Click "Run" to execute

After running these commands, the image upload functionality will work completely!