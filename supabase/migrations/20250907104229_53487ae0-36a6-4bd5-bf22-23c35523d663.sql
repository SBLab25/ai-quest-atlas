-- Add support for multiple images in community posts and submissions

-- Add image_urls array column to community_posts (keeping image_url for backward compatibility)
ALTER TABLE community_posts ADD COLUMN image_urls TEXT[] DEFAULT '{}';

-- Add image_urls array column to Submissions (keeping photo_url for backward compatibility)  
ALTER TABLE "Submissions" ADD COLUMN image_urls TEXT[] DEFAULT '{}';

-- Create index for better performance on image_urls queries
CREATE INDEX idx_community_posts_image_urls ON community_posts USING GIN(image_urls);
CREATE INDEX idx_submissions_image_urls ON "Submissions" USING GIN(image_urls);