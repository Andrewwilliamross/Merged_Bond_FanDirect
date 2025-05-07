
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.0";

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const MAC_SERVER_API_KEY = Deno.env.get('MAC_SERVER_API_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

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
    console.log('Received inbound message from Mac Agent');
    
    // Authenticate the request
    const authHeader = req.headers.get('authorization') || '';
    const apiKey = req.headers.get('x-api-key') || authHeader.replace('Bearer ', '');
    
    if (apiKey !== MAC_SERVER_API_KEY) {
      throw new Error('Unauthorized: Invalid API key');
    }

    // Extract the message data
    const { message, type } = await req.json();
    console.log(`Received ${type} from Mac Agent:`, JSON.stringify(message));
    
    // Handle different types of updates
    if (type === 'status_update') {
      // Update message status
      const { id, status, error_message } = message;
      
      if (!id || !status) {
        throw new Error('Missing required fields for status update');
      }
      
      const { error } = await supabase
        .from('outbound_messages')
        .update({ 
          status, 
          error_message: error_message || null,
          ...(status === 'sent' ? { sent_at: new Date().toISOString() } : {})
        })
        .eq('id', id);
      
      if (error) {
        throw new Error(`Failed to update message status: ${error.message}`);
      }
      
      console.log(`Updated message ${id} status to ${status}`);
      
    } else if (type === 'inbound_message') {
      // Store new inbound message
      const { text, sender_phone, attachment_url, recipient_id, apple_message_id } = message;
      
      if (!sender_phone || !text || !recipient_id) {
        throw new Error('Missing required fields for inbound message');
      }
      
      // Find creator by phone mapping
      const { data: mappingData, error: mappingError } = await supabase
        .from('fan_creator_mappings')
        .select('creator_id')
        .eq('fan_phone_number', sender_phone)
        .single();
      
      if (mappingError || !mappingData) {
        throw new Error(`No mapping found for phone number: ${sender_phone}`);
      }
      
      // Insert inbound message
      const { data: messageData, error: messageError } = await supabase
        .from('inbound_messages')
        .insert({
          message_text: text,
          fan_phone_number: sender_phone,
          creator_id: mappingData.creator_id,
          attachment_url: attachment_url || null,
          apple_id: apple_message_id || null,
        })
        .select()
        .single();
      
      if (messageError) {
        throw new Error(`Failed to insert inbound message: ${messageError.message}`);
      }
      
      console.log(`Stored inbound message with ID: ${messageData.id}`);
    } else {
      throw new Error(`Unknown message type: ${type}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Message processed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error processing message:', error.message);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
