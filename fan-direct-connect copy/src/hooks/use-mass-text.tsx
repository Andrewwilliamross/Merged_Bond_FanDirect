
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { sendOutboundMessage } from '@/utils/outboundMessages';

interface Message {
  id: string;
  text: string;
  timestamp: string;
  media?: string;
  status?: string;
}

export const useMassText = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Load previous mass text messages
  useEffect(() => {
    const loadPreviousMassTexts = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // This is a simplified query that just shows outbound messages
        // In a real implementation, you might want to tag mass texts specifically
        const { data, error } = await supabase
          .from('outbound_messages')
          .select('*')
          .eq('creator_id', user.id)
          .is('vm_id', null) // Mass texts typically don't have a vm_id
          .order('created_at', { ascending: false })
          .limit(10); // Just get the last 10 for display
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const formattedMessages: Message[] = data.map(msg => ({
            id: msg.id,
            text: msg.message_text,
            timestamp: msg.created_at,
            media: msg.attachment_url || undefined,
            status: msg.status
          }));
          
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error("Error loading previous mass texts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPreviousMassTexts();
  }, [user]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() && !selectedMedia) return;
    if (!user) {
      toast.error("You must be logged in to send messages");
      return;
    }

    try {
      setIsSending(true);
      
      // First, upload the media if it exists
      let attachmentUrl = undefined;
      if (selectedMedia) {
        // Create a unique path for the file
        const filePath = `${user.id}/${Date.now()}_${selectedMedia.name.replace(/\s/g, '_')}`;
        const { error: fileError } = await supabase.storage
          .from('attachments')
          .upload(filePath, selectedMedia);
          
        if (fileError) throw fileError;
        
        // Get the public URL
        const { data } = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath);
          
        attachmentUrl = data.publicUrl;
      }

      // Get all contacts to send the mass text
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('phone')
        .eq('owner_id', user.id)
        .not('phone', 'is', null);
        
      if (contactsError) throw contactsError;

      if (!contacts || contacts.length === 0) {
        toast.error("No contacts with phone numbers found");
        return;
      }

      // Send message to all recipients
      const messagePromises = contacts.map(contact => {
        if (!contact.phone) return null;
        return sendOutboundMessage({
          fanPhoneNumber: contact.phone,
          messageText: currentMessage,
          attachmentUrl
        });
      });
      
      // Wait for all messages to be sent
      const results = await Promise.allSettled(messagePromises.filter(Boolean));
      
      // Count successes and failures
      const successes = results.filter(r => r.status === 'fulfilled' && r.value).length;
      const failures = results.length - successes;

      // Add message to local state
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        text: currentMessage,
        timestamp: new Date().toISOString(),
        media: selectedMedia ? URL.createObjectURL(selectedMedia) : undefined,
        status: 'pending'
      };

      setMessages(prev => [newMessage, ...prev]);
      setCurrentMessage('');
      setSelectedMedia(null);
      
      // Success notification
      if (successes > 0) {
        toast.success(`Mass text sent to ${successes} subscribers${failures > 0 ? ` (${failures} failed)` : ''}`);
      } else {
        toast.error("Failed to send any messages");
      }
      
    } catch (error) {
      console.error("Error sending mass text:", error);
      toast.error("Failed to send mass text");
    } finally {
      setIsSending(false);
    }
  };

  return {
    messages,
    currentMessage,
    setCurrentMessage,
    selectedMedia,
    setSelectedMedia,
    isSending,
    isLoading,
    handleSendMessage
  };
};
