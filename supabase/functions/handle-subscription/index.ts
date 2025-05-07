import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.3";

// Get Supabase client with admin privileges
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
    const { profile_id, tier_id } = await req.json();

    if (!profile_id || !tier_id) {
      return new Response(
        JSON.stringify({ error: 'Profile ID and Tier ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get subscription tier details
    const { data: tier, error: tierError } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', tier_id)
      .single();

    if (tierError) {
      throw tierError;
    }

    if (!tier) {
      return new Response(
        JSON.stringify({ error: 'Subscription tier not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update profile's subscription
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        subscribed_to: tier.creator_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, data: updatedProfile }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 