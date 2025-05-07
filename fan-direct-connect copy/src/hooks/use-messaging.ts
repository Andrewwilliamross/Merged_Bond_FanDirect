
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Contact, Message, OutboundMessage } from '@/types/messaging';

export const useMessaging = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  const fetchContacts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data: contactsData, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const contactsWithMessagesPromises = (contactsData || []).map(async (contact) => {
        try {
          // Get outbound messages for this contact
          const { data: messagesData, error: messagesError } = await supabase
            .from('outbound_messages')
            .select('*')
            .eq('creator_id', user.id)
            .eq('fan_phone_number', contact.phone || '')
            .order('created_at', { ascending: true });
          
          if (messagesError) throw messagesError;
          
          const messages: Message[] = (messagesData || []).map((msg: OutboundMessage) => ({
            id: msg.id,
            text: msg.message_text,
            sender: 'user', // All outbound messages are from the user
            timestamp: msg.created_at,
            media: msg.attachment_url || undefined,
            status: msg.status
          }));
              
          const contactWithMessages: Contact = {
            id: contact.id,
            name: contact.name,
            avatar: contact.name.substring(0, 2).toUpperCase(),
            lastActive: new Date(contact.updated_at).toLocaleString(),
            phone: contact.phone,
            messages: messages
          };
          
          return contactWithMessages;
        } catch (error) {
          console.error('Error processing contact:', contact.id, error);
          return {
            id: contact.id,
            name: contact.name,
            avatar: contact.name.substring(0, 2).toUpperCase(),
            lastActive: new Date(contact.updated_at).toLocaleString(),
            phone: contact.phone,
            messages: []
          };
        }
      });
      
      const contactsWithMessages = await Promise.all(contactsWithMessagesPromises);
      setContacts(contactsWithMessages);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    
    // Set up a real-time subscription for outbound message status updates
    const setupStatusUpdatesSubscription = () => {
      if (!user) return null;
      
      const channel = supabase
        .channel('outbound-message-updates')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'outbound_messages',
          filter: `creator_id=eq.${user.id}`
        }, (payload) => {
          console.log('Message status updated:', payload.new);
          // This will update the list when we navigate back to the contacts list
          fetchContacts();
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    };
    
    const cleanup = setupStatusUpdatesSubscription();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [user]);

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    contacts: filteredContacts,
    loading,
    selectedContact,
    setSelectedContact,
    searchTerm,
    setSearchTerm,
    refreshContacts: fetchContacts
  };
};
