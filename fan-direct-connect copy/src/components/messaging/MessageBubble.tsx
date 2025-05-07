
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';

interface MessageBubbleProps {
  text: string;
  sender: 'user' | 'contact';
  timestamp: string;
  media?: string;
  status?: string;
}

const MessageBubble = ({ text, sender, timestamp, media, status }: MessageBubbleProps) => {
  const isMobile = useIsMobile();
  
  const renderStatusIcon = () => {
    if (!status || sender !== 'user') return null;
    
    switch(status) {
      case 'sent':
        return <Check className="inline h-4 w-4 ml-1 text-gray-200" />;
      case 'delivered':
        return <CheckCheck className="inline h-4 w-4 ml-1 text-gray-200" />;
      case 'pending':
        return <Clock className="inline h-4 w-4 ml-1 text-gray-200" />;
      case 'error':
        return <AlertCircle className="inline h-4 w-4 ml-1 text-red-300" />;
      default:
        return null;
    }
  };

  const renderStatusText = () => {
    if (!status || sender !== 'user') return null;
    
    return (
      <span className="ml-1 text-xs">
        {status === 'error' ? 'Failed' : status}
      </span>
    );
  };
  
  return (
    <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`${isMobile ? 'max-w-[90%]' : 'max-w-md md:max-w-lg'} rounded-2xl px-4 py-3 ${
          sender === 'user'
            ? 'bg-gradient-brand text-white rounded-br-none'
            : 'bg-brand-lightgray rounded-bl-none'
        }`}
      >
        <p className="whitespace-pre-wrap text-base md:text-lg">{text}</p>
        {media && (
          <div className="mt-2">
            <img
              src={media}
              alt="Attached media"
              className="rounded-lg max-h-48 w-auto"
              loading="lazy"
            />
          </div>
        )}
        <div className={`flex items-center text-sm mt-1.5 ${sender === 'user' ? 'text-gray-200' : 'text-gray-500'}`}>
          <span>
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {renderStatusIcon()}
          {renderStatusText()}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
