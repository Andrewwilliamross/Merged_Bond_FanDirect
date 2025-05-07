import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.3';

// Get Supabase client with admin privileges for database operations
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Get Mac server URL from environment variable (preferred) or use hardcoded value
const MAC_SERVER_URL = Deno.env.get('MAC_SERVER_URL') || 'https://mac-agent.ngrok-free.app';
const MAC_SERVER_API_KEY = Deno.env.get('MAC_SERVER_API_KEY') || '';

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[DEBUG] Received webhook call for new outbound message');

    // Extract the message data from the request
    const messageData = await req.json();
    console.log('[DEBUG] Message data:', JSON.stringify(messageData));

    if (!messageData.id || !messageData.fan_phone_number || !messageData.creator_id) {
      const error = 'Missing required message fields';
      console.error(`[DEBUG] ${error}:`, JSON.stringify(messageData));
      throw new Error(error);
    }
    
    console.log(`[DEBUG] Using Mac server URL: ${MAC_SERVER_URL}`);
    console.log(`[DEBUG] API Key exists: ${!!MAC_SERVER_API_KEY}`);

    // Validate the Mac server URL
    if (!MAC_SERVER_URL || !MAC_SERVER_URL.startsWith('http')) {
      const error = `Invalid Mac server URL: ${MAC_SERVER_URL}`;
      console.error(`[DEBUG] ${error}`);
      throw new Error(error);
    }

    // Forward the message to the Mac server's send-message endpoint
    const macServerEndpoint = `${MAC_SERVER_URL}/send-message`;
    console.log(`[DEBUG] Forwarding message to Mac server at ${macServerEndpoint}`);
    
    try {
      const response = await fetch(macServerEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': MAC_SERVER_API_KEY
        },
        body: JSON.stringify({
          fan_phone_number: messageData.fan_phone_number,
          message_text: messageData.message_text || '',
          media_url: messageData.attachment_url || null,
          creator_id: messageData.creator_id,
          outbound_message_id: messageData.id
        })
      });

      console.log(`[DEBUG] Mac server response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DEBUG] Mac server responded with status ${response.status}: ${errorText}`);
        
        // Update the message status to error
        const { error: updateError } = await supabase
          .from('outbound_messages')
          .update({
            status: 'error',
            error_message: `Mac server error: ${response.status} - ${errorText.substring(0, 100)}`
          })
          .eq('id', messageData.id);
          
        if (updateError) {
          console.error('[DEBUG] Failed to update message status:', updateError);
        }
        
        throw new Error(`Mac server responded with status ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('[DEBUG] Mac server response:', JSON.stringify(result));
      
      // Update the message status to queued (Mac agent will update to processing/sent)
      const { error: updateError } = await supabase
        .from('outbound_messages')
        .update({
          status: 'queued'
        })
        .eq('id', messageData.id);
        
      if (updateError) {
        console.error('[DEBUG] Failed to update message status to queued:', updateError);
        throw updateError;
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });

    } catch (fetchError) {
      console.error('[DEBUG] Error forwarding message to Mac server:', fetchError);
      
      // Update message status to error
      const { error: updateError } = await supabase
        .from('outbound_messages')
        .update({
          status: 'error',
          error_message: `Failed to reach Mac server: ${fetchError.message}`
        })
        .eq('id', messageData.id);
        
      if (updateError) {
        console.error('[DEBUG] Failed to update message status:', updateError);
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error('[DEBUG] Error processing webhook:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
