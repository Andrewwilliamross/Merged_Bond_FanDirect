
import React, { useState, useEffect, useRef } from 'react';
import { Contact, Message } from '@/types/messaging';
import MessageBubble from './MessageBubble';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MessagesAreaProps {
  contact: Contact;
}

const MessagesArea = ({ contact }: MessagesAreaProps) => {
  const [messages, setMessages] = useState<Message[]>(contact.messages || []);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Set messages from contact prop initially
    setMessages(contact.messages || []);
    
    // Set up real-time subscription for outbound messages
    const fetchMessagesAndSubscribe = async () => {
      if (!user || !contact) return;
      
      try {
        // Get latest outbound messages for this contact
        const { data: latestMessages, error } = await supabase
          .from('outbound_messages')
          .select('*')
          .eq('creator_id', user.id)
          .eq('fan_phone_number', contact.phone || '')
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        
        if (latestMessages) {
          const formattedMessages: Message[] = latestMessages.map(msg => ({
            id: msg.id,
            text: msg.message_text || '',
            sender: 'user',
            timestamp: msg.created_at,
            media: msg.attachment_url || undefined,
            status: msg.status,
          }));
          
          setMessages(formattedMessages);
          
          // Scroll to bottom with slight delay to ensure messages are rendered
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
        
        // Subscribe to new outbound messages
        const channel = supabase
          .channel(`outbound-messages-${contact.id}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'outbound_messages',
            filter: `fan_phone_number=eq.${contact.phone || ''}` 
          }, payload => {
            const newMessage = payload.new;
            console.log('New outbound message received:', newMessage);
            
            if (newMessage.creator_id === user.id) {
              setMessages(currentMessages => [
                ...currentMessages, 
                {
                  id: newMessage.id,
                  text: newMessage.message_text || '',
                  sender: 'user',
                  timestamp: newMessage.created_at,
                  media: newMessage.attachment_url || undefined,
                  status: newMessage.status,
                }
              ]);
              
              // Scroll to bottom with slight delay to ensure new message is rendered
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }
          })
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'outbound_messages',
            filter: `fan_phone_number=eq.${contact.phone || ''}`
          }, payload => {
            const updatedMessage = payload.new;
            console.log('Outbound message updated:', updatedMessage);
            
            // Update the message status in the UI
            if (updatedMessage.creator_id === user.id) {
              setMessages(currentMessages => 
                currentMessages.map(msg => 
                  msg.id === updatedMessage.id 
                    ? {
                        ...msg,
                        status: updatedMessage.status
                      }
                    : msg
                )
              );
              
              // Show toast on status change to sent or error
              if (updatedMessage.status === 'sent') {
                toast.success('Message sent successfully');
              } else if (updatedMessage.status === 'error') {
                toast.error(`Message failed: ${updatedMessage.error_message || 'Unknown error'}`);
              }
            }
          })
          .subscribe((status) => {
            console.log('Subscription status:', status);
          });
          
        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error('Error setting up message subscription:', error);
      }
    };
    
    fetchMessagesAndSubscribe();
  }, [contact.id, contact.phone, user]);

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
      <div className="space-y-4">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              text={msg.text}
              sender={msg.sender}
              timestamp={msg.timestamp}
              media={msg.media}
              status={msg.status}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No messages yet. Send a message to start the conversation.
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessagesArea;
