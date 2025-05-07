
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Uploads a file to Supabase Storage
 * @param file The file to upload
 * @param userId The ID of the user uploading the file
 * @param bucketName The storage bucket name (defaults to 'attachments')
 * @returns The URL of the uploaded file, or null if upload failed
 */
export async function uploadFile(
  file: File,
  userId: string,
  bucketName: string = 'attachments'
): Promise<string | null> {
  try {
    // Create a unique path for the file
    const filePath = `${userId}/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    
    // Check if the bucket exists, create if it doesn't
    const { data: buckets } = await supabase
      .storage
      .listBuckets();
      
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      // Create the bucket
      const { error } = await supabase
        .storage
        .createBucket(bucketName, {
          public: true, // Make files publicly accessible
          fileSizeLimit: 10485760, // 10MB limit
        });
        
      if (error) throw error;
    }
    
    // Upload the file
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from(bucketName)
      .upload(filePath, file);
      
    if (fileError) throw fileError;
    
    // Get the public URL
    const { data } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    toast.error("Failed to upload file");
    return null;
  }
}
