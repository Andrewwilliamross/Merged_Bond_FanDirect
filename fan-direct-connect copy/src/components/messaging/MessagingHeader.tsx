
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Contact } from '@/types/messaging';
import { useIsMobile } from '@/hooks/use-mobile';

interface MessagingHeaderProps {
  contact: Contact;
  onBackClick: () => void;
}

const MessagingHeader = ({ contact, onBackClick }: MessagingHeaderProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="p-4 border-b flex items-center justify-between bg-gray-50">
      <div className="flex items-center">
        {isMobile && (
          <button
            onClick={onBackClick}
            className="mr-2 p-2 hover:bg-gray-100 rounded-full"
            aria-label="Back to contacts"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
        )}
        <div className="h-10 w-10 rounded-full bg-gradient-brand flex items-center justify-center text-white font-medium mr-3">
          {contact.avatar}
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{contact.name}</h3>
          <p className="text-xs text-gray-500">{contact.lastActive}</p>
        </div>
      </div>
    </div>
  );
};

export default MessagingHeader;
