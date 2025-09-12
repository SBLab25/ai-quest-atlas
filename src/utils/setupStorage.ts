import { supabase } from '@/integrations/supabase/client';

export const setupStorageBucket = async () => {
  try {
    // First check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return { success: false, error: 'Cannot access storage. Storage might not be enabled.' };
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'user-uploads');
    
    if (bucketExists) {
      return { success: true, message: 'Storage bucket already exists' };
    }

    // Try to create the bucket
    const { error: createError } = await supabase.storage.createBucket('user-uploads', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880, // 5MB
    });

    if (createError) {
      console.error('Error creating bucket:', createError);
      return { 
        success: false, 
        error: 'Cannot create storage bucket automatically. Please create it manually.',
        instructions: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to Storage section',
          '3. Click "Create Bucket"',
          '4. Name it "user-uploads"',
          '5. Make it public',
          '6. Set file size limit to 5MB',
          '7. Allow image file types only'
        ]
      };
    }

    return { success: true, message: 'Storage bucket created successfully' };
  } catch (error) {
    console.error('Setup error:', error);
    return { 
      success: false, 
      error: 'Storage setup failed. Please set up manually in Supabase dashboard.' 
    };
  }
};

export const testStorageAccess = async () => {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      return { accessible: false, error: error.message };
    }
    return { accessible: true, buckets: data };
  } catch (error) {
    return { accessible: false, error: 'Storage not accessible' };
  }
};