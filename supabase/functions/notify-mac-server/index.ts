import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.3";

// Get Supabase client with admin privileges
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Get Mac server configuration
const MAC_SERVER_API_KEY = Deno.env.get('MAC_SERVER_API_KEY') || '';
const MAC_SERVER_URL = Deno.env.get('MAC_SERVER_URL') || '';

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
    const { id, fan_phone_number, message_text, attachment_url, creator_id } = await req.json();

    if (!id || !fan_phone_number || !creator_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get creator's Mac server mapping
    const { data: mapping, error: mappingError } = await supabase
      .from('mac_server_mappings')
      .select('server_url, api_key')
      .eq('creator_id', creator_id)
      .single();

    if (mappingError && !mappingError.message.includes('No rows found')) {
      throw mappingError;
    }

    // Use mapped server or fallback to default
    const targetServerUrl = mapping?.server_url || MAC_SERVER_URL;
    const targetApiKey = mapping?.api_key || MAC_SERVER_API_KEY;

    if (!targetServerUrl) {
      throw new Error('No Mac server configured for this creator');
    }

    // Forward message to Mac server
    const response = await fetch(`${targetServerUrl}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${targetApiKey}`,
      },
      body: JSON.stringify({
        id,
        fan_phone_number,
        message_text,
        attachment_url,
        creator_id,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mac server responded with status ${response.status}`);
    }

    // Update message status to queued
    const { error: updateError } = await supabase
      .from('outbound_messages')
      .update({ status: 'queued' })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error notifying Mac server:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 