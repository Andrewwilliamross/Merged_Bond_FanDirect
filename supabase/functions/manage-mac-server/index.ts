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
    const { action, data } = await req.json();

    if (!action || !data) {
      return new Response(
        JSON.stringify({ error: 'Action and data are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'add': {
        const { creator_id, server_url, api_key, is_default } = data;
        
        if (!creator_id || !server_url || !api_key) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields for adding server' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: server, error } = await supabase
          .from('mac_server_mappings')
          .insert({
            creator_id,
            server_url,
            api_key,
            is_default: is_default || false
          })
          .select()
          .single();

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, data: server }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update': {
        const { id, server_url, api_key, is_default, is_active } = data;
        
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'Server ID is required for update' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const updateData: any = {};
        if (server_url) updateData.server_url = server_url;
        if (api_key) updateData.api_key = api_key;
        if (typeof is_default === 'boolean') updateData.is_default = is_default;
        if (typeof is_active === 'boolean') updateData.is_active = is_active;

        const { data: server, error } = await supabase
          .from('mac_server_mappings')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, data: server }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        const { id } = data;
        
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'Server ID is required for deletion' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabase
          .from('mac_server_mappings')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'list': {
        const { creator_id } = data;
        
        if (!creator_id) {
          return new Response(
            JSON.stringify({ error: 'Creator ID is required for listing servers' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: servers, error } = await supabase
          .from('mac_server_mappings')
          .select('*')
          .eq('creator_id', creator_id)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, data: servers }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error managing Mac server:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 