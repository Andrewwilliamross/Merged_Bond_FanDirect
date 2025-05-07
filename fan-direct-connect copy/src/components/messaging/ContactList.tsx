
import React from 'react';
import { Input } from "@/components/ui/input";
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastActive: string;
  messages: Message[];
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'contact';
  timestamp: string;
  media?: string;
}

interface ContactListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
}

const ContactList = ({
  contacts,
  selectedContact,
  onSelectContact,
  searchTerm,
  onSearchChange,
  isLoading = false,
}: ContactListProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`${isMobile ? 'w-full' : 'w-full max-w-xs'} border-r border-gray-200 bg-gray-50 flex flex-col relative`}>
      <div className="p-4 border-b">
        <div className="relative">
          <Input
            type="text"
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search contacts..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2 focus:outline-none focus:border-brand-blue focus:ring-brand-blue"
            disabled={isLoading}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="h-6 w-6 text-brand-blue animate-spin" />
          </div>
        ) : contacts.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                className={`w-full text-left px-4 py-3 hover:bg-gray-100 focus:outline-none ${selectedContact?.id === contact.id ? 'bg-brand-lightgray' : ''}`}
                onClick={() => onSelectContact(contact)}
              >
                <div className="flex items-start">
                  <div className="h-10 w-10 rounded-full bg-gradient-brand flex items-center justify-center text-white font-medium mr-3 flex-shrink-0">
                    {contact.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 truncate">{contact.name}</p>
                      <p className="text-xs text-gray-500 ml-2 flex-shrink-0">{contact.lastActive}</p>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {contact.messages.length > 0 
                        ? contact.messages[contact.messages.length - 1]?.text 
                        : 'No messages yet'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full p-4">
            <p className="text-gray-500 text-center">No contacts found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactList;
