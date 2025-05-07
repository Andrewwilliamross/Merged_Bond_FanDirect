
import React from 'react';
import { Send, Loader } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import DashboardLayout from '../components/DashboardLayout';
import ContactList from '../components/messaging/ContactList';
import MessagingHeader from '../components/messaging/MessagingHeader';
import MessagesArea from '../components/messaging/MessagesArea';
import MessageInputArea from '../components/messaging/MessageInputArea';
import { useMessaging } from '@/hooks/use-messaging';

const Messaging = () => {
  const isMobile = useIsMobile();
  const { 
    contacts,
    loading,
    selectedContact,
    setSelectedContact,
    searchTerm,
    setSearchTerm,
    refreshContacts
  } = useMessaging();

  const handleBackToContacts = () => {
    setSelectedContact(null);
  };
  
  return (
    <DashboardLayout title="Messaging">
      <div className="flex h-[calc(100vh-7rem)] bg-white rounded-xl shadow-sm overflow-hidden">
        {(!isMobile || !selectedContact) && (
          <ContactList
            contacts={contacts}
            selectedContact={selectedContact}
            onSelectContact={setSelectedContact}
            searchTerm={searchTerm}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            isLoading={loading}
          />
        )}
        
        {(!isMobile || selectedContact) && (
          <div className="flex-1 flex flex-col">
            {selectedContact ? (
              <>
                <MessagingHeader 
                  contact={selectedContact}
                  onBackClick={handleBackToContacts}
                />
                <MessagesArea contact={selectedContact} />
                <MessageInputArea 
                  contactPhone={selectedContact.phone || ''}
                  onMessageSent={refreshContacts}
                />
              </>
            ) : !isMobile ? (
              <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
                <div className="text-center">
                  <div className="mx-auto h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                    <Send className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-xl text-gray-900 mb-2">No conversation selected</h3>
                  <p className="text-gray-500">Select a conversation from the list to start messaging</p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
            <Loader className="h-8 w-8 text-brand-blue animate-spin" />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Messaging;
