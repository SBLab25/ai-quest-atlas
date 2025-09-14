import { supabase } from "@/integrations/supabase/client";

export const fixHiddenTemplePost = async () => {
  const hiddenTemplePostId = "b7cc9331-820c-4fe6-b6f3-0c5eb92195ab";
  const imageUrl = "https://afglpoufxxgdxylvgeex.supabase.co/storage/v1/object/public/community-images/community-posts/0.8783817240408768.jpg";

  try {
    const { error } = await supabase
      .from('community_posts')
      .update({ 
        image_urls: [imageUrl] 
      })
      .eq('id', hiddenTemplePostId);

    if (error) {
      console.error('Error fixing Hidden Temple post image:', error);
      throw error;
    }

    console.log('Successfully fixed Hidden Temple post image');
    return { success: true };
  } catch (error) {
    console.error('Failed to fix Hidden Temple post:', error);
    throw error;
  }
};

export const fixAllCommunityImageUrls = async () => {
  try {
    // Get all community posts with missing or empty image_urls
    const { data: posts, error: fetchError } = await supabase
      .from('community_posts')
      .select('*')
      .or('image_urls.is.null,image_urls.eq.{}');

    if (fetchError) throw fetchError;

    console.log(`Found ${posts?.length || 0} posts with missing images`);
    
    // You can add more specific fixes here based on known image URLs
    // For now, just fix the Hidden Temple post
    await fixHiddenTemplePost();

    return { success: true, postsFound: posts?.length || 0 };
  } catch (error) {
    console.error('Error fixing community image URLs:', error);
    throw error;
  }
};