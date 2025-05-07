import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.3";

// Get Supabase client with admin privileges for storage operations
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[DEBUG] Setting up storage buckets and policies');

    // Create attachments bucket if it doesn't exist
    const { data: attachmentsBucket, error: attachmentsError } = await supabase
      .storage
      .createBucket('attachments', {
        public: true,
        allowedMimeTypes: ['image/*', 'video/*', 'audio/*'],
        fileSizeLimit: 100000000 // 100MB
      });

    if (attachmentsError && !attachmentsError.message.includes('already exists')) {
      throw attachmentsError;
    }

    // Create profiles bucket if it doesn't exist
    const { data: profilesBucket, error: profilesError } = await supabase
      .storage
      .createBucket('profiles', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 10000000 // 10MB
      });

    if (profilesError && !profilesError.message.includes('already exists')) {
      throw profilesError;
    }

    // Set up storage policies
    const policies = [
      // Attachments bucket policies
      {
        name: 'Authenticated users can upload attachments',
        bucket: 'attachments',
        definition: {
          role: 'authenticated',
          operation: 'INSERT',
          check: "auth.uid() = storage.foldername"
        }
      },
      {
        name: 'Anyone can view attachments',
        bucket: 'attachments',
        definition: {
          role: 'anon',
          operation: 'SELECT',
          check: "true"
        }
      },
      {
        name: 'Users can delete their own attachments',
        bucket: 'attachments',
        definition: {
          role: 'authenticated',
          operation: 'DELETE',
          check: "auth.uid() = storage.foldername"
        }
      },
      // Profile bucket policies
      {
        name: 'Users can upload their own profile pictures',
        bucket: 'profiles',
        definition: {
          role: 'authenticated',
          operation: 'INSERT',
          check: "auth.uid() = storage.foldername"
        }
      },
      {
        name: 'Anyone can view profile pictures',
        bucket: 'profiles',
        definition: {
          role: 'anon',
          operation: 'SELECT',
          check: "true"
        }
      },
      {
        name: 'Users can update their own profile pictures',
        bucket: 'profiles',
        definition: {
          role: 'authenticated',
          operation: 'UPDATE',
          check: "auth.uid() = storage.foldername"
        }
      }
    ];

    // Apply policies
    for (const policy of policies) {
      const { error: policyError } = await supabase
        .rpc('create_storage_policy', {
          bucket_name: policy.bucket,
          policy_name: policy.name,
          definition: policy.definition
        });

      if (policyError && !policyError.message.includes('already exists')) {
        console.error(`Error creating policy '${policy.name}':`, policyError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Storage buckets and policies set up successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('[DEBUG] Error setting up storage:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
