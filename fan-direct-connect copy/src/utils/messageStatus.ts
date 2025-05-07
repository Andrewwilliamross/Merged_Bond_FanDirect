
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Updates the status of an outbound message in the database
 * This can be used by the Mac server to update message status via API
 */
export async function updateMessageStatus(
  messageId: string, 
  status: 'pending' | 'sent' | 'delivered' | 'error',
  errorMessage?: string
) {
  try {
    const updateData: {
      status: string;
      sent_at?: string;
      error_message?: string | null;
    } = {
      status
    };
    
    // If the message is sent, update the sent_at timestamp
    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    }
    
    // If there's an error, update the error message
    if (status === 'error' && errorMessage) {
      updateData.error_message = errorMessage;
    } else if (status !== 'error') {
      // Clear any previous error message if setting to a non-error state
      updateData.error_message = null;
    }
    
    const { error } = await supabase
      .from('outbound_messages')
      .update(updateData)
      .eq('id', messageId);
      
    if (error) {
      throw error;
    }
    
    console.log(`Updated message ${messageId} status to ${status}`);
    return true;
    
  } catch (error) {
    console.error('Error updating message status:', error);
    toast.error('Failed to update message status');
    return false;
  }
}

/**
 * Endpoint reference for Mac server integration
 * This provides documentation for the expected API endpoints
 */
export const MAC_SERVER_API_REFERENCE = {
  // Mac server should implement this endpoint to receive messages
  receiveMessage: {
    endpoint: '/api/messages',
    method: 'POST',
    body: {
      message: {
        id: 'string', // Message UUID
        message_text: 'string', // The message content
        fan_phone_number: 'string', // Recipient phone number
        attachment_url: 'string | null', // Optional attachment URL
        creator_id: 'string', // UUID of the creator who sent the message
        created_at: 'string' // ISO timestamp when the message was created
      },
      timestamp: 'string' // ISO timestamp of when webhook was triggered
    },
    response: {
      success: 'boolean',
      messageId: 'string' // Echo back the message ID
    }
  },
  // Mac server should call this endpoint to update message status
  updateStatus: {
    endpoint: 'https://uaqnjttwmrosudmbpcct.supabase.co/functions/v1/handle-inbound-message',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_MAC_SERVER_API_KEY',
      'X-API-Key': 'YOUR_MAC_SERVER_API_KEY',
      'Content-Type': 'application/json'
    },
    body: {
      type: 'status_update',
      message: {
        id: 'string', // Message UUID
        status: 'string', // 'pending', 'sent', 'delivered', or 'error'
        error_message: 'string?' // Optional error message if status is 'error'
      }
    }
  }
};

/**
 * Architecture reference for Mac server allocation
 * This documents how creators are mapped to specific Mac servers
 */
export const MAC_SERVER_ARCHITECTURE = {
  // How Mac servers are allocated for creators
  allocation: {
    creatorSpecific: "Each creator can be mapped to a specific Mac server URL",
    defaultServer: "A default Mac server can be used for unmapped creators",
    environmentVariable: "The MAC_SERVER_URL environment variable is used as a fallback"
  },
  
  // Database table that stores Mac server mappings
  databaseTable: "mac_server_mappings",
  
  // Fields in the Mac server mappings table
  mappingFields: {
    id: "UUID primary key",
    creator_id: "UUID of the creator",
    server_url: "URL of the Mac server API endpoint",
    api_key: "API key for authenticating with the Mac server",
    is_default: "Boolean flag for the default server",
    created_at: "Timestamp when the mapping was created"
  }
};
