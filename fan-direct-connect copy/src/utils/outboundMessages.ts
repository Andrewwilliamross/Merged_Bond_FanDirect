
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Enhanced outbound message sending function with improved error handling and logging
export async function sendOutboundMessage({
  fanPhoneNumber,
  messageText,
  attachmentUrl,
}: {
  fanPhoneNumber: string;
  messageText: string;
  attachmentUrl?: string;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('You must be logged in to send messages');
      console.error('Message sending failed: User not logged in');
      return null;
    }
    
    if (!fanPhoneNumber) {
      const error = 'Recipient phone number is required';
      console.error('Message sending failed:', error);
      throw new Error(error);
    }

    if (!messageText.trim()) {
      const error = 'Message text is required';
      console.error('Message sending failed:', error);
      throw new Error(error);
    }

    // Clean phone number format to ensure consistency
    const cleanedPhoneNumber = fanPhoneNumber.replace(/[^0-9+]/g, '');

    console.log('[DEBUG] Preparing to send message');
    console.log('[DEBUG] User ID:', user.id, 'Type:', typeof user.id);
    console.log('[DEBUG] Phone number:', cleanedPhoneNumber);
    console.log('[DEBUG] Message text:', messageText);
    console.log('[DEBUG] Has attachment:', !!attachmentUrl);
    
    // Create the outbound message data object with all required fields
    const outboundMessageData = {
      creator_id: user.id,
      fan_phone_number: cleanedPhoneNumber,
      message_text: messageText,
      attachment_url: attachmentUrl || null,
      status: 'pending'
    };

    console.log('[DEBUG] Sending outbound message with data:', JSON.stringify(outboundMessageData));

    // Insert the outbound message - our database trigger will handle the rest
    const { data, error } = await supabase
      .from('outbound_messages')
      .insert(outboundMessageData)
      .select()
      .single();

    if (error) {
      console.error('[DEBUG] Error sending outbound message:', error);
      console.error('[DEBUG] Error details:', JSON.stringify(error));
      toast.error(`Database error: ${error.message}`);
      throw error;
    }

    console.log('[DEBUG] Outbound message created successfully:', data);
    console.log('[DEBUG] Message ID:', data.id);
    toast.success('Message queued for delivery');
    
    // Listen for status updates for this message
    const channel = supabase
      .channel(`message-status-${data.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'outbound_messages',
        filter: `id=eq.${data.id}`
      }, payload => {
        console.log('[DEBUG] Message status updated:', payload.new);
        if (payload.new.status === 'error') {
          console.error('[DEBUG] Message delivery failed:', payload.new.error_message);
          toast.error(`Message delivery failed: ${payload.new.error_message || 'Unknown error'}`);
        } else if (payload.new.status === 'sent') {
          toast.success('Message delivered successfully');
          console.log('[DEBUG] Message delivered successfully');
        } else {
          console.log('[DEBUG] Message status changed to:', payload.new.status);
        }
      })
      .subscribe((status, err) => {
        if (err) {
          console.error('[DEBUG] Error subscribing to status updates:', err);
        } else {
          console.log('[DEBUG] Successfully subscribed to status updates:', status);
        }
      });
    
    // Return subscription cleanup after 5 minutes
    setTimeout(() => {
      supabase.removeChannel(channel);
    }, 300000);
    
    return data;
  } catch (error: any) {
    console.error('[DEBUG] Error sending outbound message:', error);
    console.error('[DEBUG] Error stack:', error.stack);
    toast.error(`Failed to send message: ${error.message || 'Unknown error'}`);
    return null;
  }
}
