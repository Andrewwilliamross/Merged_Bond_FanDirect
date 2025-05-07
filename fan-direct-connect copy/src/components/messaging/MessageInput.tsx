
import React, { useState } from 'react';
import { Send, Star, X, LoaderCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import MessageSuggestions from './MessageSuggestions';
import { Textarea } from '@/components/ui/textarea';

interface MessageInputProps {
  message: string;
  onMessageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedMedia: File | null;
  onRemoveMedia: () => void;
  isSending?: boolean;
}

const MessageInput = ({
  message,
  onMessageChange,
  onSendMessage,
  onKeyDown,
  onFileChange,
  selectedMedia,
  onRemoveMedia,
  isSending = false,
}: MessageInputProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const isMobile = useIsMobile();
  const suggestions = [
    "Thanks for sharing! I'll check it out.",
    "Would you like to schedule a call to discuss this further?",
    "Great idea! Let me know how I can help.",
  ];
  
  const handleAcceptSuggestion = (suggestion: string) => {
    onMessageChange({ target: { value: suggestion } } as React.ChangeEvent<HTMLInputElement>);
    onSendMessage();
  };
  
  const handleRejectSuggestion = (index: number) => {
    console.log('Rejected suggestion:', index);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 3000);
  };

  return (
    <div className="flex flex-col">
      <div className="p-3 md:p-4 border-t">
        {selectedMedia && (
          <div className="mb-2 relative inline-block">
            <img
              src={URL.createObjectURL(selectedMedia)}
              alt="Selected media"
              className="h-16 w-auto rounded-lg"
            />
            <button
              type="button"
              onClick={onRemoveMedia}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
              aria-label="Remove media"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0">
            <label className="cursor-pointer text-gray-500 hover:text-gray-700 p-2 md:p-0">
              <Star className="h-5 w-5" />
              <input type="file" className="hidden" onChange={onFileChange} accept="image/*,video/*" />
            </label>
          </div>
          <input
            type="text"
            value={message}
            onChange={onMessageChange}
            onKeyDown={onKeyDown}
            placeholder="Type your message..."
            className="flex-1 py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2 focus:outline-none focus:border-brand-blue focus:ring-brand-blue text-sm md:text-base"
            disabled={isSending}
          />
          <button
            type="button"
            onClick={onSendMessage}
            disabled={(!message.trim() && !selectedMedia) || isSending}
            className="bg-gradient-brand text-white p-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            {isSending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="border-t">
        <MessageSuggestions 
          suggestions={suggestions}
          onAcceptSuggestion={handleAcceptSuggestion}
          onRejectSuggestion={handleRejectSuggestion}
        />

        <div className="p-3 bg-gray-50">
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0">
              <label className="cursor-pointer text-gray-500 hover:text-gray-700 p-2">
                <Star className="h-5 w-5" />
                <input type="file" className="hidden" onChange={onFileChange} accept="image/*,video/*" />
              </label>
            </div>
            <input
              type="text"
              placeholder="Draft with AI"
              className="flex-1 py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-2 focus:outline-none focus:border-brand-blue focus:ring-brand-blue text-sm md:text-base"
              disabled={isGenerating}
            />
            <button
              type="button"
              onClick={handleGenerate}
              className="bg-gradient-brand text-white p-2 rounded-lg hover:opacity-90"
            >
              <LoaderCircle className={`h-5 w-5 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
