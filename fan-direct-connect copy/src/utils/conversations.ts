
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function getOrCreateConversation(recipientId: string): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in to send messages');
      return null;
    }

    // First, check if a conversation exists between these users
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('conversation_id')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .or(`sender_id.eq.${recipientId},recipient_id.eq.${recipientId}`)
      .limit(1);

    if (existingMessages && existingMessages.length > 0) {
      return existingMessages[0].conversation_id;
    }

    // If no conversation exists, create a new one using our RPC function
    const { data: newConversation, error: conversationError } = await supabase.rpc(
      'create_conversation'
    );

    if (conversationError) {
      console.error('Error creating conversation:', conversationError);
      throw conversationError;
    }
    
    if (!newConversation || newConversation.length === 0) {
      throw new Error('Failed to create conversation');
    }
    
    console.log('Created new conversation:', newConversation);
    // Access the first element of the array since create_conversation returns an array
    return newConversation[0].id;

  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    toast.error('Failed to create conversation');
    return null;
  }
}

export async function sendMessage({
  conversationId,
  recipientId,
  senderId,
  content,
  mediaUrl,
  mediaType,
  replyToId,
}: {
  conversationId: string;
  recipientId?: string;
  senderId: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
  replyToId?: string;
}) {
  try {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }

    if (!senderId) {
      throw new Error('Sender ID is required');
    }

    // Create the message object with the required fields
    const messageData = {
      conversation_id: conversationId,
      sender_id: senderId,
      recipient_id: recipientId || null,
      content: content || null,
      attachment_url: mediaUrl || null,
      attachment_type: mediaType || null,
      reply_to_id: replyToId || null,
      is_sent: true,
    };

    console.log('Sending message with data:', messageData);

    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    console.log('Message sent successfully:', data);
    return data;
  } catch (error: any) {
    console.error('Error sending message:', error);
    toast.error('Failed to send message');
    return null;
  }
}
