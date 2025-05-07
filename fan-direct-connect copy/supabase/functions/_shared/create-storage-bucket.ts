
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.3';

// This function creates a storage bucket if it doesn't exist
export async function ensureBucketExists(
  supabase: ReturnType<typeof createClient>,
  bucketName: string,
  options: {
    public?: boolean;
    fileSizeLimit?: number;
  } = { public: true, fileSizeLimit: 10485760 } // Default 10MB limit
): Promise<boolean> {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      // Create bucket if it doesn't exist
      const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: options.public,
        fileSizeLimit: options.fileSizeLimit
      });
      
      if (createError) {
        console.error(`Error creating bucket "${bucketName}":`, createError);
        return false;
      }
      
      console.log(`Created bucket "${bucketName}" successfully:`, data);
    } else {
      console.log(`Bucket "${bucketName}" already exists`);
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    return false;
  }
}
